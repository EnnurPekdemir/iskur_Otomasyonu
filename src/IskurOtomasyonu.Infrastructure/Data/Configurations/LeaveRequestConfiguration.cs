using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Workflow;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class LeaveRequestConfiguration : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.ToTable("LeaveRequests");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.StartDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(l => l.EndDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(l => l.TotalDays)
            .IsRequired();

        builder.Property(l => l.LeaveType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Reason)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(l => l.DocumentUrl)
            .HasMaxLength(500);

        builder.Property(l => l.RejectionReason)
            .HasMaxLength(500);

        // Öğrenci İlişkisi
        builder.HasOne(l => l.Student)
            .WithMany(s => s.LeaveRequests)
            .HasForeignKey(l => l.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Onaylayan Danışman / Yetkili
        builder.HasOne(l => l.ApprovedByUser)
            .WithMany(u => u.EvaluatedLeaveRequests)
            .HasForeignKey(l => l.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Performans ve Kota Denetimi İndeksleri
        builder.HasIndex(l => new { l.StudentId, l.Status });
        builder.HasIndex(l => new { l.StartDate, l.EndDate });
    }
}
