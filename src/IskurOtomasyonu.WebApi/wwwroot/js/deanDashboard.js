// ============================================================================
// Dekanlık Paneli (Dean Dashboard)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class DeanDashboard {
    constructor() {
        this.payrollData = [];
        this.allStudents = [];
        this.departments = [];
        this.riskWarnings = [];
        this.selectedDepartmentId = '';
        
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth() + 1;
        this.hourlyWage = 185; // TL
        this.totalSemesterBudget = 500000; // TL Dönemlik İŞKUR Ödenek Kotası
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
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-800 font-bold border border-gray-300">
                                <i class="fa-solid fa-landmark text-sm"></i>
                            </span>
                            <h1 class="text-xl font-bold tracking-tight text-gray-900">
                                Dekanlık Yönetim & İŞKUR Ödenek Takip Paneli
                            </h1>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Fakülte İŞKUR bütçe planlaması, toplam öğrenci istatistikleri ve 10 günlük izin aşımı takip merkezi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="dean-export-excel-btn" class="btn-secondary">
                            <i class="fa-solid fa-file-excel text-emerald-600 text-xs"></i>
                            <span>Excel Puantaj İndir</span>
                        </button>
                        <button id="dean-refresh-btn" class="btn-secondary">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları (Minimal Gri-Beyaz Kutucuklar) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toplam İŞKUR Öğrencisi</p>
                            <h3 id="dean-stat-students" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">5 Bölüm Genelinde</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dönemlik Ödenek Bütçesi</p>
                            <h3 id="dean-stat-budget" class="text-2xl font-bold text-teal-800 mt-0.5">${(this.totalSemesterBudget).toLocaleString('tr-TR')} ₺</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">İŞKUR Tahsisli Ödenek</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-lg">
                            <i class="fa-solid fa-wallet"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Gerçekleşen Harcama</p>
                            <h3 id="dean-stat-spent" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Hak Edilen Toplam Maaş</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-coins"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">10 Gün İzin Aşımı Riski</p>
                            <h3 id="dean-stat-risks" class="text-2xl font-bold text-rose-700 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">İlişik Kesme Adayı</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 text-lg">
                            <i class="fa-solid fa-user-slash"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Dean Tabs">
                        <button id="dean-tab-budget-btn" class="dean-tab-btn py-2.5 px-1 border-b-2 border-teal-800 font-semibold text-xs text-teal-900 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-chart-pie"></i>
                            <span>İŞKUR Ödenek Planlaması & Bölüm İstatistikleri</span>
                        </button>
                        <button id="dean-tab-termination-btn" class="dean-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-triangle-exclamation text-rose-600"></i>
                            <span>10 Gün Yasal İzin Sınırını Aşanlar & İlişik Kesme</span>
                            <span id="dean-risk-count-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-800 font-bold">0</span>
                        </button>
                        <button id="dean-tab-payroll-btn" class="dean-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-file-invoice"></i>
                            <span>Fakülte Resmi Puantaj Tablosu</span>
                        </button>
                    </nav>
                </div>

                <!-- Filtreleme Çubuğu (Yıl, Ay, Bölüm) -->
                <div class="box-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Yıl:</span>
                            <select id="dean-filter-year" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700">
                                <option value="2026" selected>2026</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Ay:</span>
                            <select id="dean-filter-month" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700">
                                ${months.map((m, idx) => `<option value="${idx + 1}" ${idx + 1 === this.currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-gray-500 font-medium">Bölüm:</span>
                            <select id="dean-filter-dept" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700 max-w-[200px]">
                                <option value="">Tüm Bölümler</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 1. PANE: ÖDENEK PLANLAMASI & BÖLÜM İSTATİSTİKLERİ -->
                <!-- ========================================================= -->
                <div id="dean-pane-budget" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Ödenek Kullanım Özeti -->
                        <div class="box-card p-4 space-y-3">
                            <h3 class="font-bold text-xs text-gray-800 uppercase tracking-wider">İŞKUR Ödenek Tüketim Oranı</h3>
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-gray-500">Tahsis Edilen Bütçe:</span>
                                    <span class="font-bold font-mono">${this.totalSemesterBudget.toLocaleString('tr-TR')} ₺</span>
                                </div>
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-gray-500">Kullanılan Toplam Tutar:</span>
                                    <span id="dean-budget-spent-val" class="font-bold font-mono text-teal-800">0 ₺</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div id="dean-budget-progress-bar" class="bg-teal-700 h-3 rounded-full transition-all duration-500" style="width: 15%"></div>
                                </div>
                                <div class="flex items-center justify-between text-[11px] text-gray-400">
                                    <span id="dean-budget-percent">%0 Kullanıldı</span>
                                    <span id="dean-budget-remaining">Kalan: ${this.totalSemesterBudget.toLocaleString('tr-TR')} ₺</span>
                                </div>
                            </div>
                        </div>

                        <!-- İŞKUR Katılım ve Yasal Kural Notu -->
                        <div class="box-card p-4 space-y-2">
                            <h3 class="font-bold text-xs text-gray-800 uppercase tracking-wider">Yasal İŞKUR Mevzuatı</h3>
                            <ul class="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                                <li>Haftalık çalışma süresi en fazla <strong>3 gün</strong> ve günlük <strong>5 saat</strong>tir.</li>
                                <li>Öğrenciler bir ayda en fazla <strong>60 saat</strong> fiili çalışma yapabilir.</li>
                                <li>Yıllık mazeret/sağlık izin hakkı toplam <strong>10 iş günü</strong>dür.</li>
                                <li>10 günlük yasal sınırı aşan öğrencilerin İŞKUR ilişiği Dekanlıkça derhal kesilir.</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Bölüm Bazlı İstatistik ve Ödenek Dağılım Tablosu -->
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50">
                            <span class="font-bold text-xs text-gray-700">Bölüm Bazlı İŞKUR Öğrenci ve Ödenek Dağılımı</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Bölüm Adı</th>
                                        <th class="text-center">Öğrenci Sayısı</th>
                                        <th class="text-center">Aylık Toplam Çalışma (Saat)</th>
                                        <th class="text-right">Aylık Tahakkuk Eden Maaş (₺)</th>
                                        <th class="text-center">Risk Taşıyan Öğrenci</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-dept-stats-table-body">
                                    <tr>
                                        <td colspan="5" class="py-6 text-center text-gray-400">Yükleniyor...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. PANE: 10 GÜN İZİN AŞIMI & İLİŞİK KESME -->
                <!-- ========================================================= -->
                <div id="dean-pane-termination" class="space-y-4 hidden">
                    <div class="box-card p-4 bg-rose-50/70 border-rose-200 text-rose-900 flex items-start gap-3">
                        <i class="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5"></i>
                        <div>
                            <h4 class="font-bold text-xs">10 Günlük Yasal İzin Sınırı ve İlişik Kesme Kuralı</h4>
                            <p class="text-xs text-rose-800 mt-0.5">
                                İŞKUR protokolü gereğince, yıllık toplam 10 iş günü izin kotasını dolduran veya devamsızlık nedeniyle sınırı aşan öğrencilerin programa devam hakkı sona erer. Aşağıdaki listeden öğrencilerin İŞKUR ilişiğini resmi olarak kesebilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div class="box-card overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No & Ad Soyad</th>
                                        <th>Bölüm</th>
                                        <th>Danışman</th>
                                        <th class="text-center">Kullanılan İzin</th>
                                        <th class="text-center">Kalan İzin</th>
                                        <th class="text-center">Devamsız Gün</th>
                                        <th>Risk Durumu</th>
                                        <th class="text-right">Dekanlık Aksiyonu</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-risk-table-body">
                                    <tr>
                                        <td colspan="8" class="py-8 text-center text-gray-400">
                                            İzin aşımı olan öğrenci verileri inceleniyor...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 3. PANE: RESMİ PUANTAJ TABLOSU -->
                <!-- ========================================================= -->
                <div id="dean-pane-payroll" class="space-y-4 hidden">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span class="font-bold text-xs text-gray-700">Resmi Fakülte Ay Sonu Puantaj Verisi</span>
                            <button onclick="window.deanDashboard.exportCsv()" class="btn-secondary text-[11px] py-1 px-2.5">
                                <i class="fa-solid fa-file-csv text-xs text-blue-600"></i>
                                <span>CSV İndir</span>
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No</th>
                                        <th>Ad Soyad</th>
                                        <th>TCKN (KVKK)</th>
                                        <th>Bölüm</th>
                                        <th>Danışman</th>
                                        <th class="text-center">Çalışılan Gün</th>
                                        <th class="text-center">Toplam Saat</th>
                                        <th class="text-right">Net Ödenecek Maaş</th>
                                        <th>IBAN No</th>
                                    </tr>
                                </thead>
                                <tbody id="dean-payroll-table-body">
                                    <tr>
                                        <td colspan="9" class="py-8 text-center text-gray-400">Yükleniyor...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- İlişik Kesme Onay Modalı -->
            <div id="dean-terminate-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs hidden">
                <div class="box-card bg-white p-5 max-w-sm w-full space-y-3 shadow-xl">
                    <div class="flex items-center gap-2 text-rose-700">
                        <i class="fa-solid fa-triangle-exclamation text-base"></i>
                        <h3 class="font-bold text-sm">İŞKUR İlişiğini Kes</h3>
                    </div>
                    <p class="text-xs text-gray-600">
                        <strong id="dean-terminate-student-name">Öğrenci</strong> adlı öğrencinin İŞKUR ilişiği kesilecektir. Bu işlem geri alınamaz.
                    </p>
                    <input type="hidden" id="dean-terminate-student-id">
                    <div>
                        <label class="block text-[11px] font-semibold text-gray-500 mb-1">Gerekçe</label>
                        <textarea id="dean-terminate-reason" rows="2" class="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-rose-600">10 günlük yasal izin sınırının aşılması ve devamsızlık</textarea>
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onclick="document.getElementById('dean-terminate-modal').classList.add('hidden')" class="btn-secondary">
                            Vazgeç
                        </button>
                        <button type="button" id="dean-confirm-terminate-btn" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold">
                            İlişiği Kes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('dean-refresh-btn')?.addEventListener('click', () => this.loadInitialData());

        // Sekmeler
        const tabs = [
            { btn: 'dean-tab-budget-btn', pane: 'dean-pane-budget' },
            { btn: 'dean-tab-termination-btn', pane: 'dean-pane-termination' },
            { btn: 'dean-tab-payroll-btn', pane: 'dean-pane-payroll' }
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
        document.getElementById('dean-filter-year')?.addEventListener('change', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.loadPayrollData();
        });

        document.getElementById('dean-filter-month')?.addEventListener('change', (e) => {
            this.currentMonth = parseInt(e.target.value);
            this.loadPayrollData();
        });

        document.getElementById('dean-filter-dept')?.addEventListener('change', (e) => {
            this.selectedDepartmentId = e.target.value;
            this.renderFilteredViews();
        });

        // Dışa Aktarma
        document.getElementById('dean-export-excel-btn')?.addEventListener('click', () => this.exportExcel());

        // İlişik Kes Onay Butonu
        document.getElementById('dean-confirm-terminate-btn')?.addEventListener('click', () => this.executeTermination());
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadDepartments(),
                this.loadAllStudents(),
                this.loadPayrollData(),
                this.loadRiskWarnings()
            ]);
        } catch (err) {
            console.error("Dekanlık verileri yüklenirken hata:", err);
            AppToast.error("Veriler yüklenirken bir sorun oluştu.");
        }
    }

    async loadDepartments() {
        try {
            const res = await ApiClient.Academic.getDepartments();
            this.departments = res.data || [];
            const select = document.getElementById('dean-filter-dept');
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

    async loadAllStudents() {
        try {
            const res = await ApiClient.Academic.getAllStudents();
            this.allStudents = res.data || [];
            document.getElementById('dean-stat-students').textContent = this.allStudents.length;
        } catch (err) {
            console.warn("Öğrenciler yüklenemedi:", err);
        }
    }

    async loadPayrollData() {
        try {
            const res = await ApiClient.Report.getMonthlySummary({
                year: this.currentYear,
                month: this.currentMonth,
                departmentId: this.selectedDepartmentId || null
            });
            this.payrollData = res.data || [];
            this.renderFilteredViews();
        } catch (err) {
            console.warn("Puantaj verileri yüklenemedi:", err);
            this.payrollData = [];
            this.renderFilteredViews();
        }
    }

    async loadRiskWarnings() {
        try {
            const res = await ApiClient.Report.getRiskWarnings();
            this.riskWarnings = res.data || [];
            
            // 10 günü aşan veya kritik riski olanlar
            const criticalRisks = this.riskWarnings.filter(r => (r.usedLeaveDays >= 10 || r.remainingLeaveDays <= 0 || r.riskLevel === 'Kritik'));
            
            const badge = document.getElementById('dean-risk-count-badge');
            if (badge) {
                badge.textContent = criticalRisks.length;
                if (criticalRisks.length > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }

            document.getElementById('dean-stat-risks').textContent = criticalRisks.length;
            this.renderRiskTable(this.riskWarnings);
        } catch (err) {
            console.warn("Risk uyarıları yüklenemedi:", err);
        }
    }

    renderFilteredViews() {
        let filtered = [...this.payrollData];
        if (this.selectedDepartmentId) {
            filtered = filtered.filter(p => {
                const s = this.allStudents.find(stud => stud.studentId === p.studentId);
                return s && s.departmentId === this.selectedDepartmentId;
            });
        }

        // Toplam harcama ve bütçe hesaplama
        const totalHours = filtered.reduce((acc, curr) => acc + (curr.totalHoursWorked || 0), 0);
        const totalSpent = totalHours * this.hourlyWage;
        const budgetPercent = Math.min(100, Math.round((totalSpent / this.totalSemesterBudget) * 100));

        document.getElementById('dean-stat-spent').textContent = `${totalSpent.toLocaleString('tr-TR')} ₺`;
        document.getElementById('dean-budget-spent-val').textContent = `${totalSpent.toLocaleString('tr-TR')} ₺`;
        document.getElementById('dean-budget-percent').textContent = `%${budgetPercent} Kullanıldı`;
        document.getElementById('dean-budget-remaining').textContent = `Kalan: ${(Math.max(0, this.totalSemesterBudget - totalSpent)).toLocaleString('tr-TR')} ₺`;
        
        const progressBar = document.getElementById('dean-budget-progress-bar');
        if (progressBar) progressBar.style.width = `${budgetPercent}%`;

        this.renderDeptStatsTable(filtered);
        this.renderPayrollTable(filtered);
    }

    renderDeptStatsTable(payroll) {
        const tbody = document.getElementById('dean-dept-stats-table-body');
        if (!tbody) return;

        if (this.departments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-400">Bölüm verisi bulunamadı.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.departments.map(dept => {
            const deptStudents = this.allStudents.filter(s => s.departmentId === dept.id);
            const deptPayroll = payroll.filter(p => {
                const s = this.allStudents.find(stud => stud.studentId === p.studentId);
                return s && s.departmentId === dept.id;
            });

            const totalHours = deptPayroll.reduce((acc, curr) => acc + (curr.totalHoursWorked || 0), 0);
            const totalWage = totalHours * this.hourlyWage;
            const deptRisks = this.riskWarnings.filter(r => {
                const s = this.allStudents.find(stud => stud.studentId === r.studentId);
                return s && s.departmentId === dept.id && (r.usedLeaveDays >= 10 || r.remainingLeaveDays <= 0);
            });

            return `
                <tr>
                    <td class="font-bold text-gray-900">${dept.name}</td>
                    <td class="text-center font-semibold">${deptStudents.length}</td>
                    <td class="text-center font-mono">${totalHours} Saat</td>
                    <td class="text-right font-mono font-bold text-teal-800">${totalWage.toLocaleString('tr-TR')} ₺</td>
                    <td class="text-center">
                        ${deptRisks.length > 0 
                            ? `<span class="badge-minimal badge-danger">${deptRisks.length} Öğrenci (Sınırda/Aştı)</span>` 
                            : `<span class="badge-minimal badge-success">Sorun Yok</span>`}
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderRiskTable(risks) {
        const tbody = document.getElementById('dean-risk-table-body');
        if (!tbody) return;

        if (!risks || risks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 text-center text-gray-400">
                        10 günlük yasal izin sınırını aşan veya risk taşıyan öğrenci bulunmamaktadır.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = risks.map(r => {
            const student = this.allStudents.find(s => s.studentId === r.studentId);
            const isTerminated = student?.status === 'Terminated';
            const hasExceeded = r.usedLeaveDays >= 10 || r.remainingLeaveDays <= 0;

            let badgeClass = 'badge-warning';
            let label = 'İzin Sınırına Yakın';
            if (hasExceeded) {
                badgeClass = 'badge-danger';
                label = '10 Gün Sınırı Aşıldı';
            }

            return `
                <tr>
                    <td>
                        <div class="font-bold text-gray-900">${r.fullName}</div>
                        <div class="font-mono text-[10px] text-gray-400">${r.studentNumber}</div>
                    </td>
                    <td>${r.departmentName || '-'}</td>
                    <td>${r.advisorName || 'Atanmadı'}</td>
                    <td class="text-center font-bold text-rose-700">${r.usedLeaveDays} Gün</td>
                    <td class="text-center font-bold">${r.remainingLeaveDays} Gün</td>
                    <td class="text-center font-bold font-mono">${r.totalAbsentDays || 0} Gün</td>
                    <td><span class="badge-minimal ${badgeClass}">${label}</span></td>
                    <td class="text-right">
                        ${isTerminated 
                            ? `<span class="badge-minimal badge-neutral">İlişiği Kesilmiş</span>` 
                            : `<button onclick="window.deanDashboard.openTerminateModal('${r.studentId}', '${r.fullName}')" 
                                       class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition">
                                   <i class="fa-solid fa-user-slash mr-1"></i>İŞKUR İlişiğini Kes
                               </button>`}
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPayrollTable(data) {
        const tbody = document.getElementById('dean-payroll-table-body');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-gray-400">Puantaj kaydı bulunamadı.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const hours = item.totalHoursWorked || 0;
            const salary = hours * this.hourlyWage;

            return `
                <tr>
                    <td class="font-mono font-medium">${item.studentNumber || '-'}</td>
                    <td class="font-semibold text-gray-900">${item.fullName || '-'}</td>
                    <td class="font-mono text-gray-500">${item.tcNo || 'KVKK Gizli'}</td>
                    <td>${item.departmentName || '-'}</td>
                    <td>${item.advisorName || 'Atanmadı'}</td>
                    <td class="text-center font-bold">${item.actualDaysCount || 0}</td>
                    <td class="text-center font-mono font-bold text-teal-800">${hours}</td>
                    <td class="text-right font-black font-mono">${salary.toLocaleString('tr-TR')} ₺</td>
                    <td class="font-mono text-[10px] text-gray-500">${item.iban || 'KVKK Gizli'}</td>
                </tr>
            `;
        }).join('');
    }

    openTerminateModal(studentId, studentName) {
        document.getElementById('dean-terminate-student-id').value = studentId;
        document.getElementById('dean-terminate-student-name').textContent = studentName;
        document.getElementById('dean-terminate-reason').value = '10 günlük yasal izin sınırının aşılması ve devamsızlık';
        document.getElementById('dean-terminate-modal').classList.remove('hidden');
    }

    async executeTermination() {
        const studentId = document.getElementById('dean-terminate-student-id').value;
        const reason = document.getElementById('dean-terminate-reason').value.trim();

        try {
            await ApiClient.Academic.terminateStudent(studentId, reason);
            AppToast.success("Öğrencinin İŞKUR ilişiği resmi olarak kesildi.");
            document.getElementById('dean-terminate-modal').classList.add('hidden');
            await this.loadAllStudents();
            await this.loadRiskWarnings();
        } catch (err) {
            console.error("İlişik kesme hatası:", err);
            AppToast.error(err.message || "İlişik kesme işlemi başarısız.");
        }
    }

    async exportExcel() {
        try {
            await ApiClient.Report.downloadExcel(this.currentYear, this.currentMonth, this.selectedDepartmentId || null);
            AppToast.success("Excel puantaj raporu başarıyla indirildi.");
        } catch (err) {
            console.error("Excel indirme hatası:", err);
            AppToast.error("Rapor indirilemedi.");
        }
    }

    async exportCsv() {
        try {
            await ApiClient.Report.downloadCsv(this.currentYear, this.currentMonth, this.selectedDepartmentId || null);
            AppToast.success("CSV puantaj raporu başarıyla indirildi.");
        } catch (err) {
            console.error("CSV indirme hatası:", err);
            AppToast.error("Rapor indirilemedi.");
        }
    }
}

window.deanDashboard = new DeanDashboard();
