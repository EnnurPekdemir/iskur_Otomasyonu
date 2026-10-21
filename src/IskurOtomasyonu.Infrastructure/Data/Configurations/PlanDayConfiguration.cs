using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Tracking;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class PlanDayConfiguration : IEntityTypeConfiguration<PlanDay>
{
    public void Configure(EntityTypeBuilder<PlanDay> builder)
    {
        builder.ToTable("PlanDays");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Date)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(p => p.StartTime)
            .IsRequired();

        builder.Property(p => p.EndTime)
            .IsRequired();

        builder.Property(p => p.PlannedHours)
            .HasPrecision(4, 2)
            .IsRequired();

        builder.Property(p => p.DayStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(p => p.Notes)
            .HasMaxLength(250);

        // Bir plan içinde aynı gün sadece bir defa planlanabilir
        builder.HasIndex(p => new { p.MonthlyPlanId, p.Date })
            .IsUnique();

        // Gerçekleşen Devam Kaydı İlişkisi (1-to-1)
        builder.HasOne(p => p.Attendance)
            .WithOne(a => a.PlanDay)
            .HasForeignKey<Attendance>(a => a.PlanDayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
