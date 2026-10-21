using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Leave;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface ILeaveService
{
    Task<ApiResponse<LeaveRequestResponseDto>> CreateLeaveRequestAsync(CreateLeaveRequestDto request, CancellationToken ct = default);
    Task<ApiResponse<LeaveRequestResponseDto>> EvaluateLeaveRequestAsync(Guid leaveRequestId, EvaluateLeaveDto evaluation, CancellationToken ct = default);
    Task<ApiResponse<StudentLeaveBalanceDto>> GetStudentLeaveBalanceAsync(Guid studentId, CancellationToken ct = default);
    Task<ApiResponse<LeaveRequestResponseDto>> GetLeaveRequestByIdAsync(Guid leaveRequestId, CancellationToken ct = default);
    Task<ApiResponse<List<LeaveRequestResponseDto>>> GetPendingLeaveRequestsAsync(CancellationToken ct = default);
    Task<ApiResponse<List<LeaveRequestResponseDto>>> GetStudentLeaveRequestsAsync(Guid studentId, CancellationToken ct = default);
}
