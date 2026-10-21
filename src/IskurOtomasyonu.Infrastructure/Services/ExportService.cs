using System.Text;
using ClosedXML.Excel;
using IskurOtomasyonu.Application.DTOs.Report;
using IskurOtomasyonu.Application.Interfaces.Services;

namespace IskurOtomasyonu.Infrastructure.Services;

public class ExportService : IExportService
{
    public byte[] ExportPayrollToExcel(List<MonthlyPayrollItemDto> data, int year, int month)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add($"Puantaj_{year}_{month}");

        // Görünüm Ayarları
        worksheet.ShowGridLines = true;
        worksheet.PageSetup.PageOrientation = XLPageOrientation.Landscape;

        // 1. Kurumsal Başlık Alanı
        worksheet.Range("A1:L1").Merge().Value = "T.C. TEKNOLOJİ FAKÜLTESİ DEKANLIĞI";
        worksheet.Range("A1:L1").Style.Font.SetBold().Font.SetFontSize(14).Font.SetFontColor(XLColor.FromHtml("#1B365D"));
        worksheet.Range("A1:L1").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        worksheet.Range("A2:L2").Merge().Value = "İŞKUR ÖĞRENCİ AYLIK RESMİ PUANTAJ VE HAK EDİŞ LİSTESİ";
        worksheet.Range("A2:L2").Style.Font.SetBold().Font.SetFontSize(12).Font.SetFontColor(XLColor.FromHtml("#2C3E50"));
        worksheet.Range("A2:L2").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        worksheet.Range("A3:L3").Merge().Value = $"Dönem: {month:D2}/{year} | Rapor Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm} | Toplam Öğrenci: {data.Count}";
        worksheet.Range("A3:L3").Style.Font.SetItalic().Font.SetFontSize(10).Font.SetFontColor(XLColor.Gray);
        worksheet.Range("A3:L3").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        // 2. Tablo Başlıkları (Row 5)
        int headerRow = 5;
        string[] headers =
        {
            "Sıra",
            "T.C. Kimlik No",
            "Öğrenci No",
            "Adı Soyadı",
            "Bölümü",
            "Görev Birimi",
            "Danışman",
            "Planlanan Gün",
            "Gerçekleşen Gün",
            "Toplam Saat",
            "İzinli Gün",
            "IBAN"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#1B365D")); // Fakülte Laciverti
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            cell.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            cell.Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            cell.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#0E1D33"));
        }
        worksheet.Row(headerRow).Height = 28;

        // 3. Veri Satırları
        int currentRow = headerRow + 1;
        int rowNumber = 1;

        foreach (var item in data)
        {
            worksheet.Cell(currentRow, 1).SetValue(rowNumber);
            worksheet.Cell(currentRow, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            // TCKN metin formatında (baştaki sıfırlar kaybolmasın)
            worksheet.Cell(currentRow, 2).SetValue($"'{item.TcNo}");
            worksheet.Cell(currentRow, 2).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            // Öğrenci No metin formatında
            worksheet.Cell(currentRow, 3).SetValue($"'{item.StudentNumber}");
            worksheet.Cell(currentRow, 3).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            worksheet.Cell(currentRow, 4).SetValue(item.FullName);
            worksheet.Cell(currentRow, 5).SetValue(item.DepartmentName);
            worksheet.Cell(currentRow, 6).SetValue(item.UnitName);
            worksheet.Cell(currentRow, 7).SetValue(item.AdvisorName);

            worksheet.Cell(currentRow, 8).SetValue(item.PlannedDaysCount);
            worksheet.Cell(currentRow, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(currentRow, 9).SetValue(item.ActualDaysCount);
            worksheet.Cell(currentRow, 9).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(currentRow, 10).SetValue((double)item.TotalHoursWorked);
            worksheet.Cell(currentRow, 10).Style.NumberFormat.Format = "#,##0.00";
            worksheet.Cell(currentRow, 10).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(currentRow, 11).SetValue(item.ApprovedLeaveDays);
            worksheet.Cell(currentRow, 11).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            // IBAN
            worksheet.Cell(currentRow, 12).SetValue($"'{item.Iban}");
            worksheet.Cell(currentRow, 12).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            // Çizgiler ve Alternatif Satır Rengi
            var rowRange = worksheet.Range(currentRow, 1, currentRow, 12);
            rowRange.Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            rowRange.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#E0E0E0"));
            rowRange.Style.Border.SetInsideBorder(XLBorderStyleValues.Thin);
            rowRange.Style.Border.SetInsideBorderColor(XLColor.FromHtml("#E0E0E0"));

            if (rowNumber % 2 == 0)
            {
                rowRange.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F8F9FA"));
            }

            currentRow++;
            rowNumber++;
        }

        // 4. Genel Toplam Satırı
        if (data.Any())
        {
            var summaryRow = currentRow;
            worksheet.Range(summaryRow, 1, summaryRow, 7).Merge().Value = "GENEL TOPLAM";
            worksheet.Range(summaryRow, 1, summaryRow, 7).Style.Font.SetBold();
            worksheet.Range(summaryRow, 1, summaryRow, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            // Planlanan Gün Toplamı
            worksheet.Cell(summaryRow, 8).FormulaA1 = $"SUM(H{headerRow + 1}:H{summaryRow - 1})";
            worksheet.Cell(summaryRow, 8).Style.Font.SetBold();
            worksheet.Cell(summaryRow, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            // Gerçekleşen Gün Toplamı
            worksheet.Cell(summaryRow, 9).FormulaA1 = $"SUM(I{headerRow + 1}:I{summaryRow - 1})";
            worksheet.Cell(summaryRow, 9).Style.Font.SetBold();
            worksheet.Cell(summaryRow, 9).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            // Toplam Saat
            worksheet.Cell(summaryRow, 10).FormulaA1 = $"SUM(J{headerRow + 1}:J{summaryRow - 1})";
            worksheet.Cell(summaryRow, 10).Style.Font.SetBold();
            worksheet.Cell(summaryRow, 10).Style.NumberFormat.Format = "#,##0.00";
            worksheet.Cell(summaryRow, 10).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            // İzinli Gün Toplamı
            worksheet.Cell(summaryRow, 11).FormulaA1 = $"SUM(K{headerRow + 1}:K{summaryRow - 1})";
            worksheet.Cell(summaryRow, 11).Style.Font.SetBold();
            worksheet.Cell(summaryRow, 11).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Right);

            worksheet.Cell(summaryRow, 12).Value = "-";
            worksheet.Cell(summaryRow, 12).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            var sumRange = worksheet.Range(summaryRow, 1, summaryRow, 12);
            sumRange.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#E8EEF5"));
            sumRange.Style.Border.SetTopBorder(XLBorderStyleValues.Thin);
            sumRange.Style.Border.SetBottomBorder(XLBorderStyleValues.Double);
        }

        // 5. Sütun Genişliklerini Otomatik Ayarla
        worksheet.Columns().AdjustToContents();
        worksheet.Column(1).Width = 6;   // Sıra
        worksheet.Column(2).Width = 14;  // TCKN
        worksheet.Column(3).Width = 14;  // Öğrenci No
        worksheet.Column(12).Width = 30; // IBAN

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public byte[] ExportPayrollToCsv(List<MonthlyPayrollItemDto> data)
    {
        var sb = new StringBuilder();

        // Başlıklar (Noktalı virgül ile ayrılmış, Türkçe Excel uyumlu)
        sb.AppendLine("Sıra;TC Kimlik No;Öğrenci No;Ad Soyad;Bölüm;Görev Birimi;Danışman;Yıl;Ay;Planlanan Gün;Gerçekleşen Gün;Toplam Saat;İzinli Gün;IBAN");

        int index = 1;
        foreach (var item in data)
        {
            var line = $"{index};" +
                       $"\"{item.TcNo}\";" +
                       $"\"{item.StudentNumber}\";" +
                       $"\"{item.FullName.Replace("\"", "\"\"")}\";" +
                       $"\"{item.DepartmentName.Replace("\"", "\"\"")}\";" +
                       $"\"{item.UnitName.Replace("\"", "\"\"")}\";" +
                       $"\"{item.AdvisorName.Replace("\"", "\"\"")}\";" +
                       $"{item.Year};" +
                       $"{item.Month};" +
                       $"{item.PlannedDaysCount};" +
                       $"{item.ActualDaysCount};" +
                       $"{item.TotalHoursWorked:F2};" +
                       $"{item.ApprovedLeaveDays};" +
                       $"\"{item.Iban}\"";

            sb.AppendLine(line);
            index++;
        }

        // UTF-8 BOM ekle ki Excel Türkçe karakterleri (ğ, ü, ş, ı, ö, ç) doğru göstersin
        var preamble = Encoding.UTF8.GetPreamble();
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[preamble.Length + bytes.Length];
        Buffer.BlockCopy(preamble, 0, result, 0, preamble.Length);
        Buffer.BlockCopy(bytes, 0, result, preamble.Length, bytes.Length);

        return result;
    }

    public byte[] ExportRiskReportToExcel(List<StudentRiskReportDto> data)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Risk_Uyarilari");

        worksheet.ShowGridLines = true;

        // Başlık
        worksheet.Range("A1:I1").Merge().Value = "T.C. TEKNOLOJİ FAKÜLTESİ - İŞKUR ÖĞRENCİ DEVAM VE İZİN RİSK RAPORU";
        worksheet.Range("A1:I1").Style.Font.SetBold().Font.SetFontSize(13).Font.SetFontColor(XLColor.FromHtml("#8B0000"));
        worksheet.Range("A1:I1").Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        int headerRow = 3;
        string[] headers =
        {
            "Öğrenci No",
            "Adı Soyadı",
            "Bölümü",
            "Danışman",
            "Kullanılan İzin",
            "Kalan İzin",
            "Devamsız Gün",
            "Risk Seviyesi",
            "İdari Öneri"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.SetBold().Font.SetFontColor(XLColor.White);
            cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#8B0000")); // Koyu Kırmızı
            cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }

        int currentRow = headerRow + 1;
        foreach (var item in data)
        {
            worksheet.Cell(currentRow, 1).SetValue($"'{item.StudentNumber}");
            worksheet.Cell(currentRow, 2).SetValue(item.FullName);
            worksheet.Cell(currentRow, 3).SetValue(item.DepartmentName);
            worksheet.Cell(currentRow, 4).SetValue(item.AdvisorName);
            worksheet.Cell(currentRow, 5).SetValue($"{item.UsedLeaveDays} / {item.TotalAnnualEntitlement}");
            worksheet.Cell(currentRow, 6).SetValue(item.RemainingLeaveDays);
            worksheet.Cell(currentRow, 7).SetValue(item.TotalAbsentDays);

            var riskCell = worksheet.Cell(currentRow, 8);
            riskCell.SetValue(item.RiskLevel);
            riskCell.Style.Font.SetBold();
            riskCell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            if (item.RiskLevel == "Kritik")
            {
                riskCell.Style.Font.SetFontColor(XLColor.White);
                riskCell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#D9534F")); // Kırmızı
            }
            else if (item.RiskLevel == "Orta")
            {
                riskCell.Style.Font.SetFontColor(XLColor.Black);
                riskCell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F0AD4E")); // Turuncu
            }

            worksheet.Cell(currentRow, 9).SetValue(item.RecommendedAction);

            var rowRange = worksheet.Range(currentRow, 1, currentRow, 9);
            rowRange.Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin);
            rowRange.Style.Border.SetOutsideBorderColor(XLColor.FromHtml("#E0E0E0"));

            currentRow++;
        }

        worksheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
