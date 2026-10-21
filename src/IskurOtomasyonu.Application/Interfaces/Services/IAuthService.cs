using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Auth;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<ApiResponse<AuthResponseDto>> RegisterStudentAsync(RegisterStudentDto request, CancellationToken ct = default);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken ct = default);
}
