using System.ComponentModel.DataAnnotations;

namespace IskurOtomasyonu.Application.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "E-posta veya Kullanıcı Adı zorunludur.")]
    public string UserNameOrEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Parola zorunludur.")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public Guid? StudentId { get; set; }
}

public class RegisterStudentDto
{
    [Required(ErrorMessage = "Ad zorunludur.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Soyad zorunludur.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-posta zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta giriniz.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Öğrenci Numarası zorunludur.")]
    public string StudentNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "TC Kimlik Numarası zorunludur.")]
    [StringLength(11, MinimumLength = 11, ErrorMessage = "TC Kimlik No 11 haneli olmalıdır.")]
    public string TcNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "IBAN zorunludur.")]
    public string Iban { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bölüm seçimi zorunludur.")]
    public Guid DepartmentId { get; set; }

    [Required(ErrorMessage = "Parola zorunludur.")]
    [MinLength(8, ErrorMessage = "Parola en az 8 karakter olmalıdır.")]
    public string Password { get; set; } = string.Empty;

    public int ClassLevel { get; set; } = 1;
}

public class RefreshTokenRequestDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
