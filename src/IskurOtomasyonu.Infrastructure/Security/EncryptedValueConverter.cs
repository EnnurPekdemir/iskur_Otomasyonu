using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using IskurOtomasyonu.Application.Common.Interfaces;

namespace IskurOtomasyonu.Infrastructure.Security;

/// <summary>
/// Entity Framework Core seviyesinde şeffaf (transparent) şifreleme ve çözme sağlayan ValueConverter.
/// Veritabanına yazılırken şifrelenir, veritabanından okunurken otomatik çözülür.
/// </summary>
public class EncryptedValueConverter : ValueConverter<string, string>
{
    public EncryptedValueConverter(IEncryptionService encryptionService)
        : base(
            v => encryptionService.Encrypt(v),
            v => encryptionService.Decrypt(v))
    {
    }
}
