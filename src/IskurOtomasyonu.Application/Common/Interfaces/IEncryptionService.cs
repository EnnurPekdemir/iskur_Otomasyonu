namespace IskurOtomasyonu.Application.Common.Interfaces;

/// <summary>
/// KVKK gereği hassas verilerin (TCKN, IBAN vb.) şifrelenmesi ve çözülmesi için servis arayüzü.
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// Düz metni şifreler (AES-256).
    /// </summary>
    string Encrypt(string plainText);

    /// <summary>
    /// Şifreli metni çözer.
    /// </summary>
    string Decrypt(string cipherText);

    /// <summary>
    /// Arama ve tekil indeksleme için deterministik hash üretir (SHA-256).
    /// </summary>
    string ComputeHash(string input);
}
