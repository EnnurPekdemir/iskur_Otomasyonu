using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Assignments;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class StudentUnitAssignmentConfiguration : IEntityTypeConfiguration<StudentUnitAssignment>
{
    public void Configure(EntityTypeBuilder<StudentUnitAssignment> builder)
    {
        builder.ToTable("StudentUnitAssignments");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.StartDate)
            .IsRequired();

        builder.Property(u => u.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(u => u.AssignmentNote)
            .HasMaxLength(500);

        // Öğrenci İlişkisi
        builder.HasOne(u => u.Student)
            .WithMany(s => s.UnitAssignments)
            .HasForeignKey(u => u.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Birim İlişkisi
        builder.HasOne(u => u.Unit)
            .WithMany(unit => unit.StudentAssignments)
            .HasForeignKey(u => u.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        // Performans İndeksleri
        builder.HasIndex(u => new { u.StudentId, u.IsActive });
        builder.HasIndex(u => new { u.UnitId, u.IsActive });
    }
}
