using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;

namespace IskurOtomasyonu.Domain.Entities.Assignments;

/// <summary>
/// Öğrencinin fakülte içerisindeki birim görevlendirme tarihçesini tutan snapshot tablosu.
/// Birim değişikliklerinde doğrudan öğrenci tablosunda ezilmez; geçmişe dönük izlenebilir.
/// </summary>
public class StudentUnitAssignment : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    public Guid UnitId { get; set; }
    public virtual Unit Unit { get; set; } = null!;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Birim görevlendirmesinin şu anda geçerli aktif görevlendirme olup olmadığı.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Görevlendirme veya birim değişikliği gerekçesi/açıklaması.
    /// </summary>
    public string? AssignmentNote { get; set; }
}
