using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Infrastructure.Data;
using IskurOtomasyonu.Infrastructure.Security;

namespace IskurOtomasyonu.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Altyapı katmanı bağımlılıklarını (DbContext, Identity, KVKK Şifreleme) DI konteynerine kaydeder.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // 1. KVKK Şifreleme Servisi Kaydı
        services.AddSingleton<IEncryptionService, AesEncryptionService>();

        // 2. Entity Framework Core MSSQL Bağlantısı
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=IskurOtomasyonDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });
            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        // 3. IApplicationDbContext Arayüz Bağlantısı
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // 3. ASP.NET Core Identity Yapılandırması
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            // Parola Kuralları (Fakülte ve Kurumsal Güvenlik Politikası)
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;

            // Kullanıcı Kuralları
            options.User.RequireUniqueEmail = true;

            // Hesap Kilitleme Kuralları (Brute-Force Koruması)
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // 4. HttpContextAccessor, CurrentUserService, JwtTokenGenerator ve ExportService Kaydı
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, Services.CurrentUserService>();
        services.AddScoped<IJwtTokenGenerator, Security.JwtTokenGenerator>();
        services.AddScoped<IExportService, Services.ExportService>();

        return services;
    }
}
