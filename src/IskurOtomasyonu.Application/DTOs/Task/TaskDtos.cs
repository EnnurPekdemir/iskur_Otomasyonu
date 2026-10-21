using System.ComponentModel.DataAnnotations;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.Application.DTOs.Task;

public class CreateStudentTaskDto
{
    [Required(ErrorMessage = "Öğrenci seçimi zorunludur.")]
    public Guid StudentId { get; set; }

    [Required(ErrorMessage = "Görev başlığı zorunludur.")]
    [MaxLength(200, ErrorMessage = "Görev başlığı en fazla 200 karakter olabilir.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Görev açıklaması zorunludur.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Teslim/Hedef tarihi zorunludur.")]
    public DateTime DueDate { get; set; }
}

public class UpdateTaskStatusDto
{
    [Required]
    public StudentTaskStatus Status { get; set; } // InProgress, Completed

    public string? StudentSubmissionNote { get; set; }
}

public class EvaluateTaskDto
{
    [Required(ErrorMessage = "Danışman değerlendirme notu zorunludur.")]
    public string AdvisorEvaluationNote { get; set; } = string.Empty;

    [Range(0, 100, ErrorMessage = "Puan 0 ile 100 arasında olmalıdır.")]
    public int? AdvisorScore { get; set; }
}

public class StudentTaskResponseDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public Guid AssignedByUserId { get; set; }
    public string AssignedByName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public StudentTaskStatus Status { get; set; }
    public string StatusDescription => Status.ToString();
    public DateTime? CompletedAt { get; set; }
    public string? StudentSubmissionNote { get; set; }
    public string? AdvisorEvaluationNote { get; set; }
    public int? AdvisorScore { get; set; }
    public DateTime CreatedAt { get; set; }
}
