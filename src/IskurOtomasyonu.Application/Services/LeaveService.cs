using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Leave;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Configuration;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class LeaveService : ILeaveService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public LeaveService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<LeaveRequestResponseDto>> CreateLeaveRequestAsync(
        CreateLeaveRequestDto request, 
        CancellationToken ct = default)
    {
        var student = await GetCurrentStudentAsync(ct);

        if (request.EndDate.Date < request.StartDate.Date)
        {
            throw new BusinessRuleException("İzin bitiş tarihi başlangıç tarihinden önce olamaz.");
        }

        // 1. Gün Sayısını Hesapla (İş günleri veya takvim günleri)
        var totalDays = (int)(request.EndDate.Date - request.StartDate.Date).TotalDays + 1;

        // 2. Kalan İzin Kotası Kontrolü
        var balance = await CalculateLeaveBalanceInternalAsync(student.Id, ct);

        if (totalDays > balance.RemainingLeaveDays)
        {
            throw new BusinessRuleException($"Yetersiz izin hakkı! Kalan izin hakkınız {balance.RemainingLeaveDays} gün iken, {totalDays} günlük izin talep edemezsiniz.");
        }

        // 3. Çakışan İzin Kontrolü
        var hasConflict = await _context.LeaveRequests.AnyAsync(l =>
            l.StudentId == student.Id &&
            l.Status != LeaveStatus.Rejected &&
            l.Status != LeaveStatus.Cancelled &&
            ((request.StartDate.Date >= l.StartDate && request.StartDate.Date <= l.EndDate) ||
             (request.EndDate.Date >= l.StartDate && request.EndDate.Date <= l.EndDate)), ct);

        if (hasConflict)
        {
            throw new BusinessRuleException("Talep edilen tarih aralığında zaten bekleyen veya onaylanmış bir izin kaydınız bulunmaktadır.");
        }

        // 4. İzin Talebini Oluştur
        var leave = new LeaveRequest
        {
            StudentId = student.Id,
            StartDate = request.StartDate.Date,
            EndDate = request.EndDate.Date,
            TotalDays = totalDays,
            LeaveType = request.LeaveType,
            Status = LeaveStatus.Pending,
            Reason = request.Reason,
            DocumentUrl = request.DocumentUrl
        };

        await _context.LeaveRequests.AddAsync(leave, ct);
        await _context.SaveChangesAsync(ct);

        return ApiResponse<LeaveRequestResponseDto>.SuccessResult(
            MapToResponseDto(leave, student), 
            "İzin talebiniz başarıyla oluşturuldu ve onay sürecine iletildi.");
    }

    public async Task<ApiResponse<LeaveRequestResponseDto>> EvaluateLeaveRequestAsync(
        Guid leaveRequestId, 
        EvaluateLeaveDto evaluation, 
        CancellationToken ct = default)
    {
        var currentUserId = _currentUser.UserId 
            ?? throw new UnauthorizedException("İzin değerlendirmek için yetkili girişi zorunludur.");

        var leave = await _context.LeaveRequests
            .Include(l => l.Student).ThenInclude(s => s.User)
            .FirstOrDefaultAsync(l => l.Id == leaveRequestId, ct);

        if (leave == null)
            throw new NotFoundException(nameof(LeaveRequest), leaveRequestId);

        if (leave.Status != LeaveStatus.Pending)
        {
            throw new BusinessRuleException("Yalnızca beklemede (Pending) olan izin talepleri değerlendirilebilir.");
        }

        if (evaluation.Decision == LeaveStatus.Rejected && string.IsNullOrWhiteSpace(evaluation.RejectionReason))
        {
            throw new BusinessRuleException("İzin talebi reddedilirken ret gerekçesi belirtilmesi zorunludur.");
        }

        leave.Status = evaluation.Decision;
        leave.DecisionDate = DateTime.UtcNow;
        leave.ApprovedByUserId = currentUserId;
        leave.RejectionReason = evaluation.Decision == LeaveStatus.Rejected ? evaluation.RejectionReason : null;

        // Onaylandıysa öğrencinin kalan izin gününü güncelle
        if (evaluation.Decision == LeaveStatus.Approved)
        {
            var student = leave.Student;
            student.RemainingLeaveDays = Math.Max(0, student.RemainingLeaveDays - leave.TotalDays);
        }

        await _context.SaveChangesAsync(ct);

        var evaluator = await _context.Users.FindAsync(new object[] { currentUserId }, ct);

        return ApiResponse<LeaveRequestResponseDto>.SuccessResult(
            MapToResponseDto(leave, leave.Student, evaluator?.FullName), 
            $"İzin talebi başarıyla {(evaluation.Decision == LeaveStatus.Approved ? "onaylandı" : "reddedildi")}.");
    }

    public async Task<ApiResponse<StudentLeaveBalanceDto>> GetStudentLeaveBalanceAsync(
        Guid studentId, 
        CancellationToken ct = default)
    {
        var balance = await CalculateLeaveBalanceInternalAsync(studentId, ct);
        return ApiResponse<StudentLeaveBalanceDto>.SuccessResult(balance);
    }

    public async Task<ApiResponse<LeaveRequestResponseDto>> GetLeaveRequestByIdAsync(
        Guid leaveRequestId, 
        CancellationToken ct = default)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Student).ThenInclude(s => s.User)
            .Include(l => l.ApprovedByUser)
            .FirstOrDefaultAsync(l => l.Id == leaveRequestId, ct);

        if (leave == null)
            throw new NotFoundException(nameof(LeaveRequest), leaveRequestId);

        return ApiResponse<LeaveRequestResponseDto>.SuccessResult(MapToResponseDto(leave, leave.Student, leave.ApprovedByUser?.FullName));
    }

    public async Task<ApiResponse<List<LeaveRequestResponseDto>>> GetPendingLeaveRequestsAsync(CancellationToken ct = default)
    {
        var leaves = await _context.LeaveRequests
            .Include(l => l.Student).ThenInclude(s => s.User)
            .Where(l => l.Status == LeaveStatus.Pending)
            .OrderBy(l => l.CreatedAt)
            .ToListAsync(ct);

        var result = leaves.Select(l => MapToResponseDto(l, l.Student)).ToList();
        return ApiResponse<List<LeaveRequestResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<List<LeaveRequestResponseDto>>> GetStudentLeaveRequestsAsync(
        Guid studentId, 
        CancellationToken ct = default)
    {
        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), studentId);

        var leaves = await _context.LeaveRequests
            .Include(l => l.ApprovedByUser)
            .Where(l => l.StudentId == studentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);

        var result = leaves.Select(l => MapToResponseDto(l, student, l.ApprovedByUser?.FullName)).ToList();
        return ApiResponse<List<LeaveRequestResponseDto>>.SuccessResult(result);
    }

    // ==========================================
    // Yardımcı ve Hesaplama Metotları
    // ==========================================

    private async Task<StudentLeaveBalanceDto> CalculateLeaveBalanceInternalAsync(Guid studentId, CancellationToken ct)
    {
        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), studentId);

        // 1. Sistem ayarlarından maksimum yıllık izin hakkını oku (Varsayılan 10)
        var maxLeaveSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == SystemSettingKeys.MaxAnnualLeaveDays, ct);

        int maxDays = 10;
        if (maxLeaveSetting != null && int.TryParse(maxLeaveSetting.Value, out var val))
        {
            maxDays = val;
        }

        // 2. Onaylanan ve Bekleyen İzinleri Topla
        var leaves = await _context.LeaveRequests
            .Where(l => l.StudentId == studentId)
            .ToListAsync(ct);

        var usedDays = leaves
            .Where(l => l.Status == LeaveStatus.Approved)
            .Sum(l => l.TotalDays);

        var pendingDays = leaves
            .Where(l => l.Status == LeaveStatus.Pending)
            .Sum(l => l.TotalDays);

        var remainingDays = Math.Max(0, maxDays - usedDays);
        var hasWarning = remainingDays <= 2;

        string? warningMessage = null;
        if (remainingDays == 0)
        {
            warningMessage = "Yıllık izin kotanız tamamen tükenmiştir. Yeni izin talebinde bulunamazsınız.";
        }
        else if (hasWarning)
        {
            warningMessage = $"Dikkat: Yıllık izin kotanız sınırda! Kalan izin hakkınız yalnızca {remainingDays} gündür.";
        }

        return new StudentLeaveBalanceDto
        {
            StudentId = student.Id,
            StudentFullName = student.User?.FullName ?? string.Empty,
            StudentNumber = student.StudentNumber,
            TotalAnnualEntitlement = maxDays,
            UsedLeaveDays = usedDays,
            PendingLeaveDays = pendingDays,
            WarningMessage = warningMessage
        };
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

    private static LeaveRequestResponseDto MapToResponseDto(
        LeaveRequest l, 
        IskurOtomasyonu.Domain.Entities.Academic.Student student, 
        string? approvedByName = null)
    {
        return new LeaveRequestResponseDto
        {
            Id = l.Id,
            StudentId = l.StudentId,
            StudentFullName = student.User?.FullName ?? string.Empty,
            StudentNumber = student.StudentNumber,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            TotalDays = l.TotalDays,
            LeaveType = l.LeaveType,
            Status = l.Status,
            Reason = l.Reason,
            DocumentUrl = l.DocumentUrl,
            DecisionDate = l.DecisionDate,
            ApprovedByName = approvedByName ?? l.ApprovedByUser?.FullName,
            RejectionReason = l.RejectionReason,
            CreatedAt = l.CreatedAt
        };
    }
}
