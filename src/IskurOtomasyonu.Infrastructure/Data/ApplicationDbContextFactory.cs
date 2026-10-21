using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace IskurOtomasyonu.Infrastructure.Data;

/// <summary>
/// EF Core CLI ve Migration araçlarının tasarım zamanında (Design-time) 
/// ApplicationDbContext örneğini güvenle üretebilmesini sağlayan fabrika sınıfı.
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        // Tasarım zamanında yerel MSSQL bağlantı dizesi kullanılır
        var connectionString = "Server=(localdb)\\mssqllocaldb;Database=IskurOtomasyonDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        optionsBuilder.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
        });

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
