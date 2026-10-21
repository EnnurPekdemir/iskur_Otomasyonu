// ============================================================================
// Bölüm Başkanı Paneli (Department Dashboard)
// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu
// ============================================================================

class DepartmentDashboard {
    constructor() {
        this.students = [];
        this.advisors = [];
        this.riskWarnings = [];
        this.departments = [];
        this.currentDepartmentId = null;
        this.selectedStudent = null;
        this.isInitialized = false;
    }

    async init() {
        console.log("DepartmentDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadInitialData();
        this.isInitialized = true;
    }

    renderShell() {
        const container = document.getElementById('department-dashboard-view');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Üst Bar -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                                <i class="fa-solid fa-graduation-cap text-lg"></i>
                            </span>
                            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Bölüm Başkanlığı Yönetim Paneli
                            </h1>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" id="dept-info-text">
                            Bölüm İŞKUR öğrencileri, danışman atamaları ve devam devamsızlık takip merkezi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="dept-refresh-btn" class="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm inline-flex items-center gap-2">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Bölüm Öğrencisi</p>
                            <h3 id="stat-total-students" class="text-2xl font-black text-slate-900 dark:text-white mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Aktif İŞKUR Kaydı</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Danışmansız Öğrenci</p>
                            <h3 id="stat-unassigned-advisors" class="text-2xl font-black text-amber-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Atama Bekliyor</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-user-clock"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk & Uyarı Sayısı</p>
                            <h3 id="stat-risk-count" class="text-2xl font-black text-rose-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">İzin / Devamsızlık</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Öğretim Elemanı</p>
                            <h3 id="stat-advisor-count" class="text-2xl font-black text-emerald-600 mt-1">-</h3>
                            <p class="text-xs text-slate-500 mt-1">Danışman Havuzu</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-chalkboard-user"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-slate-200 dark:border-slate-800">
                    <nav class="flex space-x-6" aria-label="Tabs">
                        <button id="dept-tab-students-btn" class="dept-tab-btn py-3 px-1 border-b-2 border-indigo-600 font-semibold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <i class="fa-solid fa-table-list"></i>
                            <span>Bölüm İŞKUR Öğrencileri & Danışman Atama</span>
                        </button>
                        <button id="dept-tab-risks-btn" class="dept-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>Devamsızlık & Risk Uyarıları</span>
                            <span id="dept-risk-badge" class="hidden px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 font-bold">0</span>
                        </button>
                    </nav>
                </div>

                <!-- 1. Sekme: Öğrenci Tablosu -->
                <div id="dept-pane-students" class="space-y-4">
                    <!-- Filtreleme ve Arama Çubuğu -->
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                        <div class="relative w-full md:w-80">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                <i class="fa-solid fa-magnifying-glass text-xs"></i>
                            </span>
                            <input type="text" id="dept-student-search" placeholder="Öğrenci no veya ad soyad ile ara..." 
                                class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200">
                        </div>

                        <div class="flex items-center gap-3 w-full md:w-auto">
                            <select id="dept-advisor-filter" class="w-full md:w-auto px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option value="">Tüm Danışmanlar</option>
                                <option value="unassigned">Danışmansız Öğrenciler</option>
                            </select>

                            <select id="dept-status-filter" class="w-full md:w-auto px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                                <option value="">Tüm Durumlar</option>
                                <option value="Active">Aktif</option>
                                <option value="Suspended">Askıya Alındı</option>
                                <option value="Graduated">Mezun</option>
                                <option value="Terminated">İlişik Kesildi</option>
                            </select>
                        </div>
                    </div>

                    <!-- Öğrenci Listesi Tablosu -->
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-4">Öğrenci No</th>
                                        <th class="py-3.5 px-4">Ad Soyad & İletişim</th>
                                        <th class="py-3.5 px-4">Atanmış Danışman</th>
                                        <th class="py-3.5 px-4">Görev Birimi</th>
                                        <th class="py-3.5 px-4 text-center">Kalan İzin</th>
                                        <th class="py-3.5 px-4 text-center">Durum</th>
                                        <th class="py-3.5 px-4 text-right">Aksiyonlar</th>
                                    </tr>
                                </thead>
                                <tbody id="dept-students-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="7" class="py-12 text-center text-slate-400">
                                            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-indigo-500"></i>
                                            <p>Öğrenci verileri yükleniyor...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 2. Sekme: Devamsızlık & Risk Uyarıları Paneli -->
                <div id="dept-pane-risks" class="hidden space-y-4">
                    <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                        <i class="fa-solid fa-circle-exclamation text-amber-500 text-lg mt-0.5"></i>
                        <div>
                            <h4 class="font-bold text-sm">Bölüm İŞKUR Risk Denetim Bildirimi</h4>
                            <p class="text-xs mt-0.5 text-amber-700 dark:text-amber-300">
                                İzin hakkı sınırına yaklaşan (>7 gün kullanılan) veya onaylı çalışma planına rağmen QR yoklamasına katılmayan öğrencilerin kritik uyarı listesidir.
                            </p>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th class="py-3.5 px-4">Öğrenci</th>
                                        <th class="py-3.5 px-4">Danışman</th>
                                        <th class="py-3.5 px-4 text-center">Kullanılan İzin</th>
                                        <th class="py-3.5 px-4 text-center">Devamsızlık (Gün)</th>
                                        <th class="py-3.5 px-4 text-center">Risk Seviyesi</th>
                                        <th class="py-3.5 px-4">Açıklama / Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="dept-risks-table-body" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td colspan="6" class="py-8 text-center text-slate-400">
                                            Kayıtlı riskli öğrenci bulunmamaktadır.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Danışman Atama / Değiştirme Modalı -->
            <div id="assign-advisor-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                <i class="fa-solid fa-user-plus text-sm"></i>
                            </span>
                            <h3 class="font-bold text-slate-900 dark:text-white">Danışman Atama & Değiştirme</h3>
                        </div>
                        <button id="close-assign-advisor-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <form id="assign-advisor-form" class="mt-4 space-y-4">
                        <input type="hidden" id="assign-student-id">

                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Seçili Öğrenci</label>
                            <div id="assign-student-name" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-slate-200 text-sm">
                                -
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mevcut Danışman</label>
                            <div id="assign-current-advisor" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm">
                                -
                            </div>
                        </div>

                        <div>
                            <label for="assign-advisor-select" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Yeni Danışman Öğretim Elemanı <span class="text-rose-500">*</span>
                            </label>
                            <select id="assign-advisor-select" required class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                                <option value="">Öğretim Elemanı Seçiniz...</option>
                            </select>
                        </div>

                        <div>
                            <label for="assign-note" class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Atama Gerekçesi / Notu (Opsiyonel)</label>
                            <textarea id="assign-note" rows="2" placeholder="Örn: 2026 Bahar dönemi İŞKUR danışmanlık görevlendirmesi" 
                                class="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" id="cancel-assign-advisor-btn" class="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                İptal
                            </button>
                            <button type="submit" id="submit-assign-advisor-btn" class="px-5 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center gap-2">
                                <i class="fa-solid fa-check text-xs"></i>
                                <span>Atamayı Kaydet</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Yenile Butonu
        document.getElementById('dept-refresh-btn')?.addEventListener('click', () => {
            this.loadInitialData();
            AppToast.info("Veriler güncelleniyor...");
        });

        // Sekmeler
        const tabStudents = document.getElementById('dept-tab-students-btn');
        const tabRisks = document.getElementById('dept-tab-risks-btn');
        const paneStudents = document.getElementById('dept-pane-students');
        const paneRisks = document.getElementById('dept-pane-risks');

        tabStudents?.addEventListener('click', () => {
            tabStudents.classList.add('border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
            tabStudents.classList.remove('border-transparent', 'text-slate-500');
            tabRisks.classList.remove('border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
            tabRisks.classList.add('border-transparent', 'text-slate-500');

            paneStudents?.classList.remove('hidden');
            paneRisks?.classList.add('hidden');
        });

        tabRisks?.addEventListener('click', () => {
            tabRisks.classList.add('border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
            tabRisks.classList.remove('border-transparent', 'text-slate-500');
            tabStudents.classList.remove('border-indigo-600', 'text-indigo-600', 'dark:text-indigo-400');
            tabStudents.classList.add('border-transparent', 'text-slate-500');

            paneRisks?.classList.remove('hidden');
            paneStudents?.classList.add('hidden');
        });

        // Arama ve Filtreler
        document.getElementById('dept-student-search')?.addEventListener('input', () => this.filterStudents());
        document.getElementById('dept-advisor-filter')?.addEventListener('change', () => this.filterStudents());
        document.getElementById('dept-status-filter')?.addEventListener('change', () => this.filterStudents());

        // Danışman Atama Modalı Olayları
        const modal = document.getElementById('assign-advisor-modal');
        document.getElementById('close-assign-advisor-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));
        document.getElementById('cancel-assign-advisor-btn')?.addEventListener('click', () => modal?.classList.add('hidden'));

        document.getElementById('assign-advisor-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAssignAdvisor();
        });
    }

    async loadInitialData() {
        try {
            // Danışmanlar ve Bölüm öğrencilerini paralel çek
            const [advisorsRes, studentsRes] = await Promise.all([
                ApiClient.Academic.getAdvisors(),
                ApiClient.Academic.getDepartmentStudents()
            ]);

            this.advisors = advisorsRes.data || [];
            this.students = studentsRes.data || [];

            // Danışman select kutusunu doldur
            this.populateAdvisorSelect();

            // Risk uyarılarını çek
            try {
                const risksRes = await ApiClient.Report.getRiskWarnings();
                this.riskWarnings = risksRes.data || [];
            } catch (err) {
                console.warn("Risk uyarıları servisi:", err);
                this.riskWarnings = [];
            }

            this.updateKpiStats();
            this.renderStudentsTable(this.students);
            this.renderRisksTable(this.riskWarnings);

        } catch (error) {
            console.error("Bölüm verileri yüklenirken hata:", error);
            AppToast.error("Veriler yüklenirken bir hata oluştu: " + error.message);
        }
    }

    populateAdvisorSelect() {
        const select = document.getElementById('assign-advisor-select');
        const filterSelect = document.getElementById('dept-advisor-filter');
        if (!select) return;

        select.innerHTML = '<option value="">Öğretim Elemanı Seçiniz...</option>';
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Tüm Danışmanlar</option><option value="unassigned">Danışmansız Öğrenciler</option>';
        }

        this.advisors.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = `${a.academicTitle ? a.academicTitle + ' ' : ''}${a.fullName}`;
            select.appendChild(opt);

            if (filterSelect) {
                const fOpt = document.createElement('option');
                fOpt.value = a.id;
                fOpt.textContent = opt.textContent;
                filterSelect.appendChild(fOpt);
            }
        });
    }

    updateKpiStats() {
        const totalCount = this.students.length;
        const unassignedCount = this.students.filter(s => !s.advisorId).length;
        const riskCount = this.riskWarnings.length;

        document.getElementById('stat-total-students').textContent = totalCount;
        document.getElementById('stat-unassigned-advisors').textContent = unassignedCount;
        document.getElementById('stat-risk-count').textContent = riskCount;
        document.getElementById('stat-advisor-count').textContent = this.advisors.length;

        const riskBadge = document.getElementById('dept-risk-badge');
        if (riskBadge) {
            if (riskCount > 0) {
                riskBadge.textContent = riskCount;
                riskBadge.classList.remove('hidden');
            } else {
                riskBadge.classList.add('hidden');
            }
        }
    }

    filterStudents() {
        const search = document.getElementById('dept-student-search')?.value.toLowerCase().trim() || '';
        const advisorFilter = document.getElementById('dept-advisor-filter')?.value || '';
        const statusFilter = document.getElementById('dept-status-filter')?.value || '';

        const filtered = this.students.filter(s => {
            const matchSearch = !search || 
                s.fullName.toLowerCase().includes(search) || 
                (s.studentNumber && s.studentNumber.toLowerCase().includes(search));

            let matchAdvisor = true;
            if (advisorFilter === 'unassigned') {
                matchAdvisor = !s.advisorId;
            } else if (advisorFilter) {
                matchAdvisor = s.advisorId === advisorFilter;
            }

            const matchStatus = !statusFilter || s.status === statusFilter;

            return matchSearch && matchAdvisor && matchStatus;
        });

        this.renderStudentsTable(filtered);
    }

    renderStudentsTable(studentsList) {
        const tbody = document.getElementById('dept-students-table-body');
        if (!tbody) return;

        if (studentsList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-10 text-center text-slate-400">
                        <i class="fa-solid fa-folder-open text-2xl mb-2 text-slate-300"></i>
                        <p>Kriterlere uygun öğrenci kaydı bulunamadı.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = studentsList.map(s => {
            const statusBadge = this.getStatusBadge(s.status);
            const hasAdvisor = !!s.advisorId;

            return `
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        ${s.studentNumber || '-'}
                    </td>
                    <td class="py-3.5 px-4">
                        <div class="font-bold text-slate-900 dark:text-white">${s.fullName}</div>
                        <div class="text-xs text-slate-400">${s.email || '-'}</div>
                    </td>
                    <td class="py-3.5 px-4">
                        ${hasAdvisor 
                            ? `<span class="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                 <i class="fa-solid fa-chalkboard-user text-xs text-indigo-500"></i>
                                 ${s.advisorName}
                               </span>`
                            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                 <i class="fa-solid fa-triangle-exclamation text-xs"></i>
                                 Atama Yapılmadı
                               </span>`
                        }
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <i class="fa-solid fa-building text-slate-400"></i>
                            ${s.unitName || 'Atanmadı'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <span class="font-bold text-xs px-2.5 py-1 rounded-lg ${s.remainingLeaveDays <= 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
                            ${s.remainingLeaveDays} / 10 Gün
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        ${statusBadge}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <button onclick="window.deptDashboard.openAssignModal('${s.studentId}')" 
                            class="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm">
                            <i class="fa-solid fa-user-pen"></i>
                            <span>${hasAdvisor ? 'Danışman Değiştir' : 'Danışman Ata'}</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderRisksTable(risks) {
        const tbody = document.getElementById('dept-risks-table-body');
        if (!tbody) return;

        if (risks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-10 text-center text-slate-400">
                        <i class="fa-solid fa-circle-check text-2xl mb-2 text-emerald-500"></i>
                        <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Harika! Bölümde riskli veya devamsızlık sınırına ulaşan öğrenci bulunmuyor.</p>
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
                    <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        ${r.advisorName || 'Atanmadı'}
                    </td>
                    <td class="py-3.5 px-4 text-center font-bold ${r.usedLeaveDays > 7 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}">
                        ${r.usedLeaveDays} Gün
                    </td>
                    <td class="py-3.5 px-4 text-center font-bold ${r.absentDays >= 3 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}">
                        ${r.absentDays} Gün
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <span class="px-2.5 py-1 text-xs font-bold rounded-full ${isHighRisk ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}">
                            ${isHighRisk ? 'Yüksek Risk (Kritik)' : 'Orta Risk (Uyarı)'}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-xs text-slate-500">
                        ${r.riskDescription || (isHighRisk ? 'İzin/Devamsızlık sınırına ulaşıldı' : 'Sınır eşiğinde')}
                    </td>
                </tr>
            `;
        }).join('');
    }

    openAssignModal(studentId) {
        const student = this.students.find(s => s.studentId === studentId);
        if (!student) return;

        this.selectedStudent = student;
        document.getElementById('assign-student-id').value = student.studentId;
        document.getElementById('assign-student-name').textContent = `${student.fullName} (${student.studentNumber})`;
        document.getElementById('assign-current-advisor').textContent = student.advisorName || 'Atama Yapılmadı';
        document.getElementById('assign-advisor-select').value = student.advisorId || '';
        document.getElementById('assign-note').value = '';

        document.getElementById('assign-advisor-modal')?.classList.remove('hidden');
    }

    async handleAssignAdvisor() {
        const studentId = document.getElementById('assign-student-id').value;
        const advisorId = document.getElementById('assign-advisor-select').value;
        const note = document.getElementById('assign-note').value;

        if (!advisorId) {
            AppToast.warning("Lütfen danışman öğretim elemanı seçiniz.");
            return;
        }

        const btn = document.getElementById('submit-assign-advisor-btn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Kaydediliyor...</span>`;

        try {
            await ApiClient.Academic.assignAdvisor(studentId, advisorId, note);
            AppToast.success("Danışman ataması başarıyla gerçekleştirildi.");
            document.getElementById('assign-advisor-modal')?.classList.add('hidden');
            await this.loadInitialData();
        } catch (error) {
            console.error("Danışman atama hatası:", error);
            AppToast.error("Atama kaydedilemedi: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>Atamayı Kaydet</span>`;
        }
    }

    getStatusBadge(status) {
        switch (status) {
            case 'Active':
                return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Aktif</span>`;
            case 'Suspended':
                return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Askıda</span>`;
            case 'Graduated':
                return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">Mezun</span>`;
            case 'Terminated':
                return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">İlişik Kesildi</span>`;
            default:
                return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">${status || 'Bilinmiyor'}</span>`;
        }
    }
}

window.deptDashboard = new DepartmentDashboard();
