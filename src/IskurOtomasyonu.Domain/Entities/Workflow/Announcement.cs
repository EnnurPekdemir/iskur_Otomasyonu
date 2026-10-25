using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Domain.Entities.Workflow;

/// <summary>
/// Bölüm Başkanı, Dekanlık veya Fakülte Sekreteri tarafından tüm öğrencilere veya bölüme yönelik yapılan duyurular.
/// </summary>
public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "Genel"; // Genel, İŞKUR, Önemli, Mazeret vb.
    public bool IsUrgent { get; set; } = false;

    // Duyuruyu Yapan Kullanıcı
    public Guid CreatedByUserId { get; set; }
    public virtual ApplicationUser? CreatedByUser { get; set; }

    // Belirli bir bölüme mi ait yoksa fakülte geneli mi?
    public Guid? DepartmentId { get; set; }
    public virtual Department? Department { get; set; }
}
