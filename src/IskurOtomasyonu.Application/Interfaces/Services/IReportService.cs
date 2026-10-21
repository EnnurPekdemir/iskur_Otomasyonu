using IskurOtomasyonu.Application.Common.Models;
using IskurOtomasyonu.Application.DTOs.Report;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface IReportService
{
    /// <summary>
    /// Ay, Yıl, Bölüm, Danışman, Birim ve Öğrenci bazında filtrelenmiş ay sonu resmi puantaj dökümünü hesaplar.
    /// </summary>
    Task<ApiResponse<List<MonthlyPayrollItemDto>>> GetMonthlyPayrollSummaryAsync(
        MonthlyPayrollReportFilterDto filter, 
        CancellationToken ct = default);

    /// <summary>
    /// İzin sınırına yaklaşan (>7 gün), sınırı aşan veya devamsızlık riski taşıyan öğrencilerin risk raporunu oluşturur.
    /// </summary>
    Task<ApiResponse<List<StudentRiskReportDto>>> GetRiskWarningsAsync(
        RiskWarningFilterDto filter, 
        CancellationToken ct = default);
}
