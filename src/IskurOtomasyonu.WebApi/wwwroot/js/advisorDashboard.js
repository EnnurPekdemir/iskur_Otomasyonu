// ============================================================================
// Danışman Öğretmen Paneli (Advisor Dashboard)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class AdvisorDashboard {
    constructor() {
        this.todayAttendances = [];
        this.students = [];
        this.pendingPlans = [];
        this.assignedTasks = [];
        this.currentQrSession = null;
        this.countdownInterval = null;
        this.qrInterval = null;
        this.remainingSeconds = 30;
        this.isQrRunning = false;
        this.qrcodeInstance = null;
    }

    async init() {
        console.log("AdvisorDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadInitialData();
    }

    renderShell() {
        const container = document.getElementById('advisor-dashboard-view');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                                <i class="fa-solid fa-chalkboard-user text-sm"></i>
                            </span>
                            <h1 class="text-xl font-bold tracking-tight text-gray-900">
                                Danışman Öğretmen Yönetim Paneli
                            </h1>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            O gün çalışan öğrencileri izleme, görev tanımlama ve 30 saniyelik dinamik QR yoklama döngüsü.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="adv-refresh-btn" class="btn-secondary">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları (Minimal Gri-Beyaz) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bugün Çalışan Öğrenci</p>
                            <h3 id="adv-stat-today-active" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Yoklama Kaydı Olan</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-lg">
                            <i class="fa-solid fa-user-check"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tanımlanan Görevler</p>
                            <h3 id="adv-stat-total-tasks" class="text-2xl font-bold text-teal-800 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Aktif / Tamamlanan</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-lg">
                            <i class="fa-solid fa-tasks"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Onay Bekleyen Plan</p>
                            <h3 id="adv-stat-pending-plans" class="text-2xl font-bold text-amber-700 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">İnceleme Bekliyor</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-lg">
                            <i class="fa-solid fa-calendar-check"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Karekod Durumu</p>
                            <h3 id="adv-stat-qr-status" class="text-base font-bold text-gray-900 mt-1">Hazır</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">30 sn Güvenlikli QR</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-qrcode"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Advisor Tabs">
                        <button id="adv-tab-today-btn" class="adv-tab-btn py-2.5 px-1 border-b-2 border-teal-800 font-semibold text-xs text-teal-900 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-user-clock"></i>
                            <span>O Gün Çalışan Öğrenciler Listesi</span>
                        </button>
                        <button id="adv-tab-tasks-btn" class="adv-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-list-check"></i>
                            <span>Öğrencilere Görev / İş Tanımlama</span>
                        </button>
                        <button id="adv-tab-qr-btn" class="adv-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-qrcode"></i>
                            <span>Canlı 30 sn Dinamik QR Oturumu</span>
                        </button>
                        <button id="adv-tab-plans-btn" class="adv-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>Onay Bekleyen Çalışma Planları</span>
                            <span id="adv-plans-badge" class="hidden px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">0</span>
                        </button>
                    </nav>
                </div>

                <!-- ========================================================= -->
                <!-- 1. PANE: O GÜN ÇALIŞAN ÖĞRENCİLER LİSTESİ -->
                <!-- ========================================================= -->
                <div id="adv-pane-today" class="space-y-4">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span class="font-bold text-xs text-gray-700">Bugün Yoklama Veren & Çalışan Öğrenciler</span>
                            <span class="text-[11px] text-gray-500">Tarih: <strong>${new Date().toLocaleDateString('tr-TR')}</strong></span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No</th>
                                        <th>Ad Soyad</th>
                                        <th>Bölüm</th>
                                        <th>Görev Birimi</th>
                                        <th class="text-center">Giriş Saati</th>
                                        <th class="text-center">Çıkış Saati</th>
                                        <th class="text-center">Çalışılan Süre</th>
                                        <th class="text-center">Doğrulama</th>
                                        <th class="text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody id="adv-today-table-body">
                                    <tr>
                                        <td colspan="9" class="py-8 text-center text-gray-400">Yükleniyor...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. PANE: ÖĞRENCİLERE GÖREV TANIMLAMA -->
                <!-- ========================================================= -->
                <div id="adv-pane-tasks" class="space-y-4 hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Görev Tanımlama Formu -->
                        <div class="box-card p-4 md:col-span-1 space-y-3">
                            <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <i class="fa-solid fa-plus text-teal-700"></i>
                                <h3 class="font-bold text-xs text-gray-900">Öğrenciye Yeni Görev Tanımla</h3>
                            </div>
                            <form id="adv-create-task-form" class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Görevlendirilecek Öğrenci</label>
                                    <select id="adv-task-student" required class="w-full p-2 border border-gray-300 rounded-lg bg-white">
                                        <option value="">Öğrenci Seçiniz...</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Görev / İş Başlığı</label>
                                    <input type="text" id="adv-task-title" required placeholder="Örn: Bilgisayar Lab 2 Envanter Kontrolü" 
                                           class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700">
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Görev Tanımı ve Detayları</label>
                                    <textarea id="adv-task-desc" rows="3" required placeholder="Öğrencinin yapması gereken işin kapsamını yazınız..." 
                                              class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700"></textarea>
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Son Teslim Tarihi</label>
                                    <input type="date" id="adv-task-duedate" required class="w-full p-2 border border-gray-300 rounded-lg">
                                </div>
                                <button type="submit" id="adv-submit-task-btn" class="w-full btn-primary justify-center">
                                    <i class="fa-solid fa-paper-plane text-xs"></i>
                                    <span>Görevi Öğrenciye Ata</span>
                                </button>
                            </form>
                        </div>

                        <!-- Tanımlanan Görevler Listesi -->
                        <div class="box-card p-4 md:col-span-2 space-y-3">
                            <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                                <h3 class="font-bold text-xs text-gray-900">Tanımlanan Görevler & Değerlendirme</h3>
                                <span class="text-[11px] text-gray-400">Teslim edilen görevleri notlandırabilirsiniz</span>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="table-minimal text-xs">
                                    <thead>
                                        <tr>
                                            <th>Öğrenci</th>
                                            <th>Görev Başlığı</th>
                                            <th>Teslim Tarihi</th>
                                            <th>Öğrenci Notu</th>
                                            <th class="text-center">Durum</th>
                                            <th class="text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody id="adv-tasks-table-body">
                                        <tr>
                                            <td colspan="6" class="py-6 text-center text-gray-400">Görevler yükleniyor...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 3. PANE: 30 SN DİNAMİK QR YOKLAMA -->
                <!-- ========================================================= -->
                <div id="adv-pane-qr" class="space-y-4 hidden">
                    <div class="max-w-md mx-auto box-card p-6 text-center space-y-4">
                        <div>
                            <h3 class="font-bold text-sm text-gray-900">30 Saniyelik Dinamik QR Devam Kodu</h3>
                            <p class="text-xs text-gray-500 mt-0.5">Çalışan öğrenciler bu kodu okutarak devam girişi yapar.</p>
                        </div>

                        <div class="relative inline-flex items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm mx-auto">
                            <div id="adv-qr-canvas" class="w-[200px] h-[200px] flex items-center justify-center">
                                <i class="fa-solid fa-spinner fa-spin text-2xl text-teal-700"></i>
                            </div>
                        </div>

                        <!-- Geri Sayım -->
                        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                            <span id="adv-countdown-label">30 sn sonra yenilenecek</span>
                        </div>

                        <div class="flex items-center justify-center gap-2 pt-2">
                            <button id="adv-toggle-qr-btn" class="btn-primary">
                                <i class="fa-solid fa-play text-xs"></i>
                                <span>QR Döngüsünü Başlat</span>
                            </button>
                            <button id="adv-manual-refresh-qr" class="btn-secondary">
                                <i class="fa-solid fa-arrows-rotate text-xs"></i>
                                <span>Anında Yenile</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 4. PANE: ONAY BEKLEYEN PLANLAR -->
                <!-- ========================================================= -->
                <div id="adv-pane-plans" class="space-y-4 hidden">
                    <div class="box-card overflow-hidden">
                        <div class="p-3 border-b border-gray-200 bg-gray-50">
                            <span class="font-bold text-xs text-gray-700">Danışman Onayında Olan Aylık Çalışma Planları</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="table-minimal text-xs">
                                <thead>
                                    <tr>
                                        <th>Öğrenci No & Ad Soyad</th>
                                        <th>Dönem (Ay / Yıl)</th>
                                        <th class="text-center">Planlanan Gün</th>
                                        <th class="text-center">Hedef Saat</th>
                                        <th class="text-center">Durum</th>
                                        <th class="text-right">Danışman Kararı</th>
                                    </tr>
                                </thead>
                                <tbody id="adv-plans-table-body">
                                    <tr>
                                        <td colspan="6" class="py-6 text-center text-gray-400">Onay bekleyen plan bulunmuyor.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('adv-refresh-btn')?.addEventListener('click', () => this.loadInitialData());

        // Sekmeler
        const tabs = [
            { btn: 'adv-tab-today-btn', pane: 'adv-pane-today' },
            { btn: 'adv-tab-tasks-btn', pane: 'adv-pane-tasks' },
            { btn: 'adv-tab-qr-btn', pane: 'adv-pane-qr' },
            { btn: 'adv-tab-plans-btn', pane: 'adv-pane-plans' }
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

        // Görev Formu Submit
        document.getElementById('adv-create-task-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateTask();
        });

        // QR Döngü Butonları
        document.getElementById('adv-toggle-qr-btn')?.addEventListener('click', () => this.toggleQrLoop());
        document.getElementById('adv-manual-refresh-qr')?.addEventListener('click', () => this.generateNewQrSession());
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadTodayAttendances(),
                this.loadStudents(),
                this.loadTasks(),
                this.loadPendingPlans()
            ]);
        } catch (err) {
            console.error("Danışman paneli yükleme hatası:", err);
        }
    }

    async loadTodayAttendances() {
        try {
            const res = await ApiClient.Attendance.getToday();
            this.todayAttendances = res.data || [];
            document.getElementById('adv-stat-today-active').textContent = `${this.todayAttendances.length} Öğrenci`;
            this.renderTodayTable();
        } catch (err) {
            console.warn("Bugünkü devam listesi çekilemedi:", err);
        }
    }

    renderTodayTable() {
        const tbody = document.getElementById('adv-today-table-body');
        if (!tbody) return;

        if (this.todayAttendances.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-gray-400">Bugün henüz yoklama vermiş çalışan öğrenci bulunmuyor.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.todayAttendances.map(att => {
            const inTime = new Date(att.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const outTime = att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';

            return `
                <tr>
                    <td class="font-mono font-medium">${att.studentNumber || '-'}</td>
                    <td class="font-bold text-gray-900">${att.studentName || '-'}</td>
                    <td>${att.departmentName || '-'}</td>
                    <td><span class="badge-minimal badge-neutral">${att.unitName || 'Fakülte'}</span></td>
                    <td class="text-center font-mono font-bold">${inTime}</td>
                    <td class="text-center font-mono">${outTime}</td>
                    <td class="text-center font-bold text-teal-800">${att.actualHoursWorked || 5} Saat</td>
                    <td class="text-center"><span class="badge-minimal badge-success">Dinamik QR</span></td>
                    <td class="text-center">
                        <span class="badge-minimal ${att.checkOutTime ? 'badge-neutral' : 'badge-success'}">
                            ${att.checkOutTime ? 'Mesai Tamamlandı' : 'Görevde'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadStudents() {
        try {
            const res = await ApiClient.Academic.getAllStudents();
            this.students = res.data || [];
            const select = document.getElementById('adv-task-student');
            if (select) {
                select.innerHTML = '<option value="">Öğrenci Seçiniz...</option>';
                this.students.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.studentId;
                    opt.textContent = `${s.studentNumber} - ${s.fullName} (${s.departmentName})`;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.warn("Öğrenci listesi çekilemedi:", err);
        }
    }

    async loadTasks() {
        const user = ApiClient.getUser();
        if (!user || !user.id) return;

        try {
            const res = await ApiClient.Task.getAdvisorTasks(user.id);
            this.assignedTasks = res.data || [];
            document.getElementById('adv-stat-total-tasks').textContent = this.assignedTasks.length;
            this.renderTasksTable();
        } catch (err) {
            console.warn("Görevler çekilemedi:", err);
        }
    }

    renderTasksTable() {
        const tbody = document.getElementById('adv-tasks-table-body');
        if (!tbody) return;

        if (this.assignedTasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-gray-400">Tanımlanmış görev bulunmuyor.</td></tr>`;
            return;
        }

        tbody.innerHTML = this.assignedTasks.map(t => {
            const isCompleted = t.status === 3;
            const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR') : '-';

            return `
                <tr>
                    <td class="font-bold text-gray-900">${t.studentName || 'Öğrenci'}</td>
                    <td><strong>${t.title}</strong></td>
                    <td>${dueStr}</td>
                    <td class="max-w-[150px] truncate">${t.studentSubmissionNote || '-'}</td>
                    <td class="text-center">
                        <span class="badge-minimal ${isCompleted ? 'badge-success' : 'badge-warning'}">
                            ${isCompleted ? 'Tamamlandı' : 'Beklemede'}
                        </span>
                    </td>
                    <td class="text-right">
                        ${isCompleted ? `
                            <span class="text-xs font-bold text-emerald-700">Puan: ${t.advisorScore ?? 100}</span>
                        ` : `
                            <span class="text-gray-400 text-xs">Teslim Bekliyor</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    async handleCreateTask() {
        const studentId = document.getElementById('adv-task-student').value;
        const title = document.getElementById('adv-task-title').value.trim();
        const description = document.getElementById('adv-task-desc').value.trim();
        const dueDate = document.getElementById('adv-task-duedate').value;
        const btn = document.getElementById('adv-submit-task-btn');

        if (!studentId || !title || !description || !dueDate) {
            AppToast.warning("Lütfen tüm alanları eksiksiz doldurunuz.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Atanıyor...</span>`;

        try {
            await ApiClient.Task.create({
                studentId,
                title,
                description,
                dueDate
            });

            AppToast.success("Görev başarıyla öğrenciye atandı!");
            document.getElementById('adv-create-task-form').reset();
            await this.loadTasks();
        } catch (err) {
            AppToast.error(err.message || "Görev atanamadı.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-paper-plane text-xs"></i> <span>Görevi Öğrenciye Ata</span>`;
        }
    }

    async loadPendingPlans() {
        try {
            const res = await ApiClient.Plan.getPending();
            this.pendingPlans = res.data || [];
            
            const badge = document.getElementById('adv-plans-badge');
            if (badge) {
                badge.textContent = this.pendingPlans.length;
                if (this.pendingPlans.length > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }

            document.getElementById('adv-stat-pending-plans').textContent = this.pendingPlans.length;
            this.renderPlansTable();
        } catch (err) {
            console.warn("Bekleyen planlar çekilemedi:", err);
        }
    }

    renderPlansTable() {
        const tbody = document.getElementById('adv-plans-table-body');
        if (!tbody) return;

        if (this.pendingPlans.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-gray-400">Onay bekleyen çalışma planı bulunmuyor.</td></tr>`;
            return;
        }

        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        tbody.innerHTML = this.pendingPlans.map(p => {
            return `
                <tr>
                    <td class="font-bold text-gray-900">${p.studentName || 'Öğrenci'}</td>
                    <td>${months[(p.month || 1) - 1]} ${p.year}</td>
                    <td class="text-center font-bold">${p.days ? p.days.length : 0} Gün</td>
                    <td class="text-center font-bold font-mono text-teal-800">${p.totalTargetHours || 0} Saat</td>
                    <td class="text-center"><span class="badge-minimal badge-warning">Onay Bekliyor</span></td>
                    <td class="text-right">
                        <div class="inline-flex items-center gap-1.5">
                            <button onclick="window.advisorDashboard.evaluatePlan('${p.id}', 3)" 
                                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition">
                                <i class="fa-solid fa-check mr-1"></i>Onayla
                            </button>
                            <button onclick="window.advisorDashboard.evaluatePlan('${p.id}', 4)" 
                                    class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition">
                                <i class="fa-solid fa-xmark mr-1"></i>Reddet
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async evaluatePlan(planId, decision) {
        try {
            await ApiClient.Plan.evaluate(planId, decision, decision === 4 ? 'Danışman tarafından uygun görülmedi.' : null);
            AppToast.success(decision === 3 ? "Çalışma planı onaylandı." : "Plan reddedildi.");
            await this.loadPendingPlans();
        } catch (err) {
            AppToast.error(err.message || "İşlem sırasında hata oluştu.");
        }
    }

    // QR Döngüsü
    toggleQrLoop() {
        const btn = document.getElementById('adv-toggle-qr-btn');
        if (this.isQrRunning) {
            this.stopQrLoop();
            btn.innerHTML = `<i class="fa-solid fa-play text-xs"></i> <span>QR Döngüsünü Başlat</span>`;
            document.getElementById('adv-stat-qr-status').textContent = 'Durduruldu';
        } else {
            this.startQrLoop();
            btn.innerHTML = `<i class="fa-solid fa-pause text-xs"></i> <span>Döngüyü Durdur</span>`;
            document.getElementById('adv-stat-qr-status').textContent = 'Canlı Yayın';
        }
    }

    startQrLoop() {
        this.isQrRunning = true;
        this.generateNewQrSession();

        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;
            const label = document.getElementById('adv-countdown-label');
            if (label) label.textContent = `${this.remainingSeconds} sn sonra yenilenecek`;

            if (this.remainingSeconds <= 0) {
                this.generateNewQrSession();
            }
        }, 1000);
    }

    stopQrLoop() {
        this.isQrRunning = false;
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        if (this.qrInterval) clearInterval(this.qrInterval);
    }

    async generateNewQrSession() {
        this.remainingSeconds = 30;
        try {
            const res = await ApiClient.Attendance.createQrSession();
            this.currentQrSession = res.data;
            this.renderQrCode(this.currentQrSession.tokenHash);
        } catch (err) {
            console.warn("QR oluşturulamadı:", err);
        }
    }

    renderQrCode(hash) {
        const container = document.getElementById('adv-qr-canvas');
        if (!container) return;

        container.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            this.qrcodeInstance = new QRCode(container, {
                text: hash,
                width: 180,
                height: 180,
                colorDark: "#111827",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            container.innerHTML = `<div class="p-3 text-xs font-mono break-all text-gray-700 bg-gray-50 border rounded">${hash}</div>`;
        }
    }
}

window.advisorDashboard = new AdvisorDashboard();
