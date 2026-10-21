using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Configuration;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Infrastructure.Data;

/// <summary>
/// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu Entity Framework Core veri bağlamı.
/// ASP.NET Core Identity (Guid anahtarlı), Fluent API konfigürasyonları, 
/// otomatik denetim izi (Audit), KVKK ve global Soft-Delete mekanizmasını yönetir.
/// </summary>
public class ApplicationDbContext : IdentityDbContext<
    ApplicationUser,
    ApplicationRole,
    Guid,
    IdentityUserClaim<Guid>,
    IdentityUserRole<Guid>,
    IdentityUserLogin<Guid>,
    IdentityRoleClaim<Guid>,
    IdentityUserToken<Guid>>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // ==========================================
    // DbSet Tanımlamaları
    // ==========================================

    // Akademik ve Birim Varlıkları
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Student> Students => Set<Student>();

    // Snapshot & Geçmiş Takip Varlıkları
    public DbSet<StudentAdvisorAssignment> StudentAdvisorAssignments => Set<StudentAdvisorAssignment>();
    public DbSet<StudentUnitAssignment> StudentUnitAssignments => Set<StudentUnitAssignment>();

    // Çalışma Planı ve Devam Takip Varlıkları
    public DbSet<MonthlyPlan> MonthlyPlans => Set<MonthlyPlan>();
    public DbSet<PlanDay> PlanDays => Set<PlanDay>();
    public DbSet<QrSession> QrSessions => Set<QrSession>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    // İş Akışı ve Görev Değerlendirme Varlıkları
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<StudentTask> StudentTasks => Set<StudentTask>();

    // Sistem Yapılandırması
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    // ==========================================
    // Model Yapılandırması (Fluent API)
    // ==========================================

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // 1. ASP.NET Core Identity tablolarının temel şemasını oluştur
        base.OnModelCreating(builder);

        // 2. Identity tablolarını temiz isimlendirme standartlarına uyarla
        ConfigureIdentityTableNames(builder);

        // 3. IEntityTypeConfiguration sınıflarını derlemeden otomatik keşfet ve uygula
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // 4. MSSQL'deki döngüsel silme (Error 1785 - multiple cascade paths) hatalarını 
        // engellemek adına açıkça Cascade belirtilmeyen tüm Foreign Key'leri varsayılan olarak Restrict yap
        ApplyGlobalRestrictDeleteBehavior(builder);

        // 5. ISoftDeletable arayüzünü uygulayan tüm varlıklara Global Query Filter uygula
        ApplyGlobalSoftDeleteQueryFilters(builder);

        // 6. Başlangıç çekirdek verilerini (Seed Data) yükle
        SeedDefaultSystemData(builder);
    }

    // ==========================================
    // Otomatik Audit & Soft-Delete Interception
    // ==========================================

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        OnBeforeSaving();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        OnBeforeSaving();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void OnBeforeSaving()
    {
        var utcNow = DateTime.UtcNow;

        // 1. Soft-Delete (Mantıksal Silme) İşlemi
        foreach (var entry in ChangeTracker.Entries<ISoftDeletable>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = utcNow;
            }
        }

        // 2. Denetim İzi (Audit) Bilgilerinin Güncellenmesi
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = utcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = utcNow;
                    break;
            }
        }
    }

    // ==========================================
    // Yardımcı Yapılandırma Metotları
    // ==========================================

    private static void ConfigureIdentityTableNames(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>().ToTable("AppUsers");
        builder.Entity<ApplicationRole>().ToTable("AppRoles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("AppUserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("AppUserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("AppUserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("AppRoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("AppUserTokens");
    }

    private static void ApplyGlobalRestrictDeleteBehavior(ModelBuilder builder)
    {
        var cascadeFks = builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetForeignKeys())
            .Where(fk => !fk.IsOwnership && fk.DeleteBehavior == DeleteBehavior.Cascade);

        foreach (var fk in cascadeFks)
        {
            // MonthlyPlan -> PlanDay ilişkisi haricinde döngüsel silmeyi önlemek için Restrict yap
            if (fk.DeclaringEntityType.ClrType == typeof(PlanDay) && 
                fk.PrincipalEntityType.ClrType == typeof(MonthlyPlan))
            {
                continue;
            }

            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }

    private static void ApplyGlobalSoftDeleteQueryFilters(ModelBuilder builder)
    {
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ConfigureSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)?
                    .MakeGenericMethod(entityType.ClrType);

                method?.Invoke(null, new object[] { builder });
            }
        }
    }

    private static void ConfigureSoftDeleteFilter<TEntity>(ModelBuilder builder) 
        where TEntity : class, ISoftDeletable
    {
        builder.Entity<TEntity>().HasQueryFilter(e => !e.IsDeleted);
    }

    private static void SeedDefaultSystemData(ModelBuilder builder)
    {
        // 1. Sabit Roller
        var dekanlikRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var bolumBaskaniRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var danismanRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var ogrenciRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        builder.Entity<ApplicationRole>().HasData(
            new ApplicationRole
            {
                Id = dekanlikRoleId,
                Name = AppRoles.Dekanlik,
                NormalizedName = AppRoles.Dekanlik.ToUpperInvariant(),
                Description = "Teknoloji Fakültesi Dekanlık ve Yönetici Rolü",
                IsSystemRole = true,
                ConcurrencyStamp = "role-stamp-dekanlik"
            },
            new ApplicationRole
            {
                Id = bolumBaskaniRoleId,
                Name = AppRoles.BolumBaskani,
                NormalizedName = AppRoles.BolumBaskani.ToUpperInvariant(),
                Description = "Akademik Bölüm Başkanı Rolü",
                IsSystemRole = true,
                ConcurrencyStamp = "role-stamp-bolumbaskani"
            },
            new ApplicationRole
            {
                Id = danismanRoleId,
                Name = AppRoles.Danisman,
                NormalizedName = AppRoles.Danisman.ToUpperInvariant(),
                Description = "Öğrenci Akademik ve İŞKUR Danışmanı Rolü",
                IsSystemRole = true,
                ConcurrencyStamp = "role-stamp-danisman"
            },
            new ApplicationRole
            {
                Id = ogrenciRoleId,
                Name = AppRoles.Ogrenci,
                NormalizedName = AppRoles.Ogrenci.ToUpperInvariant(),
                Description = "İŞKUR Kapsamında Görev Alan Öğrenci Rolü",
                IsSystemRole = true,
                ConcurrencyStamp = "role-stamp-ogrenci"
            }
        );

        // 2. Parametrik Sistem Ayarları Seed Kayıtları
        builder.Entity<SystemSetting>().HasData(
            new SystemSetting
            {
                Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"),
                Key = SystemSettingKeys.MaxAnnualLeaveDays,
                Value = "10",
                Description = "Öğrencinin yıllık kullanabileceği maksimum mazeret/sağlık izin gün sayısı",
                Group = "Leave",
                IsReadOnly = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SystemSetting
            {
                Id = Guid.Parse("a0000000-0000-0000-0000-000000000002"),
                Key = SystemSettingKeys.QrExpirationSeconds,
                Value = "30",
                Description = "Yoklama için üretilen dinamik karekod oturumunun geçerlilik süresi (saniye)",
                Group = "Attendance",
                IsReadOnly = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SystemSetting
            {
                Id = Guid.Parse("a0000000-0000-0000-0000-000000000003"),
                Key = SystemSettingKeys.DailyMaxWorkingHours,
                Value = "5",
                Description = "Bir öğrencinin günde yapabileceği maksimum İŞKUR çalışma saati",
                Group = "Planning",
                IsReadOnly = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SystemSetting
            {
                Id = Guid.Parse("a0000000-0000-0000-0000-000000000004"),
                Key = SystemSettingKeys.MonthlyMaxWorkingHours,
                Value = "60",
                Description = "Bir öğrencinin ayda yapabileceği maksimum İŞKUR çalışma saati",
                Group = "Planning",
                IsReadOnly = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SystemSetting
            {
                Id = Guid.Parse("a0000000-0000-0000-0000-000000000005"),
                Key = SystemSettingKeys.AttendanceToleranceMinutes,
                Value = "15",
                Description = "Giriş ve çıkış saatlerinde tolerans tanınan dakika süresi",
                Group = "Attendance",
                IsReadOnly = false,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
