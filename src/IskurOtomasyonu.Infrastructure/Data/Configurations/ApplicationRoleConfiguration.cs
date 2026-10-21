using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.ToTable("AppRoles");

        builder.Property(r => r.Description)
            .HasMaxLength(250);
    }
}
