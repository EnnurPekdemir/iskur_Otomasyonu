using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize]
public class AcademicController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<ApplicationUser> _userManager;

    public AcademicController(
        IApplicationDbContext context, 
        ICurrentUserService currentUser,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _currentUser = currentUser;
        _userManager = userManager;
    }

    /// <summary>
    /// Tüm bölümlerin listesini döner. Veritabanı boş ise varsayılan bölümleri otomatik oluşturur.
    /// </summary>
    [HttpGet("departments")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetDepartments(CancellationToken ct)
    {
        var depts = await _context.Departments
            .OrderBy(d => d.Name)
            .Select(d => new
            {
                d.Id,
                d.Code,
                d.Name,
                HeadOfDepartmentName = d.HeadOfDepartment != null 
                    ? $"{d.HeadOfDepartment.FirstName} {d.HeadOfDepartment.LastName}" 
                    : null
            })
            .ToListAsync(ct);

        if (!depts.Any())
        {
            var seedDepts = new List<Department>
            {
                new() { Name = "Bilgisayar Mühendisliği", Code = "BM" },
                new() { Name = "Yazılım Mühendisliği", Code = "YM" },
                new() { Name = "Mekatronik Mühendisliği", Code = "MM" },
                new() { Name = "Elektrik-Elektronik Mühendisliği", Code = "EEM" },
                new() { Name = "Adli Bilişim Mühendisliği", Code = "ABM" }
            };

            await _context.Departments.AddRangeAsync(seedDepts, ct);
            await _context.SaveChangesAsync(ct);

            depts = seedDepts.Select(d => new
            {
                d.Id,
                d.Code,
                d.Name,
                HeadOfDepartmentName = (string?)null
            }).ToList();
        }

        return Ok(ApiResponse<List<object>>.SuccessResult(depts.Cast<object>().ToList()));
    }

    /// <summary>
    /// Fakülte bünyesindeki birimlerin listesini döner. Boş ise varsayılan birimleri otomatik oluşturur.
    /// </summary>
    [HttpGet("units")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetUnits(CancellationToken ct)
    {
        var units = await _context.Units
            .OrderBy(u => u.Name)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Description,
                u.Capacity,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.Department != null ? u.Department.Name : "Fakülte Geneli"
            })
            .ToListAsync(ct);

        if (!units.Any())
        {
            var seedUnits = new List<Unit>
            {
                new() { Name = "Bilgi İşlem ve Ağ Yönetim Birimi", Capacity = 6, Description = "Fakülte sunucu ve laboratuvar altyapısı" },
                new() { Name = "Yazılım Geliştirme Laboratuvarı", Capacity = 8, Description = "Öğrenci otomasyon ve proje yazılımları" },
                new() { Name = "Öğrenci İşleri ve Yazı İşleri Bürosu", Capacity = 5, Description = "Öğrenci evrak, staj ve puantaj takibi" },
                new() { Name = "Fakülte Kütüphanesi ve Çalışma Salonu", Capacity = 4, Description = "Öğrenci çalışma alanı düzeni" },
                new() { Name = "Ar-Ge ve Robotik Laboratuvarı", Capacity = 5, Description = "TÜBİTAK ve TEKNOFEST proje çalışmaları" }
            };

            await _context.Units.AddRangeAsync(seedUnits, ct);
            await _context.SaveChangesAsync(ct);

            units = seedUnits.Select(u => new
            {
                u.Id,
                u.Name,
                u.Description,
                u.Capacity,
                DepartmentId = u.DepartmentId,
                DepartmentName = "Fakülte Geneli"
            }).ToList();
        }

        return Ok(ApiResponse<List<object>>.SuccessResult(units.Cast<object>().ToList()));
    }

    /// <summary>
    /// Danışmanlık yapabilecek öğretim elemanlarını listeler.
    /// </summary>
    [HttpGet("advisors")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAdvisors(
        [FromQuery] Guid? departmentId, 
        CancellationToken ct)
    {
        // Danışman veya Bölüm Başkanı rolündeki kullanıcıları getir
        var advisorUsers = await _userManager.GetUsersInRoleAsync(AppRoles.Danisman);
        var deptHeadUsers = await _userManager.GetUsersInRoleAsync(AppRoles.BolumBaskani);

        var allUsers = advisorUsers.Concat(deptHeadUsers).DistinctBy(u => u.Id).ToList();

        var result = allUsers.Select(u => new
        {
            Id = u.Id,
            FullName = $"{u.FirstName} {u.LastName}",
            Email = u.Email,
            AcademicTitle = u.AcademicTitle
        }).OrderBy(u => u.FullName).Cast<object>().ToList();

        return Ok(ApiResponse<List<object>>.SuccessResult(result));
    }

    /// <summary>
    /// Bölüm Başkanı veya Dekanlık için bölüme ait İŞKUR öğrencilerini listeler.
    /// </summary>
    [HttpGet("department-students")]
    [Authorize(Roles = $"{AppRoles.BolumBaskani},{AppRoles.Dekanlik}")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetDepartmentStudents(
        [FromQuery] Guid? departmentId, 
        CancellationToken ct)
    {
        // Eğer kullanıcı Bölüm Başkanı ise kendi bölümünü bul
        if (_currentUser.Roles.Contains(AppRoles.BolumBaskani))
        {
            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.HeadOfDepartmentId == _currentUser.UserId, ct);
            if (dept != null)
            {
                departmentId = dept.Id;
            }
        }

        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .Include(s => s.AdvisorAssignments.Where(a => a.IsActive)).ThenInclude(a => a.Advisor)
            .Include(s => s.UnitAssignments.Where(u => u.IsActive)).ThenInclude(u => u.Unit)
            .AsNoTracking();

        if (departmentId.HasValue && departmentId.Value != Guid.Empty)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        var students = await query.ToListAsync(ct);

        var result = students.Select(s =>
        {
            var activeAdvisor = s.AdvisorAssignments.FirstOrDefault(a => a.IsActive)?.Advisor;
            var activeUnit = s.UnitAssignments.FirstOrDefault(u => u.IsActive)?.Unit;

            return new
            {
                StudentId = s.Id,
                UserId = s.UserId,
                StudentNumber = s.StudentNumber,
                FullName = $"{s.User.FirstName} {s.User.LastName}",
                Email = s.User.Email,
                PhoneNumber = s.User.PhoneNumber,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department?.Name ?? "Bilinmiyor",
                ClassLevel = s.ClassLevel,
                Gpa = s.Gpa,
                Status = s.Status.ToString(),
                RemainingLeaveDays = s.RemainingLeaveDays,
                AdvisorId = activeAdvisor?.Id,
                AdvisorName = activeAdvisor != null ? $"{activeAdvisor.FirstName} {activeAdvisor.LastName}" : "Atanmadı",
                UnitId = activeUnit?.Id,
                UnitName = activeUnit != null ? activeUnit.Name : "Atanmadı"
            };
        }).OrderBy(s => s.FullName).Cast<object>().ToList();

        return Ok(ApiResponse<List<object>>.SuccessResult(result));
    }

    /// <summary>
    /// Dekanlık paneli için fakülte genelindeki tüm öğrencileri listeler.
    /// </summary>
    [HttpGet("all-students")]
    [Authorize(Roles = AppRoles.Dekanlik)]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAllStudents(CancellationToken ct)
    {
        var students = await _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .Include(s => s.AdvisorAssignments.Where(a => a.IsActive)).ThenInclude(a => a.Advisor)
            .Include(s => s.UnitAssignments.Where(u => u.IsActive)).ThenInclude(u => u.Unit)
            .AsNoTracking()
            .ToListAsync(ct);

        var result = students.Select(s =>
        {
            var activeAdvisor = s.AdvisorAssignments.FirstOrDefault(a => a.IsActive)?.Advisor;
            var activeUnit = s.UnitAssignments.FirstOrDefault(u => u.IsActive)?.Unit;

            return new
            {
                StudentId = s.Id,
                UserId = s.UserId,
                StudentNumber = s.StudentNumber,
                FullName = $"{s.User.FirstName} {s.User.LastName}",
                Email = s.User.Email,
                PhoneNumber = s.User.PhoneNumber,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department?.Name ?? "Bilinmiyor",
                ClassLevel = s.ClassLevel,
                Gpa = s.Gpa,
                Status = s.Status.ToString(),
                RemainingLeaveDays = s.RemainingLeaveDays,
                AdvisorId = activeAdvisor?.Id,
                AdvisorName = activeAdvisor != null ? $"{activeAdvisor.FirstName} {activeAdvisor.LastName}" : "Atanmadı",
                UnitId = activeUnit?.Id,
                UnitName = activeUnit != null ? activeUnit.Name : "Atanmadı"
            };
        }).OrderBy(s => s.FullName).Cast<object>().ToList();

        return Ok(ApiResponse<List<object>>.SuccessResult(result));
    }

    /// <summary>
    /// Öğrenciye danışman atar veya mevcut danışmanını günceller (Tarihçeli kayıt).
    /// </summary>
    [HttpPost("assign-advisor")]
    [Authorize(Roles = $"{AppRoles.BolumBaskani},{AppRoles.Dekanlik}")]
    public async Task<ActionResult<ApiResponse<bool>>> AssignAdvisor(
        [FromBody] AssignAdvisorDto request, 
        CancellationToken ct)
    {
        var student = await _context.Students
            .Include(s => s.AdvisorAssignments)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student == null)
        {
            return NotFound(ApiResponse<bool>.FailureResult("Öğrenci bulunamadı."));
        }

        // Önceki aktif atamaları pasifleştir
        var activeAssignments = student.AdvisorAssignments.Where(a => a.IsActive).ToList();
        foreach (var assignment in activeAssignments)
        {
            assignment.IsActive = false;
            assignment.EndDate = DateTime.UtcNow;
        }

        // Yeni atama ekle
        var newAssignment = new StudentAdvisorAssignment
        {
            StudentId = request.StudentId,
            AdvisorId = request.AdvisorId,
            StartDate = DateTime.UtcNow,
            IsActive = true,
            AssignmentNote = request.Note ?? "Bölüm Başkanlığı tarafından danışman ataması yapıldı."
        };

        await _context.StudentAdvisorAssignments.AddAsync(newAssignment, ct);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.SuccessResult(true, "Danışman başarıyla atandı."));
    }

    /// <summary>
    /// Öğrenciye fakülte birimi atar veya birimini günceller (Dekanlık).
    /// </summary>
    [HttpPost("assign-unit")]
    [Authorize(Roles = AppRoles.Dekanlik)]
    public async Task<ActionResult<ApiResponse<bool>>> AssignUnit(
        [FromBody] AssignUnitDto request, 
        CancellationToken ct)
    {
        var student = await _context.Students
            .Include(s => s.UnitAssignments)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student == null)
        {
            return NotFound(ApiResponse<bool>.FailureResult("Öğrenci bulunamadı."));
        }

        // Önceki aktif atamaları pasifleştir
        var activeAssignments = student.UnitAssignments.Where(u => u.IsActive).ToList();
        foreach (var assignment in activeAssignments)
        {
            assignment.IsActive = false;
            assignment.EndDate = DateTime.UtcNow;
        }

        // Yeni birim ataması ekle
        var newAssignment = new StudentUnitAssignment
        {
            StudentId = request.StudentId,
            UnitId = request.UnitId,
            StartDate = DateTime.UtcNow,
            IsActive = true,
            AssignmentNote = request.Note ?? "Dekanlık/Fakülte Sekreterliği birim görevlendirmesi yapıldı."
        };

        await _context.StudentUnitAssignments.AddAsync(newAssignment, ct);
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.SuccessResult(true, "Birim görevlendirmesi başarıyla güncellendi."));
    }

    /// <summary>
    /// Öğrencinin aktiflik durumunu günceller (Onaylama, Pasife alma, Mezun etme vb.).
    /// </summary>
    [HttpPost("update-student-status")]
    [Authorize(Roles = $"{AppRoles.Dekanlik},{AppRoles.BolumBaskani}")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStudentStatus(
        [FromBody] UpdateStudentStatusDto request, 
        CancellationToken ct)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);
        if (student == null)
        {
            return NotFound(ApiResponse<bool>.FailureResult("Öğrenci bulunamadı."));
        }

        student.Status = request.Status;
        await _context.SaveChangesAsync(ct);

        return Ok(ApiResponse<bool>.SuccessResult(true, "Öğrenci durumu başarıyla güncellendi."));
    }

    /// <summary>
    /// Oturum açmış kullanıcının tam profil ve atama kartı bilgilerini döner.
    /// </summary>
    [HttpGet("my-profile")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyProfile(CancellationToken ct)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, ct);

        if (user == null)
        {
            return NotFound(ApiResponse<object>.FailureResult("Kullanıcı bulunamadı."));
        }

        // Eğer öğrenci ise öğrenci detaylarını getir
        Student? student = null;
        Department? dept = null;

        if (_currentUser.Roles.Contains(AppRoles.Ogrenci))
        {
            student = await _context.Students
                .Include(s => s.Department)
                .Include(s => s.AdvisorAssignments.Where(a => a.IsActive)).ThenInclude(a => a.Advisor)
                .Include(s => s.UnitAssignments.Where(u => u.IsActive)).ThenInclude(u => u.Unit)
                .FirstOrDefaultAsync(s => s.UserId == user.Id, ct);

            dept = student?.Department;
        }
        else if (_currentUser.Roles.Contains(AppRoles.BolumBaskani))
        {
            dept = await _context.Departments.FirstOrDefaultAsync(d => d.HeadOfDepartmentId == user.Id, ct);
        }

        var activeAdvisor = student?.AdvisorAssignments.FirstOrDefault(a => a.IsActive)?.Advisor;
        var activeUnit = student?.UnitAssignments.FirstOrDefault(u => u.IsActive)?.Unit;

        var profile = new
        {
            UserId = user.Id,
            StudentId = student?.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AcademicTitle = user.AcademicTitle,
            Roles = _currentUser.Roles,
            DepartmentId = dept?.Id ?? student?.DepartmentId,
            DepartmentName = dept?.Name ?? student?.Department?.Name ?? "Teknoloji Fakültesi",
            StudentNumber = student?.StudentNumber,
            ClassLevel = student?.ClassLevel,
            Gpa = student?.Gpa,
            Status = student?.Status.ToString(),
            RemainingLeaveDays = student?.RemainingLeaveDays ?? 10,
            Advisor = activeAdvisor != null ? new
            {
                activeAdvisor.Id,
                FullName = $"{activeAdvisor.FirstName} {activeAdvisor.LastName}",
                Email = activeAdvisor.Email,
                PhoneNumber = activeAdvisor.PhoneNumber
            } : null,
            Unit = activeUnit != null ? new
            {
                activeUnit.Id,
                Name = activeUnit.Name,
                Description = activeUnit.Description
            } : null
        };

        return Ok(ApiResponse<object>.SuccessResult(profile, "Profil bilgileri getirildi."));
    }
}

public record AssignAdvisorDto(Guid StudentId, Guid AdvisorId, string? Note);
public record AssignUnitDto(Guid StudentId, Guid UnitId, string? Note);
public record UpdateStudentStatusDto(Guid StudentId, StudentStatus Status);
