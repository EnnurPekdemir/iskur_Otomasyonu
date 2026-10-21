namespace IskurOtomasyonu.Application.Common.Models;

/// <summary>
/// Tüm API yanıtları için standart sonuç sarmalayıcısı (Result Wrapper).
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();
    public int StatusCode { get; set; } = 200;

    public static ApiResponse<T> SuccessResult(T data, string message = "İşlem başarıyla tamamlandı.", int statusCode = 200)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            StatusCode = statusCode
        };
    }

    public static ApiResponse<T> FailureResult(string message, List<string>? errors = null, int statusCode = 400)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Data = default,
            Errors = errors ?? new List<string>(),
            StatusCode = statusCode
        };
    }
}

/// <summary>
/// Veri içermeyen genel operasyon yanıtları için yardımcı sınıf.
/// </summary>
public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse SuccessResult(string message = "İşlem başarıyla tamamlandı.", int statusCode = 200)
    {
        return new ApiResponse
        {
            Success = true,
            Message = message,
            StatusCode = statusCode
        };
    }

    public static new ApiResponse FailureResult(string message, List<string>? errors = null, int statusCode = 400)
    {
        return new ApiResponse
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>(),
            StatusCode = statusCode
        };
    }
}
