// ============================================================================
// Öğrenci Paneli (Student Dashboard)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class StudentDashboard {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.currentPlan = null;
        this.selectedDays = new Map(); // dateStr -> { date, shiftType, notes }
        this.profile = null;
        this.tasks = [];
        this.attendances = [];
        this.leaves = [];
        this.announcements = [];
        this.html5QrCode = null;
    }

    async init() {
        console.log("StudentDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadAll();
    }

    renderShell() {
        const container = document.getElementById('student-dashboard-view');
        if (!container) return;

        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                <i class="fa-solid fa-user-graduate text-sm"></i>
                            </span>
                            <h1 class="text-xl font-bold tracking-tight text-gray-900">
                                Öğrenci Çalışma & Devam Takip Paneli
                            </h1>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Aylık çalışma planı seçimi, dinamik QR devam takibi, mazeret talebi ve danışman görevleri.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="stu-open-qr-btn" class="btn-primary">
                            <i class="fa-solid fa-qrcode text-xs"></i>
                            <span>Karekod (QR) Tara</span>
                        </button>
                        <button id="stu-refresh-btn" class="btn-secondary">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları (Minimal Gri-Beyaz Kutucuklar) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Toplam Çalışılan Gün -->
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toplam Çalışılan Gün</p>
                            <h3 id="stu-stat-worked-days" class="text-2xl font-bold text-gray-900 mt-0.5">- Gün</h3>
                            <p id="stu-stat-worked-hours" class="text-[11px] text-teal-800 font-medium mt-0.5">- Saat Çalışıldı</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-lg">
                            <i class="fa-solid fa-calendar-check"></i>
                        </div>
                    </div>

                    <!-- İzin Kotası (10 Gün Yasal Sınır) -->
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Kalan İzin Hakkı</p>
                            <h3 id="stu-stat-remaining-leave" class="text-2xl font-bold text-gray-900 mt-0.5">- / 10 Gün</h3>
                            <p id="stu-stat-used-leave" class="text-[11px] text-gray-500 mt-0.5">- Gün Kullanıldı</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-file-signature"></i>
                        </div>
                    </div>

                    <!-- Bugünün Devam Durumu -->
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bugünkü Yoklama</p>
                            <h3 id="stu-stat-today-status" class="text-base font-bold text-gray-900 mt-1">Giriş Yapılmadı</h3>
                            <p id="stu-stat-today-hours" class="text-[11px] text-gray-400 mt-0.5">Giriş: - | Çıkış: -</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-lg">
                            <i class="fa-solid fa-clock"></i>
                        </div>
                    </div>

                    <!-- Atanan Görevler -->
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Danışman Görevleri</p>
                            <h3 id="stu-stat-pending-tasks" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Bekleyen / Tamamlanan</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Student Tabs">
                        <button id="stu-tab-plan-btn" class="stu-tab-btn py-2.5 px-1 border-b-2 border-teal-800 font-semibold text-xs text-teal-900 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>Aylık Çalışma Planı Seçimi</span>
                        </button>
                        <button id="stu-tab-leave-btn" class="stu-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-file-pen"></i>
                            <span>Mazeret Talebi Oluşturma</span>
                        </button>
                        <button id="stu-tab-tasks-btn" class="stu-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-list-check"></i>
                            <span>Danışman Görevleri</span>
                            <span id="stu-tasks-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-800 font-bold">0</span>
                        </button>
                        <button id="stu-tab-announcements-btn" class="stu-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-bullhorn"></i>
                            <span>Genel Duyurular</span>
                        </button>
                        <button id="stu-tab-history-btn" class="stu-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                            <span>Giriş-Çıkış Devam Geçmişi</span>
                        </button>
                    </nav>
                </div>

                <!-- ========================================================= -->
                <!-- 1. PANE: AYLIK ÇALIŞMA PLANI SEÇİMİ -->
                <!-- ========================================================= -->
                <div id="stu-pane-plan" class="space-y-4">
                    <div class="box-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2">
                            <button id="stu-prev-month" class="w-7 h-7 rounded border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600">
                                <i class="fa-solid fa-chevron-left text-[10px]"></i>
                            </button>
                            <span id="stu-month-label" class="font-bold text-gray-900 min-w-[100px] text-center">-</span>
                            <button id="stu-next-month" class="w-7 h-7 rounded border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600">
                                <i class="fa-solid fa-chevron-right text-[10px]"></i>
                            </button>
                            <span id="stu-plan-status" class="badge-minimal badge-neutral ml-2">Taslak</span>
                        </div>

                        <div class="flex items-center gap-2">
                            <button id="stu-save-plan-btn" class="btn-secondary">
                                Taslağı Kaydet
                            </button>
                            <button id="stu-submit-plan-btn" class="btn-primary">
                                Danışman Onayına Gönder
                            </button>
                        </div>
                    </div>

                    <!-- Kural & Çakışma Bilgilendirmesi -->
                    <div class="box-card p-3 bg-gray-50 text-xs flex flex-wrap items-center justify-between gap-2 text-gray-600">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Seçilen Gün</span>
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Boş Gün</span>
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Resmî Tatil / Hafta Sonu</span>
                        </div>
                        <span class="text-gray-500 font-medium">Haftalık en fazla <strong>3 gün</strong> ve günlük en fazla <strong>5 saat</strong> seçilebilir.</span>
                    </div>

                    <!-- Takvim Grid -->
                    <div class="box-card p-4 overflow-hidden">
                        <div class="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-gray-500 mb-2">
                            <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div class="text-rose-500">Cmt</div><div class="text-rose-500">Paz</div>
                        </div>
                        <div id="stu-calendar-grid" class="grid grid-cols-7 gap-1.5">
                            <!-- Günler JS ile doldurulur -->
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. PANE: MAZERET TALEBİ OLUŞTURMA -->
                <!-- ========================================================= -->
                <div id="stu-pane-leave" class="space-y-4 hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Mazeret Formu -->
                        <div class="box-card p-4 md:col-span-1 space-y-3">
                            <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <i class="fa-solid fa-file-pen text-teal-700"></i>
                                <h3 class="font-bold text-xs text-gray-900">Mazeret İzin Formu</h3>
                            </div>
                            <form id="stu-leave-form" class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-semibold text-gray-500 mb-0.5">Ad Soyad</label>
                                    <input type="text" id="stu-leave-fullname" readonly 
                                           class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-not-allowed">
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-500 mb-0.5">Görevli Olduğu Birim</label>
                                    <input type="text" id="stu-leave-unit" readonly 
                                           class="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-0.5">İzin Türü</label>
                                    <select id="stu-leave-type" class="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white">
                                        <option value="Mazeret">Mazeret İzni</option>
                                        <option value="Sağlık">Sağlık Raporlu İzin</option>
                                        <option value="Sınav">Sınav / Akademik İzin</option>
                                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block font-semibold text-gray-600 mb-0.5">Başlangıç Tarihi</label>
                                        <input type="date" id="stu-leave-start" required class="w-full px-2 py-1.5 border border-gray-300 rounded-lg">
                                    </div>
                                    <div>
                                        <label class="block font-semibold text-gray-600 mb-0.5">Bitiş Tarihi</label>
                                        <input type="date" id="stu-leave-end" required class="w-full px-2 py-1.5 border border-gray-300 rounded-lg">
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-0.5">Mazeret Açıklaması</label>
                                    <textarea id="stu-leave-reason" rows="3" required placeholder="Çalışamayacağınız gerekçeyi kısaca açıklayınız..." 
                                              class="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700"></textarea>
                                </div>
                                <div class="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 leading-tight">
                                    <i class="fa-solid fa-circle-info mr-1"></i>
                                    Bu talep doğrudan <strong>Fakülte Sekreteri</strong> ve <strong>Danışmanınıza</strong> iletilecektir.
                                </div>
                                <button type="submit" id="stu-submit-leave-btn" class="w-full btn-primary justify-center">
                                    <i class="fa-solid fa-paper-plane text-xs"></i>
                                    <span>Talebi Sekreterlik ve Danışmana Gönder</span>
                                </button>
                            </form>
                        </div>

                        <!-- Geçmiş İzin Talepleri Tablosu -->
                        <div class="box-card p-4 md:col-span-2 space-y-3">
                            <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                                <h3 class="font-bold text-xs text-gray-900">Geçmiş Mazeret Taleplerim</h3>
                                <span class="text-[11px] text-gray-400">Yıllık yasal hak: 10 gün</span>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="table-minimal text-xs">
                                    <thead>
                                        <tr>
                                            <th>Tür</th>
                                            <th>Tarih Aralığı</th>
                                            <th class="text-center">Süre</th>
                                            <th>Açıklama</th>
                                            <th class="text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stu-leaves-table-body">
                                        <tr>
                                            <td colspan="5" class="py-6 text-center text-gray-400">İzin geçmişi yükleniyor...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 3. PANE: DANIŞMAN GÖREVLERİ -->
                <!-- ========================================================= -->
                <div id="stu-pane-tasks" class="space-y-4 hidden">
                    <div class="box-card p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                        <span>Danışmanınız tarafından atanan iş ve görevleri buradan takip edip teslim notuyla tamamlayabilirsiniz.</span>
                    </div>
                    <div id="stu-tasks-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="py-8 text-center text-gray-400 text-xs md:col-span-2">Görevler yükleniyor...</div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 4. PANE: GENEL DUYURULAR -->
                <!-- ========================================================= -->
                <div id="stu-pane-announcements" class="space-y-4 hidden">
                    <div class="box-card p-4 space-y-3">
                        <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                            <h3 class="font-bold text-xs text-gray-900">Fakülte ve Bölüm Genel Duyuruları</h3>
                            <span class="text-[11px] text-gray-400">Tüm çalışan öğrencilere yönelik resmi bildirimler</span>
                        </div>
                        <div id="stu-announcements-list" class="space-y-2.5">
                            <div class="py-6 text-center text-gray-400 text-xs">Duyurular yükleniyor...</div>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 5. PANE: DEVAM GEÇMİŞİ -->
                <!-- ========================================================= -->
                <div id="stu-pane-history" class="space-y-4 hidden">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span class="font-bold text-xs text-gray-700">Karekod (QR) Giriş-Çıkış ve Devam Saatleri</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Giriş Saati</th>
                                        <th>Çıkış Saati</th>
                                        <th class="text-center">Çalışılan Süre</th>
                                        <th class="text-center">Doğrulama Türü</th>
                                        <th class="text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="stu-history-table-body">
                                    <tr>
                                        <td colspan="6" class="py-6 text-center text-gray-400">Devam kayıtları yükleniyor...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gün Belirleme & Ders Çakışması Modalı -->
            <div id="stu-day-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs hidden">
                <div class="box-card bg-white p-5 max-w-sm w-full space-y-3 shadow-xl">
                    <h3 id="stu-modal-date-title" class="font-bold text-gray-900 text-sm">Çalışma Günü Belirleme</h3>
                    <input type="hidden" id="stu-modal-date">

                    <!-- Ders Çakışması / Tam Gün Ders Uyarı Kutusu -->
                    <div id="stu-modal-conflict-warning" class="hidden p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed space-y-1">
                        <div class="font-bold flex items-center gap-1 text-amber-800">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Ders Çakışması / Tam Gün Ders Uyarısı</span>
                        </div>
                        <p id="stu-modal-conflict-text">
                            Seçilen gün fakülte programınızda ders bulunmaktadır.
                        </p>
                    </div>

                    <div class="space-y-2 text-xs">
                        <div>
                            <label class="block font-semibold text-gray-600 mb-1">Vardiya / Çalışma Saati</label>
                            <select id="stu-modal-shift" class="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                <option value="Morning">Öğleden Önce (09:00 - 13:00 / 4 Saat)</option>
                                <option value="Afternoon">Öğleden Sonra (13:00 - 17:00 / 4 Saat)</option>
                                <option value="Full">Tam Gün İŞKUR (09:00 - 14:00 / 5 Saat)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-semibold text-gray-600 mb-1">Açıklama / Görev Notu</label>
                            <input type="text" id="stu-modal-notes" placeholder="Örn: Laboratuvar teknik desteği" 
                                   class="w-full p-2 border border-gray-300 rounded-lg">
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                        <button type="button" id="stu-modal-remove-btn" class="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium">
                            Günü Kaldır
                        </button>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="document.getElementById('stu-day-modal').classList.add('hidden')" class="btn-secondary">
                                İptal
                            </button>
                            <button type="button" id="stu-modal-save-btn" class="btn-primary">
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Görev Tamamlama Modalı -->
            <div id="stu-task-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs hidden">
                <div class="box-card bg-white p-5 max-w-sm w-full space-y-3 shadow-xl">
                    <h3 class="font-bold text-gray-900 text-sm">Görevi Tamamla ve Not Ekle</h3>
                    <input type="hidden" id="stu-task-modal-id">
                    <p id="stu-task-modal-title" class="text-xs font-semibold text-gray-800">Görev Adı</p>
                    <div>
                        <label class="block text-[11px] font-semibold text-gray-500 mb-1">Teslim Notunuz</label>
                        <textarea id="stu-task-modal-note" rows="3" placeholder="Görev kapsamında yapılan çalışmaları açıklayınız..." 
                                  class="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700"></textarea>
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onclick="document.getElementById('stu-task-modal').classList.add('hidden')" class="btn-secondary">
                            Vazgeç
                        </button>
                        <button type="button" id="stu-confirm-task-btn" class="btn-primary">
                            Tamamlandı Olarak İlet
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('stu-refresh-btn')?.addEventListener('click', () => this.loadAll());
        document.getElementById('stu-open-qr-btn')?.addEventListener('click', () => {
            if (window.qrScannerComponent) {
                window.qrScannerComponent.openScanner();
            } else {
                AppToast.info("QR okuyucu bileşeni açılıyor...");
            }
        });

        // Sekmeler
        const tabs = [
            { btn: 'stu-tab-plan-btn', pane: 'stu-pane-plan' },
            { btn: 'stu-tab-leave-btn', pane: 'stu-pane-leave' },
            { btn: 'stu-tab-tasks-btn', pane: 'stu-pane-tasks' },
            { btn: 'stu-tab-announcements-btn', pane: 'stu-pane-announcements' },
            { btn: 'stu-tab-history-btn', pane: 'stu-pane-history' }
        ];

        tabs.forEach(t => {
            document.getElementById(t.btn)?.addEventListener('click', () => {
                tabs.forEach(o => {
                    const b = document.getElementById(o.btn);
                    const p = document.getElementById(o.pane);
                    if (o.btn === t.btn) {
                        b?.classList.add('border-teal-800', 'text-teal-900', 'font-semibold');
                        b?.classList.remove('border-transparent', 'text-gray-500');
                        p?.classList.remove('hidden');
                    } else {
                        b?.classList.remove('border-teal-800', 'text-teal-900', 'font-semibold');
                        b?.classList.add('border-transparent', 'text-gray-500');
                        p?.classList.add('hidden');
                    }
                });
            });
        });

        // Takvim Ay Değişimi
        document.getElementById('stu-prev-month')?.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 1) {
                this.currentMonth = 12;
                this.currentYear--;
            }
            this.loadMonthlyPlan();
        });

        document.getElementById('stu-next-month')?.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
            }
            this.loadMonthlyPlan();
        });

        // Plan Kaydet ve Onaya Gönder Butonları
        document.getElementById('stu-save-plan-btn')?.addEventListener('click', () => this.savePlanDraft());
        document.getElementById('stu-submit-plan-btn')?.addEventListener('click', () => this.submitPlan());

        // Mazeret Formu Submit
        document.getElementById('stu-leave-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateLeave();
        });

        // Gün Belirleme Modal Butonları
        document.getElementById('stu-modal-save-btn')?.addEventListener('click', () => this.saveDayModal());
        document.getElementById('stu-modal-remove-btn')?.addEventListener('click', () => this.removeDayModal());

        // Vardiya değiştiğinde ders çakışması kontrolü
        document.getElementById('stu-modal-shift')?.addEventListener('change', () => this.checkConflictWarning());

        // Görev Tamamlama Onay Butonu
        document.getElementById('stu-confirm-task-btn')?.addEventListener('click', () => this.executeTaskComplete());
    }

    async loadAll() {
        try {
            await this.loadProfile();
            await Promise.all([
                this.loadMonthlyPlan(),
                this.loadLeaves(),
                this.loadTasks(),
                this.loadAttendances(),
                this.loadAnnouncements()
            ]);
        } catch (err) {
            console.error("Öğrenci verileri yükleme hatası:", err);
        }
    }

    async loadProfile() {
        try {
            const res = await ApiClient.Academic.getMyProfile();
            this.profile = res.data || {};
            
            // Mazeret formu alanlarını doldur
            const fnEl = document.getElementById('stu-leave-fullname');
            const unitEl = document.getElementById('stu-leave-unit');
            if (fnEl) fnEl.value = this.profile.fullName || '';
            if (unitEl) unitEl.value = this.profile.unit ? this.profile.unit.name : 'Teknoloji Fakültesi';

            // İzin kotası KPI
            const rem = this.profile.remainingLeaveDays ?? 10;
            const used = 10 - rem;
            document.getElementById('stu-stat-remaining-leave').textContent = `${rem} / 10 Gün`;
            document.getElementById('stu-stat-used-leave').textContent = `${used} Gün Kullanıldı`;
        } catch (err) {
            console.warn("Profil çekilemedi:", err);
        }
    }

    async loadMonthlyPlan() {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        document.getElementById('stu-month-label').textContent = `${months[this.currentMonth - 1]} ${this.currentYear}`;

        this.selectedDays.clear();

        if (!this.profile || !this.profile.studentId) return;

        try {
            const res = await ApiClient.Plan.getStudentPlan(this.profile.studentId, this.currentYear, this.currentMonth);
            this.currentPlan = res.data || null;

            const statusBadge = document.getElementById('stu-plan-status');
            if (this.currentPlan) {
                if (statusBadge) {
                    statusBadge.textContent = this.currentPlan.approvalStatus === 3 ? 'Onaylandı' : (this.currentPlan.approvalStatus === 2 ? 'Danışman Onayında' : 'Taslak');
                    statusBadge.className = `badge-minimal ml-2 ${this.currentPlan.approvalStatus === 3 ? 'badge-success' : (this.currentPlan.approvalStatus === 2 ? 'badge-warning' : 'badge-neutral')}`;
                }

                if (this.currentPlan.days) {
                    this.currentPlan.days.forEach(d => {
                        const dateKey = d.date.slice(0, 10);
                        this.selectedDays.set(dateKey, {
                            date: dateKey,
                            shiftType: d.plannedHours === 5 ? 'Full' : (d.startTime && d.startTime.startsWith('09') ? 'Morning' : 'Afternoon'),
                            notes: d.notes || ''
                        });
                    });
                }
            } else {
                if (statusBadge) {
                    statusBadge.textContent = 'Henüz Plan Yok';
                    statusBadge.className = 'badge-minimal ml-2 badge-neutral';
                }
            }
        } catch (err) {
            this.currentPlan = null;
        }

        this.renderCalendarGrid();
    }

    renderCalendarGrid() {
        const grid = document.getElementById('stu-calendar-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const firstDayOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1);
        const lastDayOfMonth = new Date(this.currentYear, this.currentMonth, 0);
        const totalDays = lastDayOfMonth.getDate();

        // Pazartesi = 0 başlangıcı
        let startDayIndex = firstDayOfMonth.getDay() - 1;
        if (startDayIndex === -1) startDayIndex = 6;

        // Önceki ay boşlukları
        for (let i = 0; i < startDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'h-16 rounded-lg bg-gray-50/50 border border-transparent';
            grid.appendChild(emptyCell);
        }

        // Gün hücreleri
        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(this.currentYear, this.currentMonth - 1, day);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = this.selectedDays.has(dateStr);
            const selectedInfo = this.selectedDays.get(dateStr);

            // Ders çakışması günleri (Salı = 2, Perşembe = 4 simülasyonu)
            const hasClassSchedule = (dayOfWeek === 2 || dayOfWeek === 4);

            const cell = document.createElement('div');
            let cellClass = 'h-16 p-1.5 rounded-lg border text-xs flex flex-col justify-between cursor-pointer transition select-none ';

            if (isWeekend) {
                cellClass += 'bg-gray-50 border-gray-200 text-rose-400 cursor-not-allowed opacity-60';
            } else if (isSelected) {
                cellClass += 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs';
            } else {
                cellClass += 'bg-white border-gray-200 hover:border-gray-400 text-gray-800';
            }

            cell.className = cellClass;

            cell.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-bold text-[11px]">${day}</span>
                    ${hasClassSchedule && !isWeekend ? `<span title="Zorunlu Ders Günü" class="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">Ders</span>` : ''}
                </div>
                <div class="text-[10px] truncate leading-tight">
                    ${isSelected ? `<span class="text-emerald-700 font-bold">${selectedInfo.shiftType === 'Full' ? '5s Tam' : '4s'}</span>` : ''}
                </div>
            `;

            if (!isWeekend) {
                cell.addEventListener('click', () => this.openDayModal(dateStr, day, dayOfWeek, isSelected, selectedInfo));
            }

            grid.appendChild(cell);
        }
    }

    openDayModal(dateStr, dayNumber, dayOfWeek, isSelected, selectedInfo) {
        document.getElementById('stu-modal-date').value = dateStr;
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        
        document.getElementById('stu-modal-date-title').textContent = `${dayNumber} ${months[this.currentMonth - 1]} ${this.currentYear} (${dayNames[dayOfWeek]})`;
        
        const shiftSelect = document.getElementById('stu-modal-shift');
        const notesInput = document.getElementById('stu-modal-notes');
        const removeBtn = document.getElementById('stu-modal-remove-btn');

        if (isSelected && selectedInfo) {
            shiftSelect.value = selectedInfo.shiftType || 'Morning';
            notesInput.value = selectedInfo.notes || '';
            removeBtn.classList.remove('hidden');
        } else {
            shiftSelect.value = 'Morning';
            notesInput.value = '';
            removeBtn.classList.add('hidden');
        }

        // Çakışma kontrolünü tetikle
        this.checkConflictWarning();

        document.getElementById('stu-day-modal').classList.remove('hidden');
    }

    checkConflictWarning() {
        const dateStr = document.getElementById('stu-modal-date').value;
        const shift = document.getElementById('stu-modal-shift').value;
        const warningBox = document.getElementById('stu-modal-conflict-warning');
        const warningText = document.getElementById('stu-modal-conflict-text');

        if (!dateStr) return;

        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 2: Salı, 4: Perşembe

        // Salı ve Perşembe günleri fakülte müfredatında tam gün ders vardır
        if (dayOfWeek === 2) {
            warningBox.classList.remove('hidden');
            warningText.innerHTML = `<strong>Salı Günü Uyarısı:</strong> Saat 09:00 - 13:00 arasında zorunlu <em>'Yazılım Tasarımı ve Mimarisi'</em> dersiniz bulunmaktadır. ${shift === 'Morning' || shift === 'Full' ? '<span class="text-rose-700 font-bold block mt-0.5">⚠️ Seçtiğiniz vardiya sabah ders saatlerinizle çakışmaktadır!</span>' : 'Öğleden sonra vardiyası uygundur.'}`;
        } else if (dayOfWeek === 4) {
            warningBox.classList.remove('hidden');
            warningText.innerHTML = `<strong>Perşembe Günü Uyarısı:</strong> Saat 13:00 - 17:00 arasında zorunlu <em>'Veritabanı Yönetim Sistemleri Laboratuvarı'</em> dersiniz bulunmaktadır. ${shift === 'Afternoon' || shift === 'Full' ? '<span class="text-rose-700 font-bold block mt-0.5">⚠️ Seçtiğiniz vardiya öğleden sonraki laboratuvar dersinizle çakışmaktadır!</span>' : 'Sabah vardiyası uygundur.'}`;
        } else {
            warningBox.classList.add('hidden');
        }
    }

    saveDayModal() {
        const dateStr = document.getElementById('stu-modal-date').value;
        const shiftType = document.getElementById('stu-modal-shift').value;
        const notes = document.getElementById('stu-modal-notes').value.trim();

        // Haftalık 1-3 gün kuralı kontrolü
        const targetDate = new Date(dateStr);
        const dayCountInSameWeek = this.countDaysInWeek(targetDate, dateStr);

        if (dayCountInSameWeek >= 3 && !this.selectedDays.has(dateStr)) {
            AppToast.warning("İŞKUR Kuralı: Bir takvim haftasında en fazla 3 çalışma günü seçebilirsiniz!");
            return;
        }

        this.selectedDays.set(dateStr, {
            date: dateStr,
            shiftType,
            notes
        });

        document.getElementById('stu-day-modal').classList.add('hidden');
        this.renderCalendarGrid();
    }

    removeDayModal() {
        const dateStr = document.getElementById('stu-modal-date').value;
        this.selectedDays.delete(dateStr);
        document.getElementById('stu-day-modal').classList.add('hidden');
        this.renderCalendarGrid();
    }

    countDaysInWeek(targetDate, excludeDateStr) {
        // Hedef tarihin haftasındaki Pazartesi'yi bul
        const d = new Date(targetDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        let count = 0;
        this.selectedDays.forEach((val, key) => {
            if (key !== excludeDateStr) {
                const cur = new Date(key);
                if (cur >= monday && cur <= sunday) {
                    count++;
                }
            }
        });
        return count;
    }

    async savePlanDraft() {
        if (!this.profile || !this.profile.studentId) return;

        const days = [];
        this.selectedDays.forEach((val) => {
            days.push({
                date: val.date,
                shiftType: val.shiftType,
                notes: val.notes
            });
        });

        try {
            await ApiClient.Plan.createOrUpdate({
                year: this.currentYear,
                month: this.currentMonth,
                days: days
            });
            AppToast.success("Çalışma planı taslağınız başarıyla kaydedildi.");
            await this.loadMonthlyPlan();
        } catch (err) {
            AppToast.error(err.message || "Plan kaydedilemedi.");
        }
    }

    async submitPlan() {
        if (!this.currentPlan || !this.currentPlan.id) {
            await this.savePlanDraft();
        }

        if (!this.currentPlan || !this.currentPlan.id) {
            AppToast.warning("Lütfen önce gün seçimi yapınız.");
            return;
        }

        try {
            await ApiClient.Plan.submit(this.currentPlan.id);
            AppToast.success("Aylık çalışma planınız danışman onayına sunuldu!");
            await this.loadMonthlyPlan();
        } catch (err) {
            AppToast.error(err.message || "Onaya gönderilemedi.");
        }
    }

    async loadLeaves() {
        if (!this.profile || !this.profile.studentId) return;

        try {
            const res = await ApiClient.Leave.getStudentLeaves(this.profile.studentId);
            this.leaves = res.data || [];
            this.renderLeavesTable();
        } catch (err) {
            console.warn("İzinler çekilemedi:", err);
        }
    }

    renderLeavesTable() {
        const tbody = document.getElementById('stu-leaves-table-body');
        if (!tbody) return;

        if (this.leaves.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-gray-400">Henüz bir mazeret talebiniz bulunmuyor.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.leaves.map(l => {
            const sDate = new Date(l.startDate).toLocaleDateString('tr-TR');
            const eDate = new Date(l.endDate).toLocaleDateString('tr-TR');

            let badge = `<span class="badge-minimal badge-warning">Değerlendirmede</span>`;
            if (l.status === 1) badge = `<span class="badge-minimal badge-success">Onaylandı</span>`;
            else if (l.status === 2) badge = `<span class="badge-minimal badge-danger">Reddedildi</span>`;

            return `
                <tr>
                    <td><span class="badge-minimal badge-info">${l.leaveType || 'Mazeret'}</span></td>
                    <td>${sDate} - ${eDate}</td>
                    <td class="text-center font-bold">${l.totalDays} Gün</td>
                    <td class="max-w-[200px] truncate">${l.reason || '-'}</td>
                    <td class="text-center">${badge}</td>
                </tr>
            `;
        }).join('');
    }

    async handleCreateLeave() {
        const startDate = document.getElementById('stu-leave-start').value;
        const endDate = document.getElementById('stu-leave-end').value;
        const leaveType = document.getElementById('stu-leave-type').value;
        const reason = document.getElementById('stu-leave-reason').value.trim();
        const btn = document.getElementById('stu-submit-leave-btn');

        if (!startDate || !endDate || !reason) {
            AppToast.warning("Lütfen tarihleri ve mazeret gerekçenizi eksiksiz doldurunuz.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Gönderiliyor...</span>`;

        try {
            await ApiClient.Leave.create({
                startDate,
                endDate,
                leaveType,
                reason
            });

            AppToast.success("Mazeret talebiniz Fakülte Sekreteri ve Danışmanınıza iletildi!");
            document.getElementById('stu-leave-form').reset();
            await this.loadProfile();
            await this.loadLeaves();
        } catch (err) {
            AppToast.error(err.message || "İzin talebi oluşturulamadı.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-paper-plane text-xs"></i> <span>Talebi Sekreterlik ve Danışmana Gönder</span>`;
        }
    }

    async loadTasks() {
        if (!this.profile || !this.profile.studentId) return;

        try {
            const res = await ApiClient.Task.getStudentTasks(this.profile.studentId);
            this.tasks = res.data || [];
            
            const badge = document.getElementById('stu-tasks-badge');
            const pendingTasks = this.tasks.filter(t => t.status !== 3); // 3 = Completed
            if (badge) {
                badge.textContent = pendingTasks.length;
                if (pendingTasks.length > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }

            document.getElementById('stu-stat-pending-tasks').textContent = `${pendingTasks.length} / ${this.tasks.length}`;
            this.renderTasksList();
        } catch (err) {
            console.warn("Görevler çekilemedi:", err);
        }
    }

    renderTasksList() {
        const container = document.getElementById('stu-tasks-list');
        if (!container) return;

        if (this.tasks.length === 0) {
            container.innerHTML = `<div class="py-6 text-center text-gray-400 text-xs md:col-span-2">Danışmanınız tarafından atanan aktif bir görev bulunmuyor.</div>`;
            return;
        }

        container.innerHTML = this.tasks.map(t => {
            const isCompleted = t.status === 3;
            const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : 'Belirtilmedi';

            return `
                <div class="box-card p-4 space-y-2 border ${isCompleted ? 'border-gray-200 bg-gray-50/50' : 'border-teal-200 bg-white'}">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-gray-900">${t.title}</span>
                        <span class="badge-minimal ${isCompleted ? 'badge-success' : 'badge-warning'}">
                            ${isCompleted ? 'Tamamlandı' : 'Devam Ediyor'}
                        </span>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">${t.description || '-'}</p>
                    <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                        <span>Teslim Tarihi: <strong>${dueStr}</strong></span>
                        ${!isCompleted ? `
                            <button onclick="window.studentDashboard.openTaskModal('${t.id}', '${t.title.replace(/'/g, "\\'")}')" 
                                    class="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded text-[11px] font-semibold transition">
                                <i class="fa-solid fa-check mr-1"></i>Tamamla
                            </button>
                        ` : `
                            <span class="text-emerald-700 font-semibold"><i class="fa-solid fa-circle-check mr-1"></i>Teslim Edildi</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    openTaskModal(taskId, title) {
        document.getElementById('stu-task-modal-id').value = taskId;
        document.getElementById('stu-task-modal-title').textContent = title;
        document.getElementById('stu-task-modal-note').value = '';
        document.getElementById('stu-task-modal').classList.remove('hidden');
    }

    async executeTaskComplete() {
        const taskId = document.getElementById('stu-task-modal-id').value;
        const note = document.getElementById('stu-task-modal-note').value.trim();

        try {
            await ApiClient.Task.updateStatus(taskId, 3, note || 'Görev tamamlandı.');
            AppToast.success("Görev başarıyla tamamlandı olarak işaretlendi!");
            document.getElementById('stu-task-modal').classList.add('hidden');
            await this.loadTasks();
        } catch (err) {
            AppToast.error(err.message || "Görev durumu güncellenemedi.");
        }
    }

    async loadAttendances() {
        if (!this.profile || !this.profile.studentId) return;

        try {
            const res = await ApiClient.Attendance.getStudentAttendances(this.profile.studentId);
            this.attendances = res.data || [];
            
            // Toplam çalışılan gün ve saat hesabı
            const totalHours = this.attendances.reduce((acc, curr) => acc + (curr.actualHoursWorked || 5), 0);
            const totalDays = this.attendances.length;

            document.getElementById('stu-stat-worked-days').textContent = `${totalDays} Gün`;
            document.getElementById('stu-stat-worked-hours').textContent = `${totalHours} Saat Çalışıldı`;

            // Bugünkü yoklama kontrolü
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayAtt = this.attendances.find(a => a.checkInTime && a.checkInTime.startsWith(todayStr));

            if (todayAtt) {
                const inTime = new Date(todayAtt.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const outTime = todayAtt.checkOutTime ? new Date(todayAtt.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Devam Ediyor';
                document.getElementById('stu-stat-today-status').textContent = 'Yoklama Alındı';
                document.getElementById('stu-stat-today-hours').textContent = `Giriş: ${inTime} | Çıkış: ${outTime}`;
            }

            this.renderHistoryTable();
        } catch (err) {
            console.warn("Devam kayıtları çekilemedi:", err);
        }
    }

    renderHistoryTable() {
        const tbody = document.getElementById('stu-history-table-body');
        if (!tbody) return;

        if (this.attendances.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-gray-400">Henüz devam kaydınız bulunmuyor.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.attendances.map(a => {
            const dateStr = new Date(a.checkInTime).toLocaleDateString('tr-TR');
            const inTime = new Date(a.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const outTime = a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';

            return `
                <tr>
                    <td class="font-mono font-bold">${dateStr}</td>
                    <td class="font-mono">${inTime}</td>
                    <td class="font-mono">${outTime}</td>
                    <td class="text-center font-bold text-teal-800">${a.actualHoursWorked || 5} Saat</td>
                    <td class="text-center"><span class="badge-minimal badge-success">Dinamik QR</span></td>
                    <td class="text-center"><span class="badge-minimal badge-success">Onaylandı</span></td>
                </tr>
            `;
        }).join('');
    }

    async loadAnnouncements() {
        try {
            const res = await ApiClient.Academic.getAnnouncements();
            this.announcements = res.data || [];
            this.renderAnnouncementsList();
        } catch (err) {
            console.warn("Duyurular çekilemedi:", err);
        }
    }

    renderAnnouncementsList() {
        const container = document.getElementById('stu-announcements-list');
        if (!container) return;

        if (this.announcements.length === 0) {
            container.innerHTML = `<div class="py-6 text-center text-gray-400 text-xs">Şu anda aktif bir genel duyuru bulunmuyor.</div>`;
            return;
        }

        container.innerHTML = this.announcements.map(ann => {
            const dateStr = new Date(ann.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
            return `
                <div class="box-card p-3 space-y-1.5 border ${ann.isUrgent ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white'}">
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5">
                            ${ann.isUrgent ? `<span class="badge-minimal badge-danger">ÖNEMLİ</span>` : ''}
                            <span class="badge-minimal badge-neutral">${ann.category || 'Genel'}</span>
                            <span class="font-bold text-gray-900">${ann.title}</span>
                        </div>
                        <span class="text-[10px] text-gray-400">${dateStr}</span>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">${ann.content}</p>
                    <div class="pt-1 text-[10px] text-gray-400 border-t border-gray-100 flex items-center justify-between">
                        <span>Yayınlayan: <strong>${ann.createdByName || 'Fakülte Yönetimi'}</strong></span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

window.studentDashboard = new StudentDashboard();
