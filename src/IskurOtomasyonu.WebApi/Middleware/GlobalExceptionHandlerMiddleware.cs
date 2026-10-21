using System.Net;
using System.Text.Json;
using IskurOtomasyonu.Application.Common.Exceptions;
using IskurOtomasyonu.Application.Common.Models;

namespace IskurOtomasyonu.WebApi.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İşlem sırasında yakalanmamış bir hata oluştu: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            ValidationException valEx => (
                (int)HttpStatusCode.BadRequest,
                valEx.Message,
                valEx.Errors.SelectMany(e => e.Value).ToList()
            ),
            BusinessRuleException bizEx => (
                (int)HttpStatusCode.BadRequest,
                bizEx.Message,
                new List<string> { bizEx.Message }
            ),
            NotFoundException notFoundEx => (
                (int)HttpStatusCode.NotFound,
                notFoundEx.Message,
                new List<string> { notFoundEx.Message }
            ),
            UnauthorizedException unauthEx => (
                (int)HttpStatusCode.Forbidden,
                unauthEx.Message,
                new List<string> { unauthEx.Message }
            ),
            _ => (
                (int)HttpStatusCode.InternalServerError,
                "Sunucu tarafında beklenmeyen bir hata oluştu.",
                new List<string> { exception.Message }
            )
        };

        context.Response.StatusCode = statusCode;

        var response = ApiResponse<object>.FailureResult(message, errors, statusCode);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
