using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Academic;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.ToTable("Units");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.Description)
            .HasMaxLength(500);

        builder.Property(u => u.Capacity)
            .HasDefaultValue(5)
            .IsRequired();

        // Bağlı olduğu bölüm (Opsiyonel)
        builder.HasOne(u => u.Department)
            .WithMany(d => d.Units)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Birim Sorumlusu
        builder.HasOne(u => u.Supervisor)
            .WithMany(user => user.SupervisedUnits)
            .HasForeignKey(u => u.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Birim Öğrenci Görevlendirmeleri
        builder.HasMany(u => u.StudentAssignments)
            .WithOne(sa => sa.Unit)
            .HasForeignKey(sa => sa.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // QR Oturumları
        builder.HasMany(u => u.QrSessions)
            .WithOne(q => q.Unit)
            .HasForeignKey(q => q.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
