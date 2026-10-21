namespace IskurOtomasyonu.Domain.Enums;

/// <summary>
/// Danışman tarafından öğrenciye atanan görevin durumu.
/// </summary>
public enum StudentTaskStatus
{
    Pending = 1,      // Başlanmadı / Beklemede
    InProgress = 2,   // Devam Ediyor
    Completed = 3,    // Tamamlandı
    Overdue = 4,      // Süresi Geçti
    Cancelled = 5     // İptal Edildi
}

/// <summary>
/// QR ve Devam Takip Doğrulama Durumları.
/// </summary>
public enum AttendanceVerificationStatus
{
    VerifiedByQr = 1,       // 30 sn'lik dinamik QR ile başarılı doğrulandı
    ManuallyApproved = 2,   // Danışman/Birim yetkilisi tarafından elle onaylandı
    PendingVerification = 3,// Doğrulama bekliyor (ör. cihaz uyuşmazlığı incelemesi)
    Rejected = 4            // Sahte/süresi geçmiş QR veya geçersiz lokasyon sebebiyle reddedildi
}

/// <summary>
/// Öğrencinin İŞKUR programındaki aktiflik durumu.
/// </summary>
public enum StudentStatus
{
    Active = 1,
    Suspended = 2,
    Graduated = 3,
    Terminated = 4
}
