// Öğrenci Paneli (Student Dashboard) Yöneticisi

class StudentDashboard {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.currentPlan = null;
        this.selectedDays = new Map(); // dateString -> { date, shiftType, notes }
        this.html5QrCode = null;
    }

    async init() {
        this.renderShell();
        this.bindEvents();
        await this.loadAll();
    }

    renderShell() {
        const container = document.getElementById('student-dashboard-view');
        if (!container || container.innerHTML.trim().length > 0) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                                <i class="fa-solid fa-graduation-cap text-lg"></i>
                            </span>
                            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Öğrenci Çalışma & Devam Takip Paneli
                            </h1>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Aylık İŞKUR çalışma planı, dinamik QR devam okutma ve izin yönetimi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="open-qr-scanner-btn" class="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-2">
                            <i class="fa-solid fa-qrcode text-base"></i>
                            <span>Karekod (QR) Tara</span>
                        </button>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-slate-200 dark:border-slate-800">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Student Tabs">
                        <button data-tab="plan" class="student-tab-btn py-3 px-1 border-b-2 border-blue-600 font-semibold text-sm text-blue-600 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>Aylık Çalışma Planı Takvimi</span>
                        </button>
                        <button data-tab="leaves" class="student-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-file-signature"></i>
                            <span>İzin Taleplerim</span>
                        </button>
                        <button data-tab="tasks" class="student-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-list-check"></i>
                            <span>Atanan Görevlerim</span>
                        </button>
                        <button data-tab="attendances" class="student-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                            <span>Devam Geçmişim</span>
                        </button>
                    </nav>
                </div>

                <!-- 1. Sekme: Çalışma Planı -->
                <div id="student-tab-plan" class="student-tab-content space-y-4">
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <button id="student-prev-month-btn" class="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                <i class="fa-solid fa-chevron-left text-xs"></i>
                            </button>
                            <h3 id="student-current-month-label" class="text-base font-bold text-slate-900 dark:text-white capitalize min-w-[140px] text-center">-</h3>
                            <button id="student-next-month-btn" class="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                <i class="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                            <span id="student-plan-status-badge" class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Durum</span>
                        </div>
                        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button id="student-save-plan-btn" class="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition">
                                Taslağı Kaydet
                            </button>
                            <button id="student-submit-plan-btn" class="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                                Onaya Gönder
                            </button>
                        </div>
                    </div>

                    <!-- Renk Kodları Açıklaması -->
                    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500 px-1">
                        <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500"></span> Seçilen/Uygun Gün</span>
                        <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500"></span> Resmî Tatil / Kapalı</span>
                        <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span> Boş Seçilebilir Gün</span>
                        <span class="text-indigo-600 dark:text-indigo-400 font-medium">Haftalık 1-3 gün (En fazla 15 saat) kuralı geçerlidir.</span>
                    </div>

                    <!-- Takvim Grid -->
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 overflow-hidden">
                        <div class="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase">
                            <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div class="text-rose-400">Cmt</div><div class="text-rose-400">Paz</div>
                        </div>
                        <div id="student-calendar-grid" class="grid grid-cols-7 gap-2"></div>
                    </div>
                </div>

                <!-- 2. Sekme: İzin Talepleri -->
                <div id="student-tab-leaves" class="student-tab-content space-y-4 hidden">
                    <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-bold text-slate-900 dark:text-white">Yıllık Mazeret / İzin Kotası</h3>
                                <p class="text-xs text-slate-500">Yıllık toplam 10 iş günü izin hakkınız bulunmaktadır.</p>
                            </div>
                            <span id="student-remaining-leave-label" class="text-lg font-black text-indigo-600 dark:text-indigo-400">- / 10 Gün</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div id="student-leave-progress" class="bg-indigo-600 h-3 rounded-full transition-all duration-500" style="width: 100%"></div>
                        </div>
                    </div>

                    <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-4">Yeni İzin Talebi Oluştur</h4>
                        <form id="create-leave-form" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">İzin Türü</label>
                                    <select id="leave-type-select" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                        <option value="Mazeret">Mazeret İzni</option>
                                        <option value="Sağlık">Sağlık Raporlu İzin</option>
                                        <option value="Sınav">Akademik Sınav İzni</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">Başlangıç Tarihi</label>
                                    <input type="date" id="leave-start-date" required class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-500 mb-1">Bitiş Tarihi</label>
                                    <input type="date" id="leave-end-date" required class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-500 mb-1">Mazeret Açıklaması</label>
                                <textarea id="leave-reason" rows="2" required placeholder="İzin gerekçenizi belirtiniz..." class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"></textarea>
                            </div>
                            <div class="flex items-center justify-between pt-2">
                                <span id="leave-days-count" class="text-xs font-bold text-slate-600 dark:text-slate-300"></span>
                                <button type="submit" class="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
                                    <i class="fa-solid fa-paper-plane text-xs"></i>
                                    <span>Talebi İlet</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm">İzin Talepleri Geçmişi</div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead>
                                    <tr class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-400 font-semibold">
                                        <th class="py-3 px-4">Tür</th>
                                        <th class="py-3 px-4">Tarihler</th>
                                        <th class="py-3 px-3 text-center">Gün</th>
                                        <th class="py-3 px-4">Açıklama</th>
                                        <th class="py-3 px-4 text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="student-leaves-table-body" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 3. Sekme: Atanan Görevler -->
                <div id="student-tab-tasks" class="student-tab-content space-y-4 hidden">
                    <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-sm">
                        Danışman Tarafından Atanan Görevler
                    </div>
                    <div id="student-tasks-table-body" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                </div>

                <!-- 4. Sekme: Devam Geçmişi -->
                <div id="student-tab-attendances" class="student-tab-content space-y-4 hidden">
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm">Fiili QR Devam Kayıtları</div>
                        <div id="student-recent-attendances-list" class="divide-y divide-slate-100 dark:divide-slate-800"></div>
                    </div>
                </div>
            </div>

            <!-- Gün Seçimi Modalı -->
            <div id="student-day-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
                    <h3 id="day-modal-title" class="font-bold text-slate-900 dark:text-white mb-4 text-base">Çalışma Günü Belirleme</h3>
                    <input type="hidden" id="day-modal-date">
                    
                    <div id="day-modal-weekly-warning" class="hidden p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs mb-3 border border-amber-200 dark:border-amber-900"></div>

                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Vardiya / Çalışma Süresi</label>
                            <select id="day-modal-shift" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                                <option value="Full">Tam Gün (5 Saat)</option>
                                <option value="Morning">Öğleden Önce (4 Saat - Sabah)</option>
                                <option value="Afternoon">Öğleden Sonra (4 Saat - Öğle)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Not / Plan Açıklaması</label>
                            <input type="text" id="day-modal-notes" placeholder="Örn: Laboratuvar teknik desteği" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" id="day-modal-remove-btn" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition">
                            Günü Çıkar
                        </button>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="Modal.close('student-day-modal')" class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                İptal
                            </button>
                            <button type="button" id="day-modal-save-btn" class="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QR Tarayıcı Modalı -->
            <div id="qr-scanner-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-qrcode text-emerald-600 text-lg"></i>
                            <h3 class="font-bold text-slate-900 dark:text-white">Danışman QR Kodunu Tara</h3>
                        </div>
                        <button id="close-qr-scanner-btn" class="text-slate-400 hover:text-slate-600">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <div class="mt-4 space-y-4">
                        <div id="qr-reader" class="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 min-h-[220px]"></div>
                        <div id="qr-camera-error" class="hidden p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                            Kamera erişimi sağlanamadı. Lütfen tarayıcı izinlerini kontrol edin veya kodu elle girin.
                        </div>

                        <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Veya Token Kodunu Elle Giriniz</label>
                            <div class="flex gap-2">
                                <input type="text" id="qr-token-input" placeholder="32 haneli QR Hash..." class="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <button type="button" id="submit-manual-qr-btn" class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    Doğrula
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Görev Tamamlama Modalı -->
            <div id="complete-task-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2 text-base">Görevi Tamamla</h3>
                    <p class="text-xs text-slate-500 mb-4">Görevi teslim ederken danışmanınıza iletmek istediğiniz notu giriniz.</p>
                    <input type="hidden" id="complete-task-id">
                    <textarea id="complete-task-note" rows="3" placeholder="Örn: Rapor ve kod dosyaları teslim edildi." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-4"></textarea>
                    <div class="flex items-center justify-end gap-2">
                        <button type="button" onclick="Modal.close('complete-task-modal')" class="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl">İptal</button>
                        <button type="button" id="complete-task-submit-btn" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Teslim Et</button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Ay Değiştirme
        const prevMonthBtn = document.getElementById('student-prev-month-btn');
        const nextMonthBtn = document.getElementById('student-next-month-btn');
        if (prevMonthBtn) prevMonthBtn.onclick = () => this.changeMonth(-1);
        if (nextMonthBtn) nextMonthBtn.onclick = () => this.changeMonth(1);

        // Plan Kaydet ve Onaya Gönder Butonları
        const savePlanBtn = document.getElementById('student-save-plan-btn');
        const submitPlanBtn = document.getElementById('student-submit-plan-btn');
        if (savePlanBtn) savePlanBtn.onclick = () => this.savePlanDraft();
        if (submitPlanBtn) submitPlanBtn.onclick = () => this.submitPlanForApproval();

        // QR Tarayıcı Modal Butonu
        const openQrBtn = document.getElementById('open-qr-scanner-btn');
        if (openQrBtn) openQrBtn.onclick = () => this.openQrScanner();

        const closeQrBtn = document.getElementById('close-qr-scanner-btn');
        if (closeQrBtn) closeQrBtn.onclick = () => this.closeQrScanner();

        const manualQrBtn = document.getElementById('submit-manual-qr-btn');
        if (manualQrBtn) manualQrBtn.onclick = () => this.submitManualQrToken();

        // İzin Talep Formu
        const leaveForm = document.getElementById('create-leave-form');
        if (leaveForm) leaveForm.onsubmit = (e) => this.handleCreateLeave(e);

        // Sekme Geçişleri
        document.querySelectorAll('.student-tab-btn').forEach(btn => {
            btn.onclick = (e) => this.switchTab(e.currentTarget.dataset.tab);
        });
    }

    async loadAll() {
        const student = AppStateManager.user;
        if (!student) return;

        await Promise.all([
            this.loadMonthlyPlan(),
            this.loadLeaveBalance(),
            this.loadTasks(),
            this.loadRecentAttendances()
        ]);
    }

    switchTab(tabId) {
        document.querySelectorAll('.student-tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.student-tab-btn').forEach(btn => {
            btn.classList.remove('border-blue-600', 'text-blue-600', 'font-semibold');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeContent = document.getElementById(`student-tab-${tabId}`);
        const activeBtn = document.querySelector(`.student-tab-btn[data-tab="${tabId}"]`);

        if (activeContent) activeContent.classList.remove('hidden');
        if (activeBtn) {
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
            activeBtn.classList.add('border-blue-600', 'text-blue-600', 'font-semibold');
        }
    }

    // ==========================================
    // 1. Aylık Çalışma Planı ve Takvim Görünümü
    // ==========================================
    async loadMonthlyPlan() {
        const monthLabel = document.getElementById('student-current-month-label');
        if (monthLabel) {
            const date = new Date(this.currentYear, this.currentMonth - 1, 1);
            monthLabel.textContent = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        }

        try {
            const studentId = AppStateManager.user?.studentId;
            if (!studentId) return;

            const response = await ApiClient.Plan.getStudentPlan(studentId, this.currentYear, this.currentMonth);
            this.currentPlan = response.data || null;

            this.selectedDays.clear();
            if (this.currentPlan && this.currentPlan.days) {
                this.currentPlan.days.forEach(d => {
                    const dateKey = d.date.slice(0, 10);
                    this.selectedDays.set(dateKey, {
                        id: d.id,
                        date: dateKey,
                        shiftType: this.inferShiftType(d.startTime, d.plannedHours),
                        plannedHours: d.plannedHours,
                        dayStatus: d.dayStatus,
                        notes: d.notes,
                        hasAttendance: d.hasAttendance
                    });
                });
            }

            this.renderPlanStatusBadge();
            this.renderCalendar();
        } catch (error) {
            // Plan henüz oluşturulmamış olabilir
            this.currentPlan = null;
            this.selectedDays.clear();
            this.renderPlanStatusBadge();
            this.renderCalendar();
        }
    }

    inferShiftType(startTime, hours) {
        if (hours === 5) return 'Full';
        if (startTime?.startsWith('13')) return 'Afternoon';
        return 'Morning';
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        this.loadMonthlyPlan();
    }

    renderPlanStatusBadge() {
        const badgeEl = document.getElementById('student-plan-status-badge');
        const submitBtn = document.getElementById('student-submit-plan-btn');
        const saveBtn = document.getElementById('student-save-plan-btn');

        if (!badgeEl) return;

        if (!this.currentPlan) {
            badgeEl.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700';
            badgeEl.textContent = 'Plan Yok (Taslak Oluşturun)';
            if (submitBtn) submitBtn.disabled = true;
            if (saveBtn) saveBtn.disabled = false;
            return;
        }

        const status = this.currentPlan.approvalStatus; // 1: Draft, 2: Submitted, 3: Approved, 4: Rejected

        if (status === 1 || status === 'Draft') {
            badgeEl.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800';
            badgeEl.textContent = 'Taslak (Onaya Sunulmadı)';
            if (submitBtn) submitBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;
        } else if (status === 2 || status === 'Submitted') {
            badgeEl.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800';
            badgeEl.textContent = 'Danışman Onayı Bekliyor';
            if (submitBtn) submitBtn.disabled = true;
            if (saveBtn) saveBtn.disabled = true;
        } else if (status === 3 || status === 'Approved') {
            badgeEl.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800';
            badgeEl.textContent = 'Onaylandı (Geçerli Plan)';
            if (submitBtn) submitBtn.disabled = true;
            if (saveBtn) saveBtn.disabled = true;
        } else if (status === 4 || status === 'Rejected') {
            badgeEl.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800';
            badgeEl.textContent = `Reddedildi: ${this.currentPlan.rejectionReason || 'Gerekçe belirtilmedi'}`;
            if (submitBtn) submitBtn.disabled = false;
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    renderCalendar() {
        const grid = document.getElementById('student-calendar-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const year = this.currentYear;
        const month = this.currentMonth;
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Pazartesi = 1, Pazar = 7 yap
        let startDay = firstDayOfMonth.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1; // Pazartesi 0 tabanlı

        // Önceki ayın boşlukları
        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'bg-gray-50 border border-gray-100 rounded-lg opacity-40 calendar-day-cell';
            grid.appendChild(emptyCell);
        }

        const isReadOnly = this.currentPlan && (this.currentPlan.approvalStatus === 2 || this.currentPlan.approvalStatus === 3);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month - 1, day);
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
            const isHoliday = this.isOfficialHoliday(month, day);
            const isSelected = this.selectedDays.has(dateKey);
            const selectionData = this.selectedDays.get(dateKey);

            const cell = document.createElement('div');
            cell.className = 'calendar-day-cell border rounded-lg p-2 flex flex-col justify-between text-xs cursor-pointer relative';

            if (isWeekend || isHoliday) {
                // Kırmızı / Kapalı
                cell.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-700', 'disabled', 'cursor-not-allowed');
                cell.innerHTML = `
                    <div class="flex justify-between items-center font-bold">
                        <span>${day}</span>
                        <span class="text-[10px] uppercase">${isHoliday ? 'Tatil' : 'H.Sonu'}</span>
                    </div>
                    <div class="text-[10px] text-rose-500 font-medium truncate">${isHoliday || 'Kapalı'}</div>
                `;
            } else if (isSelected) {
                // Yeşil / Seçilen Gün
                const shiftName = selectionData.shiftType === 'Full' ? 'Tam Gün (5s)' : 
                                  selectionData.shiftType === 'Morning' ? 'Sabah (4s)' : 'Öğle (4s)';

                cell.classList.add('bg-emerald-50', 'border-emerald-300', 'text-emerald-900', 'shadow-sm');
                cell.innerHTML = `
                    <div class="flex justify-between items-center font-bold text-emerald-800">
                        <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">${day}</span>
                        <span class="text-[10px] font-semibold text-emerald-700"><i class="fas fa-check"></i></span>
                    </div>
                    <div class="mt-1 font-semibold text-[11px] text-emerald-800">${shiftName}</div>
                    <div class="text-[10px] text-emerald-600">${selectionData.hasAttendance ? '✓ Devam Alındı' : 'Planlandı'}</div>
                `;

                if (!isReadOnly) {
                    cell.onclick = () => this.openDayModal(dateKey, day, selectionData);
                }
            } else {
                // Gri / Seçilebilir Boş Gün
                cell.classList.add('bg-white', 'border-gray-200', 'hover:border-blue-400', 'hover:bg-blue-50/30');
                cell.innerHTML = `
                    <div class="flex justify-between items-center font-semibold text-gray-700">
                        <span>${day}</span>
                    </div>
                    <div class="text-[10px] text-gray-400 mt-2">+ Gün Ekle</div>
                `;

                if (!isReadOnly) {
                    cell.onclick = () => this.openDayModal(dateKey, day, null);
                }
            }

            grid.appendChild(cell);
        }

        this.updatePlanSummaryHours();
    }

    isOfficialHoliday(month, day) {
        const holidays = {
            '1-1': 'Yılbaşı',
            '4-23': 'Ulusal Egemenlik',
            '5-1': 'İşçi Bayramı',
            '5-19': 'Gençlik ve Spor',
            '7-15': 'Demokrasi Günü',
            '8-30': 'Zafer Bayramı',
            '10-29': 'Cumhuriyet Bayramı'
        };
        return holidays[`${month}-${day}`] || null;
    }

    openDayModal(dateKey, dayNumber, existingData) {
        const modal = document.getElementById('student-day-modal');
        const title = document.getElementById('day-modal-title');
        const dateInput = document.getElementById('day-modal-date');
        const shiftSelect = document.getElementById('day-modal-shift');
        const notesInput = document.getElementById('day-modal-notes');
        const removeBtn = document.getElementById('day-modal-remove-btn');
        const weeklyWarningEl = document.getElementById('day-modal-weekly-warning');

        if (!modal) return;

        title.textContent = `${dayNumber} ${new Date(this.currentYear, this.currentMonth - 1, dayNumber).toLocaleDateString('tr-TR', { month: 'long' })} - Çalışma Günü`;
        dateInput.value = dateKey;
        shiftSelect.value = existingData ? existingData.shiftType : 'Morning';
        notesInput.value = existingData ? (existingData.notes || '') : '';

        // Haftalık 1-3 gün canlı denetimi
        const weekCount = this.getWeekDayCount(dateKey, existingData ? dateKey : null);
        if (weekCount >= 3 && !existingData) {
            weeklyWarningEl.classList.remove('hidden');
            weeklyWarningEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> Bu hafta için zaten ${weekCount} gün seçilmiş! Haftalık 3 gün kuralı sebebiyle yeni gün ekleyemezsiniz.`;
            document.getElementById('day-modal-save-btn').disabled = true;
        } else {
            weeklyWarningEl.classList.add('hidden');
            document.getElementById('day-modal-save-btn').disabled = false;
        }

        if (existingData) {
            removeBtn.classList.remove('hidden');
            removeBtn.onclick = () => {
                this.selectedDays.delete(dateKey);
                Modal.close('student-day-modal');
                this.renderCalendar();
            };
        } else {
            removeBtn.classList.add('hidden');
        }

        document.getElementById('day-modal-save-btn').onclick = () => {
            const shiftType = shiftSelect.value;
            const notes = notesInput.value.trim();
            const plannedHours = shiftType === 'Full' ? 5.0 : 4.0;

            this.selectedDays.set(dateKey, {
                date: dateKey,
                shiftType,
                plannedHours,
                dayStatus: 1, // Planned
                notes,
                hasAttendance: false
            });

            Modal.close('student-day-modal');
            this.renderCalendar();
        };

        Modal.open('student-day-modal');
    }

    getWeekDayCount(targetDateStr, excludeDateStr = null) {
        const targetDate = new Date(targetDateStr);
        // Hedef tarihin haftasındaki Pazartesi gününü bul
        const dayOfWeek = targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1;
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - dayOfWeek);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        let count = 0;
        this.selectedDays.forEach((val, key) => {
            if (key === excludeDateStr) return;
            const d = new Date(key);
            if (d >= monday && d <= sunday) {
                count++;
            }
        });

        return count;
    }

    updatePlanSummaryHours() {
        let totalHours = 0;
        let totalDays = 0;
        this.selectedDays.forEach(day => {
            totalHours += day.plannedHours || 4.0;
            totalDays++;
        });

        const totalDaysEl = document.getElementById('student-plan-total-days');
        const totalHoursEl = document.getElementById('student-plan-total-hours');

        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (totalHoursEl) totalHoursEl.textContent = `${totalHours.toFixed(1)} Saat`;
    }

    async savePlanDraft() {
        if (this.selectedDays.size === 0) {
            Toast.warning('Lütfen plana en az 1 çalışma günü ekleyiniz.');
            return;
        }

        const days = [];
        this.selectedDays.forEach(val => {
            days.push({
                date: val.date,
                shiftType: val.shiftType === 'Full' ? 3 : val.shiftType === 'Afternoon' ? 2 : 1,
                notes: val.notes
            });
        });

        try {
            const res = await ApiClient.Plan.createOrUpdate({
                year: this.currentYear,
                month: this.currentMonth,
                days: days,
                notes: 'Öğrenci arayüzünden kaydedildi'
            });

            if (res.success) {
                Toast.success('Çalışma planı taslağı başarıyla kaydedildi.');
                await this.loadMonthlyPlan();
            }
        } catch (error) {
            Toast.error(error.message || 'Plan kaydedilemedi.');
        }
    }

    async submitPlanForApproval() {
        if (!this.currentPlan || !this.currentPlan.id) {
            Toast.warning('Lütfen önce plan taslağını kaydediniz.');
            return;
        }

        try {
            const res = await ApiClient.Plan.submit(this.currentPlan.id);
            if (res.success) {
                Toast.success('Çalışma planınız başarıyla danışman onayına sunuldu!');
                await this.loadMonthlyPlan();
            }
        } catch (error) {
            Toast.error(error.message || 'Plan onaya sunulamadı.');
        }
    }

    // ==========================================
    // 2. Devam Takibi ve QR Okutma (Check-in)
    // ==========================================
    openQrScanner() {
        Modal.open('qr-scanner-modal');
        const qrReaderDiv = document.getElementById('qr-reader');
        if (!qrReaderDiv) return;

        qrReaderDiv.innerHTML = '';

        if (typeof Html5Qrcode !== 'undefined') {
            this.html5QrCode = new Html5Qrcode('qr-reader');
            this.html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await this.handleQrScanned(decodedText);
                },
                (errorMessage) => {
                    // Tarama esnasındaki anlık okunamama durumları
                }
            ).catch(err => {
                console.warn('Kamera açılamadı:', err);
                document.getElementById('qr-camera-error').classList.remove('hidden');
            });
        }
    }

    closeQrScanner() {
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(() => {
                this.html5QrCode.clear();
                this.html5QrCode = null;
            }).catch(e => console.warn(e));
        }
        Modal.close('qr-scanner-modal');
    }

    async handleQrScanned(tokenHash) {
        this.closeQrScanner();
        try {
            Toast.info('Karekod doğrulandı, yoklama gönderiliyor...');
            const res = await ApiClient.Attendance.checkIn(tokenHash);
            if (res.success) {
                Toast.success('Giriş devam kaydınız başarıyla alındı! İyi çalışmalar.');
                await this.loadRecentAttendances();
                await this.loadMonthlyPlan();
            }
        } catch (error) {
            Toast.error(error.message || 'Karekod ile devam kaydı oluşturulamadı.');
        }
    }

    async submitManualQrToken() {
        const input = document.getElementById('manual-qr-token-input');
        const token = input?.value?.trim();
        if (!token) {
            Toast.warning('Lütfen geçerli bir QR token giriniz.');
            return;
        }
        await this.handleQrScanned(token);
    }

    async loadRecentAttendances() {
        const studentId = AppStateManager.user?.studentId;
        if (!studentId) return;

        try {
            const res = await ApiClient.Attendance.getStudentAttendances(studentId);
            const container = document.getElementById('student-attendances-list');
            if (!container) return;

            if (!res.data || res.data.length === 0) {
                container.innerHTML = '<div class="text-sm text-gray-400 py-3 text-center">Henüz devam kaydınız bulunmuyor.</div>';
                return;
            }

            container.innerHTML = res.data.slice(0, 5).map(a => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                    <div>
                        <div class="font-semibold text-gray-800">${new Date(a.checkInTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div class="text-gray-500 mt-0.5">Giriş: <span class="font-medium text-emerald-600">${new Date(a.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span> | Çıkış: ${a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '<span class="text-amber-500">Çıkış Yapılmadı</span>'}</div>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${a.verificationStatus === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${a.verificationStatusDescription}</span>
                        ${!a.checkOutTime ? `<button onclick="window.StudentDashboardInstance.handleCheckOut('${a.id}')" class="block mt-1 text-xs text-blue-600 font-semibold hover:underline">Çıkış Yap</button>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Devam listesi alınamadı:', e);
        }
    }

    async handleCheckOut(attendanceId) {
        try {
            const res = await ApiClient.Attendance.checkOut(attendanceId);
            if (res.success) {
                Toast.success(`Çıkış yapıldı! Net Çalışma Süresi: ${res.data.actualHoursWorked} saat.`);
                await this.loadRecentAttendances();
            }
        } catch (error) {
            Toast.error(error.message || 'Çıkış işlemi başarısız oldu.');
        }
    }

    // ==========================================
    // 3. İzin Yönetimi ve Bakiye Takip
    // ==========================================
    async loadLeaveBalance() {
        const studentId = AppStateManager.user?.studentId;
        if (!studentId) return;

        try {
            const res = await ApiClient.Leave.getBalance(studentId);
            const balance = res.data;
            if (!balance) return;

            // İlerleme çubuğunu güncelle
            const usedDays = balance.usedLeaveDays;
            const maxDays = balance.totalAnnualEntitlement || 10;
            const remainingDays = balance.remainingLeaveDays;
            const pct = Math.min(100, Math.round((usedDays / maxDays) * 100));

            const progressBar = document.getElementById('student-leave-progress');
            const usedDaysEl = document.getElementById('student-leave-used-days');
            const remainingDaysEl = document.getElementById('student-leave-remaining-days');
            const warningAlert = document.getElementById('student-leave-warning-alert');

            if (progressBar) progressBar.style.width = `${pct}%`;
            if (usedDaysEl) usedDaysEl.textContent = `${usedDays} Gün`;
            if (remainingDaysEl) remainingDaysEl.textContent = `${remainingDays} Gün Kaldı`;

            if (balance.hasLeaveWarning && warningAlert) {
                warningAlert.classList.remove('hidden');
                document.getElementById('student-leave-warning-text').textContent = balance.warningMessage || 'Yıllık izin hakkınız sınır seviyesine yaklaşmıştır.';
            } else if (warningAlert) {
                warningAlert.classList.add('hidden');
            }

            // İzin Geçmişini Yükle
            await this.loadLeaveHistory();
        } catch (e) {
            console.error('İzin bakiyesi alınamadı:', e);
        }
    }

    async loadLeaveHistory() {
        const studentId = AppStateManager.user?.studentId;
        if (!studentId) return;

        try {
            const res = await ApiClient.Leave.getStudentLeaves(studentId);
            const tbody = document.getElementById('student-leaves-table-body');
            if (!tbody) return;

            if (!res.data || res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-400 text-xs">Henüz izin talebiniz bulunmamaktadır.</td></tr>';
                return;
            }

            tbody.innerHTML = res.data.map(l => {
                let badgeClass = 'bg-amber-100 text-amber-800';
                if (l.status === 2 || l.status === 'Approved') badgeClass = 'bg-emerald-100 text-emerald-800';
                if (l.status === 3 || l.status === 'Rejected') badgeClass = 'bg-rose-100 text-rose-800';

                return `
                    <tr class="border-b border-gray-100 hover:bg-gray-50 text-xs">
                        <td class="py-3 px-3 font-medium text-gray-800">${new Date(l.startDate).toLocaleDateString('tr-TR')} - ${new Date(l.endDate).toLocaleDateString('tr-TR')}</td>
                        <td class="py-3 px-3">${l.totalDays} Gün</td>
                        <td class="py-3 px-3 text-gray-600">${l.leaveTypeDescription}</td>
                        <td class="py-3 px-3 text-gray-500 max-w-xs truncate" title="${l.reason}">${l.reason}</td>
                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}">${l.statusDescription}</span></td>
                    </tr>
                `;
            }).join('');
        } catch (e) {
            console.error(e);
        }
    }

    async handleCreateLeave(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const data = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            leaveType: parseInt(formData.get('leaveType') || '1'),
            reason: formData.get('reason'),
            documentUrl: formData.get('documentUrl') || null
        };

        try {
            const res = await ApiClient.Leave.create(data);
            if (res.success) {
                Toast.success('İzin talebiniz başarıyla oluşturuldu ve danışman onayına iletildi.');
                Modal.close('create-leave-modal');
                form.reset();
                await this.loadLeaveBalance();
            }
        } catch (error) {
            Toast.error(error.message || 'İzin talebi oluşturulamadı.');
        }
    }

    // ==========================================
    // 4. Görevlerim Sekmesi
    // ==========================================
    async loadTasks() {
        const studentId = AppStateManager.user?.studentId;
        if (!studentId) return;

        try {
            const res = await ApiClient.Task.getStudentTasks(studentId);
            const container = document.getElementById('student-tasks-container');
            if (!container) return;

            if (!res.data || res.data.length === 0) {
                container.innerHTML = '<div class="col-span-2 text-center py-8 text-gray-400 text-sm">Danışmanınız tarafından atanmış aktif bir görev bulunmamaktadır.</div>';
                return;
            }

            container.innerHTML = res.data.map(t => {
                const isCompleted = t.status === 3 || t.status === 'Completed';
                const isOverdue = new Date(t.dueDate) < new Date() && !isCompleted;

                return `
                    <div class="p-4 bg-white rounded-xl border border-gray-200 card-hover subtle-shadow flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isCompleted ? 'bg-emerald-100 text-emerald-800' : isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}">
                                    ${isCompleted ? 'Tamamlandı' : isOverdue ? 'Süresi Geçti' : 'Bekliyor'}
                                </span>
                                <span class="text-xs text-gray-400"><i class="far fa-calendar-alt mr-1"></i> ${new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <h4 class="font-bold text-gray-800 text-sm mb-1">${t.title}</h4>
                            <p class="text-xs text-gray-600 line-clamp-3 mb-3">${t.description}</p>
                            ${t.advisorEvaluationNote ? `
                                <div class="bg-blue-50 border-l-2 border-blue-500 p-2 text-[11px] text-blue-900 rounded mb-2">
                                    <span class="font-semibold">Danışman Değerlendirmesi:</span> ${t.advisorEvaluationNote}
                                    ${t.advisorScore !== null ? `<span class="ml-2 font-bold text-emerald-700">(${t.advisorScore}/100)</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                            <span class="text-gray-500">Danışman: <span class="font-medium text-gray-700">${t.assignedByName}</span></span>
                            ${!isCompleted ? `
                                <button onclick="window.StudentDashboardInstance.openCompleteTaskModal('${t.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm">Tamamla</button>
                            ` : '<span class="text-emerald-600 font-semibold text-xs"><i class="fas fa-check-circle mr-1"></i> Tamamlandı</span>'}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('Görevler yüklenemedi:', e);
        }
    }

    openCompleteTaskModal(taskId) {
        document.getElementById('complete-task-id').value = taskId;
        Modal.open('complete-task-modal');

        document.getElementById('complete-task-submit-btn').onclick = async () => {
            const note = document.getElementById('complete-task-note').value.trim();
            try {
                const res = await ApiClient.Task.updateStatus(taskId, 3, note); // 3: Completed
                if (res.success) {
                    Toast.success('Görev başarıyla tamamlandı olarak işaretlendi.');
                    Modal.close('complete-task-modal');
                    await this.loadTasks();
                }
            } catch (error) {
                Toast.error(error.message || 'Görev güncellenemedi.');
            }
        };
    }
}

window.StudentDashboard = StudentDashboard;
window.studentDashboard = new StudentDashboard();
window.StudentDashboardInstance = window.studentDashboard;

