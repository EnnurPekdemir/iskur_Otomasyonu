using Microsoft.AspNetCore.Identity;
using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;

namespace IskurOtomasyonu.Domain.Entities.Identity;

/// <summary>
/// ASP.NET Core Identity altyapısını genişleten ana kullanıcı sınıfı.
/// Guid birincil anahtarına ve KVKK uyumlu denetim izlerine sahiptir.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>, ISoftDeletable, IAuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AcademicTitle { get; set; } // Örn: Doç. Dr., Arş. Gör., Dekan vb.

    public string FullName => $"{FirstName} {LastName}".Trim();

    public bool IsActive { get; set; } = true;

    // JWT Bearer Refresh Token Desteği
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Denetim (Audit) Alanları
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Mantıksal Silme (Soft-Delete)
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // ==========================================
    // Navigation Properties (İlişkiler)
    // ==========================================

    /// <summary>
    /// Eğer bu kullanıcı bir öğrenci ise öğrenci profil detayları (1-to-1).
    /// </summary>
    public virtual Student? StudentProfile { get; set; }

    /// <summary>
    /// Danışman olarak atanmış olduğu öğrenci görevlendirmeleri geçmişi.
    /// </summary>
    public virtual ICollection<StudentAdvisorAssignment> AdvisorAssignments { get; set; } = new List<StudentAdvisorAssignment>();

    /// <summary>
    /// Bu kullanıcı (Danışman/Yetkili) tarafından başlatılan dinamik QR oturumları.
    /// </summary>
    public virtual ICollection<QrSession> CreatedQrSessions { get; set; } = new List<QrSession>();

    /// <summary>
    /// Bu kullanıcı (Danışman/Dekanlık) tarafından onaylanan/değerlendirilen izin talepleri.
    /// </summary>
    public virtual ICollection<LeaveRequest> EvaluatedLeaveRequests { get; set; } = new List<LeaveRequest>();

    /// <summary>
    /// Bu kullanıcı (Danışman) tarafından öğrencilere verilen görevler.
    /// </summary>
    public virtual ICollection<StudentTask> AssignedTasks { get; set; } = new List<StudentTask>();

    /// <summary>
    /// Bu kullanıcı tarafından onaylanan aylık çalışma planları.
    /// </summary>
    public virtual ICollection<MonthlyPlan> ApprovedMonthlyPlans { get; set; } = new List<MonthlyPlan>();

    /// <summary>
    /// Bölüm başkanı olduğu bölümler.
    /// </summary>
    public virtual ICollection<Department> HeadOfDepartments { get; set; } = new List<Department>();

    /// <summary>
    /// Birim sorumlusu olduğu fakülte/bölüm birimleri.
    /// </summary>
    public virtual ICollection<Unit> SupervisedUnits { get; set; } = new List<Unit>();
}
