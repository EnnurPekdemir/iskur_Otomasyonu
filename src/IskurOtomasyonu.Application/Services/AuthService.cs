using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Auth;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Identity;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEncryptionService _encryptionService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        IEncryptionService encryptionService)
    {
        _userManager = userManager;
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _encryptionService = encryptionService;
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(
        LoginRequestDto request, 
        CancellationToken ct = default)
    {
        // 1. Kullanıcıyı Kullanıcı Adı veya E-posta İle Bul
        var user = await _userManager.FindByEmailAsync(request.UserNameOrEmail)
                   ?? await _userManager.FindByNameAsync(request.UserNameOrEmail);

        if (user == null)
        {
            throw new BusinessRuleException("Geçersiz e-posta / kullanıcı adı veya parola.");
        }

        if (!user.IsActive)
        {
            throw new BusinessRuleException("Kullanıcı hesabınız pasife alınmıştır. Lütfen dekanlık ile iletişime geçiniz.");
        }

        // 2. Parola Kontrolü
        var isValidPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValidPassword)
        {
            throw new BusinessRuleException("Geçersiz e-posta / kullanıcı adı veya parola.");
        }

        // 3. Rolleri ve Öğrenci Profilini Getir
        var roles = await _userManager.GetRolesAsync(user);
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.UserId == user.Id, ct);

        // 4. JWT Token & Refresh Token Üret
        var (token, expiration, refreshToken) = _jwtTokenGenerator.GenerateToken(user, roles);

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var response = new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = expiration,
            UserId = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToList(),
            StudentId = student?.Id
        };

        return ApiResponse<AuthResponseDto>.SuccessResult(response, "Giriş başarılı.");
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterStudentAsync(
        RegisterStudentDto request, 
        CancellationToken ct = default)
    {
        // 1. Öğrenci Numarası ve E-posta Tekillik Kontrolü
        var emailExists = await _userManager.FindByEmailAsync(request.Email);
        if (emailExists != null)
        {
            throw new BusinessRuleException("Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");
        }

        var studentNumberExists = await _context.Students
            .AnyAsync(s => s.StudentNumber == request.StudentNumber, ct);
        if (studentNumberExists)
        {
            throw new BusinessRuleException("Bu öğrenci numarası ile kayıtlı bir öğrenci zaten mevcut.");
        }

        // 2. KVKK Güvenliği: TCKN Hash ve Şifreleme
        var tcNoHash = _encryptionService.ComputeHash(request.TcNo);
        var tcNoExists = await _context.Students.AnyAsync(s => s.TcNoHash == tcNoHash, ct);
        if (tcNoExists)
        {
            throw new BusinessRuleException("Bu TC Kimlik Numarası sistemde zaten kayıtlıdır.");
        }

        var encryptedTcNo = _encryptionService.Encrypt(request.TcNo);
        var encryptedIban = _encryptionService.Encrypt(request.Iban);

        // 3. Bölüm Varlığı Kontrolü
        var department = await _context.Departments.FindAsync(new object[] { request.DepartmentId }, ct);
        if (department == null)
        {
            throw new NotFoundException(nameof(Department), request.DepartmentId);
        }

        // 4. ApplicationUser Oluşturma
        var user = new ApplicationUser
        {
            UserName = request.StudentNumber,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = true,
            IsActive = true
        };

        var identityResult = await _userManager.CreateAsync(user, request.Password);
        if (!identityResult.Succeeded)
        {
            var errors = identityResult.Errors.Select(e => e.Description).ToList();
            throw new ValidationException(new Dictionary<string, string[]> { { "Identity", errors.ToArray() } });
        }

        // 5. 'Ogrenci' Rolünü Ata
        await _userManager.AddToRoleAsync(user, AppRoles.Ogrenci);

        // 6. Student Profil Kaydını Oluştur
        var student = new Student
        {
            UserId = user.Id,
            StudentNumber = request.StudentNumber,
            EncryptedTcNo = encryptedTcNo,
            TcNoHash = tcNoHash,
            EncryptedIban = encryptedIban,
            DepartmentId = request.DepartmentId,
            ClassLevel = request.ClassLevel,
            Status = StudentStatus.Active,
            RemainingLeaveDays = 10
        };

        await _context.Students.AddAsync(student, ct);
        await _context.SaveChangesAsync(ct);

        // 7. Otomatik Token Üret
        var roles = new List<string> { AppRoles.Ogrenci };
        var (token, expiration, refreshToken) = _jwtTokenGenerator.GenerateToken(user, roles);

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var response = new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = expiration,
            UserId = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles,
            StudentId = student.Id
        };

        return ApiResponse<AuthResponseDto>.SuccessResult(response, "Öğrenci kaydı başarıyla tamamlandı.", 201);
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(
        RefreshTokenRequestDto request, 
        CancellationToken ct = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, ct);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new BusinessRuleException("Geçersiz veya süresi dolmuş yenileme anahtarı (Refresh Token).");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == user.Id, ct);

        var (newToken, expiration, newRefreshToken) = _jwtTokenGenerator.GenerateToken(user, roles);

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var response = new AuthResponseDto
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            Expiration = expiration,
            UserId = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToList(),
            StudentId = student?.Id
        };

        return ApiResponse<AuthResponseDto>.SuccessResult(response, "Oturum başarıyla yenilendi.");
    }
}
