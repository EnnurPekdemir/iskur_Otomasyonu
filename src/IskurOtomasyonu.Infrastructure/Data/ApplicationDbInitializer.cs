using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Infrastructure.Data;

public static class ApplicationDbInitializer
{
    public static async Task InitializeDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var encryptionService = services.GetRequiredService<IEncryptionService>();

        logger.LogInformation("Veritabanı başlatılıyor ve migrationlar kontrol ediliyor...");

        // 1. Veritabanı Şemasını Garantiye Al
        try
        {
            await context.Database.MigrateAsync();
            logger.LogInformation("MigrateAsync başarıyla tamamlandı.");
        }
        catch (Exception ex)
        {
            logger.LogWarning("MigrateAsync çalıştırılamadı ({Message}), EnsureCreatedAsync deneniyor...", ex.Message);
            try
            {
                await context.Database.EnsureCreatedAsync();
                logger.LogInformation("EnsureCreatedAsync ile veritabanı şeması oluşturuldu.");
            }
            catch (Exception innerEx)
            {
                logger.LogError(innerEx, "EnsureCreatedAsync hatası: {Message}", innerEx.Message);
            }
        }

        // 2. Rolleri Kontrol Et / Oluştur
        try
        {
            string[] roles = [AppRoles.Dekanlik, AppRoles.BolumBaskani, AppRoles.Danisman, AppRoles.Ogrenci, AppRoles.FakulteSekreteri];
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    var roleResult = await roleManager.CreateAsync(new ApplicationRole
                    {
                        Name = role,
                        NormalizedName = role.ToUpperInvariant(),
                        Description = $"{role} Rolü",
                        IsSystemRole = true
                    });
                    if (roleResult.Succeeded)
                    {
                        logger.LogInformation("Rol oluşturuldu: {Role}", role);
                    }
                    else
                    {
                        logger.LogWarning("Rol oluşturulamadı ({Role}): {Errors}", role, string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Roller oluşturulurken hata: {Message}", ex.Message);
        }

        // 3. Bölümleri Kontrol Et / Oluştur
        Department? bmDept = null;
        try
        {
            if (!await context.Departments.AnyAsync())
            {
                var departments = new List<Department>
                {
                    new() { Name = "Bilgisayar Mühendisliği", Code = "BM" },
                    new() { Name = "Yazılım Mühendisliği", Code = "YM" },
                    new() { Name = "Mekatronik Mühendisliği", Code = "MM" },
                    new() { Name = "Elektrik-Elektronik Mühendisliği", Code = "EEM" },
                    new() { Name = "Adli Bilişim Mühendisliği", Code = "ABM" }
                };
                await context.Departments.AddRangeAsync(departments);
                await context.SaveChangesAsync();
                logger.LogInformation("Bölümler oluşturuldu.");
            }
            bmDept = await context.Departments.FirstOrDefaultAsync(d => d.Code == "BM");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Bölümler oluşturulurken hata: {Message}", ex.Message);
        }

        // 4. Birimleri Kontrol Et / Oluştur
        Unit? defaultUnit = null;
        try
        {
            if (!await context.Units.AnyAsync())
            {
                var units = new List<Unit>
                {
                    new() { Name = "Bilgi İşlem ve Ağ Yönetim Birimi", Capacity = 6, Description = "Fakülte sunucu ve laboratuvar altyapısı", DepartmentId = bmDept?.Id },
                    new() { Name = "Yazılım Geliştirme Laboratuvarı", Capacity = 8, Description = "Öğrenci otomasyon ve proje yazılımları", DepartmentId = bmDept?.Id },
                    new() { Name = "Öğrenci İşleri ve Yazı İşleri Bürosu", Capacity = 5, Description = "Öğrenci evrak, staj ve puantaj takibi" },
                    new() { Name = "Fakülte Kütüphanesi ve Çalışma Salonu", Capacity = 4, Description = "Öğrenci çalışma alanı düzeni" }
                };
                await context.Units.AddRangeAsync(units);
                await context.SaveChangesAsync();
                logger.LogInformation("Birimler oluşturuldu.");
            }
            defaultUnit = await context.Units.FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Birimler oluşturulurken hata: {Message}", ex.Message);
        }

        // 5. Demo Kullanıcıları Kontrol Et / Oluştur
        try
        {
            // A) Dekanlık - Prof. Dr. Abdullah Engin ÖZÇELİK
            var dekanUser = await userManager.FindByEmailAsync("dekanlik@tf.edu.tr");
            if (dekanUser == null)
            {
                dekanUser = new ApplicationUser
                {
                    UserName = "dekanlik@tf.edu.tr",
                    Email = "dekanlik@tf.edu.tr",
                    FirstName = "Abdullah Engin",
                    LastName = "Özçelik",
                    AcademicTitle = "Prof. Dr. (Dekan)",
                    PhoneNumber = "03322233300",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(dekanUser, "Admin123!");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(dekanUser, AppRoles.Dekanlik);
                    logger.LogInformation("Dekanlık kullanıcısı oluşturuldu.");
                }
            }
            else
            {
                dekanUser.FirstName = "Abdullah Engin";
                dekanUser.LastName = "Özçelik";
                dekanUser.AcademicTitle = "Prof. Dr. (Dekan)";
                await userManager.UpdateAsync(dekanUser);
            }

            // B) Bölüm Başkanı - Prof. Dr. Fatih BAŞÇİFTÇİ
            var baskanUser = await userManager.FindByEmailAsync("bm_baskan@tf.edu.tr");
            if (baskanUser == null)
            {
                baskanUser = new ApplicationUser
                {
                    UserName = "bm_baskan@tf.edu.tr",
                    Email = "bm_baskan@tf.edu.tr",
                    FirstName = "Fatih",
                    LastName = "Başçiftçi",
                    AcademicTitle = "Prof. Dr. (Bölüm Başkanı)",
                    PhoneNumber = "03322233310",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(baskanUser, "Baskan123!");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(baskanUser, AppRoles.BolumBaskani);
                    if (bmDept != null)
                    {
                        bmDept.HeadOfDepartmentId = baskanUser.Id;
                        await context.SaveChangesAsync();
                    }
                    logger.LogInformation("Bölüm Başkanı kullanıcısı oluşturuldu.");
                }
            }
            else
            {
                baskanUser.FirstName = "Fatih";
                baskanUser.LastName = "Başçiftçi";
                baskanUser.AcademicTitle = "Prof. Dr. (Bölüm Başkanı)";
                await userManager.UpdateAsync(baskanUser);
            }

            // C) Danışman - Prof. Dr. Şakir TAŞDEMİR
            var danismanUser = await userManager.FindByEmailAsync("danisman@tf.edu.tr");
            if (danismanUser == null)
            {
                danismanUser = new ApplicationUser
                {
                    UserName = "danisman@tf.edu.tr",
                    Email = "danisman@tf.edu.tr",
                    FirstName = "Şakir",
                    LastName = "Taşdemir",
                    AcademicTitle = "Prof. Dr.",
                    PhoneNumber = "03322233320",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(danismanUser, "Danisman123!");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(danismanUser, AppRoles.Danisman);
                    logger.LogInformation("Danışman kullanıcısı oluşturuldu.");
                }
            }
            else
            {
                danismanUser.FirstName = "Şakir";
                danismanUser.LastName = "Taşdemir";
                danismanUser.AcademicTitle = "Prof. Dr.";
                await userManager.UpdateAsync(danismanUser);
            }

            // C2) Selçuk Teknoloji Fakültesi Diğer Gerçek Akademik Kadro
            var facultyMembers = new List<(string Email, string FirstName, string LastName, string Title, string Phone)>
            {
                ("hkahramanli@tf.edu.tr", "Humar", "Kahramanlı Örnek", "Prof. Dr.", "03322233321"),
                ("zuleyha@tf.edu.tr", "Züleyha", "Yılmaz Acar", "Prof. Dr.", "03322233322"),
                ("iaozkan@tf.edu.tr", "İlker Ali", "Özkan", "Doç. Dr.", "03322233323"),
                ("isaritas@tf.edu.tr", "İsmail", "Sarıtaş", "Prof. Dr.", "03322233324"),
                ("mcunkas@tf.edu.tr", "Mehmet", "Çunkaş", "Prof. Dr.", "03322233325"),
                ("ayasar@tf.edu.tr", "Ali", "Yaşar", "Doç. Dr.", "03322233326"),
                ("tsag@tf.edu.tr", "Tahir", "Sağ", "Doç. Dr.", "03322233327"),
                ("ktutuncu@tf.edu.tr", "Kemal", "Tütüncü", "Doç. Dr.", "03322233328")
            };

            foreach (var prof in facultyMembers)
            {
                var existingProf = await userManager.FindByEmailAsync(prof.Email);
                if (existingProf == null)
                {
                    var newProf = new ApplicationUser
                    {
                        UserName = prof.Email,
                        Email = prof.Email,
                        FirstName = prof.FirstName,
                        LastName = prof.LastName,
                        AcademicTitle = prof.Title,
                        PhoneNumber = prof.Phone,
                        EmailConfirmed = true,
                        IsActive = true
                    };
                    var pRes = await userManager.CreateAsync(newProf, "Hoca123!");
                    if (pRes.Succeeded)
                    {
                        await userManager.AddToRoleAsync(newProf, AppRoles.Danisman);
                    }
                }
                else
                {
                    existingProf.FirstName = prof.FirstName;
                    existingProf.LastName = prof.LastName;
                    existingProf.AcademicTitle = prof.Title;
                    await userManager.UpdateAsync(existingProf);
                }
            }

            // D) Öğrenci
            var ogrenciUser = await userManager.FindByNameAsync("2210206001");
            if (ogrenciUser == null)
            {
                ogrenciUser = new ApplicationUser
                {
                    UserName = "2210206001",
                    Email = "2210206001@ogr.tf.edu.tr",
                    FirstName = "Ennur",
                    LastName = "Pekdemir",
                    PhoneNumber = "05324445566",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(ogrenciUser, "Ogrenci123!");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(ogrenciUser, AppRoles.Ogrenci);
                    logger.LogInformation("Öğrenci hesabı oluşturuldu.");

                    // Öğrenci profili
                    if (bmDept != null)
                    {
                        var tcNoRaw = "12345678901";
                        var ibanRaw = "TR330006100511123456789012";

                        var student = new Student
                        {
                            UserId = ogrenciUser.Id,
                            StudentNumber = "2210206001",
                            DepartmentId = bmDept.Id,
                            ClassLevel = 4,
                            Gpa = 3.45m,
                            Status = StudentStatus.Active,
                            RemainingLeaveDays = 10,
                            EncryptedTcNo = encryptionService.Encrypt(tcNoRaw),
                            TcNoHash = encryptionService.ComputeHash(tcNoRaw),
                            EncryptedIban = encryptionService.Encrypt(ibanRaw)
                        };
                        await context.Students.AddAsync(student);
                        await context.SaveChangesAsync();

                        // Danışman Ataması
                        if (danismanUser != null)
                        {
                            var advAssign = new StudentAdvisorAssignment
                            {
                                StudentId = student.Id,
                                AdvisorId = danismanUser.Id,
                                StartDate = DateTime.UtcNow.AddMonths(-1),
                                IsActive = true,
                                AssignmentNote = "2026 Bahar Dönemi İŞKUR Danışmanı"
                            };
                            await context.StudentAdvisorAssignments.AddAsync(advAssign);
                        }

                        // Birim Görevlendirmesi
                        if (defaultUnit != null)
                        {
                            var unitAssign = new StudentUnitAssignment
                            {
                                StudentId = student.Id,
                                UnitId = defaultUnit.Id,
                                StartDate = DateTime.UtcNow.AddMonths(-1),
                                IsActive = true,
                                AssignmentNote = "Yazılım ve Laboratuvar Görevlendirmesi"
                            };
                            await context.StudentUnitAssignments.AddAsync(unitAssign);
                        }

                        // Bu ay için örnek onaylı çalışma planı oluştur
                        var now = DateTime.UtcNow;
                        var plan = new MonthlyPlan
                        {
                            StudentId = student.Id,
                            Year = now.Year,
                            Month = now.Month,
                            ApprovalStatus = MonthlyPlanStatus.Approved,
                            TotalTargetHours = 15,
                            ApprovedByUserId = danismanUser?.Id,
                            ApprovalDate = now.AddDays(-2)
                        };
                        await context.MonthlyPlans.AddAsync(plan);
                        await context.SaveChangesAsync();

                        // Bugün için bir plan günü ekle (QR yoklaması hemen yapılabilsin)
                        var todayPlanDay = new PlanDay
                        {
                            MonthlyPlanId = plan.Id,
                            Date = now.Date,
                            StartTime = new TimeSpan(9, 0, 0),
                            EndTime = new TimeSpan(14, 0, 0),
                            PlannedHours = 5,
                            DayStatus = PlanDayStatus.Planned,
                            Notes = "Sistem başlangıç test çalışma günü"
                        };
                        await context.PlanDays.AddAsync(todayPlanDay);

                        // Örnek bir görev ata
                        if (danismanUser != null)
                        {
                            var task = new StudentTask
                            {
                                StudentId = student.Id,
                                AssignedByUserId = danismanUser.Id,
                                Title = "İŞKUR Otomasyonu Proje Dokümantasyonu",
                                Description = "Geliştirilen dinamik QR devam takip sisteminin kullanım kılavuzunu hazırlayınız.",
                                DueDate = now.AddDays(7),
                                Status = StudentTaskStatus.Pending
                            };
                            await context.StudentTasks.AddAsync(task);
                        }

                        await context.SaveChangesAsync();
                        logger.LogInformation("Öğrenci profili, danışman/birim atamaları ve planı oluşturuldu.");
                    }
                }
                else
                {
                    logger.LogError("Öğrenci oluşturulamadı: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }

            // E) Fakülte Sekreteri (İŞKUR Yönetim Merkezi)
            var sekreterUser = await userManager.FindByEmailAsync("sekreter@tf.edu.tr");
            if (sekreterUser == null)
            {
                sekreterUser = new ApplicationUser
                {
                    UserName = "sekreter@tf.edu.tr",
                    Email = "sekreter@tf.edu.tr",
                    FirstName = "Murat",
                    LastName = "Kaya",
                    AcademicTitle = "Fakülte Sekreteri",
                    PhoneNumber = "05325556677",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createResult = await userManager.CreateAsync(sekreterUser, "Sekreter123!");
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(sekreterUser, AppRoles.FakulteSekreteri);
                    logger.LogInformation("Fakülte Sekreteri kullanıcısı oluşturuldu.");
                }
                else
                {
                    logger.LogError("Fakülte Sekreteri oluşturulamadı: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Kullanıcılar oluşturulurken hata: {Message}", ex.Message);
        }

        // 6. Başlangıç Duyurularını Kontrol Et / Oluştur
        try
        {
            if (!await context.Announcements.AnyAsync())
            {
                var adminUser = await userManager.FindByEmailAsync("bm_baskan@tf.edu.tr");
                var announcements = new List<Announcement>
                {
                    new()
                    {
                        Title = "2026 Bahar Dönemi İŞKUR Çalışma Esasları ve Devam Hatırlatması",
                        Content = "Öğrencilerimizin haftalık en fazla 3 gün ve günlük 5 saat sınırına titizlikle uymaları, mesai giriş ve çıkışlarında dinamik QR kodlarını onaylatmaları zorunludur.",
                        Category = "İŞKUR",
                        IsUrgent = true,
                        CreatedByUserId = adminUser?.Id ?? Guid.Empty,
                        DepartmentId = bmDept?.Id
                    },
                    new()
                    {
                        Title = "Mazeret İzin Talepleri Hakkında Bilgilendirme",
                        Content = "Çalışamayacağınız günler için sistem üzerinden mazeret talebi oluşturabilirsiniz. Yıllık toplam yasal izin hakkı 10 gündür.",
                        Category = "Mazeret",
                        IsUrgent = false,
                        CreatedByUserId = adminUser?.Id ?? Guid.Empty
                    }
                };
                await context.Announcements.AddRangeAsync(announcements);
                await context.SaveChangesAsync();
                logger.LogInformation("Başlangıç duyuruları oluşturuldu.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Duyurular oluşturulurken hata: {Message}", ex.Message);
        }

        logger.LogInformation("Veritabanı başlatma ve tohumlama süreci tamamlandı.");
    }
}
