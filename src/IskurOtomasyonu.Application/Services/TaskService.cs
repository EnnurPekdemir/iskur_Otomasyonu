using Microsoft.EntityFrameworkCore;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Interfaces;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Task;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Entities.Academic;
using IskurOtomasyonu.Domain.Entities.Workflow;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.Services;

public class TaskService : ITaskService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public TaskService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<StudentTaskResponseDto>> CreateTaskAsync(
        CreateStudentTaskDto request, 
        CancellationToken ct = default)
    {
        var currentUserId = _currentUser.UserId 
            ?? throw new UnauthorizedException("Görev atayabilmek için yetkili/danışman oturumu gereklidir.");

        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), request.StudentId);

        if (request.DueDate < DateTime.UtcNow)
        {
            throw new BusinessRuleException("Görevin hedef teslim tarihi geçmiş bir tarih olamaz.");
        }

        var task = new StudentTask
        {
            StudentId = request.StudentId,
            AssignedByUserId = currentUserId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            Status = StudentTaskStatus.Pending
        };

        await _context.StudentTasks.AddAsync(task, ct);
        await _context.SaveChangesAsync(ct);

        var advisor = await _context.Users.FindAsync(new object[] { currentUserId }, ct);

        return ApiResponse<StudentTaskResponseDto>.SuccessResult(
            MapToResponseDto(task, student, advisor?.FullName), 
            "Görev başarıyla öğrenciye atandı.");
    }

    public async Task<ApiResponse<StudentTaskResponseDto>> UpdateTaskStatusAsync(
        Guid taskId, 
        UpdateTaskStatusDto request, 
        CancellationToken ct = default)
    {
        var task = await _context.StudentTasks
            .Include(t => t.Student).ThenInclude(s => s.User)
            .Include(t => t.AssignedByUser)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task == null)
            throw new NotFoundException(nameof(StudentTask), taskId);

        task.Status = request.Status;

        if (request.Status == StudentTaskStatus.Completed)
        {
            task.CompletedAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(request.StudentSubmissionNote))
        {
            task.StudentSubmissionNote = request.StudentSubmissionNote;
        }

        await _context.SaveChangesAsync(ct);

        return ApiResponse<StudentTaskResponseDto>.SuccessResult(
            MapToResponseDto(task, task.Student, task.AssignedByUser?.FullName), 
            "Görev durumu başarıyla güncellendi.");
    }

    public async Task<ApiResponse<StudentTaskResponseDto>> EvaluateTaskAsync(
        Guid taskId, 
        EvaluateTaskDto evaluation, 
        CancellationToken ct = default)
    {
        var task = await _context.StudentTasks
            .Include(t => t.Student).ThenInclude(s => s.User)
            .Include(t => t.AssignedByUser)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task == null)
            throw new NotFoundException(nameof(StudentTask), taskId);

        task.AdvisorEvaluationNote = evaluation.AdvisorEvaluationNote;
        task.AdvisorScore = evaluation.AdvisorScore;

        await _context.SaveChangesAsync(ct);

        return ApiResponse<StudentTaskResponseDto>.SuccessResult(
            MapToResponseDto(task, task.Student, task.AssignedByUser?.FullName), 
            "Danışman değerlendirme notu ve puanı başarıyla kaydedildi.");
    }

    public async Task<ApiResponse<List<StudentTaskResponseDto>>> GetStudentTasksAsync(
        Guid studentId, 
        StudentTaskStatus? status = null, 
        CancellationToken ct = default)
    {
        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct);

        if (student == null)
            throw new NotFoundException(nameof(Student), studentId);

        var query = _context.StudentTasks
            .Include(t => t.AssignedByUser)
            .Where(t => t.StudentId == studentId);

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        var tasks = await query.OrderBy(t => t.DueDate).ToListAsync(ct);
        var result = tasks.Select(t => MapToResponseDto(t, student, t.AssignedByUser?.FullName)).ToList();

        return ApiResponse<List<StudentTaskResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<List<StudentTaskResponseDto>>> GetAssignedTasksAsync(
        Guid advisorId, 
        CancellationToken ct = default)
    {
        var tasks = await _context.StudentTasks
            .Include(t => t.Student).ThenInclude(s => s.User)
            .Include(t => t.AssignedByUser)
            .Where(t => t.AssignedByUserId == advisorId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var result = tasks.Select(t => MapToResponseDto(t, t.Student, t.AssignedByUser?.FullName)).ToList();
        return ApiResponse<List<StudentTaskResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<StudentTaskResponseDto>> GetTaskByIdAsync(
        Guid taskId, 
        CancellationToken ct = default)
    {
        var task = await _context.StudentTasks
            .Include(t => t.Student).ThenInclude(s => s.User)
            .Include(t => t.AssignedByUser)
            .FirstOrDefaultAsync(t => t.Id == taskId, ct);

        if (task == null)
            throw new NotFoundException(nameof(StudentTask), taskId);

        return ApiResponse<StudentTaskResponseDto>.SuccessResult(
            MapToResponseDto(task, task.Student, task.AssignedByUser?.FullName));
    }

    private static StudentTaskResponseDto MapToResponseDto(
        StudentTask t, 
        IskurOtomasyonu.Domain.Entities.Academic.Student student, 
        string? assignedByName = null)
    {
        return new StudentTaskResponseDto
        {
            Id = t.Id,
            StudentId = t.StudentId,
            StudentFullName = student.User?.FullName ?? string.Empty,
            StudentNumber = student.StudentNumber,
            AssignedByUserId = t.AssignedByUserId,
            AssignedByName = assignedByName ?? t.AssignedByUser?.FullName ?? string.Empty,
            Title = t.Title,
            Description = t.Description,
            DueDate = t.DueDate,
            Status = t.Status,
            CompletedAt = t.CompletedAt,
            StudentSubmissionNote = t.StudentSubmissionNote,
            AdvisorEvaluationNote = t.AdvisorEvaluationNote,
            AdvisorScore = t.AdvisorScore,
            CreatedAt = t.CreatedAt
        };
    }
}
