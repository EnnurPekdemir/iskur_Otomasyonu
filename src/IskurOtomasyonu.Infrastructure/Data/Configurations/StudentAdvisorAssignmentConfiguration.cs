using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Assignments;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class StudentAdvisorAssignmentConfiguration : IEntityTypeConfiguration<StudentAdvisorAssignment>
{
    public void Configure(EntityTypeBuilder<StudentAdvisorAssignment> builder)
    {
        builder.ToTable("StudentAdvisorAssignments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.StartDate)
            .IsRequired();

        builder.Property(a => a.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(a => a.AssignmentNote)
            .HasMaxLength(500);

        // Öğrenci İlişkisi
        builder.HasOne(a => a.Student)
            .WithMany(s => s.AdvisorAssignments)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Danışman İlişkisi
        builder.HasOne(a => a.Advisor)
            .WithMany(u => u.AdvisorAssignments)
            .HasForeignKey(a => a.AdvisorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Performans İndeksleri: Aktif danışman sorgusu ve danışmanın aktif öğrencileri
        builder.HasIndex(a => new { a.StudentId, a.IsActive });
        builder.HasIndex(a => new { a.AdvisorId, a.IsActive });
    }
}
