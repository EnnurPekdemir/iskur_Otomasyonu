namespace IskurOtomasyonu.Domain.Enums;

/// <summary>
/// Öğrenci izin talep türü.
/// </summary>
public enum LeaveType
{
    Mazeret = 1,
    SaglikRaporu = 2,
    ResmiTatil = 3,
    AkademikFaaliyet = 4,
    Diger = 5
}

/// <summary>
/// İzin talep onay süreci durumları.
/// </summary>
public enum LeaveStatus
{
    Pending = 1,    // Beklemede (Danışman / Yetkili onayı bekliyor)
    Approved = 2,   // Onaylandı
    Rejected = 3,   // Reddedildi
    Cancelled = 4   // Öğrenci tarafından geri çekildi
}
