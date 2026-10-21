// ============================================================================
// Dekanlık & Fakülte Sekreterliği Paneli (Dean / Admin Dashboard)
// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu
// ============================================================================

class DeanDashboard {
    constructor() {
        this.payrollData = [];
        this.pendingLeaves = [];
        this.allStudents = [];
        this.departments = [];
        this.units = [];
        this.riskWarnings = [];
        this.selectedStudent = null;

        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth() + 1;
        this.selectedDepartmentId = '';
    }

    async init() {
        console.log("DeanDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadInitialData();
    }

    renderShell() {
        const container = document.getElementById('dean-dashboard-view');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Üst Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                                <i class="fa-solid fa-landmark text-lg"></i>
                            </span>
                            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Dekanlık & Fakülte Sekreterliği Yönetim Merkezi
                            </h1>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            İŞKUR resmi ay sonu puantaj dökümü, fakülte izin onay merkezi ve birim dağıtım yönetimi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="dean-refresh-btn" class="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm inline-flex items-center gap-2">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Verileri Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam İŞKUR Öğrencisi</p>
                            <h3 id="dean-stat-students" class="text-2xl font-black text-slate-900 dark:text-white mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Fakülte Genelinde</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-user-graduate"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Bekleyen İzin Onayı</p>
                            <h3 id="dean-stat-pending-leaves" class="text-2xl font-black text-amber-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">İnceleme Bekliyor</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-envelope-open-text"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Kritik Riskli Öğrenci</p>
                            <h3 id="dean-stat-risks" class="text-2xl font-black text-rose-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Kota / Devamsızlık</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Fiili Çalışma Saati</p>
                            <h3 id="dean-stat-hours" class="text-2xl font-black text-emerald-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Bu Ay Gerçekleşen</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-clock"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-slate-200 dark:border-slate-800">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Dean Tabs">
                        <button id="dean-tab-payroll-btn" class="dean-tab-btn py-3 px-1 border-b-2 border-purple-600 font-semibold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                            <span>Ay Sonu Resmi Puantaj & Bordro</span>
                        </button>
                        <button id="dean-tab-leaves-btn" class="dean-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>Fakülte İzin Onay Merkezi</span>
                            <span id="dean-pending-leaves-badge" class="hidden px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-bold">0</span>
                        </button>
                        <button id="dean-tab-students-btn" class="dean-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-building-user"></i>
                            <span>Birim Dağıtımı & Öğrenci Yönetimi</span>
                        </button>
                        <button id="dean-tab-risks-btn" class="dean-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-shield-halved"></i>
                            <span>Risk & Devamsızlık Denetimi</span>
                        </button>
                    </nav>
                </div>

                <!-- 1. SEKME: AY SONU PUANTAJ VE RAPORLAMA -->
                <div id="dean-pane-payroll" class="space-y-4">
                    <!-- Filtreleme ve Export Barı -->
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <!-- Yıl Seçimi -->
                            <div>
                                <select id="payroll-year-select" class="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                                    <option value="2026">2026</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>

                            <!-- Ay Seçimi -->
                            <div>
                                <select id="payroll-month-select" class="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                                    <option value="1">Ocak</option>
                                    <option value="2">Şubat</option>
                                    <option value="3">Mart</option>
                                    <option value="4">Nisan</option>
                                    <option value="5">Mayıs</option>
                                    <option value="6">Haziran</option>
                                    <option value="7">Temmuz</option>
                                    <option value="8">Ağustos</option>
                                    <option value="9">Eylül</option>
                                    <option value="10">Ekim</option>
                                    <option value="11">Kasım</option>
                                    <option value="12">Aralık</option>
                                </select>
                            </div>

                            <!-- Bölüm Filtresi -->
                            <div>
                                <select id="payroll-dept-select" class="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                                    <option value="">Tüm Fakülte Bölümleri</option>
                                </select>
                            </div>

                            <button id="payroll-filter-btn" class="px-4 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm flex items-center gap-2">
                                <i class="fa-solid fa-filter text-xs"></i>
                                <span>Puantajı Getir</span>
                            </button>
                        </div>

                        <!-- Tek Tıkla Excel & CSV Dışa Aktarma Butonları -->
                        <div class="flex items-center gap-2 w-full lg:w-auto justify-end">
                            <button id="export-excel-btn" class="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-2">
                                <i class="fa-solid fa-file-excel text-base"></i>
                                <span>Excel (.xlsx) Olarak İndir</span>
                            </button>
                            <button id="export-csv-btn" class="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm flex items-center gap-2">
                                <i class="fa-solid fa-file-csv text-base text-blue-500"></i>
                                <span>CSV İndir</span>
                            </button>
                        </div>
                    </div>

                    <!-- Puantaj Veri Tablosu -->
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-3 text-center">Sıra</th>
                                        <th class="py-3.5 px-3">TCKN</th>
                                        <th class="py-3.5 px-4">Adı Soyadı</th>
                                        <th class="py-3.5 px-3">Bölüm</th>
                                        <th class="py-3.5 px-4 font-mono">IBAN (KVKK Korumalı)</th>
                                        <th class="py-3.5 px-3 text-center">Planlanan</th>
                                        <th class="py-3.5 px-3 text-center">Gerçekleşen (QR)</th>
                                        <th class="py-3.5 px-3 text-center">İzinli Gün</th>
                                        <th class="py-3.5 px-3 text-center font-bold">Toplam Saat</th>
                                        <th class="py-3.5 px-3 text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-payroll-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="10" class="py-12 text-center text-slate-400">
                                            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-purple-500"></i>
                                            <p>Puantaj verileri yükleniyor...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 2. SEKME: İZİN ONAY MERKEZİ -->
                <div id="dean-pane-leaves" class="hidden space-y-4">
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-slate-900 dark:text-white">Fakülte Genelinde Onay Bekleyen İzin Talepleri</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Öğrencilerin sağlık, sınav ve mazeret gerekçeli izin başvurularını onaylayınız veya reddediniz.</p>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-4">Öğrenci & No</th>
                                        <th class="py-3.5 px-3">İzin Türü</th>
                                        <th class="py-3.5 px-3">Tarih Aralığı</th>
                                        <th class="py-3.5 px-3 text-center">Toplam Gün</th>
                                        <th class="py-3.5 px-4">Mazeret Gerekçesi</th>
                                        <th class="py-3.5 px-4 text-right">Aksiyonlar</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-leaves-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-slate-400">
                                            Bekleyen izin talebi bulunmamaktadır.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 3. SEKME: BİRİM DAĞITIMI & ÖĞRENCİ YÖNETİMİ -->
                <div id="dean-pane-students" class="hidden space-y-4">
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                        <div class="relative w-full md:w-80">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                <i class="fa-solid fa-magnifying-glass text-xs"></i>
                            </span>
                            <input type="text" id="dean-student-search" placeholder="Öğrenci ara..." 
                                class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-slate-200">
                        </div>

                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <select id="dean-unit-filter" class="w-full md:w-auto px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                                <option value="">Tüm Birimler</option>
                                <option value="unassigned">Birimsiz Öğrenciler</option>
                            </select>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-4">Öğrenci No</th>
                                        <th class="py-3.5 px-4">Ad Soyad</th>
                                        <th class="py-3.5 px-3">Bölüm</th>
                                        <th class="py-3.5 px-4">Mevcut Görev Birimi</th>
                                        <th class="py-3.5 px-3 text-center">Durum</th>
                                        <th class="py-3.5 px-4 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-students-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-slate-400">
                                            Öğrenci verileri yükleniyor...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 4. SEKME: RİSK & UYARI TABLOSU -->
                <div id="dean-pane-risks" class="hidden space-y-4">
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-slate-900 dark:text-white">Fakülte Genel Risk & Uyarı Paneli</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Yıllık izin hakkını doldurmak üzere olan (>7 gün) ve devamsızlık sınırına ulaşan öğrenciler.</p>
                        </div>
                        <button id="dean-export-risk-excel-btn" class="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-2">
                            <i class="fa-solid fa-file-excel"></i>
                            <span>Risk Raporunu Excel Olarak İndir</span>
                        </button>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-4">Öğrenci</th>
                                        <th class="py-3.5 px-3">Bölüm</th>
                                        <th class="py-3.5 px-3">Danışman</th>
                                        <th class="py-3.5 px-3 text-center">Kullanılan İzin</th>
                                        <th class="py-3.5 px-3 text-center">Devamsızlık</th>
                                        <th class="py-3.5 px-3 text-center">Risk Bayrağı</th>
                                        <th class="py-3.5 px-4">Değerlendirme Notu</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-risks-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="7" class="py-8 text-center text-slate-400">
                                            Riskli öğrenci bulunmamaktadır.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Birim Atama Modalı -->
            <div id="assign-unit-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                <i class="fa-solid fa-building-circle-check text-sm"></i>
                            </span>
                            <h3 class="font-bold text-slate-900 dark:text-white">Fakülte Birimi Görevlendirmesi</h3>
                        </div>
                        <button id="close-assign-unit-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <form id="assign-unit-form" class="mt-4 space-y-4">
                        <input type="hidden" id="assign-unit-student-id">

                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Öğrenci</label>
                            <div id="assign-unit-student-name" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-slate-200 text-sm">
                                -
                            </div>
                        </div>

                        <div>
                            <label for="assign-unit-select" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Görevlendirilecek Birim <span class="text-rose-500">*</span>
                            </label>
                            <select id="assign-unit-select" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                                <option value="">Birim Seçiniz...</option>
                            </select>
                        </div>

                        <div>
                            <label for="assign-unit-note" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Görevlendirme Açıklaması</label>
                            <textarea id="assign-unit-note" rows="2" placeholder="Örn: 2026 Bahar dönemi bilgi işlem teknik destek görevlendirmesi" 
                                class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" id="cancel-assign-unit-btn" class="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                İptal
                            </button>
                            <button type="submit" id="submit-assign-unit-btn" class="px-5 py-2 text-sm font-medium rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm flex items-center gap-2">
                                <i class="fa-solid fa-check text-xs"></i>
                                <span>Görevi Kaydet</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Yenile Butonu
        document.getElementById('dean-refresh-btn')?.addEventListener('click', () => {
            this.loadInitialData();
            AppToast.info("Veriler yenileniyor...");
        });

        // Sekmeler
        const tabs = [
            { btn: 'dean-tab-payroll-btn', pane: 'dean-pane-payroll' },
            { btn: 'dean-tab-leaves-btn', pane: 'dean-pane-leaves' },
            { btn: 'dean-tab-students-btn', pane: 'dean-pane-students' },
            { btn: 'dean-tab-risks-btn', pane: 'dean-pane-risks' }
        ];

        tabs.forEach(t => {
            document.getElementById(t.btn)?.addEventListener('click', () => {
                tabs.forEach(o => {
                    const b = document.getElementById(o.btn);
                    const p = document.getElementById(o.pane);
                    if (o.btn === t.btn) {
                        b?.classList.add('border-purple-600', 'text-purple-600', 'dark:text-purple-400');
                        b?.classList.remove('border-transparent', 'text-slate-500');
                        p?.classList.remove('hidden');
                    } else {
                        b?.classList.remove('border-purple-600', 'text-purple-600', 'dark:text-purple-400');
                        b?.classList.add('border-transparent', 'text-slate-500');
                        p?.classList.add('hidden');
                    }
                });
            });
        });

        // Puantaj Ay & Yıl Filtresi
        const monthSelect = document.getElementById('payroll-month-select');
        const yearSelect = document.getElementById('payroll-year-select');
        if (monthSelect) monthSelect.value = this.currentMonth;
        if (yearSelect) yearSelect.value = this.currentYear;

        document.getElementById('payroll-filter-btn')?.addEventListener('click', () => {
            this.currentYear = parseInt(document.getElementById('payroll-year-select')?.value || this.currentYear);
            this.currentMonth = parseInt(document.getElementById('payroll-month-select')?.value || this.currentMonth);
            this.selectedDepartmentId = document.getElementById('payroll-dept-select')?.value || '';
            this.loadPayrollData();
        });

        // 1-Tıkla Excel İndirme Butonu
        document.getElementById('export-excel-btn')?.addEventListener('click', async () => {
            try {
                AppToast.info("Excel puantaj dosyası hazırlanıyor...");
                await ApiClient.Report.downloadExcel(this.currentYear, this.currentMonth, this.selectedDepartmentId || null);
                AppToast.success("Excel puantaj dosyası başarıyla indirildi.");
            } catch (err) {
                console.error("Excel indirme hatası:", err);
                AppToast.error("Excel indirilemedi: " + err.message);
            }
        });

        // 1-Tıkla CSV İndirme Butonu
        document.getElementById('export-csv-btn')?.addEventListener('click', async () => {
            try {
                AppToast.info("CSV puantaj dosyası hazırlanıyor...");
                await ApiClient.Report.downloadCsv(this.currentYear, this.currentMonth, this.selectedDepartmentId || null);
                AppToast.success("CSV dosyası başarıyla indirildi.");
            } catch (err) {
                console.error("CSV indirme hatası:", err);
                AppToast.error("CSV indirilemedi: " + err.message);
            }
        });

        // Risk Excel İndirme
        document.getElementById('dean-export-risk-excel-btn')?.addEventListener('click', async () => {
            try {
                AppToast.info("Risk raporu Excel dosyası hazırlanıyor...");
                await ApiClient.Report.downloadRiskExcel(this.selectedDepartmentId || null);
                AppToast.success("Risk raporu indirildi.");
            } catch (err) {
                AppToast.error("Risk raporu indirilemedi: " + err.message);
            }
        });

        // Öğrenci arama
        document.getElementById('dean-student-search')?.addEventListener('input', () => this.filterStudents());
        document.getElementById('dean-unit-filter')?.addEventListener('change', () => this.filterStudents());

        // Birim Atama Modalı
        const modal = document.getElementById('assign-unit-modal');
        document.getElementById('close-assign-unit-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
        document.getElementById('cancel-assign-unit-btn')?.addEventListener('click', () => modal?.classList.add('hidden'));
        document.getElementById('assign-unit-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAssignUnit();
        });
    }

    async loadInitialData() {
        try {
            // Bölümler, Birimler, Bekleyen İzinler ve Tüm Öğrencileri paralel çek
            const [deptsRes, unitsRes, leavesRes, studentsRes, risksRes] = await Promise.all([
                ApiClient.Academic.getDepartments(),
                ApiClient.Academic.getUnits(),
                ApiClient.Leave.getPending(),
                ApiClient.Academic.getAllStudents(),
                ApiClient.Report.getRiskWarnings()
            ]);

            this.departments = deptsRes.data || [];
            this.units = unitsRes.data || [];
            this.pendingLeaves = leavesRes.data || [];
            this.allStudents = studentsRes.data || [];
            this.riskWarnings = risksRes.data || [];

            this.populateSelects();
            this.updateKpis();
            this.renderLeavesTable(this.pendingLeaves);
            this.renderStudentsTable(this.allStudents);
            this.renderRisksTable(this.riskWarnings);

            // Puantaj tablosunu yükle
            await this.loadPayrollData();

        } catch (error) {
            console.error("Dekanlık ilk veri yükleme hatası:", error);
            AppToast.error("Veriler yüklenirken bir hata oluştu: " + error.message);
        }
    }

    async loadPayrollData() {
        const tbody = document.getElementById('dean-payroll-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="py-12 text-center text-slate-400">
                        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-purple-500"></i>
                        <p>Puantaj verileri hesaplanıyor...</p>
                    </td>
                </tr>
            `;
        }

        try {
            const filter = {
                year: this.currentYear,
                month: this.currentMonth,
                departmentId: this.selectedDepartmentId || null
            };

            const res = await ApiClient.Report.getMonthlySummary(filter);
            this.payrollData = res.data || [];
            this.renderPayrollTable(this.payrollData);

            // KPI'da toplam gerçekleşen saati güncelle
            const totalHours = this.payrollData.reduce((acc, curr) => acc + (curr.actualWorkingHours || 0), 0);
            document.getElementById('dean-stat-hours').textContent = `${totalHours} Saat`;

        } catch (error) {
            console.error("Puantaj yükleme hatası:", error);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="py-8 text-center text-rose-500">
                            Puantaj verileri alınamadı: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }
    }

    populateSelects() {
        // Puantaj bölüm filtresi
        const deptSelect = document.getElementById('payroll-dept-select');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">Tüm Fakülte Bölümleri</option>';
            this.departments.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = d.name;
                deptSelect.appendChild(opt);
            });
        }

        // Birim select kutusu ve filtresi
        const unitSelect = document.getElementById('assign-unit-select');
        const unitFilter = document.getElementById('dean-unit-filter');
        if (unitSelect) {
            unitSelect.innerHTML = '<option value="">Birim Seçiniz...</option>';
            if (unitFilter) {
                unitFilter.innerHTML = '<option value="">Tüm Birimler</option><option value="unassigned">Birimsiz Öğrenciler</option>';
            }

            this.units.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.name} (Kapasite: ${u.capacity})`;
                unitSelect.appendChild(opt);

                if (unitFilter) {
                    const fOpt = document.createElement('option');
                    fOpt.value = u.id;
                    fOpt.textContent = u.name;
                    unitFilter.appendChild(fOpt);
                }
            });
        }
    }

    updateKpis() {
        document.getElementById('dean-stat-students').textContent = this.allStudents.length;
        document.getElementById('dean-stat-pending-leaves').textContent = this.pendingLeaves.length;
        document.getElementById('dean-stat-risks').textContent = this.riskWarnings.length;

        const badge = document.getElementById('dean-pending-leaves-badge');
        if (badge) {
            if (this.pendingLeaves.length > 0) {
                badge.textContent = this.pendingLeaves.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    renderPayrollTable(data) {
        const tbody = document.getElementById('dean-payroll-table-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="py-12 text-center text-slate-400">
                        <i class="fa-solid fa-file-invoice text-3xl mb-2 text-slate-300"></i>
                        <p class="font-medium">Seçili ay ve kriterlere ait puantaj kaydı bulunamadı.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((item, index) => {
            const statusClass = item.status === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3 px-3 text-center text-slate-400 font-medium">${index + 1}</td>
                    <td class="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${item.tcNo || '***'}
                    </td>
                    <td class="py-3 px-4">
                        <div class="font-bold text-slate-900 dark:text-white">${item.fullName}</div>
                        <div class="text-xs font-mono text-slate-400">${item.studentNumber}</div>
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-300">
                        ${item.departmentName || '-'}
                    </td>
                    <td class="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        ${item.iban || 'TR** **** **** ****'}
                    </td>
                    <td class="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        ${item.plannedDays} Gün
                    </td>
                    <td class="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        ${item.actualDays} Gün
                    </td>
                    <td class="py-3 px-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                        ${item.approvedLeaveDays} Gün
                    </td>
                    <td class="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ${item.actualWorkingHours} Saat
                    </td>
                    <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}">
                            ${item.status === 'Active' ? 'Aktif' : item.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderLeavesTable(leaves) {
        const tbody = document.getElementById('dean-leaves-table-body');
        if (!tbody) return;

        if (leaves.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-10 text-center text-slate-400">
                        <i class="fa-solid fa-check-circle text-2xl mb-2 text-emerald-500"></i>
                        <p class="font-medium text-slate-600 dark:text-slate-300">Tüm izin talepleri incelenmiş ve sonuçlandırılmıştır.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leaves.map(l => {
            const start = new Date(l.startDate).toLocaleDateString('tr-TR');
            const end = new Date(l.endDate).toLocaleDateString('tr-TR');

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-900 dark:text-white">${l.studentName || 'Öğrenci'}</div>
                        <div class="text-xs text-slate-400">${l.departmentName || '-'}</div>
                    </td>
                    <td class="py-3.5 px-3">
                        <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            ${l.leaveType || 'Mazeret İzni'}
                        </span>
                    </td>
                    <td class="py-3.5 px-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                        ${start} - ${end}
                    </td>
                    <td class="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        ${l.requestedDays} Gün
                    </td>
                    <td class="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title="${l.reason || ''}">
                        ${l.reason || '-'}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="window.deanDashboard.evaluateLeave('${l.id}', 'Approved')" 
                                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm inline-flex items-center gap-1">
                                <i class="fa-solid fa-check"></i>
                                <span>Onayla</span>
                            </button>
                            <button onclick="window.deanDashboard.evaluateLeave('${l.id}', 'Rejected')" 
                                class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition inline-flex items-center gap-1">
                                <i class="fa-solid fa-xmark"></i>
                                <span>Reddet</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async evaluateLeave(leaveId, decision) {
        let rejectionReason = null;
        if (decision === 'Rejected') {
            rejectionReason = prompt("Lütfen izin talebinin ret gerekçesini giriniz:");
            if (rejectionReason === null) return; // İptal edildi
        }

        try {
            await ApiClient.Leave.evaluate(leaveId, decision, rejectionReason);
            AppToast.success(decision === 'Approved' ? "İzin talebi onaylandı." : "İzin talebi reddedildi.");
            
            // Bekleyen izinleri yeniden yükle
            const leavesRes = await ApiClient.Leave.getPending();
            this.pendingLeaves = leavesRes.data || [];
            this.renderLeavesTable(this.pendingLeaves);
            this.updateKpis();

        } catch (error) {
            console.error("İzin değerlendirme hatası:", error);
            AppToast.error("İşlem gerçekleştirilemedi: " + error.message);
        }
    }

    filterStudents() {
        const search = document.getElementById('dean-student-search')?.value.toLowerCase().trim() || '';
        const unitFilter = document.getElementById('dean-unit-filter')?.value || '';

        const filtered = this.allStudents.filter(s => {
            const matchSearch = !search || 
                s.fullName.toLowerCase().includes(search) || 
                (s.studentNumber && s.studentNumber.toLowerCase().includes(search));

            let matchUnit = true;
            if (unitFilter === 'unassigned') {
                matchUnit = !s.unitId;
            } else if (unitFilter) {
                matchUnit = s.unitId === unitFilter;
            }

            return matchSearch && matchUnit;
        });

        this.renderStudentsTable(filtered);
    }

    renderStudentsTable(studentsList) {
        const tbody = document.getElementById('dean-students-table-body');
        if (!tbody) return;

        if (studentsList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400">
                        Kayıtlı öğrenci bulunamadı.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = studentsList.map(s => {
            const hasUnit = !!s.unitId;

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${s.studentNumber || '-'}
                    </td>
                    <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ${s.fullName}
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-300">
                        ${s.departmentName || '-'}
                    </td>
                    <td class="py-3 px-4">
                        ${hasUnit 
                            ? `<span class="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
                                 <i class="fa-solid fa-building text-purple-500"></i>
                                 ${s.unitName}
                               </span>`
                            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                 <i class="fa-solid fa-clock text-xs"></i>
                                 Birim Atanmadı
                               </span>`
                        }
                    </td>
                    <td class="py-3 px-3 text-center">
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            ${s.status || 'Aktif'}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="window.deanDashboard.openUnitModal('${s.studentId}')" 
                            class="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm">
                            <i class="fa-solid fa-building-circle-arrow-right"></i>
                            <span>${hasUnit ? 'Birimi Değiştir' : 'Birim Ata'}</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderRisksTable(risks) {
        const tbody = document.getElementById('dean-risks-table-body');
        if (!tbody) return;

        if (risks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-10 text-center text-slate-400">
                        <i class="fa-solid fa-shield-heart text-2xl mb-2 text-emerald-500"></i>
                        <p class="font-medium text-slate-600 dark:text-slate-300">Fakülte genelinde risk teşkil eden öğrenci bulunmamaktadır.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = risks.map(r => {
            const isHighRisk = r.absentDays >= 3 || r.usedLeaveDays > 7;

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-900 dark:text-white">${r.fullName}</div>
                        <div class="text-xs font-mono text-slate-400">${r.studentNumber}</div>
                    </td>
                    <td class="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                        ${r.departmentName || '-'}
                    </td>
                    <td class="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300">
                        ${r.advisorName || 'Atanmadı'}
                    </td>
                    <td class="py-3.5 px-3 text-center font-bold ${r.usedLeaveDays > 7 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}">
                        ${r.usedLeaveDays} Gün
                    </td>
                    <td class="py-3.5 px-3 text-center font-bold ${r.absentDays >= 3 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}">
                        ${r.absentDays} Gün
                    </td>
                    <td class="py-3.5 px-3 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${isHighRisk ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}">
                            <i class="fa-solid fa-flag text-xs"></i>
                            ${isHighRisk ? 'Kritik Uyarı' : 'Takipte'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-xs text-slate-500">
                        ${r.riskDescription || (isHighRisk ? 'İzin/Devamsızlık sınırına ulaşıldı' : 'Sınır eşiğinde')}
                    </td>
                </tr>
            `;
        }).join('');
    }

    openUnitModal(studentId) {
        const student = this.allStudents.find(s => s.studentId === studentId);
        if (!student) return;

        this.selectedStudent = student;
        document.getElementById('assign-unit-student-id').value = student.studentId;
        document.getElementById('assign-unit-student-name').textContent = `${student.fullName} (${student.studentNumber})`;
        document.getElementById('assign-unit-select').value = student.unitId || '';
        document.getElementById('assign-unit-note').value = '';

        document.getElementById('assign-unit-modal')?.classList.remove('hidden');
    }

    async handleAssignUnit() {
        const studentId = document.getElementById('assign-unit-student-id').value;
        const unitId = document.getElementById('assign-unit-select').value;
        const note = document.getElementById('assign-unit-note').value;

        if (!unitId) {
            AppToast.warning("Lütfen görev birimi seçiniz.");
            return;
        }

        const btn = document.getElementById('submit-assign-unit-btn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Kaydediliyor...</span>`;

        try {
            await ApiClient.Academic.assignUnit(studentId, unitId, note);
            AppToast.success("Birim görevlendirmesi başarıyla kaydedildi.");
            document.getElementById('assign-unit-modal')?.classList.add('hidden');
            await this.loadInitialData();
        } catch (error) {
            console.error("Birim atama hatası:", error);
            AppToast.error("Görevlendirme kaydedilemedi: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>Görevi Kaydet</span>`;
        }
    }
}

window.deanDashboard = new DeanDashboard();
