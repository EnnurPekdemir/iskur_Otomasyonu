using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Tracking;

/// <summary>
/// Öğrencinin ilgili ay için belirlenen çalışma takvimini tutan ana plan varlığı.
/// Her ay bağımsız bir snapshot olarak saklanır, geçmiş ayların üzerine yazılmaz.
/// </summary>
public class MonthlyPlan : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    public int Year { get; set; }
    public int Month { get; set; } // 1 - 12

    /// <summary>
    /// Bu ay için hedeflenen toplam çalışma saati (Örn: 40 saat, 60 saat).
    /// </summary>
    public decimal TotalTargetHours { get; set; }

    /// <summary>
    /// Planın onay durumu.
    /// </summary>
    public MonthlyPlanStatus ApprovalStatus { get; set; } = MonthlyPlanStatus.Draft;

    /// <summary>
    /// Planı onaylayan/reddeden Danışman / Bölüm Başkanı.
    /// </summary>
    public Guid? ApprovedByUserId { get; set; }
    public virtual ApplicationUser? ApprovedByUser { get; set; }

    public DateTime? ApprovalDate { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }

    /// <summary>
    /// Plandaki günlerin detay kayıtları.
    /// </summary>
    public virtual ICollection<PlanDay> PlanDays { get; set; } = new List<PlanDay>();
}
