using IskurOtomasyonu.Application.DTOs.Report;

namespace IskurOtomasyonu.Application.Interfaces.Services;

public interface IExportService
{
    /// <summary>
    /// Puantaj dökümünü resmi fakülte formatında biçimlendirilmiş bir .xlsx (Excel) dosyasına dönüştürür.
    /// </summary>
    byte[] ExportPayrollToExcel(List<MonthlyPayrollItemDto> data, int year, int month);

    /// <summary>
    /// Puantaj verisini UTF-8 (BOM'lu) CSV akışına dönüştürür.
    /// </summary>
    byte[] ExportPayrollToCsv(List<MonthlyPayrollItemDto> data);

    /// <summary>
    /// Risk ve devamsızlık uyarı raporunu biçimlendirilmiş bir .xlsx (Excel) dosyasına dönüştürür.
    /// </summary>
    byte[] ExportRiskReportToExcel(List<StudentRiskReportDto> data);
}
