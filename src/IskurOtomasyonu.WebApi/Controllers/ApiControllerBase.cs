using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;

namespace IskurOtomasyonu.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult<ApiResponse<T>> HandleResult<T>(ApiResponse<T> result)
    {
        return StatusCode(result.StatusCode, result);
    }

    protected ActionResult<ApiResponse> HandleResult(ApiResponse result)
    {
        return StatusCode(result.StatusCode, result);
    }
}
