using IskurOtomasyonu.Domain.Common;

namespace IskurOtomasyonu.Domain.Entities.Configuration;

/// <summary>
/// Dinamik sistem parametrelerini (10 günlük izin sınırı, 30 sn QR periyodu vb.) 
/// anahtar-değer çifti olarak tutan yapılandırma varlığı.
/// </summary>
public class SystemSetting : BaseEntity
{
    /// <summary>
    /// Parametre anahtarı (Tekil indeksli, örn: 'MAX_ANNUAL_LEAVE_DAYS', 'QR_EXPIRATION_SECONDS').
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Parametre değeri (örn: '10', '30').
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Parametrenin işlevi ve amacını açıklayan açıklama metni.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Parametre grubu / modülü (örn: 'Attendance', 'Leave', 'General').
    /// </summary>
    public string Group { get; set; } = "General";

    /// <summary>
    /// Sistem için zorunlu çekirdek ayar olup olmadığı (Silinmesi engellenir).
    /// </summary>
    public bool IsReadOnly { get; set; } = false;
}

/// <summary>
/// Sistemde kullanılan standart parametre anahtarları.
/// </summary>
public static class SystemSettingKeys
{
    public const string MaxAnnualLeaveDays = "MAX_ANNUAL_LEAVE_DAYS";
    public const string QrExpirationSeconds = "QR_EXPIRATION_SECONDS";
    public const string DailyMaxWorkingHours = "DAILY_MAX_WORKING_HOURS";
    public const string MonthlyMaxWorkingHours = "MONTHLY_MAX_WORKING_HOURS";
    public const string AttendanceToleranceMinutes = "ATTENDANCE_TOLERANCE_MINUTES";
}
