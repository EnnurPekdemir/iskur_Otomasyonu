using Microsoft.Extensions.DependencyInjection;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Application.Services;

namespace IskurOtomasyonu.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPlanService, PlanService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<ILeaveService, LeaveService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
