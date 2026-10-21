using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Plan;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface IPlanService
{
    Task<ApiResponse<MonthlyPlanResponseDto>> CreatePlanAsync(CreateMonthlyPlanDto request, CancellationToken ct = default);
    Task<ApiResponse<MonthlyPlanResponseDto>> SubmitPlanAsync(Guid planId, CancellationToken ct = default);
    Task<ApiResponse<MonthlyPlanResponseDto>> EvaluatePlanAsync(Guid planId, EvaluatePlanDto evaluation, CancellationToken ct = default);
    Task<ApiResponse<MonthlyPlanResponseDto>> GetPlanByIdAsync(Guid planId, CancellationToken ct = default);
    Task<ApiResponse<MonthlyPlanResponseDto>> GetStudentMonthlyPlanAsync(Guid studentId, int year, int month, CancellationToken ct = default);
    Task<ApiResponse<List<MonthlyPlanResponseDto>>> GetPendingPlansAsync(CancellationToken ct = default);
}
