using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Tracking;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class MonthlyPlanConfiguration : IEntityTypeConfiguration<MonthlyPlan>
{
    public void Configure(EntityTypeBuilder<MonthlyPlan> builder)
    {
        builder.ToTable("MonthlyPlans");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Year)
            .IsRequired();

        builder.Property(m => m.Month)
            .IsRequired();

        builder.Property(m => m.TotalTargetHours)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(m => m.ApprovalStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(m => m.RejectionReason)
            .HasMaxLength(500);

        builder.Property(m => m.Notes)
            .HasMaxLength(1000);

        // Snapshot Bütünlüğü: Bir öğrenci için aynı yıl ve ayda sadece 1 çalışma planı bulunabilir!
        builder.HasIndex(m => new { m.StudentId, m.Year, m.Month })
            .IsUnique();

        // Öğrenci İlişkisi
        builder.HasOne(m => m.Student)
            .WithMany(s => s.MonthlyPlans)
            .HasForeignKey(m => m.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Onaylayan Danışman / Yetkili
        builder.HasOne(m => m.ApprovedByUser)
            .WithMany(u => u.ApprovedMonthlyPlans)
            .HasForeignKey(m => m.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Plandaki Günler (Plan silinirse/arşivlenirse günleri ile birlikte yönetilir)
        builder.HasMany(m => m.PlanDays)
            .WithOne(p => p.MonthlyPlan)
            .HasForeignKey(p => p.MonthlyPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
