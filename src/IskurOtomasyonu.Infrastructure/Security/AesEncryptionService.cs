using System.Security.Cryptography;
using System.Text;

namespace IskurOtomasyonu.Infrastructure.Security;

/// <summary>
/// AES-256 ve SHA-256 algoritmalarını kullanarak KVKK uyumlu şifreleme ve özetleme sağlayan servis.
/// </summary>
public class AesEncryptionService : IEncryptionService
{
    // Üretim ortamında bu anahtar appsettings.json veya Azure Key Vault üzerinden enjekte edilmelidir.
    private static readonly byte[] DefaultKey = Encoding.UTF8.GetBytes("IskurOtom-TeknolojiFak-2026!Key#"); // 32 bytes = 256 bits
    private static readonly byte[] DefaultIv = Encoding.UTF8.GetBytes("IskurIvInit2026!"); // 16 bytes = 128 bits

    private readonly byte[] _key;
    private readonly byte[] _iv;

    public AesEncryptionService(string? customKey = null, string? customIv = null)
    {
        _key = !string.IsNullOrEmpty(customKey) ? Encoding.UTF8.GetBytes(customKey.PadRight(32).Substring(0, 32)) : DefaultKey;
        _iv = !string.IsNullOrEmpty(customIv) ? Encoding.UTF8.GetBytes(customIv.PadRight(16).Substring(0, 16)) : DefaultIv;
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText))
            return cipherText;

        try
        {
            var buffer = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(buffer);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);

            return sr.ReadToEnd();
        }
        catch
        {
            // Şifre çözülemezse (örneğin henüz şifrelenmemiş veya farklı anahtar) mevcut metni döner
            return cipherText;
        }
    }

    public string ComputeHash(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input.Trim()));
        var builder = new StringBuilder();
        foreach (var b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }
}
