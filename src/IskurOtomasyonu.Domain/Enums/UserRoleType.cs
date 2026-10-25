namespace IskurOtomasyonu.Domain.Enums;

/// <summary>
/// Sistemdeki 4 temel kullanıcı rolü.
/// </summary>
public enum UserRoleType
{
    Dekanlik = 1,
    BolumBaskani = 2,
    Danisman = 3,
    Ogrenci = 4,
    FakulteSekreteri = 5
}

/// <summary>
/// ASP.NET Core Identity ve [Authorize(Roles = ...)] için sabit rol isimleri.
/// </summary>
public static class AppRoles
{
    public const string Dekanlik = "Dekanlik";
    public const string BolumBaskani = "BolumBaskani";
    public const string Danisman = "Danisman";
    public const string Ogrenci = "Ogrenci";
    public const string FakulteSekreteri = "FakulteSekreteri";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Dekanlik,
        BolumBaskani,
        Danisman,
        Ogrenci,
        FakulteSekreteri
    };
}
