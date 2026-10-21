using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Configuration;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Key)
            .HasMaxLength(100)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(s => s.Key)
            .IsUnique();

        builder.Property(s => s.Value)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.Group)
            .HasMaxLength(50)
            .IsUnicode(false)
            .HasDefaultValue("General")
            .IsRequired();

        builder.Property(s => s.IsReadOnly)
            .HasDefaultValue(false)
            .IsRequired();
    }
}
