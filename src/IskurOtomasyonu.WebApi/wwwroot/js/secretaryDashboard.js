// ============================================================================
// Fakülte Sekreteri Paneli (İŞKUR Yönetim Merkezi)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class SecretaryDashboard {
    constructor() {
        this.payrollData = [];
        this.pendingLeaves = [];
        this.allLeaves = [];
        this.allStudents = [];
        this.departments = [];
        this.advisors = [];
        
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth() + 1;
        this.selectedDepartmentId = '';
        this.selectedAdvisorId = '';
        this.searchQuery = '';
        this.hourlyWage = 185; // İŞKUR saatlik öğrenci ücreti (TL)
    }

    async init() {
        console.log("SecretaryDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadInitialData();
    }

    renderShell() {
        const container = document.getElementById('secretary-dashboard-view');
        if (!container) return;

        const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Üst Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                <i class="fa-solid fa-briefcase text-sm"></i>
                            </span>
                            <h1 class="text-xl font-bold tracking-tight text-gray-900">
                                İŞKUR Yönetim Merkezi (Fakülte Sekreterliği)
                            </h1>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Çalışan öğrenci takibi, maaş hak edişleri, mazeret izin onayları ve devamlılık merkezi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="sec-refresh-btn" class="btn-secondary">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları (Minimal Gri-Beyaz Kutucuklar) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Çalışan Öğrenci</p>
                            <h3 id="sec-stat-total-students" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Aktif İŞKUR Kaydı</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-user-graduate"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bekleyen Mazeret</p>
                            <h3 id="sec-stat-pending-leaves" class="text-2xl font-bold text-amber-700 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Onay Bekleyen Talep</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-lg">
                            <i class="fa-solid fa-file-signature"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Aylık Toplam Çalışma</p>
                            <h3 id="sec-stat-total-hours" class="text-2xl font-bold text-teal-800 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Saat (Fiili Devam)</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-lg">
                            <i class="fa-solid fa-business-time"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Maaş / Hak Ediş</p>
                            <h3 id="sec-stat-total-salary" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Toplam Ödenecek Tutar</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-turkish-lira-sign"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Secretary Tabs">
                        <button id="sec-tab-payroll-btn" class="sec-tab-btn py-2.5 px-1 border-b-2 border-teal-800 font-semibold text-xs text-teal-900 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-table-list"></i>
                            <span>Çalışan Öğrenciler, Devamlılık & Maaş Listesi</span>
                        </button>
                        <button id="sec-tab-leaves-btn" class="sec-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-file-signature"></i>
                            <span>Mazeret İzin Talepleri Onay Merkezi</span>
                            <span id="sec-leave-count-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">0</span>
                        </button>
                        <button id="sec-tab-balance-btn" class="sec-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>Öğrenci Bazlı İzin Günleri Takibi (10 Gün Sınırı)</span>
                        </button>
                    </nav>
                </div>

                <!-- Filtreleme Çubuğu (Ay, Yıl, Bölüm, Danışman, Arama) -->
                <div class="box-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Yıl -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Yıl:</span>
                            <select id="sec-filter-year" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700">
                                <option value="2026" selected>2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>

                        <!-- Ay -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Ay:</span>
                            <select id="sec-filter-month" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700">
                                ${months.map((m, idx) => `<option value="${idx + 1}" ${idx + 1 === this.currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Bölüm -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Bölüm:</span>
                            <select id="sec-filter-department" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700 max-w-[180px]">
                                <option value="">Tüm Bölümler</option>
                            </select>
                        </div>

                        <!-- Danışman -->
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Danışman:</span>
                            <select id="sec-filter-advisor" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700 max-w-[180px]">
                                <option value="">Tüm Danışmanlar</option>
                            </select>
                        </div>
                    </div>

                    <!-- Arama Kutusu -->
                    <div class="relative w-full sm:w-64">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                            <i class="fa-solid fa-magnifying-glass text-xs"></i>
                        </span>
                        <input type="text" id="sec-search-input" placeholder="Öğrenci ara..." 
                               class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-teal-700">
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 1. PANE: ÇALIŞAN ÖĞRENCİLER, DEVAM & MAAŞ LİSTESİ -->
                <!-- ========================================================= -->
                <div id="sec-pane-payroll" class="space-y-4">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span class="font-bold text-xs text-gray-700">Çalışan Öğrenci Bilgileri & Hak Ediş Puantajı</span>
                            <span class="text-[11px] text-gray-500">Saatlik İŞKUR Katsayısı: <strong>${this.hourlyWage} ₺ / saat</strong></span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No</th>
                                        <th>Ad Soyad</th>
                                        <th>Bölüm</th>
                                        <th>Görev Birimi</th>
                                        <th>Danışman</th>
                                        <th class="text-center">Aylık Çalışma (Gün)</th>
                                        <th class="text-center">Toplam Saat</th>
                                        <th class="text-center">Devamlılık</th>
                                        <th class="text-right">Hesaplanan Maaş</th>
                                        <th class="text-center">İzin (Gün)</th>
                                    </tr>
                                </thead>
                                <tbody id="sec-payroll-table-body">
                                    <tr>
                                        <td colspan="10" class="py-8 text-center text-gray-400">
                                            <i class="fa-solid fa-spinner fa-spin text-lg mb-2 text-teal-700"></i>
                                            <p>Veriler yükleniyor...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. PANE: MAZERET İZİN TALEPLERİ ONAY MERKEZİ -->
                <!-- ========================================================= -->
                <div id="sec-pane-leaves" class="space-y-4 hidden">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span class="font-bold text-xs text-gray-700">Onay Bekleyen ve Değerlendirilen Mazeret Talepleri</span>
                            <span class="text-[11px] text-gray-500">Fakülte Sekreteri ve Danışman Onay Yetkisi</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No & Ad Soyad</th>
                                        <th>Birim & Bölüm</th>
                                        <th>İzin Türü</th>
                                        <th>Tarih Aralığı</th>
                                        <th class="text-center">Süre</th>
                                        <th>Mazeret Açıklaması</th>
                                        <th class="text-center">Durum</th>
                                        <th class="text-right">Sekreterlik Kararı</th>
                                    </tr>
                                </thead>
                                <tbody id="sec-leaves-table-body">
                                    <tr>
                                        <td colspan="8" class="py-8 text-center text-gray-400">
                                            <p>Mazeret talepleri yükleniyor...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 3. PANE: ÖĞRENCİ BAZLI İZİN GÜNLERİ & KOTA TAKİBİ -->
                <!-- ========================================================= -->
                <div id="sec-pane-balance" class="space-y-4 hidden">
                    <div class="box-card p-3 bg-amber-50/60 border-amber-200 text-amber-900 flex items-start gap-2.5">
                        <i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-xs">10 Günlük Yasal İzin Takip Kuralı:</span>
                            <span class="text-xs ml-1">Öğrencilerin yıllık toplam mazeret/sağlık izin hakkı 10 gündür. 10 günü aşan öğrencilerin İŞKUR ilişiği Dekanlık tarafından kesilir.</span>
                        </div>
                    </div>

                    <div class="box-card overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No</th>
                                        <th>Ad Soyad</th>
                                        <th>Bölüm</th>
                                        <th class="text-center">Yasal Kota</th>
                                        <th class="text-center">Kullanılan İzin</th>
                                        <th class="text-center">Kalan İzin</th>
                                        <th>Kota Durumu</th>
                                        <th class="text-center">Öğrenci Durumu</th>
                                    </tr>
                                </thead>
                                <tbody id="sec-balance-table-body">
                                    <tr>
                                        <td colspan="8" class="py-8 text-center text-gray-400">
                                            <p>Öğrenci izin bakiyeleri yükleniyor...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mazeret Reddetme Gerekçe Modalı -->
            <div id="sec-reject-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs hidden">
                <div class="box-card bg-white p-5 max-w-sm w-full space-y-3 shadow-xl">
                    <h3 class="font-bold text-gray-900 text-sm">Mazeret İznini Reddet</h3>
                    <p class="text-xs text-gray-500">Lütfen öğrenciye iletilecek ret gerekçesini yazınız:</p>
                    <input type="hidden" id="sec-reject-leave-id">
                    <textarea id="sec-reject-reason" rows="3" placeholder="Örn: Belirtilen tarihlerde fakülte etkinliği zorunludur..." 
                              class="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700"></textarea>
                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onclick="document.getElementById('sec-reject-modal').classList.add('hidden')" class="btn-secondary">
                            Vazgeç
                        </button>
                        <button type="button" id="sec-confirm-reject-btn" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold">
                            Reddet
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Yenile Butonu
        document.getElementById('sec-refresh-btn')?.addEventListener('click', () => this.loadInitialData());

        // Sekmeler
        const tabs = [
            { btn: 'sec-tab-payroll-btn', pane: 'sec-pane-payroll' },
            { btn: 'sec-tab-leaves-btn', pane: 'sec-pane-leaves' },
            { btn: 'sec-tab-balance-btn', pane: 'sec-pane-balance' }
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

        // Filtreler
        document.getElementById('sec-filter-year')?.addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.loadPayrollData();
        });

        document.getElementById('sec-filter-month')?.addEventListener('change', (e) => {
            this.currentMonth = parseInt(e.target.value);
            this.loadPayrollData();
        });

        document.getElementById('sec-filter-department')?.addEventListener('change', (e) => {
            this.selectedDepartmentId = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sec-filter-advisor')?.addEventListener('change', (e) => {
            this.selectedAdvisorId = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sec-search-input')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.applyFilters();
        });

        // Ret Onay Butonu
        document.getElementById('sec-confirm-reject-btn')?.addEventListener('click', () => this.executeRejectLeave());
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadDepartments(),
                this.loadAdvisors(),
                this.loadAllStudents(),
                this.loadPayrollData(),
                this.loadPendingLeaves()
            ]);
        } catch (err) {
            console.error("Fakülte Sekreteri verileri yüklenirken hata:", err);
            AppToast.error("Veriler yüklenirken bir sorun oluştu.");
        }
    }

    async loadDepartments() {
        try {
            const res = await ApiClient.Academic.getDepartments();
            this.departments = res.data || [];
            const select = document.getElementById('sec-filter-department');
            if (select) {
                select.innerHTML = '<option value="">Tüm Bölümler</option>';
                this.departments.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.name;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.warn("Bölümler yüklenemedi:", err);
        }
    }

    async loadAdvisors() {
        try {
            const res = await ApiClient.Academic.getAdvisors();
            this.advisors = res.data || [];
            const select = document.getElementById('sec-filter-advisor');
            if (select) {
                select.innerHTML = '<option value="">Tüm Danışmanlar</option>';
                this.advisors.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = a.fullName;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.warn("Danışmanlar yüklenemedi:", err);
        }
    }

    async loadAllStudents() {
        try {
            const res = await ApiClient.Academic.getAllStudents();
            this.allStudents = res.data || [];
            this.renderBalanceTable();
            this.updateKpiStats();
        } catch (err) {
            console.warn("Öğrenci listesi yüklenemedi:", err);
        }
    }

    async loadPayrollData() {
        try {
            const res = await ApiClient.Report.getMonthlySummary({
                year: this.currentYear,
                month: this.currentMonth
            });
            this.payrollData = res.data || [];
            this.applyFilters();
        } catch (err) {
            console.warn("Puantaj verisi yüklenemedi:", err);
            this.payrollData = [];
            this.applyFilters();
        }
    }

    async loadPendingLeaves() {
        try {
            const res = await ApiClient.Leave.getPending();
            this.pendingLeaves = res.data || [];
            
            const badge = document.getElementById('sec-leave-count-badge');
            if (badge) {
                badge.textContent = this.pendingLeaves.length;
                if (this.pendingLeaves.length > 0) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }

            document.getElementById('sec-stat-pending-leaves').textContent = this.pendingLeaves.length;
            this.renderLeavesTable();
        } catch (err) {
            console.warn("Bekleyen mazeretler yüklenemedi:", err);
        }
    }

    applyFilters() {
        let filtered = [...this.payrollData];

        if (this.selectedDepartmentId) {
            filtered = filtered.filter(p => {
                const s = this.allStudents.find(stud => stud.studentId === p.studentId);
                return s && s.departmentId === this.selectedDepartmentId;
            });
        }

        if (this.selectedAdvisorId) {
            filtered = filtered.filter(p => {
                const s = this.allStudents.find(stud => stud.studentId === p.studentId);
                return s && s.advisorId === this.selectedAdvisorId;
            });
        }

        if (this.searchQuery) {
            filtered = filtered.filter(p => 
                (p.studentNumber && p.studentNumber.toLowerCase().includes(this.searchQuery)) ||
                (p.fullName && p.fullName.toLowerCase().includes(this.searchQuery))
            );
        }

        this.renderPayrollTable(filtered);
        this.updatePayrollKpis(filtered);
    }

    renderPayrollTable(data) {
        const tbody = document.getElementById('sec-payroll-table-body');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="py-8 text-center text-gray-400">
                        Seçilen kriterlere uygun öğrenci puantaj kaydı bulunamadı.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const hours = item.totalHoursWorked || 0;
            const salary = hours * this.hourlyWage;
            const targetHours = item.plannedHours || (item.plannedDaysCount * 5) || 1;
            const attendanceRatio = Math.min(100, Math.round((hours / (targetHours || 1)) * 100));

            let ratioBadgeClass = 'badge-success';
            if (attendanceRatio < 50) ratioBadgeClass = 'badge-danger';
            else if (attendanceRatio < 80) ratioBadgeClass = 'badge-warning';

            return `
                <tr>
                    <td class="font-mono font-medium">${item.studentNumber || '-'}</td>
                    <td class="font-semibold text-gray-900">${item.fullName || '-'}</td>
                    <td>${item.departmentName || '-'}</td>
                    <td><span class="badge-minimal badge-neutral">${item.unitName || 'Atanmadı'}</span></td>
                    <td>${item.advisorName || 'Atanmadı'}</td>
                    <td class="text-center font-bold text-gray-900">${item.actualDaysCount || 0} Gün</td>
                    <td class="text-center font-bold text-teal-800">${hours} Saat</td>
                    <td class="text-center">
                        <span class="badge-minimal ${ratioBadgeClass}">%${attendanceRatio}</span>
                    </td>
                    <td class="text-right font-black text-gray-900 font-mono">
                        ${salary.toLocaleString('tr-TR')} ₺
                    </td>
                    <td class="text-center">
                        ${item.approvedLeaveDays > 0 
                            ? `<span class="badge-minimal badge-info">${item.approvedLeaveDays} Gün</span>` 
                            : `<span class="text-gray-400">-</span>`}
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderLeavesTable() {
        const tbody = document.getElementById('sec-leaves-table-body');
        if (!tbody) return;

        if (!this.pendingLeaves || this.pendingLeaves.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 text-center text-gray-400">
                        Şu anda onay bekleyen mazeret izin talebi bulunmamaktadır.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.pendingLeaves.map(leave => {
            const sDate = new Date(leave.startDate).toLocaleDateString('tr-TR');
            const eDate = new Date(leave.endDate).toLocaleDateString('tr-TR');
            const student = this.allStudents.find(s => s.studentId === leave.studentId);

            return `
                <tr>
                    <td>
                        <div class="font-bold text-gray-900">${leave.studentName || (student ? student.fullName : 'Öğrenci')}</div>
                        <div class="font-mono text-[10px] text-gray-400">${student?.studentNumber || ''}</div>
                    </td>
                    <td>
                        <div>${student?.unitName || 'Fakülte'}</div>
                        <div class="text-[10px] text-gray-400">${student?.departmentName || '-'}</div>
                    </td>
                    <td>
                        <span class="badge-minimal badge-info">${leave.leaveType || 'Mazeret'}</span>
                    </td>
                    <td>${sDate} - ${eDate}</td>
                    <td class="text-center font-bold">${leave.totalDays} Gün</td>
                    <td class="max-w-[200px] truncate" title="${leave.reason || ''}">${leave.reason || '-'}</td>
                    <td class="text-center">
                        <span class="badge-minimal badge-warning">Onay Bekliyor</span>
                    </td>
                    <td class="text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                            <button onclick="window.secretaryDashboard.evaluateLeave('${leave.id}', 1)" 
                                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition">
                                <i class="fa-solid fa-check mr-1"></i>Onayla
                            </button>
                            <button onclick="window.secretaryDashboard.openRejectModal('${leave.id}')" 
                                    class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition">
                                <i class="fa-solid fa-xmark mr-1"></i>Reddet
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderBalanceTable() {
        const tbody = document.getElementById('sec-balance-table-body');
        if (!tbody) return;

        if (!this.allStudents || this.allStudents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-gray-400">Öğrenci kaydı bulunamadı.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.allStudents.map(s => {
            const remaining = s.remainingLeaveDays ?? 10;
            const used = 10 - remaining;

            let quotaBadge = `<span class="badge-minimal badge-success">Güvenli</span>`;
            if (used >= 10) {
                quotaBadge = `<span class="badge-minimal badge-danger">10 Gün Aşımı / Kritik</span>`;
            } else if (remaining <= 2) {
                quotaBadge = `<span class="badge-minimal badge-warning">Sınırda (Son ${remaining} Gün)</span>`;
            }

            let statusBadge = `<span class="badge-minimal badge-success">Aktif</span>`;
            if (s.status === 'Terminated') {
                statusBadge = `<span class="badge-minimal badge-danger">İlişik Kesildi</span>`;
            } else if (s.status === 'Suspended') {
                statusBadge = `<span class="badge-minimal badge-warning">Askıda</span>`;
            }

            return `
                <tr>
                    <td class="font-mono">${s.studentNumber || '-'}</td>
                    <td class="font-bold text-gray-900">${s.fullName || '-'}</td>
                    <td>${s.departmentName || '-'}</td>
                    <td class="text-center font-bold">10 Gün</td>
                    <td class="text-center font-semibold text-gray-700">${used} Gün</td>
                    <td class="text-center font-bold ${remaining <= 2 ? 'text-rose-700' : 'text-teal-800'}">${remaining} Gün</td>
                    <td>${quotaBadge}</td>
                    <td class="text-center">${statusBadge}</td>
                </tr>
            `;
        }).join('');
    }

    updateKpiStats() {
        const totalStudents = this.allStudents.length;
        document.getElementById('sec-stat-total-students').textContent = totalStudents;
    }

    updatePayrollKpis(data) {
        const totalHours = data.reduce((acc, curr) => acc + (curr.totalHoursWorked || 0), 0);
        const totalSalary = totalHours * this.hourlyWage;

        document.getElementById('sec-stat-total-hours').textContent = `${totalHours} Saat`;
        document.getElementById('sec-stat-total-salary').textContent = `${totalSalary.toLocaleString('tr-TR')} ₺`;
    }

    async evaluateLeave(leaveId, decision, rejectionReason = null) {
        try {
            await ApiClient.Leave.evaluate(leaveId, decision, rejectionReason);
            AppToast.success(decision === 1 ? "Mazeret izin talebi onaylandı." : "Mazeret talebi reddedildi.");
            await this.loadPendingLeaves();
            await this.loadAllStudents();
        } catch (err) {
            console.error("İzin değerlendirme hatası:", err);
            AppToast.error(err.message || "İşlem sırasında hata oluştu.");
        }
    }

    openRejectModal(leaveId) {
        document.getElementById('sec-reject-leave-id').value = leaveId;
        document.getElementById('sec-reject-reason').value = '';
        document.getElementById('sec-reject-modal').classList.remove('hidden');
    }

    async executeRejectLeave() {
        const leaveId = document.getElementById('sec-reject-leave-id').value;
        const reason = document.getElementById('sec-reject-reason').value.trim();

        if (!reason) {
            AppToast.warning("Lütfen ret gerekçesi giriniz.");
            return;
        }

        document.getElementById('sec-reject-modal').classList.add('hidden');
        await this.evaluateLeave(leaveId, 2, reason); // 2 = Rejected
    }
}

window.secretaryDashboard = new SecretaryDashboard();
