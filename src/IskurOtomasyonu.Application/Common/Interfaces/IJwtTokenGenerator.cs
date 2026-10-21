using IskurOtomasyonu.Domain.Entities.Identity;

namespace IskurOtomasyonu.Application.Common.Interfaces;

/// <summary>
/// Kullanıcı girişlerinde JWT Bearer token ve Refresh token üreten servis arayüzü.
/// </summary>
public interface IJwtTokenGenerator
{
    (string Token, DateTime Expiration, string RefreshToken) GenerateToken(
        ApplicationUser user, 
        IList<string> roles);
}
