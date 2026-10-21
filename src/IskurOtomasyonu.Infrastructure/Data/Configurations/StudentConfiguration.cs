using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Academic;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("Students");

        builder.HasKey(s => s.Id);

        // 1-to-1 Kimlik İlişkisi
        builder.Property(s => s.UserId)
            .IsRequired();

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        // Öğrenci Numarası (Tekil İndeks)
        builder.Property(s => s.StudentNumber)
            .HasMaxLength(20)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(s => s.StudentNumber)
            .IsUnique();

        // KVKK Şifreli Alanlar
        builder.Property(s => s.EncryptedTcNo)
            .HasMaxLength(256)
            .IsUnicode(false)
            .IsRequired();

        // TCKN Arama ve Tekillik İndeksi (Deterministik Hash)
        builder.Property(s => s.TcNoHash)
            .HasMaxLength(64)
            .IsUnicode(false)
            .IsRequired();

        builder.HasIndex(s => s.TcNoHash)
            .IsUnique();

        builder.Property(s => s.EncryptedIban)
            .HasMaxLength(256)
            .IsUnicode(false)
            .IsRequired();

        // Akademik Bilgiler
        builder.Property(s => s.ClassLevel)
            .IsRequired();

        builder.Property(s => s.Gpa)
            .HasPrecision(3, 2);

        builder.Property(s => s.RemainingLeaveDays)
            .HasDefaultValue(10)
            .IsRequired();

        builder.Property(s => s.Status)
            .HasConversion<int>()
            .IsRequired();

        // Bölüm İlişkisi
        builder.HasOne(s => s.Department)
            .WithMany(d => d.Students)
            .HasForeignKey(s => s.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Tarihçeli Danışman Atamaları
        builder.HasMany(s => s.AdvisorAssignments)
            .WithOne(a => a.Student)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Tarihçeli Birim Görevlendirmeleri
        builder.HasMany(s => s.UnitAssignments)
            .WithOne(u => u.Student)
            .HasForeignKey(u => u.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Çalışma Planları
        builder.HasMany(s => s.MonthlyPlans)
            .WithOne(m => m.Student)
            .HasForeignKey(m => m.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Fiili Devam Kayıtları
        builder.HasMany(s => s.Attendances)
            .WithOne(a => a.Student)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // İzin Talepleri
        builder.HasMany(s => s.LeaveRequests)
            .WithOne(l => l.Student)
            .HasForeignKey(l => l.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Görevler
        builder.HasMany(s => s.Tasks)
            .WithOne(t => t.Student)
            .HasForeignKey(t => t.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
