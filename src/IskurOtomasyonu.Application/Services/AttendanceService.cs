using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Attendance;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Configuration;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AttendanceService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<QrSessionResponseDto>> CreateQrSessionAsync(
        CreateQrSessionDto request, 
        CancellationToken ct = default)
    {
        var currentUserId = _currentUser.UserId 
            ?? throw new UnauthorizedException("QR oturumu başlatmak için yetkili oturumu gereklidir.");

        // 1. Sistemden QR geçerlilik süresini oku (Varsayılan 30 saniye)
        var qrSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == SystemSettingKeys.QrExpirationSeconds, ct);

        int expirationSeconds = 30;
        if (qrSetting != null && int.TryParse(qrSetting.Value, out var sec))
        {
            expirationSeconds = sec;
        }

        // 2. Kriptografik Dinamik Nonce ve Token Hash Üret
        var now = DateTime.UtcNow;
        var expiresAt = now.AddSeconds(expirationSeconds);
        var nonce = Guid.NewGuid().ToString("N");
        var rawData = $"{currentUserId}:{now.Ticks}:{nonce}:{request.UnitId}";
        var tokenHash = ComputeSha256(rawData);

        // 3. QrSession Kaydını Oluştur
        var session = new QrSession
        {
            CreatedByUserId = currentUserId,
            UnitId = request.UnitId,
            TokenHash = tokenHash,
            DynamicNonce = nonce,
            CreatedAt = now,
            ExpiresAt = expiresAt,
            IsActive = true
        };

        await _context.QrSessions.AddAsync(session, ct);
        await _context.SaveChangesAsync(ct);

        var currentUserEntity = await _context.Users.FindAsync(new object[] { currentUserId }, ct);
        var unit = request.UnitId.HasValue ? await _context.Units.FindAsync(new object[] { request.UnitId.Value }, ct) : null;

        var response = new QrSessionResponseDto
        {
            Id = session.Id,
            TokenHash = tokenHash,
            QrPayload = tokenHash,
            GeneratedAt = session.CreatedAt,
            ExpiresAt = session.ExpiresAt,
            IsActive = session.IsActive,
            CreatedByUserId = currentUserId,
            CreatedByFullName = currentUserEntity?.FullName ?? string.Empty,
            UnitName = unit?.Name
        };

        return ApiResponse<QrSessionResponseDto>.SuccessResult(response, "30 saniyelik dinamik QR oturumu başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<AttendanceResponseDto>> CheckInWithQrAsync(
        QrCheckInRequestDto request, 
        CancellationToken ct = default)
    {
        // 1. Öğrenci Profilini Doğrula
        var student = await GetCurrentStudentAsync(ct);
        var now = DateTime.UtcNow;
        var today = now.Date;

        // 2. Kural 1: QR Oturumu Geçerlilik ve Süre (30 sn) Kontrolü
        var qrSession = await _context.QrSessions
            .Include(q => q.CreatedByUser)
            .FirstOrDefaultAsync(q => q.TokenHash == request.TokenHash, ct);

        if (qrSession == null)
        {
            throw new BusinessRuleException("Geçersiz veya sahte karekod tarandı.");
        }

        if (!qrSession.IsActive)
        {
            throw new BusinessRuleException("Bu karekod oturumu sonlandırılmıştır.");
        }

        if (now > qrSession.ExpiresAt)
        {
            throw new BusinessRuleException($"Karekodun 30 saniyelik geçerlilik süresi dolmuştur. Lütfen danışman ekranındaki güncel karekodu okutunuz.");
        }

        // 3. Kural 2: Öğrencinin Bugün İçin Onaylanmış Bir Çalışma Planı Var mı?
        var planDay = await _context.PlanDays
            .Include(p => p.MonthlyPlan)
            .FirstOrDefaultAsync(p => 
                p.MonthlyPlan.StudentId == student.Id && 
                p.MonthlyPlan.ApprovalStatus == MonthlyPlanStatus.Approved && 
                p.Date == today, ct);

        if (planDay == null)
        {
            throw new BusinessRuleException($"Bugün ({today:dd.MM.yyyy}) için onaylanmış bir İŞKUR çalışma planınız bulunmamaktadır.");
        }

        // 4. Kural 3: Aynı Gün İçin Mükerrer Devam Kaydı Kontrolü
        var existingAttendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.StudentId == student.Id && a.PlanDayId == planDay.Id, ct);

        if (existingAttendance != null)
        {
            throw new BusinessRuleException($"Bugün için ({existingAttendance.CheckInTime:HH:mm} saatinde) zaten devam kaydı oluşturulmuş. Tekrar giriş yapılamaz.");
        }

        // 5. Başarılı Devam (Attendance) Kaydı Oluştur
        var attendance = new Attendance
        {
            StudentId = student.Id,
            PlanDayId = planDay.Id,
            QrSessionId = qrSession.Id,
            CheckInTime = now,
            VerificationStatus = AttendanceVerificationStatus.VerifiedByQr,
            DeviceSignature = request.DeviceSignature,
            IpAddress = request.IpAddress,
            VerificationNotes = "30 sn dinamik QR oturumu ile otomatik doğrulandı."
        };

        planDay.DayStatus = PlanDayStatus.Completed;

        await _context.Attendances.AddAsync(attendance, ct);
        await _context.SaveChangesAsync(ct);

        return ApiResponse<AttendanceResponseDto>.SuccessResult(
            MapToResponseDto(attendance, student, planDay), 
            "Giriş devam kaydınız başarıyla alındı.");
    }

    public async Task<ApiResponse<AttendanceResponseDto>> CheckOutAsync(
        Guid attendanceId, 
        CancellationToken ct = default)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Student).ThenInclude(s => s.User)
            .Include(a => a.PlanDay)
            .FirstOrDefaultAsync(a => a.Id == attendanceId, ct);

        if (attendance == null)
            throw new NotFoundException(nameof(Attendance), attendanceId);

        if (attendance.CheckOutTime.HasValue)
        {
            throw new BusinessRuleException("Bu devam kaydı için çıkış işlemi zaten yapılmıştır.");
        }

        var now = DateTime.UtcNow;
        attendance.CheckOutTime = now;

        var workedDuration = now - attendance.CheckInTime;
        attendance.ActualHoursWorked = Math.Round((decimal)workedDuration.TotalHours, 2);

        await _context.SaveChangesAsync(ct);

        return ApiResponse<AttendanceResponseDto>.SuccessResult(
            MapToResponseDto(attendance, attendance.Student, attendance.PlanDay), 
            "Çıkış kaydınız başarıyla alındı.");
    }

    public async Task<ApiResponse<AttendanceResponseDto>> ManualAttendanceAsync(
        ManualAttendanceDto request, 
        CancellationToken ct = default)
    {
        var currentUserId = _currentUser.UserId 
            ?? throw new UnauthorizedException("Manuel devam onayı için yetkili oturumu gereklidir.");

        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), request.StudentId);

        var planDay = await _context.PlanDays
            .Include(p => p.MonthlyPlan)
            .FirstOrDefaultAsync(p => p.Id == request.PlanDayId, ct);

        if (planDay == null)
            throw new NotFoundException(nameof(PlanDay), request.PlanDayId);

        var existing = await _context.Attendances
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId && a.PlanDayId == request.PlanDayId, ct);

        if (existing != null)
        {
            throw new BusinessRuleException("Bu gün için zaten bir devam kaydı bulunmaktadır.");
        }

        var attendance = new Attendance
        {
            StudentId = request.StudentId,
            PlanDayId = request.PlanDayId,
            CheckInTime = request.CheckInTime,
            CheckOutTime = request.CheckOutTime,
            ActualHoursWorked = request.ActualHoursWorked ?? planDay.PlannedHours,
            VerificationStatus = AttendanceVerificationStatus.ManuallyApproved,
            VerifiedByUserId = currentUserId,
            VerificationNotes = request.VerificationNotes ?? "Yetkili tarafından manuel onaylandı."
        };

        planDay.DayStatus = PlanDayStatus.Completed;

        await _context.Attendances.AddAsync(attendance, ct);
        await _context.SaveChangesAsync(ct);

        return ApiResponse<AttendanceResponseDto>.SuccessResult(
            MapToResponseDto(attendance, student, planDay), 
            "Manuel devam kaydı başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<List<AttendanceResponseDto>>> GetStudentAttendancesAsync(
        Guid studentId, 
        DateTime? startDate = null, 
        DateTime? endDate = null, 
        CancellationToken ct = default)
    {
        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), studentId);

        var query = _context.Attendances
            .Include(a => a.PlanDay)
            .Include(a => a.VerifiedByUser)
            .Where(a => a.StudentId == studentId);

        if (startDate.HasValue)
            query = query.Where(a => a.CheckInTime >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.CheckInTime <= endDate.Value);

        var attendances = await query.OrderByDescending(a => a.CheckInTime).ToListAsync(ct);

        var result = attendances.Select(a => MapToResponseDto(a, student, a.PlanDay)).ToList();
        return ApiResponse<List<AttendanceResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<List<AttendanceResponseDto>>> GetTodayAttendancesAsync(
        Guid? unitId = null, 
        CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var query = _context.Attendances
            .Include(a => a.Student).ThenInclude(s => s.User)
            .Include(a => a.PlanDay)
            .Include(a => a.QrSession)
            .Include(a => a.VerifiedByUser)
            .Where(a => a.PlanDay.Date == today);

        if (unitId.HasValue)
        {
            query = query.Where(a => a.QrSession != null && a.QrSession.UnitId == unitId.Value);
        }

        var list = await query.OrderByDescending(a => a.CheckInTime).ToListAsync(ct);
        var result = list.Select(a => MapToResponseDto(a, a.Student, a.PlanDay)).ToList();

        return ApiResponse<List<AttendanceResponseDto>>.SuccessResult(result);
    }

    // ==========================================
    // Yardımcı Metotlar
    // ==========================================

    private static string ComputeSha256(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private async Task<IskurOtomasyonu.Domain.Entities.Academic.Student> GetCurrentStudentAsync(CancellationToken ct)
    {
        if (_currentUser.UserId == null)
            throw new UnauthorizedException("Kullanıcı oturumu bulunamadı.");

        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId.Value, ct);

        if (student == null)
            throw new NotFoundException("Öğrenci profili bulunamadı.");

        return student;
    }

    private static AttendanceResponseDto MapToResponseDto(
        Attendance a, 
        IskurOtomasyonu.Domain.Entities.Academic.Student student, 
        PlanDay planDay)
    {
        return new AttendanceResponseDto
        {
            Id = a.Id,
            StudentId = a.StudentId,
            StudentFullName = student.User?.FullName ?? string.Empty,
            StudentNumber = student.StudentNumber,
            PlanDayId = a.PlanDayId,
            PlanDate = planDay.Date,
            CheckInTime = a.CheckInTime,
            CheckOutTime = a.CheckOutTime,
            ActualHoursWorked = a.ActualHoursWorked,
            VerificationStatus = a.VerificationStatus,
            DeviceSignature = a.DeviceSignature,
            IpAddress = a.IpAddress,
            VerifiedByName = a.VerifiedByUser?.FullName,
            VerificationNotes = a.VerificationNotes
        };
    }
}
