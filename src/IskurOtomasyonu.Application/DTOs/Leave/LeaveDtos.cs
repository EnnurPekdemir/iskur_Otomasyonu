using System.ComponentModel.DataAnnotations;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.DTOs.Leave;

public class CreateLeaveRequestDto
{
    [Required(ErrorMessage = "Başlangıç tarihi zorunludur.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "Bitiş tarihi zorunludur.")]
    public DateTime EndDate { get; set; }

    [Required(ErrorMessage = "İzin türü zorunludur.")]
    public LeaveType LeaveType { get; set; } = LeaveType.Mazeret;

    [Required(ErrorMessage = "İzin gerekçesi zorunludur.")]
    [MinLength(10, ErrorMessage = "Gerekçe en az 10 karakter olmalıdır.")]
    public string Reason { get; set; } = string.Empty;

    public string? DocumentUrl { get; set; }
}

public class LeaveRequestResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public LeaveType LeaveType { get; set; }
    public string LeaveTypeDescription => LeaveType.ToString();
    public LeaveStatus Status { get; set; }
    public string StatusDescription => Status.ToString();
    public string Reason { get; set; } = string.Empty;
    public string? DocumentUrl { get; set; }
    public DateTime? DecisionDate { get; set; }
    public string? ApprovedByName { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EvaluateLeaveDto
{
    [Required(ErrorMessage = "Karar zorunludur.")]
    public LeaveStatus Decision { get; set; } // Approved veya Rejected

    public string? RejectionReason { get; set; }
}

public class StudentLeaveBalanceDto
{
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public int TotalAnnualEntitlement { get; set; } = 10;
    public int UsedLeaveDays { get; set; }
    public int PendingLeaveDays { get; set; }
    public int RemainingLeaveDays => Math.Max(0, TotalAnnualEntitlement - UsedLeaveDays);
    
    /// <summary>
    /// Kalan izin 2 gün veya daha azsa ya da sınır aşılmışsa true döner.
    /// </summary>
    public bool HasLeaveWarning => RemainingLeaveDays <= 2;
    public string? WarningMessage { get; set; }
}
