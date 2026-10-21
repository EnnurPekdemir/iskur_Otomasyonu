using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Domain.Entities.Assignments;

/// <summary>
/// Öğrencinin danışman atama tarihçesini tutan snapshot tablosu.
/// Danışman değişikliklerinde eski kayıt ezilmez; EndDate ve IsActive güncellenerek yeni kayıt açılır.
/// </summary>
public class StudentAdvisorAssignment : BaseEntity
{
    public Guid StudentId { get; set; }
    public virtual Student Student { get; set; } = null!;

    /// <summary>
    /// Danışman öğretim elemanı (ApplicationUser).
    /// </summary>
    public Guid AdvisorId { get; set; }
    public virtual ApplicationUser Advisor { get; set; } = null!;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Atamanın şu anda geçerli aktif atama olup olmadığı.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Atama veya danışman değişikliği sebebi/açıklaması.
    /// </summary>
    public string? AssignmentNote { get; set; }
}
