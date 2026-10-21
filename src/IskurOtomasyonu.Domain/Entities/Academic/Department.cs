using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Domain.Entities.Academic;

/// <summary>
/// Fakülte bünyesindeki akademik bölümleri temsil eder (Örn: Bilgisayar Mühendisliği).
/// </summary>
public class Department : BaseEntity
{
    public string Code { get; set; } = string.Empty; // Örn: 'BM', 'EM', 'MM'
    public string Name { get; set; } = string.Empty; // Örn: 'Bilgisayar Mühendisliği'

    /// <summary>
    /// Bölüm Başkanı (ApplicationUser).
    /// </summary>
    public Guid? HeadOfDepartmentId { get; set; }
    public virtual ApplicationUser? HeadOfDepartment { get; set; }

    // İlişkiler
    public virtual ICollection<Student> Students { get; set; } = new List<Student>();
    public virtual ICollection<Unit> Units { get; set; } = new List<Unit>();
}
