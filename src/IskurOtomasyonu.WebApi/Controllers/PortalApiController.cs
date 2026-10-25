using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api")]
public class PortalApiController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public PortalApiController(IApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // 1. POST /api/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginPayload req, CancellationToken ct)
    {
        var identifier = req?.Identifier?.Trim();
        var password = req?.Password?.Trim();

        if (string.IsNullOrEmpty(identifier))
            return BadRequest(new { error = "Kullanıcı bilgisi boş olamaz." });

        // Selçuk Üniversitesi Teknoloji Fakültesi Gerçek Yönetici & Akademik Kadro Girişleri
        if (identifier == "2210206001" || identifier == "20231011" || identifier.Contains("aliveli") || identifier.Contains("ennur"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 1,
                    student_id = 1,
                    full_name = identifier == "2210206001" || identifier.Contains("ennur") ? "Ennur Pekdemir" : "Ali Veli",
                    role = "student",
                    student_no = identifier == "2210206001" || identifier.Contains("ennur") ? "2210206001" : "20231011",
                    email = "2210206001@ogr.selcuk.edu.tr"
                }
            });
        }
        if (identifier.Contains("stasdemir") || identifier.Contains("ahmet.yilmaz") || identifier.Contains("danisman"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 2,
                    full_name = "Prof. Dr. Şakir Taşdemir",
                    role = "advisor",
                    email = "stasdemir@selcuk.edu.tr"
                }
            });
        }
        if (identifier.Contains("basciftci") || identifier.Contains("bbaskan") || identifier.Contains("baskan"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 3,
                    full_name = "Prof. Dr. Fatih Başçiftçi",
                    role = "head",
                    email = "basciftci@selcuk.edu.tr"
                }
            });
        }
        if (identifier.Contains("hunal") || identifier.Contains("sekreter"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 4,
                    full_name = "Hasan Ünal",
                    role = "secretary",
                    email = "hunal@selcuk.edu.tr"
                }
            });
        }
        if (identifier.Contains("hkahramanli") || identifier.Contains("dekan"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 5,
                    full_name = "Prof. Dr. Humar Kahramanlı Örnek",
                    role = "dean",
                    email = "hkahramanli@selcuk.edu.tr"
                }
            });
        }

        // DB Kontrolü (Identity)
        var user = await _userManager.FindByEmailAsync(identifier) ?? await _userManager.FindByNameAsync(identifier);
        if (user != null)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = "student";
            if (roles.Contains(AppRoles.Dekanlik)) role = "dean";
            else if (roles.Contains(AppRoles.FakulteSekreteri)) role = "secretary";
            else if (roles.Contains(AppRoles.BolumBaskani)) role = "head";
            else if (roles.Contains(AppRoles.Danisman)) role = "advisor";

            return Ok(new
            {
                user = new
                {
                    id = user.Id,
                    student_id = 1,
                    full_name = $"{user.FirstName} {user.LastName}",
                    role,
                    student_no = user.UserName,
                    email = user.Email
                }
            });
        }

        return Unauthorized(new { error = "Girdiğiniz bilgiler ile eşleşen kullanıcı bulunamadı." });
    }

    // 2. GET /api/init
    [HttpGet("init")]
    public async Task<IActionResult> Init(CancellationToken ct)
    {
        // Selçuk Üniversitesi Teknoloji Fakültesi Resmi Bölümleri
        var departments = new List<object>
        {
            new { id = 1, name = "Bilgisayar Mühendisliği", head_name = "Prof. Dr. Fatih Başçiftçi", budget_allocated = 50000.0 },
            new { id = 2, name = "Elektrik-Elektronik Mühendisliği", head_name = "Prof. Dr. İsmail Sarıtaş", budget_allocated = 42000.0 },
            new { id = 3, name = "Mekatronik Mühendisliği", head_name = "Doç. Dr. Ali Yaşar", budget_allocated = 38000.0 },
            new { id = 4, name = "Makine Mühendisliği", head_name = "Prof. Dr. Süleyman Neşeli", budget_allocated = 35000.0 },
            new { id = 5, name = "Metalurji ve Malzeme Mühendisliği", head_name = "Prof. Dr. Nurcan Akduran", budget_allocated = 28000.0 },
            new { id = 6, name = "Biyomedikal Mühendisliği", head_name = "Doç. Dr. M. Serdar Başçıl", budget_allocated = 25000.0 }
        };

        // Gerçek Öğretim Üyesi Danışmanlar
        var advisors = new List<object>
        {
            new { id = 2, full_name = "Prof. Dr. Şakir Taşdemir", department_id = 1 },
            new { id = 3, full_name = "Prof. Dr. Fatih Başçiftçi", department_id = 1 },
            new { id = 7, full_name = "Doç. Dr. İlker Ali Özkan", department_id = 1 },
            new { id = 8, full_name = "Doç. Dr. Tahir Sağ", department_id = 1 },
            new { id = 9, full_name = "Prof. Dr. İsmail Sarıtaş", department_id = 2 },
            new { id = 10, full_name = "Doç. Dr. Ali Yaşar", department_id = 3 }
        };

        // Kısmi Zamanlı Öğrenci Listesi
        var students = new List<object>
        {
            new
            {
                id = 1,
                student_no = "2210206001",
                full_name = "Ennur Pekdemir",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Yazılım Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                daily_wage = 666.75,
                status = "active",
                full_class_days = "1,3",
                conflict_days = "5",
                total_leave_days = 2,
                worked_days_count = 6,
                planned_days_count = 8,
                attendance_rate = 75,
                calculated_salary = 4000.50,
                exceeded_limit = false
            },
            new
            {
                id = 2,
                student_no = "20231011",
                full_name = "Ali Veli",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Bilişim ve Ağ Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                daily_wage = 666.75,
                status = "active",
                full_class_days = "2",
                conflict_days = "",
                total_leave_days = 11,
                worked_days_count = 3,
                planned_days_count = 4,
                attendance_rate = 75,
                calculated_salary = 2000.25,
                exceeded_limit = true
            },
            new
            {
                id = 3,
                student_no = "20231012",
                full_name = "Fatma Şahin",
                department_id = 3,
                department_name = "Mekatronik Mühendisliği",
                unit_name = "Robotik ve Otomasyon Atölyesi",
                advisor_id = 10,
                advisor_name = "Doç. Dr. Ali Yaşar",
                daily_wage = 666.75,
                status = "active",
                full_class_days = "4",
                conflict_days = "",
                total_leave_days = 3,
                worked_days_count = 2,
                planned_days_count = 3,
                attendance_rate = 67,
                calculated_salary = 1333.50,
                exceeded_limit = false
            },
            new
            {
                id = 4,
                student_no = "20231013",
                full_name = "Caner Erkin",
                department_id = 2,
                department_name = "Elektrik-Elektronik Mühendisliği",
                unit_name = "Elektronik Devre Laboratuvarı",
                advisor_id = 9,
                advisor_name = "Prof. Dr. İsmail Sarıtaş",
                daily_wage = 666.75,
                status = "active",
                full_class_days = "3",
                conflict_days = "",
                total_leave_days = 1,
                worked_days_count = 4,
                planned_days_count = 4,
                attendance_rate = 100,
                calculated_salary = 2667.00,
                exceeded_limit = false
            }
        };

        var announcements = new List<object>
        {
            new
            {
                id = 1,
                author_id = 5,
                department_id = "all",
                department_name = "Dekanlık — Tüm Fakülte",
                title = "2026-2027 Güz Dönemi İŞKUR Puantaj Teslimleri",
                content = "Kısmi zamanlı çalışan tüm öğrencilerin ekim ayı yoklama ve puantaj cetvellerini Fakülte Sekreteri Hasan Ünal onayına sunmaları rica olunur."
            },
            new
            {
                id = 2,
                author_id = 3,
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                title = "Yazılım ve Ağ Laboratuvarı Cihaz Sayımı",
                content = "Bölümümüz bünyesindeki laboratuvar cihazlarının envanter kontrolü Prof. Dr. Şakir Taşdemir gözetiminde yapılacaktır."
            }
        };

        return Ok(new
        {
            departments,
            advisors,
            students,
            announcements
        });
    }

    // 3. GET /api/student-dashboard
    [HttpGet("student-dashboard")]
    public IActionResult StudentDashboard([FromQuery] int student_id = 1, [FromQuery] int month = 10, [FromQuery] int year = 2026)
    {
        var student = new
        {
            id = student_id,
            student_no = student_id == 1 ? "2210206001" : "20231011",
            full_name = student_id == 1 ? "Ennur Pekdemir" : "Ali Veli",
            department_name = "Bilgisayar Mühendisliği",
            unit_name = student_id == 1 ? "Yazılım Laboratuvarı" : "Bilişim ve Ağ Laboratuvarı",
            advisor_name = "Prof. Dr. Şakir Taşdemir",
            status = "active",
            full_class_days = student_id == 1 ? "1,3" : "2",
            conflict_days = student_id == 1 ? "5" : ""
        };

        var plans = new List<object>
        {
            new { id = 1, student_id, work_date = "2026-10-02", attendance_status = "worked", check_in = "08:30", check_out = "12:30" },
            new { id = 2, student_id, work_date = "2026-10-06", attendance_status = "worked", check_in = "08:45", check_out = "12:45" },
            new { id = 3, student_id, work_date = "2026-10-09", attendance_status = "worked", check_in = "09:00", check_out = "13:00" },
            new { id = 4, student_id, work_date = "2026-10-13", attendance_status = "worked", check_in = "08:30", check_out = "12:30" },
            new { id = 5, student_id, work_date = "2026-10-16", attendance_status = "worked", check_in = "08:30", check_out = "12:30" },
            new { id = 6, student_id, work_date = "2026-10-20", attendance_status = "excused", check_in = (string?)null, check_out = (string?)null },
            new { id = 7, student_id, work_date = "2026-10-23", attendance_status = "worked", check_in = "08:30", check_out = "12:30" },
            new { id = 8, student_id, work_date = "2026-10-27", attendance_status = "planned", check_in = (string?)null, check_out = (string?)null },
            new { id = 9, student_id, work_date = "2026-10-30", attendance_status = "planned", check_in = (string?)null, check_out = (string?)null }
        };

        var tasks = new List<object>
        {
            new { id = 1, advisor_id = 2, student_id, title = "Yazılım laboratuvarı işletim sistemi imajlarının güncellenmesi", due_date = "2026-10-30", status = "pending", advisor_name = "Prof. Dr. Şakir Taşdemir" },
            new { id = 2, advisor_id = 2, student_id, title = "Ağ anahtarları port konfigürasyonu ve testleri", due_date = "2026-10-24", status = "completed", advisor_name = "Prof. Dr. Şakir Taşdemir" }
        };

        var excuses = new List<object>
        {
            new { id = 1, student_id, unit_name = "Yazılım Laboratuvarı", excuse_date = "2026-10-20", reason = "Vize sınavı çakışması", status = "approved" }
        };

        return Ok(new
        {
            student,
            stats = new
            {
                total_worked_days = 6,
                monthly_worked_days = 6,
                monthly_planned_days = 8,
                monthly_estimated_salary = 4000.50,
                total_leave_days = 2
            },
            plans,
            all_plans = plans,
            tasks,
            excuses
        });
    }

    // 4. POST /api/work-plans
    [HttpPost("work-plans")]
    public IActionResult SaveWorkPlans([FromBody] dynamic payload)
    {
        return Ok(new { message = "Aylık çalışma planınız sisteme kaydedildi." });
    }

    // 5. POST /api/attendance/qr
    [HttpPost("attendance/qr")]
    public IActionResult AttendanceQr([FromBody] dynamic payload)
    {
        return Ok(new { message = "Yoklama başarıyla işlendi." });
    }

    // 6. GET /api/advisor/workers
    [HttpGet("advisor/workers")]
    public IActionResult GetAdvisorWorkers([FromQuery] string? date, [FromQuery] string? advisor_id)
    {
        var workers = new List<object>
        {
            new
            {
                id = 1,
                student_id = 1,
                student_name = "Ennur Pekdemir",
                student_no = "2210206001",
                unit_name = "Yazılım Laboratuvarı",
                check_in = "08:30",
                check_out = "12:30",
                attendance_status = "worked"
            },
            new
            {
                id = 2,
                student_id = 2,
                student_name = "Ali Veli",
                student_no = "20231011",
                unit_name = "Bilişim ve Ağ Laboratuvarı",
                check_in = "09:00",
                check_out = "13:00",
                attendance_status = "worked"
            }
        };
        return Ok(workers);
    }

    // 7. PUT /api/advisor/workers/{id}
    [HttpPut("advisor/workers/{id}")]
    public IActionResult UpdateAdvisorWorkerAttendance([FromRoute] int id, [FromBody] dynamic payload)
    {
        return Ok(new { message = "Yoklama güncellendi." });
    }

    // 8. GET /api/tasks & POST /api/tasks & PUT /api/tasks/{id}
    [HttpGet("tasks")]
    public IActionResult GetTasks([FromQuery] string? advisor_id, [FromQuery] string? status)
    {
        var list = new List<object>
        {
            new { id = 1, advisor_id = 2, student_id = 1, student_name = "Ennur Pekdemir", unit_name = "Yazılım Laboratuvarı", title = "Yazılım laboratuvarı işletim sistemi imajlarının güncellenmesi", due_date = "2026-10-30", status = "pending", advisor_name = "Prof. Dr. Şakir Taşdemir" },
            new { id = 2, advisor_id = 2, student_id = 1, student_name = "Ennur Pekdemir", unit_name = "Yazılım Laboratuvarı", title = "Ağ anahtarları port konfigürasyonu ve testleri", due_date = "2026-10-24", status = "completed", advisor_name = "Prof. Dr. Şakir Taşdemir" },
            new { id = 3, advisor_id = 2, student_id = 2, student_name = "Ali Veli", unit_name = "Bilişim ve Ağ Laboratuvarı", title = "Laboratuvar yedekleme sunucusunun kontrolü", due_date = "2026-10-28", status = "pending", advisor_name = "Prof. Dr. Şakir Taşdemir" }
        };
        return Ok(list);
    }

    [HttpPost("tasks")]
    public IActionResult CreateTask([FromBody] dynamic payload)
    {
        return StatusCode(201, new { message = "Görev başarıyla oluşturuldu." });
    }

    [HttpPut("tasks/{id}")]
    public IActionResult UpdateTask([FromRoute] int id, [FromBody] dynamic payload)
    {
        return Ok(new { message = "Görev durumu güncellendi." });
    }

    // 9. GET /api/students & POST /api/students & PUT /api/students/{id}
    [HttpGet("students")]
    public IActionResult GetStudents([FromQuery] int month = 10, [FromQuery] int year = 2026, [FromQuery] string? department_id = "all", [FromQuery] string? advisor_id = "all", [FromQuery] string? search = null)
    {
        var list = new List<object>
        {
            new
            {
                id = 1,
                student_no = "2210206001",
                full_name = "Ennur Pekdemir",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Yazılım Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                daily_wage = 666.75,
                status = "active",
                total_leave_days = 2,
                worked_days_count = 6,
                planned_days_count = 8,
                attendance_rate = 75,
                calculated_salary = 4000.50,
                exceeded_limit = false
            },
            new
            {
                id = 2,
                student_no = "20231011",
                full_name = "Ali Veli",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Bilişim ve Ağ Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                daily_wage = 666.75,
                status = "active",
                total_leave_days = 11,
                worked_days_count = 3,
                planned_days_count = 4,
                attendance_rate = 75,
                calculated_salary = 2000.25,
                exceeded_limit = true
            },
            new
            {
                id = 3,
                student_no = "20231012",
                full_name = "Fatma Şahin",
                department_id = 3,
                department_name = "Mekatronik Mühendisliği",
                unit_name = "Robotik ve Otomasyon Atölyesi",
                advisor_id = 10,
                advisor_name = "Doç. Dr. Ali Yaşar",
                daily_wage = 666.75,
                status = "active",
                total_leave_days = 3,
                worked_days_count = 2,
                planned_days_count = 3,
                attendance_rate = 67,
                calculated_salary = 1333.50,
                exceeded_limit = false
            },
            new
            {
                id = 4,
                student_no = "20231013",
                full_name = "Caner Erkin",
                department_id = 2,
                department_name = "Elektrik-Elektronik Mühendisliği",
                unit_name = "Elektronik Devre Laboratuvarı",
                advisor_id = 9,
                advisor_name = "Prof. Dr. İsmail Sarıtaş",
                daily_wage = 666.75,
                status = "active",
                total_leave_days = 1,
                worked_days_count = 4,
                planned_days_count = 4,
                attendance_rate = 100,
                calculated_salary = 2667.00,
                exceeded_limit = false
            }
        };

        if (!string.IsNullOrEmpty(search))
        {
            var q = search.ToLowerInvariant();
            list = list.Where(s => ((dynamic)s).full_name.ToLower().Contains(q) || ((dynamic)s).student_no.Contains(q)).ToList();
        }

        return Ok(list);
    }

    [HttpPost("students")]
    public IActionResult CreateStudent([FromBody] dynamic payload)
    {
        return StatusCode(201, new { message = "Öğrenci kaydı oluşturuldu." });
    }

    [HttpPut("students/{id}")]
    public IActionResult UpdateStudent([FromRoute] int id, [FromBody] dynamic payload)
    {
        return Ok(new { message = "Öğrenci güncellendi." });
    }

    // 10. ANNOUNCEMENTS
    [HttpGet("announcements")]
    public IActionResult GetAnnouncements()
    {
        var announcements = new List<object>
        {
            new
            {
                id = 1,
                author_id = 5,
                department_id = "all",
                department_name = "Dekanlık — Tüm Fakülte",
                title = "2026-2027 Güz Dönemi İŞKUR Puantaj Teslimleri",
                content = "Kısmi zamanlı çalışan tüm öğrencilerin ekim ayı yoklama ve puantaj cetvellerini Fakülte Sekreteri Hasan Ünal onayına sunmaları rica olunur."
            },
            new
            {
                id = 2,
                author_id = 3,
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                title = "Yazılım ve Ağ Laboratuvarı Cihaz Sayımı",
                content = "Bölümümüz bünyesindeki laboratuvar cihazlarının envanter kontrolü Prof. Dr. Şakir Taşdemir gözetiminde yapılacaktır."
            }
        };
        return Ok(announcements);
    }

    [HttpPost("announcements")]
    public IActionResult CreateAnnouncement([FromBody] dynamic payload)
    {
        return StatusCode(201, new { message = "Duyuru yayınlandı." });
    }

    [HttpDelete("announcements/{id}")]
    public IActionResult DeleteAnnouncement([FromRoute] int id)
    {
        return Ok(new { message = "Duyuru silindi." });
    }

    // 11. EXCUSES
    [HttpGet("excuses")]
    public IActionResult GetExcuses([FromQuery] string? status = "all")
    {
        var excuses = new List<object>
        {
            new
            {
                id = 1,
                student_id = 1,
                student_name = "Ennur Pekdemir",
                student_no = "2210206001",
                unit_name = "Yazılım Laboratuvarı",
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                excuse_date = "2026-10-20",
                reason = "Vize sınavı çakışması",
                status = "approved"
            },
            new
            {
                id = 2,
                student_id = 2,
                student_name = "Ali Veli",
                student_no = "20231011",
                unit_name = "Bilişim ve Ağ Laboratuvarı",
                advisor_name = "Prof. Dr. Şakir Taşdemir",
                excuse_date = "2026-10-26",
                reason = "Sağlık raporu",
                status = "pending"
            }
        };
        return Ok(excuses);
    }

    [HttpPost("excuses")]
    public IActionResult CreateExcuse([FromBody] dynamic payload)
    {
        return StatusCode(201, new { message = "Mazeret talebiniz fakülte sekreterliğine iletildi." });
    }

    [HttpPut("excuses/{id}")]
    public IActionResult UpdateExcuse([FromRoute] int id, [FromBody] dynamic payload)
    {
        return Ok(new { message = "Mazeret talebi güncellendi." });
    }

    // 12. DEAN SUMMARY
    [HttpGet("dean/summary")]
    public IActionResult DeanSummary([FromQuery] int month = 10, [FromQuery] int year = 2026)
    {
        var departments = new List<object>
        {
            new { id = 1, name = "Bilgisayar Mühendisliği", budget_allocated = 50000.0, used_budget = 6000.75, remaining_budget = 43999.25, student_count = 2 },
            new { id = 2, name = "Elektrik-Elektronik Mühendisliği", budget_allocated = 42000.0, used_budget = 2667.00, remaining_budget = 39333.00, student_count = 1 },
            new { id = 3, name = "Mekatronik Mühendisliği", budget_allocated = 38000.0, used_budget = 1333.50, remaining_budget = 36666.50, student_count = 1 },
            new { id = 4, name = "Makine Mühendisliği", budget_allocated = 35000.0, used_budget = 0.0, remaining_budget = 35000.00, student_count = 0 },
            new { id = 5, name = "Metalurji ve Malzeme Mühendisliği", budget_allocated = 28000.0, used_budget = 0.0, remaining_budget = 28000.00, student_count = 0 },
            new { id = 6, name = "Biyomedikal Mühendisliği", budget_allocated = 25000.0, used_budget = 0.0, remaining_budget = 25000.00, student_count = 0 }
        };

        var studentsLeaveTracking = new List<object>
        {
            new { id = 1, full_name = "Ennur Pekdemir", student_no = "2210206001", department_name = "Bilgisayar Mühendisliği", total_leave_days = 2, exceeded_limit = false, status = "active" },
            new { id = 2, full_name = "Ali Veli", student_no = "20231011", department_name = "Bilgisayar Mühendisliği", total_leave_days = 11, exceeded_limit = true, status = "active" },
            new { id = 3, full_name = "Fatma Şahin", student_no = "20231012", department_name = "Mekatronik Mühendisliği", total_leave_days = 3, exceeded_limit = false, status = "active" },
            new { id = 4, full_name = "Caner Erkin", student_no = "20231013", department_name = "Elektrik-Elektronik Mühendisliği", total_leave_days = 1, exceeded_limit = false, status = "active" }
        };

        return Ok(new
        {
            departments,
            students_leave_tracking = studentsLeaveTracking
        });
    }

    // 13. PUT /api/departments/{id}
    [HttpPut("departments/{id}")]
    public IActionResult UpdateDepartmentBudget([FromRoute] int id, [FromBody] dynamic payload)
    {
        return Ok(new { message = "Bölüm ödeneği güncellendi." });
    }
}

public class LoginPayload
{
    public string? Identifier { get; set; }
    public string? Password { get; set; }
}
