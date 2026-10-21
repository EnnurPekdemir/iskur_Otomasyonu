using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Attendance;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface IAttendanceService
{
    Task<ApiResponse<QrSessionResponseDto>> CreateQrSessionAsync(CreateQrSessionDto request, CancellationToken ct = default);
    Task<ApiResponse<AttendanceResponseDto>> CheckInWithQrAsync(QrCheckInRequestDto request, CancellationToken ct = default);
    Task<ApiResponse<AttendanceResponseDto>> CheckOutAsync(Guid attendanceId, CancellationToken ct = default);
    Task<ApiResponse<AttendanceResponseDto>> ManualAttendanceAsync(ManualAttendanceDto request, CancellationToken ct = default);
    Task<ApiResponse<List<AttendanceResponseDto>>> GetStudentAttendancesAsync(Guid studentId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken ct = default);
    Task<ApiResponse<List<AttendanceResponseDto>>> GetTodayAttendancesAsync(Guid? unitId = null, CancellationToken ct = default);
}
