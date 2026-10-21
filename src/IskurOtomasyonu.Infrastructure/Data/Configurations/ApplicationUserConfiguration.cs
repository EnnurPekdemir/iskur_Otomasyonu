using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Infrastructure.Data.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("AppUsers");

        builder.Property(u => u.FirstName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(u => u.LastName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(u => u.AcademicTitle)
            .HasMaxLength(50);

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(256);

        // 1-to-1: ApplicationUser <-> Student
        builder.HasOne(u => u.StudentProfile)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Danışman Atamaları
        builder.HasMany(u => u.AdvisorAssignments)
            .WithOne(a => a.Advisor)
            .HasForeignKey(a => a.AdvisorId)
            .OnDelete(DeleteBehavior.Restrict);

        // QR Oturumları
        builder.HasMany(u => u.CreatedQrSessions)
            .WithOne(q => q.CreatedByUser)
            .HasForeignKey(q => q.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // İzin Talebi Onayları
        builder.HasMany(u => u.EvaluatedLeaveRequests)
            .WithOne(l => l.ApprovedByUser)
            .HasForeignKey(l => l.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Görev Atamaları
        builder.HasMany(u => u.AssignedTasks)
            .WithOne(t => t.AssignedByUser)
            .HasForeignKey(t => t.AssignedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Aylık Plan Onayları
        builder.HasMany(u => u.ApprovedMonthlyPlans)
            .WithOne(m => m.ApprovedByUser)
            .HasForeignKey(m => m.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bölüm Başkanlığı
        builder.HasMany(u => u.HeadOfDepartments)
            .WithOne(d => d.HeadOfDepartment)
            .HasForeignKey(d => d.HeadOfDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Birim Sorumluluğu
        builder.HasMany(u => u.SupervisedUnits)
            .WithOne(un => un.Supervisor)
            .HasForeignKey(un => un.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
