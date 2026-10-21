using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Report;
using IskurOtomasyonu.Application.Interfaces.Services;
using IskurOtomasyonu.Domain.Enums;

namespace IskurOtomasyonu.WebApi.Controllers;

[Authorize(Roles = $"{AppRoles.Dekanlik},{AppRoles.BolumBaskani}")]
public class ReportController : ApiControllerBase
{
    private readonly IReportService _reportService;
    private readonly IExportService _exportService;

    public ReportController(IReportService reportService, IExportService exportService)
    {
        _reportService = reportService;
        _exportService = exportService;
    }

    /// <summary>
    /// Ekran tablosunda görüntülemek için dinamik filtrelenebilir ay sonu resmi puantaj verisini JSON olarak döner.
    /// Bölüm Başkanı yalnızca kendi bölümünün öğrencilerini görebilir.
    /// </summary>
    [HttpGet("monthly-summary")]
    [ProducesResponseType(typeof(ApiResponse<List<MonthlyPayrollItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<MonthlyPayrollItemDto>>>> GetMonthlySummary(
        [FromQuery] MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct)
    {
        var result = await _reportService.GetMonthlyPayrollSummaryAsync(filter, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Filtre parametrelerine göre resmi fakülte formatında biçimlendirilmiş ay sonu puantaj .xlsx (Excel) dosyasını indirir.
    /// </summary>
    [HttpGet("monthly-summary/export-excel")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportMonthlySummaryExcel(
        [FromQuery] MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct)
    {
        var result = await _reportService.GetMonthlyPayrollSummaryAsync(filter, ct);
        var bytes = _exportService.ExportPayrollToExcel(result.Data ?? new(), filter.Year, filter.Month);

        var fileName = $"Iskur_Puantaj_{filter.Year}_{filter.Month:D2}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>
    /// Hafif ve hızlı dışa aktarım için puantaj verisini UTF-8 (BOM'lu) CSV dosyası olarak indirir.
    /// </summary>
    [HttpGet("monthly-summary/export-csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportMonthlySummaryCsv(
        [FromQuery] MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct)
    {
        var result = await _reportService.GetMonthlyPayrollSummaryAsync(filter, ct);
        var bytes = _exportService.ExportPayrollToCsv(result.Data ?? new());

        var fileName = $"Iskur_Puantaj_{filter.Year}_{filter.Month:D2}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    /// <summary>
    /// İzin sınırına yaklaşan (>7 gün), kotayı aşan veya devamsızlık riski taşıyan öğrencilerin risk değerlendirme listesini döner.
    /// </summary>
    [HttpGet("risk-warnings")]
    [ProducesResponseType(typeof(ApiResponse<List<StudentRiskReportDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<StudentRiskReportDto>>>> GetRiskWarnings(
        [FromQuery] RiskWarningFilterDto filter, 
        CancellationToken ct)
    {
        var result = await _reportService.GetRiskWarningsAsync(filter, ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Risk ve devamsızlık uyarı raporunu renk kodlu .xlsx (Excel) dosyası olarak indirir.
    /// </summary>
    [HttpGet("risk-warnings/export-excel")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportRiskWarningsExcel(
        [FromQuery] RiskWarningFilterDto filter, 
        CancellationToken ct)
    {
        var result = await _reportService.GetRiskWarningsAsync(filter, ct);
        var bytes = _exportService.ExportRiskReportToExcel(result.Data ?? new());

        var fileName = $"Iskur_Risk_Raporu_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
