namespace IskurOtomasyonu.Domain.Common;

/// <summary>
/// Tüm domain varlıklarının türediği, denetim (Audit) ve 
/// mantıksal silme (Soft Delete) özelliklerini barındıran temel sınıf.
/// </summary>
public abstract class BaseEntity : ISoftDeletable, IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Denetim (Audit) Alanları
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Mantıksal Silme (Soft-Delete) Alanları
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}
