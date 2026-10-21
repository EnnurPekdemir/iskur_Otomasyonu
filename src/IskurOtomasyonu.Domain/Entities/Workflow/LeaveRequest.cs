using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Workflow;

/// <summary>
/// Öğrencinin çalışma günleri için talep ettiği mazeret/sağlık izinlerini tutan varlık.
/// Sistem parametresine göre öğrencinin toplam yıllık izin hakkı (örn: 10 gün) denetlenir.
/// </summary>
public class LeaveRequest : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Talep edilen toplam iş günü / izin günü sayısı.
    /// </summary>
    public int TotalDays { get; set; }

    public LeaveType LeaveType { get; set; } = LeaveType.Mazeret;
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

    /// <summary>
    /// Öğrencinin sunduğu mazeret açıklaması.
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Varsa eklenen resmi sağlık raporu veya izin belgesi dosya yolu/adı.
    /// </summary>
    public string? DocumentUrl { get; set; }

    /// <summary>
    /// Talebi onaylayan/reddeden Danışman veya Dekanlık Yetkilisi (ApplicationUser).
    /// </summary>
    public Guid? ApprovedByUserId { get; set; }
    public virtual ApplicationUser? ApprovedByUser { get; set; }

    /// <summary>
    /// Kararın verildiği (onay/ret) tarih ve saat.
    /// </summary>
    public DateTime? DecisionDate { get; set; }

    /// <summary>
    /// Reddedildiyse gerekçesi.
    /// </summary>
    public string? RejectionReason { get; set; }
}
