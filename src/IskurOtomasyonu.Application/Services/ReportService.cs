using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Report;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Configuration;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IEncryptionService _encryptionService;

    public ReportService(
        IApplicationDbContext context, 
        ICurrentUserService currentUser, 
        IEncryptionService encryptionService)
    {
        _context = context;
        _currentUser = currentUser;
        _encryptionService = encryptionService;
    }

    public async Task<ApiResponse<List<MonthlyPayrollItemDto>>> GetMonthlyPayrollSummaryAsync(
        MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct = default)
    {
        // 1. Yetki Kuralı: Bölüm Başkanı ise yalnızca kendi bölümünü sorgulayabilir
        await EnforceDepartmentHeadScopeAsync(filter, ct);

        // 2. Öğrencileri ve İlgili İlişkileri Getir
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .Include(s => s.UnitAssignments.Where(u => u.IsActive))
                .ThenInclude(ua => ua.Unit)
            .Include(s => s.AdvisorAssignments.Where(a => a.IsActive))
                .ThenInclude(aa => aa.Advisor)
            .Include(s => s.MonthlyPlans.Where(m => m.Year == filter.Year && m.Month == filter.Month))
                .ThenInclude(m => m.PlanDays)
            .Include(s => s.Attendances.Where(a => a.CheckInTime.Year == filter.Year && a.CheckInTime.Month == filter.Month))
                .ThenInclude(a => a.PlanDay)
            .Include(s => s.LeaveRequests.Where(l => l.Status == LeaveStatus.Approved))
            .AsNoTracking()
            .AsQueryable();

        // 3. Filtreleme Koşulları
        if (filter.DepartmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == filter.DepartmentId.Value);
        }

        if (filter.StudentId.HasValue)
        {
            query = query.Where(s => s.Id == filter.StudentId.Value);
        }

        if (filter.UnitId.HasValue)
        {
            query = query.Where(s => s.UnitAssignments.Any(u => u.IsActive && u.UnitId == filter.UnitId.Value));
        }

        if (filter.AdvisorId.HasValue)
        {
            query = query.Where(s => s.AdvisorAssignments.Any(a => a.IsActive && a.AdvisorId == filter.AdvisorId.Value));
        }

        var students = await query.ToListAsync(ct);
        var resultList = new List<MonthlyPayrollItemDto>();

        var monthStart = new DateTime(filter.Year, filter.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        foreach (var student in students)
        {
            var activePlan = student.MonthlyPlans.FirstOrDefault();
            var activeUnit = student.UnitAssignments.FirstOrDefault()?.Unit?.Name ?? "Atanmadı";
            var activeAdvisor = student.AdvisorAssignments.FirstOrDefault()?.Advisor?.FullName ?? "Atanmadı";

            // Planlanan Gün ve Saatler
            var plannedDaysCount = activePlan?.PlanDays.Count ?? 0;
            var plannedHours = activePlan?.PlanDays.Sum(p => p.PlannedHours) ?? 0;

            // Gerçekleşen Doğrulanmış Devamlar (QR veya Manuel Onaylı)
            var verifiedAttendances = student.Attendances
                .Where(a => a.VerificationStatus == AttendanceVerificationStatus.VerifiedByQr ||
                            a.VerificationStatus == AttendanceVerificationStatus.ManuallyApproved)
                .ToList();

            var actualDaysCount = verifiedAttendances.Select(a => a.CheckInTime.Date).Distinct().Count();
            var totalHoursWorked = verifiedAttendances.Sum(a => a.ActualHoursWorked ?? a.PlanDay?.PlannedHours ?? 0);

            // Bu Aydaki Onaylı İzin Günleri
            var approvedLeavesInMonth = student.LeaveRequests
                .Where(l => l.StartDate <= monthEnd && l.EndDate >= monthStart)
                .ToList();

            int leaveDaysInMonth = 0;
            foreach (var leave in approvedLeavesInMonth)
            {
                var overlapStart = leave.StartDate < monthStart ? monthStart : leave.StartDate;
                var overlapEnd = leave.EndDate > monthEnd ? monthEnd : leave.EndDate;
                leaveDaysInMonth += (overlapEnd - overlapStart).Days + 1;
            }

            // Devamsız Gün Sayısı (Planlanmış ama gelinmemiş ve mazeretsiz günler)
            var absentDaysCount = activePlan?.PlanDays
                .Count(p => p.DayStatus == PlanDayStatus.Absent || 
                           (p.Date < DateTime.UtcNow.Date && p.DayStatus == PlanDayStatus.Planned)) 
                ?? 0;

            // KVKK: Şifreli TCKN ve IBAN Çözümlemesi
            var plainTcNo = _encryptionService.Decrypt(student.EncryptedTcNo);
            var plainIban = _encryptionService.Decrypt(student.EncryptedIban);

            resultList.Add(new MonthlyPayrollItemDto
            {
                StudentId = student.Id,
                StudentNumber = student.StudentNumber,
                FullName = student.User?.FullName ?? string.Empty,
                TcNo = plainTcNo,
                Iban = plainIban,
                DepartmentName = student.Department?.Name ?? string.Empty,
                UnitName = activeUnit,
                AdvisorName = activeAdvisor,
                Year = filter.Year,
                Month = filter.Month,
                PlannedDaysCount = plannedDaysCount,
                ActualDaysCount = actualDaysCount,
                PlannedHours = plannedHours,
                TotalHoursWorked = totalHoursWorked,
                ApprovedLeaveDays = leaveDaysInMonth,
                AbsentDaysCount = absentDaysCount
            });
        }

        return ApiResponse<List<MonthlyPayrollItemDto>>.SuccessResult(
            resultList.OrderBy(r => r.DepartmentName).ThenBy(r => r.FullName).ToList(),
            $"{filter.Year}/{filter.Month} dönemi için {resultList.Count} adet puantaj kaydı hesaplandı.");
    }

    public async Task<ApiResponse<List<StudentRiskReportDto>>> GetRiskWarningsAsync(
        RiskWarningFilterDto filter, 
        CancellationToken ct = default)
    {
        // 1. Maksimum İzin Hakkını Sistem Parametrelerinden Oku
        var maxLeaveSetting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == SystemSettingKeys.MaxAnnualLeaveDays, ct);

        int maxEntitledDays = 10;
        if (maxLeaveSetting != null && int.TryParse(maxLeaveSetting.Value, out var mVal))
        {
            maxEntitledDays = mVal;
        }

        // 2. Öğrencileri Getir
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .Include(s => s.UnitAssignments.Where(u => u.IsActive)).ThenInclude(ua => ua.Unit)
            .Include(s => s.AdvisorAssignments.Where(a => a.IsActive)).ThenInclude(aa => aa.Advisor)
            .Include(s => s.LeaveRequests.Where(l => l.Status == LeaveStatus.Approved))
            .Include(s => s.MonthlyPlans)
                .ThenInclude(m => m.PlanDays)
            .AsNoTracking()
            .AsQueryable();

        // Bölüm Başkanı kısıtı
        if (_currentUser.IsInRole(AppRoles.BolumBaskani) && !_currentUser.IsInRole(AppRoles.Dekanlik))
        {
            var headedDept = await _context.Departments
                .FirstOrDefaultAsync(d => d.HeadOfDepartmentId == _currentUser.UserId, ct);

            if (headedDept != null)
            {
                query = query.Where(s => s.DepartmentId == headedDept.Id);
            }
        }
        else if (filter.DepartmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == filter.DepartmentId.Value);
        }

        var students = await query.ToListAsync(ct);
        var riskReport = new List<StudentRiskReportDto>();

        foreach (var student in students)
        {
            var usedLeaveDays = student.LeaveRequests.Sum(l => l.TotalDays);
            var remainingDays = Math.Max(0, maxEntitledDays - usedLeaveDays);

            // Toplam devamsız gün sayısı
            var totalAbsentDays = student.MonthlyPlans
                .SelectMany(m => m.PlanDays)
                .Count(p => p.DayStatus == PlanDayStatus.Absent || 
                           (p.Date < DateTime.UtcNow.Date && p.DayStatus == PlanDayStatus.Planned));

            var hasLeaveRisk = usedLeaveDays >= filter.LeaveWarningThresholdDays;
            var hasAbsenteeismRisk = totalAbsentDays >= filter.AbsenteeismThresholdDays;

            if (hasLeaveRisk || hasAbsenteeismRisk)
            {
                var reasons = new List<string>();
                string riskLevel = "Düşük";
                string recommendedAction = "Takip Edilmeli";

                if (usedLeaveDays >= maxEntitledDays)
                {
                    reasons.Add($"Yıllık {maxEntitledDays} günlük izin kotası tamamen tükendi.");
                    riskLevel = "Kritik";
                }
                else if (usedLeaveDays >= filter.LeaveWarningThresholdDays)
                {
                    reasons.Add($"İzin kotasına yaklaşıldı ({usedLeaveDays}/{maxEntitledDays} gün kullanıldı, kalan: {remainingDays} gün).");
                    riskLevel = "Orta";
                }

                if (totalAbsentDays >= 5)
                {
                    reasons.Add($"Aşırı devamsızlık tespit edildi: {totalAbsentDays} gün mazeretsiz katılım sağlanmadı.");
                    riskLevel = "Kritik";
                    recommendedAction = "İlişik Kesme İncelemesi Başlatılmalı";
                }
                else if (totalAbsentDays >= filter.AbsenteeismThresholdDays)
                {
                    reasons.Add($"Devamsızlık uyarısı: {totalAbsentDays} gün katılım sağlanmadı.");
                    if (riskLevel != "Kritik")
                    {
                        riskLevel = "Orta";
                        recommendedAction = "Öğrenci ve Danışman İle Görüşme Yapılmalı";
                    }
                }

                var activeUnit = student.UnitAssignments.FirstOrDefault()?.Unit?.Name ?? "Atanmadı";
                var activeAdvisor = student.AdvisorAssignments.FirstOrDefault()?.Advisor?.FullName ?? "Atanmadı";

                riskReport.Add(new StudentRiskReportDto
                {
                    StudentId = student.Id,
                    StudentNumber = student.StudentNumber,
                    FullName = student.User?.FullName ?? string.Empty,
                    DepartmentName = student.Department?.Name ?? string.Empty,
                    UnitName = activeUnit,
                    AdvisorName = activeAdvisor,
                    TotalAnnualEntitlement = maxEntitledDays,
                    UsedLeaveDays = usedLeaveDays,
                    RemainingLeaveDays = remainingDays,
                    HasLeaveWarning = hasLeaveRisk,
                    TotalAbsentDays = totalAbsentDays,
                    HasAbsenteeismRisk = hasAbsenteeismRisk,
                    RiskLevel = riskLevel,
                    RiskReasons = reasons,
                    RecommendedAction = recommendedAction
                });
            }
        }

        return ApiResponse<List<StudentRiskReportDto>>.SuccessResult(
            riskReport.OrderByDescending(r => r.RiskLevel == "Kritik").ThenByDescending(r => r.TotalAbsentDays).ToList(),
            $"Toplam {riskReport.Count} riskli öğrenci tespit edildi.");
    }

    private async Task EnforceDepartmentHeadScopeAsync(
        MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct)
    {
        // Eğer kullanıcı Bölüm Başkanı ise ve Dekanlık yetkisi yoksa yalnızca kendi bölümünü görebilir
        if (_currentUser.IsInRole(AppRoles.BolumBaskani) && !_currentUser.IsInRole(AppRoles.Dekanlik))
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.HeadOfDepartmentId == _currentUser.UserId, ct);

            if (department != null)
            {
                filter.DepartmentId = department.Id;
            }
        }
    }
}
