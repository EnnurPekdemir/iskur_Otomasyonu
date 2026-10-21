// Danışman Paneli (Advisor Dashboard) Yöneticisi

class AdvisorDashboard {
    constructor() {
        this.qrInterval = null;
        this.countdownInterval = null;
        this.currentQrSession = null;
        this.remainingSeconds = 30;
        this.isQrRunning = false;
        this.qrcodeInstance = null;
    }

    async init() {
        this.renderShell();
        this.bindEvents();
        await this.loadAll();
    }

    renderShell() {
        const container = document.getElementById('advisor-dashboard-view');
        if (!container || container.innerHTML.trim().length > 0) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                                <i class="fa-solid fa-chalkboard-user text-lg"></i>
                            </span>
                            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Danışman Yönetim & Dinamik Devam Paneli
                            </h1>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Öğrenci çalışma planları inceleme, canlı 30 saniyelik QR yoklama döngüsü ve görev yönetimi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="advisor-refresh-all-btn" onclick="window.advisorDashboard.loadAll()" class="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm inline-flex items-center gap-2">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- Sekmeler -->
                <div class="border-b border-slate-200 dark:border-slate-800">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Advisor Tabs">
                        <button data-tab="qr" class="advisor-tab-btn py-3 px-1 border-b-2 border-blue-600 font-semibold text-sm text-blue-600 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-qrcode"></i>
                            <span>Canlı Dinamik QR Yoklama</span>
                        </button>
                        <button data-tab="plans" class="advisor-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-clipboard-check"></i>
                            <span>Onay Bekleyen Planlar</span>
                        </button>
                        <button data-tab="tasks" class="advisor-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-tasks"></i>
                            <span>Görev Yönetimi & Puanlama</span>
                        </button>
                        <button data-tab="attendances" class="advisor-tab-btn py-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-user-check"></i>
                            <span>Bugünkü Yoklama Listesi</span>
                        </button>
                    </nav>
                </div>

                <!-- 1. Sekme: Dinamik Karekod (QR) ve Canlı Sayaç -->
                <div id="advisor-tab-qr" class="advisor-tab-content space-y-6">
                    <div class="max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
                        <div class="space-y-1">
                            <h3 class="text-xl font-black text-slate-900 dark:text-white">Dinamik İŞKUR Devam Karekodu</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                Öğrenciler kendi panellerinden bu karekodu okutarak anlık yoklama verir.
                            </p>
                        </div>

                        <!-- Karekod Konteynerı -->
                        <div class="relative inline-flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner">
                            <div id="advisor-qr-canvas-container" class="w-[220px] h-[220px] flex items-center justify-center bg-white p-3 rounded-2xl shadow-md">
                                <i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-600"></i>
                            </div>
                        </div>

                        <!-- 30 Saniyelik Canlı Geri Sayım Sayacı -->
                        <div class="flex items-center justify-center gap-4">
                            <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 font-bold text-sm">
                                <i class="fa-solid fa-clock-rotate-left"></i>
                                <span id="advisor-countdown-text">30 sn sonra yenilenecek</span>
                            </div>
                        </div>

                        <!-- Aksiyon Butonları -->
                        <div class="flex items-center justify-center gap-3 pt-2">
                            <button id="advisor-toggle-qr-btn" class="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center gap-2">
                                <i class="fa-solid fa-play"></i>
                                <span>Döngüyü Başlat</span>
                            </button>
                            <button id="advisor-refresh-qr-btn" class="px-4 py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5">
                                <i class="fa-solid fa-rotate"></i>
                                <span>Hemen Yenile</span>
                            </button>
                        </div>

                        <!-- Token İmzası -->
                        <div class="text-[11px] text-slate-400 font-mono">
                            Token İmzası: <span id="advisor-qr-token-display" class="font-bold text-slate-600 dark:text-slate-300">Oturum bekleniyor...</span>
                        </div>
                    </div>
                </div>

                <!-- 2. Sekme: Onay Bekleyen Planlar -->
                <div id="advisor-tab-plans" class="advisor-tab-content space-y-4 hidden">
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm">
                            İncelenmesi Gereken Aylık Çalışma Planları
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead>
                                    <tr class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-400 font-semibold">
                                        <th class="py-3 px-4">Öğrenci No & Ad Soyad</th>
                                        <th class="py-3 px-4">Dönem / Ay</th>
                                        <th class="py-3 px-3 text-center">Toplam Gün</th>
                                        <th class="py-3 px-3 text-center">Toplam Saat</th>
                                        <th class="py-3 px-4 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="advisor-pending-plans-table" class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr><td colspan="5" class="py-8 text-center text-slate-400">Bekleyen çalışma planı bulunmuyor.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 3. Sekme: Görev Yönetimi & Puanlama -->
                <div id="advisor-tab-tasks" class="advisor-tab-content space-y-4 hidden">
                    <div class="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div>
                            <h3 class="font-bold text-slate-900 dark:text-white">Öğrencilere Atanan Görevler</h3>
                            <p class="text-xs text-slate-500">Görev tanımlayınız, teslim edilenleri notlayıp puanlayınız.</p>
                        </div>
                        <button onclick="Modal.open('create-task-modal')" class="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2">
                            <i class="fa-solid fa-plus text-xs"></i>
                            <span>Yeni Görev Tanımla</span>
                        </button>
                    </div>

                    <div id="advisor-assigned-tasks-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                </div>

                <!-- 4. Sekme: Bugünkü Devam Kayıtları -->
                <div id="advisor-tab-attendances" class="advisor-tab-content space-y-4 hidden">
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div class="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm">
                            Bugün QR ile Giriş Yapan Öğrenciler
                        </div>
                        <div id="advisor-today-attendances" class="p-4 space-y-2"></div>
                    </div>
                </div>
            </div>

            <!-- Plan İnceleme Modalı -->
            <div id="inspect-plan-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-scaleIn max-h-[90vh] overflow-y-auto">
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 class="font-extrabold text-slate-900 dark:text-white text-lg">Öğrenci Çalışma Planı İnceleme</h3>
                            <p class="text-xs text-slate-500"><span id="inspect-plan-student-name" class="font-bold text-indigo-600 dark:text-indigo-400"></span> • <span id="inspect-plan-month"></span></p>
                        </div>
                        <button onclick="Modal.close('inspect-plan-modal')" class="text-slate-400 hover:text-slate-600">
                            <i class="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <!-- Takvim Önizleme Grid'i -->
                    <div id="inspect-plan-grid" class="mt-4 grid grid-cols-7 gap-2"></div>

                    <!-- Reddetme Gerekçesi Alanı (Varsayılan Gizli) -->
                    <div id="reject-reason-container" class="mt-4 hidden p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
                        <label class="block text-xs font-bold text-rose-800 dark:text-rose-300">Planı Reddetme Gerekçesi:</label>
                        <textarea id="inspect-plan-reject-reason" rows="2" placeholder="Örn: Salı günleri ders çakışması bulunmaktadır, lütfen başka bir gün seçiniz." class="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"></textarea>
                        <div class="flex justify-end">
                            <button type="button" id="inspect-plan-confirm-reject-btn" class="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
                                Reddetmeyi Onayla
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onclick="Modal.close('inspect-plan-modal')" class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl">Kapat</button>
                        <div class="flex items-center gap-2">
                            <button type="button" id="advisor-reject-plan-btn" class="px-4 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition">
                                Planı Reddet
                            </button>
                            <button type="button" id="advisor-approve-plan-btn" class="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition">
                                Planı Onayla
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Yeni Görev Tanımla Modalı -->
            <div id="create-task-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                    <h3 class="font-bold text-slate-900 dark:text-white mb-4 text-base">Yeni Öğrenci Görevi Tanımla</h3>
                    <form id="create-task-form" class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Öğrenci</label>
                            <select id="task-student-select" name="studentId" required class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                <option value="">Öğrenci Seçiniz...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Görev Başlığı</label>
                            <input type="text" name="title" required placeholder="Örn: Hafta 4 Yazılım Entegrasyon Raporu" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Görev Açıklaması</label>
                            <textarea name="description" rows="3" required placeholder="Öğrencinin yapması gereken adımları belirtiniz..." class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Teslim Tarihi (Due Date)</label>
                            <input type="date" name="dueDate" required class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        </div>
                        <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onclick="Modal.close('create-task-modal')" class="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl">İptal</button>
                            <button type="submit" class="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Görevi Ata</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Görev Değerlendirme Modalı -->
            <div id="evaluate-task-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hidden">
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2 text-base">Görevi Değerlendir</h3>
                    <p id="eval-task-title-display" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4"></p>
                    <input type="hidden" id="eval-task-id">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Puan (0 - 100)</label>
                            <input type="number" id="eval-task-score" min="0" max="100" placeholder="100" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-500 mb-1">Değerlendirme Notu / Geri Bildirim</label>
                            <textarea id="eval-task-note" rows="3" required placeholder="Geri bildiriminizi yazınız..." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"></textarea>
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onclick="Modal.close('evaluate-task-modal')" class="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-xl">İptal</button>
                        <button type="button" id="eval-task-submit-btn" class="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Değerlendirmeyi Kaydet</button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Dinamik QR Başlat / Durdur
        const toggleQrBtn = document.getElementById('advisor-toggle-qr-btn');
        if (toggleQrBtn) toggleQrBtn.onclick = () => this.toggleDynamicQr();

        const refreshQrBtn = document.getElementById('advisor-refresh-qr-btn');
        if (refreshQrBtn) refreshQrBtn.onclick = () => this.fetchNewQrSession();

        // Yeni Görev Ata Formu
        const createTaskForm = document.getElementById('create-task-form');
        if (createTaskForm) createTaskForm.onsubmit = (e) => this.handleCreateTask(e);

        // Danışman Sekme Geçişleri
        document.querySelectorAll('.advisor-tab-btn').forEach(btn => {
            btn.onclick = (e) => this.switchTab(e.currentTarget.dataset.tab);
        });
    }

    async loadAll() {
        await Promise.all([
            this.loadPendingPlans(),
            this.loadAssignedTasks(),
            this.loadTodayAttendances()
        ]);
    }

    switchTab(tabId) {
        document.querySelectorAll('.advisor-tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.advisor-tab-btn').forEach(btn => {
            btn.classList.remove('border-blue-600', 'text-blue-600', 'font-semibold');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeContent = document.getElementById(`advisor-tab-${tabId}`);
        const activeBtn = document.querySelector(`.advisor-tab-btn[data-tab="${tabId}"]`);

        if (activeContent) activeContent.classList.remove('hidden');
        if (activeBtn) {
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
            activeBtn.classList.add('border-blue-600', 'text-blue-600', 'font-semibold');
        }

        // Eğer QR sekmesine geçildiyse ve henüz başlatılmadıysa ilk QR'ı üret
        if (tabId === 'qr' && !this.isQrRunning) {
            this.startDynamicQr();
        } else if (tabId !== 'qr' && this.isQrRunning) {
            // Arka planda gereksiz döngüyü duraklat
            this.stopDynamicQr();
        }
    }

    // ==========================================
    // 1. Dinamik Karekod (QR) ve 30 Sn Geri Sayım
    // ==========================================
    toggleDynamicQr() {
        if (this.isQrRunning) {
            this.stopDynamicQr();
            Toast.info('Dinamik QR yenilemesi duraklatıldı.');
        } else {
            this.startDynamicQr();
            Toast.success('Dinamik QR canlı yoklama döngüsü başlatıldı.');
        }
    }

    startDynamicQr() {
        this.isQrRunning = true;
        const btn = document.getElementById('advisor-toggle-qr-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-pause mr-1.5"></i> Duraklat';
            btn.className = 'px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm';
        }

        this.fetchNewQrSession();
    }

    stopDynamicQr() {
        this.isQrRunning = false;
        clearInterval(this.countdownInterval);
        clearTimeout(this.qrInterval);

        const btn = document.getElementById('advisor-toggle-qr-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-play mr-1.5"></i> Başlat';
            btn.className = 'px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm';
        }
    }

    async fetchNewQrSession() {
        try {
            const res = await ApiClient.Attendance.createQrSession();
            if (res.success && res.data) {
                this.currentQrSession = res.data;
                this.renderQrCode(res.data.tokenHash);
                this.startCountdown(30);
            }
        } catch (error) {
            Toast.error(error.message || 'QR oturumu oluşturulamadı.');
            this.stopDynamicQr();
        }
    }

    renderQrCode(text) {
        const qrContainer = document.getElementById('advisor-qr-canvas-container');
        if (!qrContainer) return;

        qrContainer.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            this.qrcodeInstance = new QRCode(qrContainer, {
                text: text,
                width: 220,
                height: 220,
                colorDark: '#1B365D',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrContainer.innerHTML = `<div class="p-4 bg-gray-100 font-mono text-xs break-all">${text}</div>`;
        }

        const tokenTextEl = document.getElementById('advisor-qr-token-display');
        if (tokenTextEl) {
            tokenTextEl.textContent = text.slice(0, 16) + '...';
            tokenTextEl.title = text;
        }
    }

    startCountdown(seconds) {
        clearInterval(this.countdownInterval);
        clearTimeout(this.qrInterval);

        this.remainingSeconds = seconds;
        const totalDuration = 30;
        const timerText = document.getElementById('advisor-qr-countdown-text');
        const circle = document.querySelector('.progress-ring__circle');
        const circumference = 2 * Math.PI * 40; // r=40

        if (circle) {
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = '0';
        }

        this.updateCountdownDisplay(circle, circumference, totalDuration);

        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateCountdownDisplay(circle, circumference, totalDuration);

            if (this.remainingSeconds <= 0) {
                clearInterval(this.countdownInterval);
                if (this.isQrRunning) {
                    this.fetchNewQrSession(); // 30 sn dolunca otomatik yeni QR al
                }
            }
        }, 1000);
    }

    updateCountdownDisplay(circle, circumference, totalDuration) {
        const timerText = document.getElementById('advisor-qr-countdown-text');
        if (timerText) {
            timerText.textContent = `${this.remainingSeconds}s`;
        }

        if (circle) {
            const offset = circumference - (this.remainingSeconds / totalDuration) * circumference;
            circle.style.strokeDashoffset = offset;

            // Renk kodlaması: son 5 sn kırmızı
            if (this.remainingSeconds <= 5) {
                circle.style.stroke = '#EF4444'; // Rose-500
            } else if (this.remainingSeconds <= 10) {
                circle.style.stroke = '#F59E0B'; // Amber-500
            } else {
                circle.style.stroke = '#10B981'; // Emerald-500
            }
        }
    }

    // ==========================================
    // 2. Plan Onayları (Submitted Plans)
    // ==========================================
    async loadPendingPlans() {
        try {
            const res = await ApiClient.Plan.getPending();
            const container = document.getElementById('advisor-pending-plans-list');
            const badge = document.getElementById('advisor-pending-plans-count');

            if (!container) return;

            const plans = res.data || [];
            if (badge) badge.textContent = plans.length;

            if (plans.length === 0) {
                container.innerHTML = '<div class="text-sm text-gray-400 py-6 text-center">Onay bekleyen çalışma planı bulunmamaktadır.</div>';
                return;
            }

            container.innerHTML = plans.map(p => `
                <div class="p-4 bg-white rounded-xl border border-gray-200 card-hover subtle-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-gray-800 text-sm">${p.studentFullName}</span>
                            <span class="text-xs text-gray-500 font-mono">(${p.studentNumber})</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">${p.year}/${p.month} Dönemi</span>
                        </div>
                        <div class="text-xs text-gray-600">
                            Toplam Planlanan Gün: <span class="font-semibold text-gray-800">${p.days.length} Gün</span> | 
                            Toplam Saat: <span class="font-semibold text-gray-800">${p.totalTargetHours} Saat</span>
                        </div>
                        ${p.notes ? `<div class="text-[11px] text-gray-400 mt-1 italic">Öğrenci Notu: ${p.notes}</div>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.AdvisorDashboardInstance.openPlanDaysViewModal('${p.id}')" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg">Günleri İncele</button>
                        <button onclick="window.AdvisorDashboardInstance.evaluatePlan('${p.id}', 3)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg shadow-sm"><i class="fas fa-check mr-1"></i> Onayla</button>
                        <button onclick="window.AdvisorDashboardInstance.promptRejectPlan('${p.id}')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-sm"><i class="fas fa-times mr-1"></i> Reddet</button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error('Bekleyen planlar alınamadı:', e);
        }
    }

    async evaluatePlan(planId, decision, rejectionReason = null) {
        try {
            const res = await ApiClient.Plan.evaluate(planId, decision, rejectionReason);
            if (res.success) {
                Toast.success(res.message || 'Plan başarıyla değerlendirildi.');
                await this.loadPendingPlans();
            }
        } catch (error) {
            Toast.error(error.message || 'İşlem başarısız oldu.');
        }
    }

    promptRejectPlan(planId) {
        const reason = prompt('Lütfen planı reddetme gerekçesini belirtiniz (Öğrenciye iletilecektir):');
        if (reason === null) return; // İptal
        if (!reason.trim()) {
            Toast.warning('Ret gerekçesi boş bırakılamaz.');
            return;
        }
        this.evaluatePlan(planId, 4, reason.trim()); // 4: Rejected
    }

    async openPlanDaysViewModal(planId) {
        try {
            const res = await ApiClient.Plan.getById(planId);
            const plan = res.data;
            if (!plan) return;

            const tbody = document.getElementById('view-plan-days-tbody');
            if (tbody) {
                tbody.innerHTML = plan.days.map(d => `
                    <tr class="border-b border-gray-100 text-xs">
                        <td class="py-2.5 px-3 font-semibold text-gray-800">${new Date(d.date).toLocaleDateString('tr-TR')} (${d.dayOfWeek})</td>
                        <td class="py-2.5 px-3">${d.startTime} - ${d.endTime}</td>
                        <td class="py-2.5 px-3 font-bold text-gray-700">${d.plannedHours} Saat</td>
                        <td class="py-2.5 px-3 text-gray-500">${d.notes || '-'}</td>
                    </tr>
                `).join('');
            }
            Modal.open('view-plan-days-modal');
        } catch (e) {
            Toast.error('Plan detayları yüklenemedi.');
        }
    }

    // ==========================================
    // 3. Görev Yönetimi (Task Assignment & Evaluation)
    // ==========================================
    async loadAssignedTasks() {
        const advisorId = AppStateManager.user?.userId;
        if (!advisorId) return;

        try {
            const res = await ApiClient.Task.getAdvisorTasks(advisorId);
            const container = document.getElementById('advisor-tasks-list');
            if (!container) return;

            const tasks = res.data || [];
            if (tasks.length === 0) {
                container.innerHTML = '<div class="text-sm text-gray-400 py-6 text-center">Henüz öğrenciye atanmış bir görev bulunmuyor.</div>';
                return;
            }

            container.innerHTML = tasks.map(t => {
                const isCompleted = t.status === 3 || t.status === 'Completed';

                return `
                    <div class="p-4 bg-white rounded-xl border border-gray-200 card-hover subtle-shadow flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start mb-2">
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                                    ${t.statusDescription}
                                </span>
                                <span class="text-xs text-gray-400">Hedef: ${new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <h4 class="font-bold text-gray-800 text-sm mb-1">${t.title}</h4>
                            <p class="text-xs text-gray-600 line-clamp-2 mb-2">${t.description}</p>
                            <div class="text-xs text-gray-500 font-medium">Öğrenci: <span class="text-gray-800">${t.studentFullName}</span> (${t.studentNumber})</div>
                            ${t.studentSubmissionNote ? `
                                <div class="bg-gray-50 border p-2 text-[11px] text-gray-700 rounded mt-2">
                                    <span class="font-semibold text-gray-800">Öğrenci Teslim Notu:</span> ${t.studentSubmissionNote}
                                </div>
                            ` : ''}
                            ${t.advisorEvaluationNote ? `
                                <div class="bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-900 rounded mt-2">
                                    <span class="font-semibold">Değerlendirme:</span> ${t.advisorEvaluationNote}
                                    ${t.advisorScore !== null ? `<span class="ml-2 font-bold text-emerald-700">(${t.advisorScore}/100)</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="pt-3 border-t border-gray-100 mt-3 flex justify-end">
                            <button onclick="window.AdvisorDashboardInstance.openEvaluateTaskModal('${t.id}', '${t.title}', '${t.advisorScore || ''}', '${t.advisorEvaluationNote || ''}')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm">
                                <i class="fas fa-star mr-1"></i> Not / Puan Gir
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('Danışman görevleri yüklenemedi:', e);
        }
    }

    async handleCreateTask(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const data = {
            studentId: formData.get('studentId'),
            title: formData.get('title'),
            description: formData.get('description'),
            dueDate: formData.get('dueDate')
        };

        try {
            const res = await ApiClient.Task.create(data);
            if (res.success) {
                Toast.success('Görev başarıyla öğrenciye atandı.');
                Modal.close('create-task-modal');
                form.reset();
                await this.loadAssignedTasks();
            }
        } catch (error) {
            Toast.error(error.message || 'Görev atanamadı.');
        }
    }

    openEvaluateTaskModal(taskId, title, score, note) {
        document.getElementById('eval-task-id').value = taskId;
        document.getElementById('eval-task-title-display').textContent = title;
        document.getElementById('eval-task-score').value = score || '';
        document.getElementById('eval-task-note').value = note || '';

        Modal.open('evaluate-task-modal');

        document.getElementById('eval-task-submit-btn').onclick = async () => {
            const s = document.getElementById('eval-task-score').value;
            const n = document.getElementById('eval-task-note').value.trim();

            if (!n) {
                Toast.warning('Lütfen bir değerlendirme notu giriniz.');
                return;
            }

            try {
                const res = await ApiClient.Task.evaluate(taskId, n, s ? parseInt(s) : null);
                if (res.success) {
                    Toast.success('Değerlendirme başarıyla kaydedildi.');
                    Modal.close('evaluate-task-modal');
                    await this.loadAssignedTasks();
                }
            } catch (error) {
                Toast.error(error.message || 'Değerlendirme kaydedilemedi.');
            }
        };
    }

    // ==========================================
    // 4. Bugünün Devam Kayıtları
    // ==========================================
    async loadTodayAttendances() {
        try {
            const res = await ApiClient.Attendance.getToday();
            const container = document.getElementById('advisor-today-attendances');
            if (!container) return;

            const list = res.data || [];
            if (list.length === 0) {
                container.innerHTML = '<div class="text-xs text-gray-400 py-3 text-center">Bugün henüz devam kaydı bulunmuyor.</div>';
                return;
            }

            container.innerHTML = list.map(a => `
                <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                    <div>
                        <div class="font-semibold text-gray-800">${a.studentFullName}</div>
                        <div class="text-[11px] text-gray-500">${a.studentNumber} | Giriş: ${new Date(a.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Doğrulandı</span>
                </div>
            `).join('');
        } catch (e) {
            console.error(e);
        }
    }
}

window.AdvisorDashboard = AdvisorDashboard;
window.advisorDashboard = new AdvisorDashboard();

