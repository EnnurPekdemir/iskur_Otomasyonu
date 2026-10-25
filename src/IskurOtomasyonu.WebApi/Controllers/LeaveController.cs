using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Leave;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize]
public class LeaveController : ApiControllerBase
{
    private readonly ILeaveService _leaveService;

    public LeaveController(ILeaveService leaveService)
    {
        _leaveService = leaveService;
    }

    /// <summary>
    /// Öğrenci tarafından mazeret/sağlık izin talebi oluşturur (Kalan kota kontrolü yapılır).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<LeaveRequestResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<LeaveRequestResponseDto>>> CreateLeaveRequest(
        [FromBody] CreateLeaveRequestDto request, 
        CancellationToken ct)
    {
        var result = await _leaveService.CreateLeaveRequestAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Yetkili (Danışman/Dekanlık) tarafından izin talebini onaylar veya reddeder.
    /// </summary>
    [HttpPost("{id:guid}/evaluate")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.Dekanlik},{AppRoles.FakulteSekreteri}")]
    [ProducesResponseType(typeof(ApiResponse<LeaveRequestResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LeaveRequestResponseDto>>> EvaluateLeaveRequest(
        [FromRoute] Guid id, 
        [FromBody] EvaluateLeaveDto evaluation, 
        CancellationToken ct)
    {
        var result = await _leaveService.EvaluateLeaveRequestAsync(id, evaluation, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrencinin kalan izin gününü, kullanılan izinleri ve sınır uyarı durumunu (HasLeaveWarning) döner.
    /// </summary>
    [HttpGet("balance/{studentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<StudentLeaveBalanceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<StudentLeaveBalanceDto>>> GetStudentLeaveBalance(
        [FromRoute] Guid studentId, 
        CancellationToken ct)
    {
        var result = await _leaveService.GetStudentLeaveBalanceAsync(studentId, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirli bir izin talebinin detaylarını getirir.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<LeaveRequestResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<LeaveRequestResponseDto>>> GetLeaveRequestById(
        [FromRoute] Guid id, 
        CancellationToken ct)
    {
        var result = await _leaveService.GetLeaveRequestByIdAsync(id, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Onay bekleyen tüm izin taleplerini listeler.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.Dekanlik},{AppRoles.FakulteSekreteri}")]
    [ProducesResponseType(typeof(ApiResponse<List<LeaveRequestResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<LeaveRequestResponseDto>>>> GetPendingLeaveRequests(CancellationToken ct)
    {
        var result = await _leaveService.GetPendingLeaveRequestsAsync(ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrencinin tüm izin talepleri geçmişini listeler.
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<LeaveRequestResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<LeaveRequestResponseDto>>>> GetStudentLeaveRequests(
        [FromRoute] Guid studentId, 
        CancellationToken ct)
    {
        var result = await _leaveService.GetStudentLeaveRequestsAsync(studentId, ct);
        return HandleResult(result);
    }
}
