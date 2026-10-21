using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Tracking;

/// <summary>
/// Öğrencinin planlanan güne ve doğrulanmış dinamik QR oturumuna bağlı fiili devam kaydı.
/// </summary>
public class Attendance : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    /// <summary>
    /// Bu devamın ait olduğu çalışma planı günü (1-to-1).
    /// </summary>
    public Guid PlanDayId { get; set; }
    public virtual PlanDay PlanDay { get; set; } = null!;

    /// <summary>
    /// Okutulan dinamik karekod oturumu.
    /// Manuel onaylarda null olabilir.
    /// </summary>
    public Guid? QrSessionId { get; set; }
    public virtual QrSession? QrSession { get; set; }

    /// <summary>
    /// Giriş yapılan an.
    /// </summary>
    public DateTime CheckInTime { get; set; }

    /// <summary>
    /// Çıkış yapılan an (varsa).
    /// </summary>
    public DateTime? CheckOutTime { get; set; }

    /// <summary>
    /// Fiilen çalışılan net süre (saat cinsinden).
    /// </summary>
    public decimal? ActualHoursWorked { get; set; }

    /// <summary>
    /// Doğrulama durumu (QR ile, manuel vb.).
    /// </summary>
    public AttendanceVerificationStatus VerificationStatus { get; set; } = AttendanceVerificationStatus.VerifiedByQr;

    /// <summary>
    /// Sahtecilik önleme amacıyla öğrencinin tarama yaptığı cihazın parmak izi / User-Agent özeti.
    /// </summary>
    public string? DeviceSignature { get; set; }

    /// <summary>
    /// Taramanın yapıldığı IP adresi.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Manuel onay verilmişse onaylayan danışman / yetkili.
    /// </summary>
    public Guid? VerifiedByUserId { get; set; }
    public virtual ApplicationUser? VerifiedByUser { get; set; }

    public string? VerificationNotes { get; set; }
}
