namespace IskurOtomasyonu.Domain.Common;

/// <summary>
/// Mantıksal silme (Soft Delete) mekanizmasını destekleyen varlıklar için arayüz.
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}
