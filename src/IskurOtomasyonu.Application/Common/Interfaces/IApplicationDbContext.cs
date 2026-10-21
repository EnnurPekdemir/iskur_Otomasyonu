using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Configuration;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;

namespace IskurOtomasyonu.Application.Common.Interfaces;

/// <summary>
/// Temiz Mimari (Clean Architecture) prensiplerine uygun olarak veritabanı bağlamını 
/// uygulama katmanına soyutlayan arayüz.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<ApplicationUser> Users { get; }
    DbSet<Department> Departments { get; }
    DbSet<Unit> Units { get; }
    DbSet<Student> Students { get; }
    DbSet<StudentAdvisorAssignment> StudentAdvisorAssignments { get; }
    DbSet<StudentUnitAssignment> StudentUnitAssignments { get; }
    DbSet<MonthlyPlan> MonthlyPlans { get; }
    DbSet<PlanDay> PlanDays { get; }
    DbSet<QrSession> QrSessions { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<LeaveRequest> LeaveRequests { get; }
    DbSet<StudentTask> StudentTasks { get; }
    DbSet<SystemSetting> SystemSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
