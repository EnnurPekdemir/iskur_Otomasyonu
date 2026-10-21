using System.Globalization;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Plan;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class PlanService : IPlanService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public PlanService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<MonthlyPlanResponseDto>> CreatePlanAsync(
        CreateMonthlyPlanDto request, 
        CancellationToken ct = default)
    {
        // 1. Öğrenci Kimliğini Belirle
        var student = await GetCurrentStudentAsync(ct);

        // 2. Aynı Yıl ve Ay İçin Mevcut Plan Kontrolü
        var existingPlan = await _context.MonthlyPlans
            .Include(m => m.PlanDays)
            .FirstOrDefaultAsync(m => m.StudentId == student.Id && m.Year == request.Year && m.Month == request.Month, ct);

        if (existingPlan != null && existingPlan.ApprovalStatus == MonthlyPlanStatus.Approved)
        {
            throw new BusinessRuleException($"{request.Year}/{request.Month} dönemi için onaylanmış bir çalışma planınız zaten bulunmaktadır.");
        }

        // 3. Çalışma Günleri Validasyonları
        ValidatePlanDays(request.Days, request.Year, request.Month);

        // 4. Gün Detaylarını Oluştur ve Saatleri Hesapla
        var planDays = new List<PlanDay>();
        decimal totalHours = 0;

        foreach (var dayDto in request.Days.OrderBy(d => d.Date))
        {
            var (startTime, endTime, plannedHours) = CalculateShiftHours(dayDto.ShiftType);
            totalHours += plannedHours;

            planDays.Add(new PlanDay
            {
                Date = dayDto.Date.Date,
                StartTime = startTime,
                EndTime = endTime,
                PlannedHours = plannedHours,
                DayStatus = PlanDayStatus.Planned,
                Notes = dayDto.Notes
            });
        }

        // 5. Varsa Taslağı Güncelle, Yoksa Yeni Oluştur
        if (existingPlan != null)
        {
            // Eski günleri temizle
            _context.PlanDays.RemoveRange(existingPlan.PlanDays);

            existingPlan.PlanDays = planDays;
            existingPlan.TotalTargetHours = totalHours;
            existingPlan.Notes = request.Notes;
            existingPlan.ApprovalStatus = MonthlyPlanStatus.Draft;
            existingPlan.RejectionReason = null;
        }
        else
        {
            existingPlan = new MonthlyPlan
            {
                StudentId = student.Id,
                Year = request.Year,
                Month = request.Month,
                TotalTargetHours = totalHours,
                ApprovalStatus = MonthlyPlanStatus.Draft,
                Notes = request.Notes,
                PlanDays = planDays
            };
            await _context.MonthlyPlans.AddAsync(existingPlan, ct);
        }

        await _context.SaveChangesAsync(ct);
        return ApiResponse<MonthlyPlanResponseDto>.SuccessResult(MapToResponseDto(existingPlan, student), "Çalışma planı taslağı başarıyla kaydedildi.");
    }

    public async Task<ApiResponse<MonthlyPlanResponseDto>> SubmitPlanAsync(Guid planId, CancellationToken ct = default)
    {
        var plan = await _context.MonthlyPlans
            .Include(m => m.Student)
                .ThenInclude(s => s.User)
            .Include(m => m.PlanDays)
            .FirstOrDefaultAsync(m => m.Id == planId, ct);

        if (plan == null)
            throw new NotFoundException(nameof(MonthlyPlan), planId);

        if (plan.ApprovalStatus != MonthlyPlanStatus.Draft && plan.ApprovalStatus != MonthlyPlanStatus.Rejected)
        {
            throw new BusinessRuleException("Yalnızca taslak (Draft) veya reddedilmiş (Rejected) durumdaki planlar onaya sunulabilir.");
        }

        if (!plan.PlanDays.Any())
        {
            throw new BusinessRuleException("Planda en az bir çalışma günü bulunmalıdır.");
        }

        plan.ApprovalStatus = MonthlyPlanStatus.Submitted;
        await _context.SaveChangesAsync(ct);

        return ApiResponse<MonthlyPlanResponseDto>.SuccessResult(MapToResponseDto(plan, plan.Student), "Çalışma planı danışman onayına sunuldu.");
    }

    public async Task<ApiResponse<MonthlyPlanResponseDto>> EvaluatePlanAsync(
        Guid planId, 
        EvaluatePlanDto evaluation, 
        CancellationToken ct = default)
    {
        var plan = await _context.MonthlyPlans
            .Include(m => m.Student)
                .ThenInclude(s => s.User)
            .Include(m => m.PlanDays)
            .FirstOrDefaultAsync(m => m.Id == planId, ct);

        if (plan == null)
            throw new NotFoundException(nameof(MonthlyPlan), planId);

        if (plan.ApprovalStatus != MonthlyPlanStatus.Submitted)
        {
            throw new BusinessRuleException("Yalnızca onaya sunulmuş (Submitted) durumdaki planlar değerlendirilebilir.");
        }

        if (evaluation.Decision == MonthlyPlanStatus.Rejected && string.IsNullOrWhiteSpace(evaluation.RejectionReason))
        {
            throw new BusinessRuleException("Plan reddedilirken gerekçe belirtilmesi zorunludur.");
        }

        plan.ApprovalStatus = evaluation.Decision;
        plan.ApprovalDate = DateTime.UtcNow;
        plan.ApprovedByUserId = _currentUser.UserId;
        plan.RejectionReason = evaluation.Decision == MonthlyPlanStatus.Rejected ? evaluation.RejectionReason : null;

        await _context.SaveChangesAsync(ct);

        return ApiResponse<MonthlyPlanResponseDto>.SuccessResult(
            MapToResponseDto(plan, plan.Student), 
            $"Plan başarıyla {(evaluation.Decision == MonthlyPlanStatus.Approved ? "onaylandı" : "reddedildi")}.");
    }

    public async Task<ApiResponse<MonthlyPlanResponseDto>> GetPlanByIdAsync(Guid planId, CancellationToken ct = default)
    {
        var plan = await _context.MonthlyPlans
            .Include(m => m.Student).ThenInclude(s => s.User)
            .Include(m => m.ApprovedByUser)
            .Include(m => m.PlanDays)
                .ThenInclude(p => p.Attendance)
            .FirstOrDefaultAsync(m => m.Id == planId, ct);

        if (plan == null)
            throw new NotFoundException(nameof(MonthlyPlan), planId);

        return ApiResponse<MonthlyPlanResponseDto>.SuccessResult(MapToResponseDto(plan, plan.Student));
    }

    public async Task<ApiResponse<MonthlyPlanResponseDto>> GetStudentMonthlyPlanAsync(
        Guid studentId, 
        int year, 
        int month, 
        CancellationToken ct = default)
    {
        var plan = await _context.MonthlyPlans
            .Include(m => m.Student).ThenInclude(s => s.User)
            .Include(m => m.ApprovedByUser)
            .Include(m => m.PlanDays)
                .ThenInclude(p => p.Attendance)
            .FirstOrDefaultAsync(m => m.StudentId == studentId && m.Year == year && m.Month == month, ct);

        if (plan == null)
            throw new NotFoundException($"Öğrencinin {year}/{month} dönemi için kayıtlı bir planı bulunamadı.");

        return ApiResponse<MonthlyPlanResponseDto>.SuccessResult(MapToResponseDto(plan, plan.Student));
    }

    public async Task<ApiResponse<List<MonthlyPlanResponseDto>>> GetPendingPlansAsync(CancellationToken ct = default)
    {
        var plans = await _context.MonthlyPlans
            .Include(m => m.Student).ThenInclude(s => s.User)
            .Include(m => m.PlanDays)
            .Where(m => m.ApprovalStatus == MonthlyPlanStatus.Submitted)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

        var result = plans.Select(p => MapToResponseDto(p, p.Student)).ToList();
        return ApiResponse<List<MonthlyPlanResponseDto>>.SuccessResult(result);
    }

    // ==========================================
    // Validasyon ve Yardımcı Metotlar
    // ==========================================

    private static void ValidatePlanDays(List<CreatePlanDayDto> days, int year, int month)
    {
        // 1. Ay ve Yıl Uyum Kontrolü
        var outOfRange = days.FirstOrDefault(d => d.Date.Year != year || d.Date.Month != month);
        if (outOfRange != null)
        {
            throw new BusinessRuleException($"Plan günü ({outOfRange.Date:dd.MM.yyyy}), seçilen {year}/{month} dönemi ile uyuşmuyor.");
        }

        // 2. Mükerrer Gün Kontrolü
        var duplicate = days.GroupBy(d => d.Date.Date).FirstOrDefault(g => g.Count() > 1);
        if (duplicate != null)
        {
            throw new BusinessRuleException($"{duplicate.Key:dd.MM.yyyy} tarihi için birden fazla kez gün seçilemez.");
        }

        // 3. Hafta Sonu ve Resmî Tatil Kontrolleri
        foreach (var day in days)
        {
            var date = day.Date.Date;

            // Hafta sonu engeli
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
            {
                throw new BusinessRuleException($"Hafta sonu ({date:dd.MM.yyyy dddd}) çalışma günü olarak seçilemez.");
            }

            // Resmî tatil engeli
            if (IsOfficialHoliday(date, out var holidayName))
            {
                throw new BusinessRuleException($"{date:dd.MM.yyyy} günü resmî tatildir ({holidayName}) ve çalışma planına dahil edilemez.");
            }
        }

        // 4. Haftalık 1-3 Gün Kuralı (Aynı haftaya 4. gün seçilemez)
        var calendar = CultureInfo.InvariantCulture.Calendar;
        var weeklyGroups = days
            .GroupBy(d => calendar.GetWeekOfYear(d.Date, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday));

        foreach (var weekGroup in weeklyGroups)
        {
            var count = weekGroup.Count();
            if (count > 3)
            {
                var sampleDate = weekGroup.First().Date;
                throw new BusinessRuleException($"Haftalık çalışma sınırı kuralı aşıldı! Bir haftada en fazla 3 gün çalışılabilir. ({sampleDate:dd.MM.yyyy} haftasında {count} gün seçildi).");
            }
        }
    }

    private static (TimeSpan StartTime, TimeSpan EndTime, decimal PlannedHours) CalculateShiftHours(PlanShiftType shiftType)
    {
        return shiftType switch
        {
            PlanShiftType.Morning => (new TimeSpan(9, 0, 0), new TimeSpan(13, 0, 0), 4.0m),
            PlanShiftType.Afternoon => (new TimeSpan(13, 0, 0), new TimeSpan(17, 0, 0), 4.0m),
            PlanShiftType.Full => (new TimeSpan(9, 0, 0), new TimeSpan(14, 0, 0), 5.0m),
            _ => (new TimeSpan(9, 0, 0), new TimeSpan(13, 0, 0), 4.0m)
        };
    }

    private static bool IsOfficialHoliday(DateTime date, out string holidayName)
    {
        // Türkiye Resmî Tatil Sabit Günleri
        var holidays = new Dictionary<(int Month, int Day), string>
        {
            { (1, 1), "Yılbaşı" },
            { (4, 23), "Ulusal Egemenlik ve Çocuk Bayramı" },
            { (5, 1), "Emek ve Dayanışma Günü" },
            { (5, 19), "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
            { (7, 15), "Demokrasi ve Millî Birlik Günü" },
            { (8, 30), "Zafer Bayramı" },
            { (10, 29), "Cumhuriyet Bayramı" }
        };

        if (holidays.TryGetValue((date.Month, date.Day), out var name))
        {
            holidayName = name;
            return true;
        }

        holidayName = string.Empty;
        return false;
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

    private static MonthlyPlanResponseDto MapToResponseDto(
        MonthlyPlan plan, 
        IskurOtomasyonu.Domain.Entities.Academic.Student student)
    {
        return new MonthlyPlanResponseDto
        {
            Id = plan.Id,
            StudentId = plan.StudentId,
            StudentFullName = student.User?.FullName ?? string.Empty,
            StudentNumber = student.StudentNumber,
            Year = plan.Year,
            Month = plan.Month,
            TotalTargetHours = plan.TotalTargetHours,
            ApprovalStatus = plan.ApprovalStatus,
            ApprovalDate = plan.ApprovalDate,
            ApprovedByFullName = plan.ApprovedByUser?.FullName,
            RejectionReason = plan.RejectionReason,
            Notes = plan.Notes,
            Days = plan.PlanDays.OrderBy(d => d.Date).Select(d => new PlanDayResponseDto
            {
                Id = d.Id,
                Date = d.Date,
                DayOfWeek = d.Date.ToString("dddd", new CultureInfo("tr-TR")),
                StartTime = d.StartTime,
                EndTime = d.EndTime,
                PlannedHours = d.PlannedHours,
                DayStatus = d.DayStatus,
                Notes = d.Notes,
                HasAttendance = d.Attendance != null
            }).ToList()
        };
    }
}
