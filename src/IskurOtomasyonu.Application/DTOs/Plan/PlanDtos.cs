using System.ComponentModel.DataAnnotations;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.DTOs.Plan;

public enum PlanShiftType
{
    Morning = 1,   // 09:00 - 13:00 (4 Saat)
    Afternoon = 2, // 13:00 - 17:00 (4 Saat)
    Full = 3       // 09:00 - 14:00 (5 Saat - İŞKUR Günlük Max Kuralı)
}

public class CreatePlanDayDto
{
    [Required(ErrorMessage = "Çalışma tarihi zorunludur.")]
    public DateTime Date { get; set; }

    [Required(ErrorMessage = "Vardiya tipi (Morning, Afternoon, Full) zorunludur.")]
    public PlanShiftType ShiftType { get; set; } = PlanShiftType.Morning;

    public string? Notes { get; set; }
}

public class CreateMonthlyPlanDto
{
    [Range(2025, 2035, ErrorMessage = "Geçerli bir yıl giriniz.")]
    public int Year { get; set; }

    [Range(1, 12, ErrorMessage = "Ay 1 ile 12 arasında olmalıdır.")]
    public int Month { get; set; }

    public string? Notes { get; set; }

    [Required(ErrorMessage = "En az bir çalışma günü eklenmelidir.")]
    [MinLength(1, ErrorMessage = "Aylık plana en az bir gün eklenmelidir.")]
    public List<CreatePlanDayDto> Days { get; set; } = new();
}

public class PlanDayResponseDto
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public decimal PlannedHours { get; set; }
    public PlanDayStatus DayStatus { get; set; }
    public string? Notes { get; set; }
    public bool HasAttendance { get; set; }
}

public class MonthlyPlanResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalTargetHours { get; set; }
    public MonthlyPlanStatus ApprovalStatus { get; set; }
    public string StatusDescription => ApprovalStatus.ToString();
    public DateTime? ApprovalDate { get; set; }
    public string? ApprovedByFullName { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    public List<PlanDayResponseDto> Days { get; set; } = new();
}

public class EvaluatePlanDto
{
    [Required]
    public MonthlyPlanStatus Decision { get; set; } // Approved veya Rejected

    public string? RejectionReason { get; set; }
}
