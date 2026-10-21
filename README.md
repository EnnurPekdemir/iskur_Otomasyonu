# Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu - Backend & API Mimarisi

Bu proje, **Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu** sistemi için modern, kurumsal standartlara ve **KVKK** güvenlik gereksinimlerine uygun olarak tasarlanmış **ASP.NET Core 9 Web API** ve **Entity Framework Core (Code-First)** ilişkisel veri ve servis mimarisidir.

---

## 🏛️ Mimari Katmanlar ve Proje Yapısı (Clean Architecture)

```
İşkur_Otomasyonu/
├── src/
│   ├── IskurOtomasyonu.Domain/           # 1. Çekirdek Domain Katmanı
│   │   ├── Common/                       # BaseEntity, ISoftDeletable, IAuditableEntity
│   │   ├── Enums/                        # UserRoleType, Statuses, LeaveTypes, Shifts
│   │   └── Entities/
│   │       ├── Academic/                 # Student, Department, Unit
│   │       ├── Assignments/              # StudentAdvisorAssignment, StudentUnitAssignment (Tarihçe/Snapshot)
│   │       ├── Configuration/            # SystemSetting
│   │       ├── Identity/                 # ApplicationUser, ApplicationRole (Guid PK)
│   │       ├── Tracking/                 # MonthlyPlan, PlanDay, QrSession, Attendance
│   │       └── Workflow/                 # LeaveRequest, StudentTask
│   │
│   ├── IskurOtomasyonu.Application/      # 2. Uygulama & İş Mantığı Katmanı
│   │   ├── Common/                       # IApplicationDbContext, ICurrentUserService, ApiResponse, Exceptions
│   │   ├── DTOs/                         # Auth, Plan, Attendance, Leave, Task DTO'ları
│   │   ├── Interfaces/Services/          # IAuthService, IPlanService, IAttendanceService, ILeaveService, ITaskService
│   │   └── Services/                     # İş kuralları, validasyonlar ve servis implementasyonları
│   │
│   ├── IskurOtomasyonu.Infrastructure/   # 3. Veri, Güvenlik ve Altyapı Katmanı
│   │   ├── Data/                         # ApplicationDbContext, DbContextFactory, Fluent API Configurations
│   │   ├── Security/                     # AES-256 Şifreleme, ValueConverter, JwtTokenGenerator
│   │   ├── Services/                     # CurrentUserService (IHttpContextAccessor)
│   │   └── Migrations/                   # EF Core Code-First Migration Dosyaları
│   │
│   └── IskurOtomasyonu.WebApi/           # 4. REST API Sunum Katmanı
│       ├── Controllers/                  # Auth, Plan, Attendance, Leave, Task Controller'ları
│       ├── Middleware/                   # GlobalExceptionHandlerMiddleware
│       ├── appsettings.json              # JWT ve MSSQL Yapılandırması
│       └── Program.cs                    # Pipeline, CORS, Swagger ve Bağımlılık Enjeksiyonu
└── IskurOtomasyonu.sln
```

---

## 🔑 Modüller ve İş Mantığı Kuralları

### 1. Güvenlik, Kimlik Doğrulama & KVKK (Auth & Security)
- **JWT Bearer Auth**: `Login`, `RegisterStudent`, `RefreshToken` uç noktaları. Rol claim'leri ve 120 dakikalık erişim süresi.
- **KVKK AES-256 Şifreleme**: Öğrenci TCKN ve IBAN verileri veritabanında asla düz metin tutulmaz.
- **Blind Indexing**: Arama ve tekil indeksleme için deterministik SHA-256 özeti tutan `TcNoHash` kolonu kullanılır.
- **Rol Yetkilendirme**: `Dekanlik`, `BolumBaskani`, `Danisman`, `Ogrenci` rolleri üzerinden `[Authorize(Roles = ...)]` filtreleri.

### 2. Çalışma Planı Motoru (PlanService)
- **Haftalık 1-3 Gün Kuralı**: Öğrenci aynı takvim haftası içine 4. bir çalışma günü ekleyemez (`ValidationException`).
- **Resmî Tatil & Hafta Sonu Koruması**: Hafta sonu günleri veya Türkiye resmî tatil günleri (Yılbaşı, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim) çalışma günü olarak seçilemez.
- **Vardiya Seçenekleri**:
  - `Morning`: 09:00 - 13:00 (4 Saat)
  - `Afternoon`: 13:00 - 17:00 (4 Saat)
  - `Full`: 09:00 - 14:00 (5 Saat - İŞKUR Günlük Max Kuralı)
- **Durum Akışı**: `Draft` (Taslak) ➔ `Submitted` (Danışman Onayında) ➔ `Approved` / `Rejected` (Onaylandı / Reddedildi).

### 3. Dinamik Karekod ve Devam Takip Motoru (AttendanceService)
- **30 Saniyelik Dinamik QR**: Yetkili (Danışman/Sekreterlik) ekranında her 30 saniyede bir kriptografik hash'e (`TokenHash`) sahip tek kullanımlık QR oturumu üretilir.
- **Check-in Doğrulama Kuralları**:
  1. *QR Süresi*: 30 saniyeyi aşmış karekodlar anında reddedilir.
  2. *Plan Uyumu*: Öğrencinin o gün için onaylanmış bir çalışma planı (`MonthlyPlanStatus.Approved`) yoksa devam alınamaz.
  3. *Mükerrerlik*: Aynı planlanan gün için mükerrer giriş engellenir (`Unique Index`).
  4. *Otomatik Tamamlama*: Başarılı check-in ile devam kaydı oluşur ve ilgili günün durumu `Completed` yapılır.
- **Check-out**: Öğrencinin çıkış saati ve net çalıştığı süre kaydedilir.

### 4. İzin Yönetimi ve Bakiye Takip (LeaveService)
- **Parametrik İzin Sınırı**: Sistem ayarlarından (`MAX_ANNUAL_LEAVE_DAYS = "10"`) okunur.
- **Bakiye Hesaplama**: `Kalan Hak = Toplam Hak - Onaylanan İzin Günleri`.
- **Uyarı Bayrağı (`HasLeaveWarning`)**: Kalan gün sayısı 2 veya daha az olduğunda sistem arayüzü ve yanıtlarında otomatik uyarı bayrağı tetiklenir.
- **Kota Denetimi**: Kalan izinden fazla izin talep edilmesi engellenir.

### 5. Görev ve Değerlendirme (TaskService)
- Danışmanlar öğrencilere hedef teslim tarihi (`DueDate`) belirterek görev atayabilir.
- Öğrenci görev durumunu güncelleyebilir (`InProgress`, `Completed`) ve teslim notu ekleyebilir.
- Danışman değerlendirme notu ve puanı (0-100) girebilir; tüm süreç tarihçeli olarak saklanır.

---

## 📡 REST API Uç Noktaları (Endpoints)

| Modül | Metot | Endpoint | Rol / Yetki | Açıklama |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Anonymous | Kullanıcı adı/e-posta ve şifreyle giriş |
| **Auth** | `POST` | `/api/auth/register-student` | Anonymous | Yeni İŞKUR öğrencisi kaydı (KVKK şifreli) |
| **Auth** | `POST` | `/api/auth/refresh-token` | Anonymous | JWT erişim anahtarını yenileme |
| **Auth** | `GET` | `/api/auth/me` | Authorize | Oturum açmış kullanıcının kimlik ve rol özeti |
| **Plan** | `POST` | `/api/plan` | Ogrenci | Aylık çalışma planı taslağı oluşturma/güncelleme |
| **Plan** | `POST` | `/api/plan/{id}/submit` | Ogrenci | Planı danışman onayına sunma |
| **Plan** | `POST` | `/api/plan/{id}/evaluate` | Danisman, BolumBaskani, Dekanlik | Planı onaylama / gerekçeli reddetme |
| **Plan** | `GET` | `/api/plan/{id}` | Authorize | Plan detayları ve günleri |
| **Plan** | `GET` | `/api/plan/student/{studentId}/{year}/{month}` | Authorize | Öğrencinin dönemlik planı |
| **Plan** | `GET` | `/api/plan/pending` | Danisman, BolumBaskani, Dekanlik | Onay bekleyen planlar listesi |
| **Attendance** | `POST` | `/api/attendance/qr-session` | Danisman, Dekanlik, BolumBaskani | 30 sn'lik dinamik QR oturumu oluşturma |
| **Attendance** | `POST` | `/api/attendance/check-in` | Ogrenci | 30 sn'lik QR okutarak devam kaydı oluşturma |
| **Attendance** | `POST` | `/api/attendance/{id}/check-out` | Ogrenci | Mesai bitişi çıkış kaydı |
| **Attendance** | `POST` | `/api/attendance/manual` | Danisman, Dekanlik | Manuel devam onaylama |
| **Attendance** | `GET` | `/api/attendance/student/{studentId}` | Authorize | Öğrencinin devam geçmişi |
| **Attendance** | `GET` | `/api/attendance/today` | Danisman, Dekanlik, BolumBaskani | Bugünün gerçekleşen devam kayıtları |
| **Leave** | `POST` | `/api/leave` | Ogrenci | İzin talebi oluşturma |
| **Leave** | `POST` | `/api/leave/{id}/evaluate` | Danisman, Dekanlik | İzin onaylama / reddetme |
| **Leave** | `GET` | `/api/leave/balance/{studentId}` | Authorize | Kalan izin ve `HasLeaveWarning` kontrolü |
| **Leave** | `GET` | `/api/leave/pending` | Danisman, Dekanlik | Onay bekleyen izin talepleri |
| **Task** | `POST` | `/api/task` | Danisman, BolumBaskani, Dekanlik | Öğrenciye görev atama |
| **Task** | `PUT` | `/api/task/{id}/status` | Ogrenci | Görev durumunu güncelleme ve teslim notu |
| **Task** | `POST` | `/api/task/{id}/evaluate` | Danisman, BolumBaskani, Dekanlik | Göreve danışman değerlendirme notu ve puanı |
| **Task** | `GET` | `/api/task/student/{studentId}` | Authorize | Öğrencinin görev listesi |
