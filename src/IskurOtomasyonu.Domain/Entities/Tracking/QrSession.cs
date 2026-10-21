using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Domain.Entities.Tracking;

/// <summary>
/// Devam takibi için üretilen 30 saniyelik dinamik karekod oturumlarını tutan varlık.
/// TokenHash güvenliği sayesinde QR kodunun ekran görüntüsü ile hile yapılmasını engeller.
/// </summary>
public class QrSession : BaseEntity
{
    /// <summary>
    /// QR oturumunu başlatan danışman veya birim yetkilisi (ApplicationUser).
    /// </summary>
    public Guid CreatedByUserId { get; set; }
    public virtual ApplicationUser CreatedByUser { get; set; } = null!;

    /// <summary>
    /// QR oturumunun ait olduğu çalışma birimi (Opsiyonel).
    /// </summary>
    public Guid? UnitId { get; set; }
    public virtual Unit? Unit { get; set; }

    /// <summary>
    /// Dinamik QR payload'unun tek kullanımlık SHA-256 kriptografik hash değeri.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// Replay attack engellemek için kullanılan dinamik nonce/tuz değeri.
    /// </summary>
    public string? DynamicNonce { get; set; }

    /// <summary>
    /// Karekodun geçerlilik süresinin bittiği an (Varsayılan: Üretildiği andan itibaren +30 saniye).
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Oturumun manuel sonlandırılma veya iptal durumu.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Bu QR oturumu taranarak oluşturulan fiili devam kayıtları.
    /// </summary>
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
