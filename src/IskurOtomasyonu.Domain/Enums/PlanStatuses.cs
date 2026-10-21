namespace IskurOtomasyonu.Domain.Enums;

/// <summary>
/// Aylık çalışma planı onay durumları.
/// </summary>
public enum MonthlyPlanStatus
{
    Draft = 1,      // Öğrenci tarafından taslak oluşturuldu
    Submitted = 2,  // Danışman onayına sunuldu
    Approved = 3,   // Danışman / Yetkili tarafından onaylandı
    Rejected = 4    // Reddedildi, revizyon bekleniyor
}

/// <summary>
/// Plandaki belirli bir günün durumu.
/// </summary>
public enum PlanDayStatus
{
    Planned = 1,    // Planlandı, henüz günü gelmedi
    Completed = 2,  // Devam sağlandı ve tamamlandı
    Excused = 3,    // İzinli / Mazeretli
    Absent = 4      // Devamsız / Katılmadı
}
