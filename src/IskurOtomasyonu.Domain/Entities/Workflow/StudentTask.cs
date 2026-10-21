using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Workflow;

/// <summary>
/// Danışman öğretim elemanı tarafından öğrenciye atanan çalışma/ödev görevleri ve değerlendirmeleri.
/// </summary>
public class StudentTask : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    /// <summary>
    /// Görevi atayan Danışman (ApplicationUser).
    /// </summary>
    public Guid AssignedByUserId { get; set; }
    public virtual ApplicationUser AssignedByUser { get; set; } = null!;

    /// <summary>
    /// Görev başlığı (örn: 'Laboratuvar Cihaz Envanter Sayımı').
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Görev detaylı açıklaması ve yönergeleri.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Görevin tamamlanması gereken hedef tarih (Teslim tarihi).
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// Görevin durumu ('Pending', 'InProgress', 'Completed', 'Overdue', 'Cancelled').
    /// </summary>
    public StudentTaskStatus Status { get; set; } = StudentTaskStatus.Pending;

    /// <summary>
    /// Görevin fiilen tamamlandığı tarih.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Öğrencinin görevi tamamlarken eklediği teslim notu / rapor özeti.
    /// </summary>
    public string? StudentSubmissionNote { get; set; }

    /// <summary>
    /// Danışmanın göreve ilişkin değerlendirme notu ve geribildirimi.
    /// </summary>
    public string? AdvisorEvaluationNote { get; set; }

    /// <summary>
    /// Danışman puanı / skoru (Opsiyonel: örn. 100 üzerinden).
    /// </summary>
    public int? AdvisorScore { get; set; }
}
