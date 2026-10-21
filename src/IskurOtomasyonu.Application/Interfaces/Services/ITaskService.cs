using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Task;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface ITaskService
{
    Task<ApiResponse<StudentTaskResponseDto>> CreateTaskAsync(CreateStudentTaskDto request, CancellationToken ct = default);
    Task<ApiResponse<StudentTaskResponseDto>> UpdateTaskStatusAsync(Guid taskId, UpdateTaskStatusDto request, CancellationToken ct = default);
    Task<ApiResponse<StudentTaskResponseDto>> EvaluateTaskAsync(Guid taskId, EvaluateTaskDto evaluation, CancellationToken ct = default);
    Task<ApiResponse<List<StudentTaskResponseDto>>> GetStudentTasksAsync(Guid studentId, StudentTaskStatus? status = null, CancellationToken ct = default);
    Task<ApiResponse<List<StudentTaskResponseDto>>> GetAssignedTasksAsync(Guid advisorId, CancellationToken ct = default);
    Task<ApiResponse<StudentTaskResponseDto>> GetTaskByIdAsync(Guid taskId, CancellationToken ct = default);
}
