using IskurOtomasyonu.Domain.Common;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Domain.Entities.Tracking;

/// <summary>
/// Bir aylık çalışma planına ait münferit bir günün çalışma saat aralığını tutan detay varlığı.
/// </summary>
public class PlanDay : BaseEntity
{
    public Guid MonthlyPlanId { get; set; }
    public virtual MonthlyPlan MonthlyPlan { get; set; } = null!;

    public DateTime Date { get; set; } // Sadece tarih bilgisi (örn: 2026-10-21 00:00:00)

    public TimeSpan StartTime { get; set; } // Örn: 09:00:00
    public TimeSpan EndTime { get; set; }   // Örn: 14:00:00

    /// <summary>
    /// O gün için planlanan saat (Örn: 5.0 saat).
    /// </summary>
    public decimal PlannedHours { get; set; }

    public PlanDayStatus DayStatus { get; set; } = PlanDayStatus.Planned;

    public string? Notes { get; set; }

    /// <summary>
    /// Bu planlanan günde gerçekleşen fiili devam kaydı (1-to-1).
    /// </summary>
    public virtual Attendance? Attendance { get; set; }
}
