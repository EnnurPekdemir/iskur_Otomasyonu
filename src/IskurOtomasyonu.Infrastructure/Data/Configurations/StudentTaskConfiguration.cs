using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Workflow;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class StudentTaskConfiguration : IEntityTypeConfiguration<StudentTask>
{
    public void Configure(EntityTypeBuilder<StudentTask> builder)
    {
        builder.ToTable("StudentTasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(t => t.DueDate)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(t => t.StudentSubmissionNote)
            .HasMaxLength(1000);

        builder.Property(t => t.AdvisorEvaluationNote)
            .HasMaxLength(1000);

        // Öğrenci İlişkisi
        builder.HasOne(t => t.Student)
            .WithMany(s => s.Tasks)
            .HasForeignKey(t => t.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Görevi Atayan Danışman (ApplicationUser)
        builder.HasOne(t => t.AssignedByUser)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AssignedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Performans İndeksleri
        builder.HasIndex(t => new { t.StudentId, t.Status });
        builder.HasIndex(t => new { t.AssignedByUserId, t.Status });
        builder.HasIndex(t => t.DueDate);
    }
}
