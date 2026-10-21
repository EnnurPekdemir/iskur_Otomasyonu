# Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu - Backend & Veritabanı Mimarisi

Bu proje, **Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu** sistemi için modern, kurumsal standartlara ve **KVKK** güvenlik gereksinimlerine uygun olarak tasarlanmış **Entity Framework Core (Code-First)** ilişkisel veri mimarisidir.

---

## 🏛️ Mimari Katmanlar ve Proje Yapısı

```
İşkur_Otomasyonu/
├── src/
│   ├── IskurOtomasyonu.Domain/           # Çekirdek Domain Katmanı (İş kuralları & Entity'ler)
│   │   ├── Common/                       # BaseEntity, ISoftDeletable, IAuditableEntity
│   │   ├── Enums/                        # UserRoleType, Statuses, LeaveTypes vb.
│   │   └── Entities/
│   │       ├── Academic/                 # Student, Department, Unit
│   │       ├── Assignments/              # StudentAdvisorAssignment, StudentUnitAssignment (Tarihçe/Snapshot)
│   │       ├── Configuration/            # SystemSetting
│   │       ├── Identity/                 # ApplicationUser, ApplicationRole (Guid PK)
│   │       ├── Tracking/                 # MonthlyPlan, PlanDay, QrSession, Attendance
│   │       └── Workflow/                 # LeaveRequest, StudentTask
│   │
│   └── IskurOtomasyonu.Infrastructure/   # Veri ve Güvenlik Altyapısı
│       ├── Data/
│       │   ├── ApplicationDbContext.cs   # Ana EF Core DbContext (IdentityDbContext<Guid>)
│       │   ├── ApplicationDbContextFactory.cs # EF CLI Migration Fabrikası
│       │   └── Configurations/           # IEntityTypeConfiguration sınıfları (Fluent API)
│       ├── Security/                     # KVKK AES-256 Şifreleme & EF Core ValueConverter
│       └── Migrations/                   # Başarıyla test edilmiş ilk EF Core Migration
└── IskurOtomasyonu.sln
```

---

## 🔑 Temel İş Kuralları ve Çözüm Yaklaşımları

### 1. Rol ve Kullanıcı Yapısı (ASP.NET Core Identity)
- `IdentityUser<Guid>` genişletilerek `ApplicationUser` oluşturulmuştur.
- 4 temel rol tanımlanmış ve sisteme tohumlanmıştır (Seeded):
  - **Dekanlik**: Fakülte genel yönetimi ve onay mercii.
  - **BolumBaskani**: Akademik bölüm yönetimi ve koordinasyon.
  - **Danisman**: Öğrencinin birebir akademik/İŞKUR sorumlusu.
  - **Ogrenci**: İŞKUR programında yer alan bursiyer öğrenci.

### 2. KVKK ve Hassas Veri Güvenliği
- **Şifreli Saklama**: Öğrencilerin TC Kimlik No ve IBAN alanları veritabanında asla düz metin (plain text) olarak saklanmaz. `EncryptedTcNo` ve `EncryptedIban` olarak AES-256 ile şifrelenir.
- **Şifreli Arama / Tekillik (Blind Indexing)**: TCKN için deterministik SHA-256 özeti tutan `TcNoHash` kolonu tanımlanmış ve üzerinde **Unique Index** oluşturulmuştur. Bu sayede veritabanındaki tüm satırların şifresini çözmeye gerek kalmadan O(1) maliyetle tekil arama yapılabilir.

### 3. Geçmişin Korunması ve Snapshot Mantığı
- **Danışman ve Birim Değişiklikleri**: Öğrencinin danışman ya da birim değişikliklerinde öğrenci tablosundaki veriler ezilmez.
  - `StudentAdvisorAssignment`: Öğrencinin geçmişten günümüze danışman atama tarihçesi (`StartDate`, `EndDate`, `IsActive`).
  - `StudentUnitAssignment`: Öğrencinin geçmişten günümüze birim görevlendirme tarihçesi (`StartDate`, `EndDate`, `IsActive`).
- **Aylık Çalışma Planı Bağımsızlığı**: Her ayın çalışma planı (`MonthlyPlan` -> `PlanDay`), fiili devam kayıtları (`Attendance`) ve izinler (`LeaveRequest`) bağımsız tutulur; geçmiş ayların verileri kesinlikle üzerine yazılmaz.

### 4. Global Mantıksal Silme (Soft-Delete) ve Denetim İzi (Audit)
- Tüm varlıklar `BaseEntity` sınıfından türer: `Id`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsDeleted`, `DeletedAt`, `DeletedBy`.
- `ApplicationDbContext.OnModelCreating` içerisinde `ISoftDeletable` arayüzünü uygulayan tüm varlıklara otomatik olarak `HasQueryFilter(e => !e.IsDeleted)` uygulanır.
- `SaveChangesAsync` override edilerek silinen kayıtlar fiziksel olarak silinmek yerine otomatik olarak `IsDeleted = true` yapılır; ekleme ve güncelleme zamanları UTC olarak damgalanır.

### 5. 30 Saniyelik Dinamik Karekod (QR) ve Devam Takibi
- `QrSession`: Danışman/Birim yetkilisi tarafından başlatılan, 30 saniyelik geçerlilik süresine sahip dinamik karekod oturumlarını tutar (`TokenHash`, `ExpiresAt`, `IsActive`).
- `Attendance`: Öğrencinin tarama sonucu planlanan güne ait fiili devam kaydıdır (`StudentId`, `PlanDayId`, `CheckInTime`, `CheckOutTime`, `ActualHoursWorked`, `VerificationStatus`, `DeviceSignature`, `IpAddress`).
- Öğrencinin aynı gün için mükerrer devam kaydı açmasını engellemek üzere `(StudentId, PlanDayId)` üzerinde **Composite Unique Index** uygulanmıştır.

### 6. Parametrik İzin ve Sistem Ayarları
- `SystemSetting`: Dinamik parametreleri (`Key`, `Value`, `Description`, `Group`) tutar.
  - `MAX_ANNUAL_LEAVE_DAYS = "10"`
  - `QR_EXPIRATION_SECONDS = "30"`
  - `DAILY_MAX_WORKING_HOURS = "5"`
  - `MONTHLY_MAX_WORKING_HOURS = "60"`
  - `ATTENDANCE_TOLERANCE_MINUTES = "15"`
- `LeaveRequest`: Başlangıç/bitiş tarihleri, gün sayısı, tür (`Mazeret`, `Rapor` vb.), durum (`Pending`, `Approved`, `Rejected`), onaylayan kullanıcı ve karar tarihini izler.

### 7. Görev ve Değerlendirme
- `StudentTask`: Danışmanın öğrenciye atadığı işler (`Title`, `Description`, `DueDate`, `Status`, `AdvisorEvaluationNote`, `AdvisorScore`, `CompletedAt`).

### 8. İlişkisel Bütünlük ve Silme Davranışı (DeleteBehavior.Restrict)
- MSSQL üzerindeki olası döngüsel silme (Cycle / Multiple Cascade Paths, Error 1785) problemlerini engellemek için kritik tablolarda `DeleteBehavior.Restrict` uygulanmıştır.
