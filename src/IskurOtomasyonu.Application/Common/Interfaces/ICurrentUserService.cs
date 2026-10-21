namespace IskurOtomasyonu.Application.Common.Interfaces;

/// <summary>
/// HTTP isteğini yapan mevcut kimliği doğrulanmış kullanıcı bilgilerine erişim sağlayan servis.
/// </summary>
public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}
