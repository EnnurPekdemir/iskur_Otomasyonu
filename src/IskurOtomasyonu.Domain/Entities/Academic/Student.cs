using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Entities.Assignments;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Entities.Tracking;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Academic;

/// <summary>
/// İŞKUR programında yer alan üniversite öğrencisi ana domain varlığı.
/// KVKK gereği TCKN ve IBAN doğrudan düz metin olarak değil, şifreli saklanır.
/// Danışman ve birim bilgileri ezilmez; geçmiş tablolarında izlenir.
/// </summary>
public class Student : BaseEntity
{
    /// <summary>
    /// Kimlik doğrulama hesabı (Identity ApplicationUser) ile 1-e-1 ilişki.
    /// </summary>
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    /// <summary>
    /// Üniversite Öğrenci Numarası (Tekil İndeksli).
    /// </summary>
    public string StudentNumber { get; set; } = string.Empty;

    // ========================================================
    // KVKK ve Hassas Veri Güvenliği (Kritik)
    // ========================================================

    /// <summary>
    /// AES-256 ile şifrelenmiş TC Kimlik Numarası. Veritabanında asla düz metin saklanmaz.
    /// </summary>
    public string EncryptedTcNo { get; set; } = string.Empty;

    /// <summary>
    /// TC Kimlik Numarasının SHA-256 HMAC / Salted Hash değeri.
    /// Şifreyi çözmeden veritabanı seviyesinde tekillik (Unique Index) ve arama yapılmasını sağlar.
    /// </summary>
    public string TcNoHash { get; set; } = string.Empty;

    /// <summary>
    /// AES-256 ile şifrelenmiş İŞKUR ödemesi IBAN bilgisi.
    /// </summary>
    public string EncryptedIban { get; set; } = string.Empty;

    // ========================================================
    // Akademik Bilgiler
    // ========================================================

    public Guid DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;

    public int ClassLevel { get; set; } = 1; // 1, 2, 3, 4
    public decimal? Gpa { get; set; }        // 0.00 - 4.00

    public StudentStatus Status { get; set; } = StudentStatus.Active;

    /// <summary>
    /// Yıllık izin kotasından kalan gün sayısı (Varsayılan: 10 gün).
    /// </summary>
    public int RemainingLeaveDays { get; set; } = 10;

    // ========================================================
    // Geçmişin Korunması ve Snapshot İlişkileri (Kritik)
    // ========================================================

    /// <summary>
    /// Öğrencinin geçmişten günümüze tüm danışman atama kayıtları (Tarihçeli).
    /// </summary>
    public virtual ICollection<StudentAdvisorAssignment> AdvisorAssignments { get; set; } = new List<StudentAdvisorAssignment>();

    /// <summary>
    /// Öğrencinin geçmişten günümüze tüm birim görevlendirme kayıtları (Tarihçeli).
    /// </summary>
    public virtual ICollection<StudentUnitAssignment> UnitAssignments { get; set; } = new List<StudentUnitAssignment>();

    /// <summary>
    /// Aylık çalışma planları (Aylara göre snapshot şeklinde bağımsız tutulur).
    /// </summary>
    public virtual ICollection<MonthlyPlan> MonthlyPlans { get; set; } = new List<MonthlyPlan>();

    /// <summary>
    /// QR ile gerçekleşen fiili devam kayıtları.
    /// </summary>
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    /// <summary>
    /// Öğrencinin izin talepleri.
    /// </summary>
    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();

    /// <summary>
    /// Öğrenciye atanan görevler.
    /// </summary>
    public virtual ICollection<StudentTask> Tasks { get; set; } = new List<StudentTask>();
}
