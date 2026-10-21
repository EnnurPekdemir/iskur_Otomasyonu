using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Attendance;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize]
public class AttendanceController : ApiControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    /// <summary>
    /// Yetkili (Danışman/Sekreterlik) için 30 saniye geçerlilik süresine sahip dinamik QR oturumu oluşturur.
    /// </summary>
    [HttpPost("qr-session")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.Dekanlik},{AppRoles.BolumBaskani}")]
    [ProducesResponseType(typeof(ApiResponse<QrSessionResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<QrSessionResponseDto>>> CreateQrSession(
        [FromBody] CreateQrSessionDto request, 
        CancellationToken ct)
    {
        var result = await _attendanceService.CreateQrSessionAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrenci tarafından 30 sn'lik dinamik QR okutularak yoklama giriş kaydı (Check-in) yapılır.
    /// </summary>
    [HttpPost("check-in")]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> CheckInWithQr(
        [FromBody] QrCheckInRequestDto request, 
        CancellationToken ct)
    {
        // İstemci IP ve User-Agent bilgilerini isteğe ekle
        request.IpAddress ??= HttpContext.Connection.RemoteIpAddress?.ToString();
        request.DeviceSignature ??= Request.Headers.UserAgent.ToString();

        var result = await _attendanceService.CheckInWithQrAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrencinin mesai bitiminde çıkış saatini ve çalıştığı net süreyi kaydeder.
    /// </summary>
    [HttpPost("{id:guid}/check-out")]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> CheckOut(
        [FromRoute] Guid id, 
        CancellationToken ct)
    {
        var result = await _attendanceService.CheckOutAsync(id, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// QR okutamayan durumlar için yetkili tarafından manuel devam onayı verir.
    /// </summary>
    [HttpPost("manual")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.Dekanlik}")]
    [ProducesResponseType(typeof(ApiResponse<AttendanceResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<AttendanceResponseDto>>> ManualAttendance(
        [FromBody] ManualAttendanceDto request, 
        CancellationToken ct)
    {
        var result = await _attendanceService.ManualAttendanceAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrencinin geçmiş devam kayıtlarını getirir.
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<AttendanceResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<AttendanceResponseDto>>>> GetStudentAttendances(
        [FromRoute] Guid studentId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct)
    {
        var result = await _attendanceService.GetStudentAttendancesAsync(studentId, startDate, endDate, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Bugünün gerçekleşen tüm devam kayıtlarını listeler (Birim filtresi destekler).
    /// </summary>
    [HttpGet("today")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.Dekanlik},{AppRoles.BolumBaskani}")]
    [ProducesResponseType(typeof(ApiResponse<List<AttendanceResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<AttendanceResponseDto>>>> GetTodayAttendances(
        [FromQuery] Guid? unitId, 
        CancellationToken ct)
    {
        var result = await _attendanceService.GetTodayAttendancesAsync(unitId, ct);
        return HandleResult(result);
    }
}
