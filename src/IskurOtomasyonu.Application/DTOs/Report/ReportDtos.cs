using System.ComponentModel.DataAnnotations;

namespace IskurOtomasyonu.Application.DTOs.Report;

/// <summary>
/// Aylık resmi puantaj dökümü sorgulama filtresi.
/// </summary>
public class MonthlyPayrollReportFilterDto
{
    [Required(ErrorMessage = "Yıl seçimi zorunludur.")]
    [Range(2025, 2035, ErrorMessage = "Geçerli bir yıl giriniz.")]
    public int Year { get; set; } = DateTime.UtcNow.Year;

    [Required(ErrorMessage = "Ay seçimi zorunludur.")]
    [Range(1, 12, ErrorMessage = "Ay 1 ile 12 arasında olmalıdır.")]
    public int Month { get; set; } = DateTime.UtcNow.Month;

    public Guid? DepartmentId { get; set; }
    public Guid? UnitId { get; set; }
    public Guid? AdvisorId { get; set; }
    public Guid? StudentId { get; set; }
}

/// <summary>
/// Dekanlık ve Fakülte Sekreterliği için hazırlanan resmi ay sonu puantaj satırı.
/// TCKN ve IBAN alanları şifrelenmiş veriden çözülerek düz metin getirilir.
/// </summary>
public class MonthlyPayrollItemDto
{
    public Guid StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    // KVKK Şifresi Çözülmüş Alanlar
    public string TcNo { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;

    public string DepartmentName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public string AdvisorName { get; set; } = string.Empty;

    public int Year { get; set; }
    public int Month { get; set; }

    public int PlannedDaysCount { get; set; }
    public int ActualDaysCount { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal TotalHoursWorked { get; set; }
    public int ApprovedLeaveDays { get; set; }
    public int AbsentDaysCount { get; set; }

    /// <summary>
    /// Puantajın katılım oranı (% cinsinden).
    /// </summary>
    public decimal AttendancePercentage => PlannedDaysCount > 0 
        ? Math.Round(((decimal)ActualDaysCount / PlannedDaysCount) * 100, 1) 
        : 0;
}

/// <summary>
/// İzin kotasına yaklaşan veya devamsızlık riski taşıyan öğrenci filtreleri.
/// </summary>
public class RiskWarningFilterDto
{
    public Guid? DepartmentId { get; set; }
    public int LeaveWarningThresholdDays { get; set; } = 7; // 7 günden fazla izin kullananlar
    public int AbsenteeismThresholdDays { get; set; } = 3;  // 3 günden fazla devamsızlık yapanlar
}

/// <summary>
/// İlişik kesme ve kota aşım riski taşıyan öğrencilerin risk değerlendirme raporu.
/// </summary>
public class StudentRiskReportDto
{
    public Guid StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public string AdvisorName { get; set; } = string.Empty;

    public int TotalAnnualEntitlement { get; set; } = 10;
    public int UsedLeaveDays { get; set; }
    public int RemainingLeaveDays { get; set; }
    public bool HasLeaveWarning { get; set; }

    public int TotalAbsentDays { get; set; }
    public bool HasAbsenteeismRisk { get; set; }

    /// <summary>
    /// Risk Seviyesi: "Düşük", "Orta", "Kritik"
    /// </summary>
    public string RiskLevel { get; set; } = "Düşük";

    /// <summary>
    /// Risk gerekçeleri listesi (Örn: "İzin kotası %80 aşıldı", "Mazeretsiz 3 gün devamsızlık").
    /// </summary>
    public List<string> RiskReasons { get; set; } = new();

    /// <summary>
    /// İdari Öneri (Örn: "Takip Edilmeli", "Görüşme Yapılmalı", "İlişik Kesme İncelemesi Başlatılmalı").
    /// </summary>
    public string RecommendedAction { get; set; } = "Takip Edilmeli";
}
