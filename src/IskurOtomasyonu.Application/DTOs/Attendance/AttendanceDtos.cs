using System.ComponentModel.DataAnnotations;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.DTOs.Attendance;

public class CreateQrSessionDto
{
    public Guid? UnitId { get; set; }
}

public class QrSessionResponseDto
{
    public Guid Id { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string QrPayload { get; set; } = string.Empty; // Mobil cihazların okuyacağı şifreli/hashli veri
    public DateTime GeneratedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int RemainingSeconds => Math.Max(0, (int)(ExpiresAt - DateTime.UtcNow).TotalSeconds);
    public bool IsActive { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByFullName { get; set; } = string.Empty;
    public string? UnitName { get; set; }
}

public class QrCheckInRequestDto
{
    [Required(ErrorMessage = "QR Token verisi zorunludur.")]
    public string TokenHash { get; set; } = string.Empty;

    public string? DeviceSignature { get; set; }
    public string? IpAddress { get; set; }
}

public class AttendanceResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public Guid PlanDayId { get; set; }
    public DateTime PlanDate { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? ActualHoursWorked { get; set; }
    public AttendanceVerificationStatus VerificationStatus { get; set; }
    public string VerificationStatusDescription => VerificationStatus.ToString();
    public string? DeviceSignature { get; set; }
    public string? IpAddress { get; set; }
    public string? VerifiedByName { get; set; }
    public string? VerificationNotes { get; set; }
}

public class ManualAttendanceDto
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    public Guid PlanDayId { get; set; }

    [Required]
    public DateTime CheckInTime { get; set; }

    public DateTime? CheckOutTime { get; set; }
    public decimal? ActualHoursWorked { get; set; }
    public string? VerificationNotes { get; set; }
}
