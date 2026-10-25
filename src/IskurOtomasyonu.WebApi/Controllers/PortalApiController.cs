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

        // Örnek hızlı demo girişleri
        if (identifier == "20231011" || identifier == "2210206001")
        {
            return Ok(new
            {
                user = new
                {
                    id = 1,
                    student_id = 1,
                    full_name = "Ali Veli",
                    role = "student",
                    student_no = "20231011",
                    email = "aliveli@ogr.universite.edu.tr"
                }
            });
        }
        if (identifier.Contains("ahmet.yilmaz") || identifier.Contains("danisman"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 2,
                    full_name = "Dr. Ahmet Yılmaz",
                    role = "advisor",
                    email = "ahmet.yilmaz@universite.edu.tr"
                }
            });
        }
        if (identifier.Contains("bbaskan") || identifier.Contains("baskan"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 3,
                    full_name = "Doç. Dr. Selin Kaya",
                    role = "head",
                    email = "bbaskan@universite.edu.tr"
                }
            });
        }
        if (identifier.Contains("sekreter"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 4,
                    full_name = "Ayşe Demir",
                    role = "secretary",
                    email = "sekreter@universite.edu.tr"
                }
            });
        }
        if (identifier.Contains("dekan"))
        {
            return Ok(new
            {
                user = new
                {
                    id = 5,
                    full_name = "Prof. Dr. Kemal Aydın",
                    role = "dean",
                    email = "dekan@universite.edu.tr"
                }
            });
        }

        // DB'den kontrol
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
        var dbDepartments = await _context.Departments
            .OrderBy(d => d.Id)
            .Select(d => new
            {
                id = (object)d.Id,
                name = d.Name,
                budget_allocated = 40000.0
            })
            .ToListAsync(ct);

        IEnumerable<object> departments = dbDepartments;
        if (!departments.Any())
        {
            departments = new List<object>
            {
                new { id = (object)1, name = "Bilgisayar Mühendisliği", budget_allocated = 45000.0 },
                new { id = (object)2, name = "Elektrik-Elektronik Mühendisliği", budget_allocated = 35000.0 },
                new { id = (object)3, name = "Makine Mühendisliği", budget_allocated = 30000.0 }
            };
        }

        var advisors = new List<object>
        {
            new { id = 2, full_name = "Dr. Ahmet Yılmaz", department_id = 1 },
            new { id = 6, full_name = "Dr. Mehmet Özkan", department_id = 2 }
        };

        var students = new List<object>
        {
            new
            {
                id = 1,
                student_no = "20231011",
                full_name = "Ali Veli",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Yazılım Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Dr. Ahmet Yılmaz",
                daily_wage = 650.0,
                status = "active",
                full_class_days = "1,3",
                conflict_days = "5",
                total_leave_days = 2,
                worked_days_count = 6,
                planned_days_count = 8,
                attendance_rate = 75,
                calculated_salary = 3900.0,
                exceeded_limit = false
            },
            new
            {
                id = 2,
                student_no = "20231012",
                full_name = "Fatma Şahin",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Fakülte Kütüphanesi",
                advisor_id = 2,
                advisor_name = "Dr. Ahmet Yılmaz",
                daily_wage = 650.0,
                status = "active",
                full_class_days = "2",
                conflict_days = "",
                total_leave_days = 11,
                worked_days_count = 2,
                planned_days_count = 4,
                attendance_rate = 50,
                calculated_salary = 1300.0,
                exceeded_limit = true
            },
            new
            {
                id = 3,
                student_no = "20231013",
                full_name = "Caner Erkin",
                department_id = 2,
                department_name = "Elektrik-Elektronik Mühendisliği",
                unit_name = "Robotik Atölyesi",
                advisor_id = 6,
                advisor_name = "Dr. Mehmet Özkan",
                daily_wage = 650.0,
                status = "active",
                full_class_days = "4",
                conflict_days = "",
                total_leave_days = 3,
                worked_days_count = 1,
                planned_days_count = 2,
                attendance_rate = 50,
                calculated_salary = 650.0,
                exceeded_limit = false
            }
        };

        var announcements = new List<object>
        {
            new
            {
                id = 1,
                author_id = 3,
                department_id = "all",
                department_name = "Tüm Fakülte",
                title = "Ekim Ayı Puantaj Teslim Tarihleri",
                content = "Kısmi zamanlı çalışan tüm öğrencilerin ekim ayı yoklama ve puantaj cetvellerini en geç ayın 28'ine kadar sekreterliğe onaylatmaları gerekmektedir."
            },
            new
            {
                id = 2,
                author_id = 3,
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                title = "Laboratuvar Cihaz Sayımı",
                content = "Bu cuma günü lab bünyesindeki tüm bilgisayarlar ve ağ donanımları kontrol edilecektir."
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
            student_no = student_id == 1 ? "20231011" : "20231012",
            full_name = student_id == 1 ? "Ali Veli" : "Fatma Şahin",
            department_name = "Bilgisayar Mühendisliği",
            unit_name = student_id == 1 ? "Yazılım Laboratuvarı" : "Fakülte Kütüphanesi",
            advisor_name = "Dr. Ahmet Yılmaz",
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
            new { id = 1, advisor_id = 2, student_id, title = "Ağ anahtarları ve kablolama kontrolü", due_date = "2026-10-30", status = "pending", advisor_name = "Dr. Ahmet Yılmaz" },
            new { id = 2, advisor_id = 2, student_id, title = "PC format ve laboratuvar imaj kurulumu", due_date = "2026-10-24", status = "completed", advisor_name = "Dr. Ahmet Yılmaz" }
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
                monthly_estimated_salary = 3900.0,
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
                student_name = "Ali Veli",
                student_no = "20231011",
                unit_name = "Yazılım Laboratuvarı",
                check_in = "08:30",
                check_out = "12:30",
                attendance_status = "worked"
            },
            new
            {
                id = 2,
                student_id = 2,
                student_name = "Fatma Şahin",
                student_no = "20231012",
                unit_name = "Fakülte Kütüphanesi",
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
            new { id = 1, advisor_id = 2, student_id = 1, student_name = "Ali Veli", unit_name = "Yazılım Laboratuvarı", title = "Ağ anahtarları ve kablolama kontrolü", due_date = "2026-10-30", status = "pending", advisor_name = "Dr. Ahmet Yılmaz" },
            new { id = 2, advisor_id = 2, student_id = 1, student_name = "Ali Veli", unit_name = "Yazılım Laboratuvarı", title = "PC format ve laboratuvar imaj kurulumu", due_date = "2026-10-24", status = "completed", advisor_name = "Dr. Ahmet Yılmaz" },
            new { id = 3, advisor_id = 2, student_id = 2, student_name = "Fatma Şahin", unit_name = "Fakülte Kütüphanesi", title = "Kütüphane kitap tasnif ve barkodlama", due_date = "2026-10-28", status = "pending", advisor_name = "Dr. Ahmet Yılmaz" }
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
                student_no = "20231011",
                full_name = "Ali Veli",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Yazılım Laboratuvarı",
                advisor_id = 2,
                advisor_name = "Dr. Ahmet Yılmaz",
                daily_wage = 650.0,
                status = "active",
                total_leave_days = 2,
                worked_days_count = 6,
                planned_days_count = 8,
                attendance_rate = 75,
                calculated_salary = 3900.0,
                exceeded_limit = false
            },
            new
            {
                id = 2,
                student_no = "20231012",
                full_name = "Fatma Şahin",
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                unit_name = "Fakülte Kütüphanesi",
                advisor_id = 2,
                advisor_name = "Dr. Ahmet Yılmaz",
                daily_wage = 650.0,
                status = "active",
                total_leave_days = 11,
                worked_days_count = 2,
                planned_days_count = 4,
                attendance_rate = 50,
                calculated_salary = 1300.0,
                exceeded_limit = true
            },
            new
            {
                id = 3,
                student_no = "20231013",
                full_name = "Caner Erkin",
                department_id = 2,
                department_name = "Elektrik-Elektronik Mühendisliği",
                unit_name = "Robotik Atölyesi",
                advisor_id = 6,
                advisor_name = "Dr. Mehmet Özkan",
                daily_wage = 650.0,
                status = "active",
                total_leave_days = 3,
                worked_days_count = 1,
                planned_days_count = 2,
                attendance_rate = 50,
                calculated_salary = 650.0,
                exceeded_limit = false
            }
        };
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
                author_id = 3,
                department_id = "all",
                department_name = "Tüm Fakülte",
                title = "Ekim Ayı Puantaj Teslim Tarihleri",
                content = "Kısmi zamanlı çalışan tüm öğrencilerin ekim ayı yoklama ve puantaj cetvellerini en geç ayın 28'ine kadar sekreterliğe onaylatmaları gerekmektedir."
            },
            new
            {
                id = 2,
                author_id = 3,
                department_id = 1,
                department_name = "Bilgisayar Mühendisliği",
                title = "Laboratuvar Cihaz Sayımı",
                content = "Bu cuma günü lab bünyesindeki tüm bilgisayarlar ve ağ donanımları kontrol edilecektir."
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
                student_name = "Ali Veli",
                student_no = "20231011",
                unit_name = "Yazılım Laboratuvarı",
                advisor_name = "Dr. Ahmet Yılmaz",
                excuse_date = "2026-10-20",
                reason = "Vize sınavı çakışması",
                status = "approved"
            },
            new
            {
                id = 2,
                student_id = 2,
                student_name = "Fatma Şahin",
                student_no = "20231012",
                unit_name = "Fakülte Kütüphanesi",
                advisor_name = "Dr. Ahmet Yılmaz",
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
            new { id = 1, name = "Bilgisayar Mühendisliği", budget_allocated = 45000.0, used_budget = 5200.0, remaining_budget = 39800.0, student_count = 2 },
            new { id = 2, name = "Elektrik-Elektronik Mühendisliği", budget_allocated = 35000.0, used_budget = 650.0, remaining_budget = 34350.0, student_count = 1 },
            new { id = 3, name = "Makine Mühendisliği", budget_allocated = 30000.0, used_budget = 0.0, remaining_budget = 30000.0, student_count = 0 }
        };

        var studentsLeaveTracking = new List<object>
        {
            new { id = 1, full_name = "Ali Veli", student_no = "20231011", department_name = "Bilgisayar Mühendisliği", total_leave_days = 2, exceeded_limit = false, status = "active" },
            new { id = 2, full_name = "Fatma Şahin", student_no = "20231012", department_name = "Bilgisayar Mühendisliği", total_leave_days = 11, exceeded_limit = true, status = "active" },
            new { id = 3, full_name = "Caner Erkin", student_no = "20231013", department_name = "Elektrik-Elektronik Mühendisliği", total_leave_days = 3, exceeded_limit = false, status = "active" }
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
