using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Task;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize]
public class TaskController : ApiControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Danışman tarafından öğrenciye yeni bir çalışma görevi ve teslim tarihi atar.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.BolumBaskani},{AppRoles.Dekanlik}")]
    [ProducesResponseType(typeof(ApiResponse<StudentTaskResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<StudentTaskResponseDto>>> CreateTask(
        [FromBody] CreateStudentTaskDto request, 
        CancellationToken ct)
    {
        var result = await _taskService.CreateTaskAsync(request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Öğrenci tarafından görevin durumunu günceller (InProgress, Completed) ve teslim notu ekler.
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = AppRoles.Ogrenci)]
    [ProducesResponseType(typeof(ApiResponse<StudentTaskResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<StudentTaskResponseDto>>> UpdateTaskStatus(
        [FromRoute] Guid id, 
        [FromBody] UpdateTaskStatusDto request, 
        CancellationToken ct)
    {
        var result = await _taskService.UpdateTaskStatusAsync(id, request, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Danışman tarafından göreve ilişkin değerlendirme notu ve puan (0-100) girer.
    /// </summary>
    [HttpPost("{id:guid}/evaluate")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.BolumBaskani},{AppRoles.Dekanlik}")]
    [ProducesResponseType(typeof(ApiResponse<StudentTaskResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<StudentTaskResponseDto>>> EvaluateTask(
        [FromRoute] Guid id, 
        [FromBody] EvaluateTaskDto evaluation, 
        CancellationToken ct)
    {
        var result = await _taskService.EvaluateTaskAsync(id, evaluation, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirli bir öğrenciye atanan görevleri listeler (Durum filtresi destekler).
    /// </summary>
    [HttpGet("student/{studentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<StudentTaskResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<StudentTaskResponseDto>>>> GetStudentTasks(
        [FromRoute] Guid studentId, 
        [FromQuery] StudentTaskStatus? status, 
        CancellationToken ct)
    {
        var result = await _taskService.GetStudentTasksAsync(studentId, status, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirli bir danışmanın öğrencilerine atadığı tüm görevleri listeler.
    /// </summary>
    [HttpGet("advisor/{advisorId:guid}")]
    [Authorize(Roles = $"{AppRoles.Danisman},{AppRoles.BolumBaskani},{AppRoles.Dekanlik}")]
    [ProducesResponseType(typeof(ApiResponse<List<StudentTaskResponseDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<StudentTaskResponseDto>>>> GetAdvisorTasks(
        [FromRoute] Guid advisorId, 
        CancellationToken ct)
    {
        var result = await _taskService.GetAssignedTasksAsync(advisorId, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Görev detayını ID'ye göre getirir.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<StudentTaskResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<StudentTaskResponseDto>>> GetTaskById(
        [FromRoute] Guid id, 
        CancellationToken ct)
    {
        var result = await _taskService.GetTaskByIdAsync(id, ct);
        return HandleResult(result);
    }
}
