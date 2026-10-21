using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;

namespace IskurOtomasyonu.Domain.Entities.Academic;

/// <summary>
/// Öğrencilerin İŞKUR kapsamında görevlendirildiği çalışma birimlerini temsil eder.
/// (Örn: Yazılım Laboratuvarı, Ar-Ge Merkezi, Fakülte Yazı İşleri, Kütüphane)
/// </summary>
public class Unit : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Capacity { get; set; } = 5;

    /// <summary>
    /// Birimin bağlı olduğu bölüm (Opsiyonel: Fakülte genel birimleri için null olabilir).
    /// </summary>
    public Guid? DepartmentId { get; set; }
    public virtual Department? Department { get; set; }

    /// <summary>
    /// Birim Sorumlusu / Danışman.
    /// </summary>
    public Guid? SupervisorId { get; set; }
    public virtual ApplicationUser? Supervisor { get; set; }

    // İlişkiler
    public virtual ICollection<StudentUnitAssignment> StudentAssignments { get; set; } = new List<StudentUnitAssignment>();
    public virtual ICollection<QrSession> QrSessions { get; set; } = new List<QrSession>();
}
