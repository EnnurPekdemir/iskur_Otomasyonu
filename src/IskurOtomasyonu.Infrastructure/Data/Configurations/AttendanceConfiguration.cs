using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Tracking;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.ToTable("Attendances");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.CheckInTime)
            .IsRequired();

        builder.Property(a => a.ActualHoursWorked)
            .HasPrecision(4, 2);

        builder.Property(a => a.VerificationStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(a => a.DeviceSignature)
            .HasMaxLength(256);

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45)
            .IsUnicode(false);

        builder.Property(a => a.VerificationNotes)
            .HasMaxLength(500);

        // Bir öğrencinin aynı planlanan günde yalnızca tek bir devam kaydı bulunabilir
        builder.HasIndex(a => new { a.StudentId, a.PlanDayId })
            .IsUnique();

        // Öğrenci İlişkisi
        builder.HasOne(a => a.Student)
            .WithMany(s => s.Attendances)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Planlanan Gün İlişkisi (1-to-1)
        builder.HasOne(a => a.PlanDay)
            .WithOne(p => p.Attendance)
            .HasForeignKey<Attendance>(a => a.PlanDayId)
            .OnDelete(DeleteBehavior.Restrict);

        // Karekod Oturumu İlişkisi
        builder.HasOne(a => a.QrSession)
            .WithMany(q => q.Attendances)
            .HasForeignKey(a => a.QrSessionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Doğrulayan Danışman/Yetkili (Manuel Onay Durumunda)
        builder.HasOne(a => a.VerifiedByUser)
            .WithMany()
            .HasForeignKey(a => a.VerifiedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Tarih ve Durum Bazlı Raporlama İndeksi
        builder.HasIndex(a => new { a.CheckInTime, a.VerificationStatus });
    }
}
