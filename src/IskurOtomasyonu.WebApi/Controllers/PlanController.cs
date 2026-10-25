using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Plan;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize]
public class PlanController : ApiControllerBase
{
    private readonly IPlanService _planService;

    public PlanController(IPlanService planService)
    {
        _planService = planService;
    }

    /// <summary>
    /// Öğrenci tarafından aylık çalışma planı taslağı oluşturur veya günceller (Haftalık 1-3 gün ve tatil kontrolleri yapılır).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<MonthlyPlanResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<MonthlyPlanResponseDto>>> CreatePlan(
        [FromBody] CreateMonthlyPlanDto request, 
        CancellationToken ct)
    {
        var result = await _planService.CreatePlanAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Taslak durumundaki planı danışman onayına sunar (DRAFT -> SUBMITTED).
    /// </summary>
    [HttpPost("{id:guid}/submit")]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<MonthlyPlanResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MonthlyPlanResponseDto>>> SubmitPlan(
        [FromRoute] Guid id, 
        CancellationToken ct)
    {
        var result = await _planService.SubmitPlanAsync(id, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Danışman veya Bölüm Başkanı tarafından planı onaylar veya gerekçe belirterek reddeder (SUBMITTED -> APPROVED / REJECTED).
    /// </summary>
    [HttpPost("{id:guid}/evaluate")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.BolumBaskani},{AppRoles.Dekanlik},{AppRoles.FakulteSekreteri}")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyPlanResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MonthlyPlanResponseDto>>> EvaluatePlan(
        [FromRoute] Guid id, 
        [FromBody] EvaluatePlanDto evaluation, 
        CancellationToken ct)
    {
        var result = await _planService.EvaluatePlanAsync(id, evaluation, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// ID'ye göre çalışma planı detaylarını günleri ve devam durumlarıyla birlikte getirir.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyPlanResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MonthlyPlanResponseDto>>> GetPlanById(
        [FromRoute] Guid id, 
        CancellationToken ct)
    {
        var result = await _planService.GetPlanByIdAsync(id, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirli bir öğrencinin yıl ve aya göre çalışma planını getirir.
    /// </summary>
    [HttpGet("student/{studentId:guid}/{year:int}/{month:int}")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyPlanResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MonthlyPlanResponseDto>>> GetStudentPlan(
        [FromRoute] Guid studentId, 
        [FromRoute] int year, 
        [FromRoute] int month, 
        CancellationToken ct)
    {
        var result = await _planService.GetStudentMonthlyPlanAsync(studentId, year, month, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Danışman onayı bekleyen tüm çalışma planlarını listeler.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.BolumBaskani},{AppRoles.Dekanlik},{AppRoles.FakulteSekreteri}")]
    [ProducesResponseType(typeof(ApiResponse<List<MonthlyPlanResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<MonthlyPlanResponseDto>>>> GetPendingPlans(CancellationToken ct)
    {
        var result = await _planService.GetPendingPlansAsync(ct);
        return HandleResult(result);
    }
}
