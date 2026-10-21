using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Auth;
using IskurOtomasyonu.Application.Interfaces.Services;

namespace IskurOtomasyonu.WebApi.Controllers;

public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService authService, ICurrentUserService currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Kullanıcı adı/E-posta ve parola ile sisteme giriş yaparak JWT Bearer token alır.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Yeni İŞKUR öğrencisi kaydı oluşturur (KVKK gereği TCKN ve IBAN şifrelenir).
    /// </summary>
    [HttpPost("register-student")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RegisterStudent([FromBody] RegisterStudentDto request, CancellationToken ct)
    {
        var result = await _authService.RegisterStudentAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Süresi dolan JWT token'ı Refresh Token kullanarak yeniler.
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        var result = await _authService.RefreshTokenAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Mevcut kimliği doğrulanmış kullanıcının kimlik ve rol bilgilerini döner.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public ActionResult<ApiResponse<object>> GetCurrentUser()
    {
        var userSummary = new
        {
            UserId = _currentUser.UserId,
            Email = _currentUser.Email,
            Roles = _currentUser.Roles,
            IsAuthenticated = _currentUser.IsAuthenticated
        };

        return Ok(ApiResponse<object>.SuccessResult(userSummary, "Kullanıcı bilgisi başarıyla getirildi."));
    }
}
