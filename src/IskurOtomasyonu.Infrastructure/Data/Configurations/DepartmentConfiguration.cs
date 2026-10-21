using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Academic;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("Departments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Code)
            .HasMaxLength(10)
            .IsUnicode(false)
            .IsRequired();

        builder.Property(d => d.Name)
            .HasMaxLength(100)
            .IsRequired();

        // Tekil İndeks: Bölüm Kodu
        builder.HasIndex(d => d.Code)
            .IsUnique();

        // Bölüm Başkanı
        builder.HasOne(d => d.HeadOfDepartment)
            .WithMany(u => u.HeadOfDepartments)
            .HasForeignKey(d => d.HeadOfDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Öğrenciler
        builder.HasMany(d => d.Students)
            .WithOne(s => s.Department)
            .HasForeignKey(s => s.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Birimler
        builder.HasMany(d => d.Units)
            .WithOne(u => u.Department)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
