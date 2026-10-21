using Microsoft.AspNetCore.Identity;

namespace IskurOtomasyonu.Domain.Entities.Identity;

/// <summary>
/// ASP.NET Core Identity rol yapısını genişleten sınıf.
/// 'Dekanlik', 'BolumBaskani', 'Danisman', 'Ogrenci' rollerini temsil eder.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationRole() : base()
    {
    }

    public ApplicationRole(string roleName, string? description = null) : base(roleName)
    {
        Description = description;
    }
}
