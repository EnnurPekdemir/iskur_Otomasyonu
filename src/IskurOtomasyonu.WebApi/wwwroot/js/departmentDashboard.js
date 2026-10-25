// ============================================================================
// Bölüm Başkanı Paneli (Department Head Dashboard)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class DepartmentDashboard {
    constructor() {
        this.students = [];
        this.advisors = [];
        this.announcements = [];
        this.departments = [];
        this.currentDepartmentId = null;
        this.selectedStudent = null;
    }

    async init() {
        console.log("DepartmentDashboard başlatılıyor...");
        this.renderShell();
        this.attachEventListeners();
        await this.loadInitialData();
    }

    renderShell() {
        const container = document.getElementById('department-dashboard-view');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık ve Aksiyon Barı -->
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-800 font-bold border border-gray-300">
                                <i class="fa-solid fa-graduation-cap text-sm"></i>
                            </span>
                            <h1 class="text-xl font-bold tracking-tight text-gray-900">
                                Bölüm Başkanlığı Yönetim Paneli
                            </h1>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                            Bölüm İŞKUR öğrencilerine danışman atama, genel duyuru/bildirim yayınlama ve takip merkezi.
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <button id="dept-refresh-btn" class="btn-secondary">
                            <i class="fa-solid fa-arrows-rotate text-xs"></i>
                            <span>Yenile</span>
                        </button>
                    </div>
                </div>

                <!-- KPI İstatistik Kartları (Minimal Gri-Beyaz) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Bölüm Öğrencisi</p>
                            <h3 id="dept-stat-total-students" class="text-2xl font-bold text-gray-900 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Kayıtlı İŞKUR Öğrencisi</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-lg">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Danışmansız Öğrenci</p>
                            <h3 id="dept-stat-unassigned" class="text-2xl font-bold text-amber-700 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Atama Bekliyor</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-lg">
                            <i class="fa-solid fa-user-clock"></i>
                        </div>
                    </div>

                    <div class="box-card p-4 flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Yayındaki Duyurular</p>
                            <h3 id="dept-stat-announcements" class="text-2xl font-bold text-teal-800 mt-0.5">-</h3>
                            <p class="text-[11px] text-gray-400 mt-0.5">Aktif Genel Bildirim</p>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 text-lg">
                            <i class="fa-solid fa-bullhorn"></i>
                        </div>
                    </div>
                </div>

                <!-- Sekmeler (Tabs) -->
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-6 overflow-x-auto" aria-label="Department Tabs">
                        <button id="dept-tab-students-btn" class="dept-tab-btn py-2.5 px-1 border-b-2 border-teal-800 font-semibold text-xs text-teal-900 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-user-gear"></i>
                            <span>Bölüm İŞKUR Öğrencileri & Danışman Ataması</span>
                        </button>
                        <button id="dept-tab-announcements-btn" class="dept-tab-btn py-2.5 px-1 border-b-2 border-transparent font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-bullhorn text-teal-700"></i>
                            <span>Öğrencilere Genel Duyuru / Bildirim Atma</span>
                        </button>
                    </nav>
                </div>

                <!-- ========================================================= -->
                <!-- 1. PANE: ÖĞRENCİLER & DANIŞMAN ATAMA -->
                <!-- ========================================================= -->
                <div id="dept-pane-students" class="space-y-4">
                    <div class="box-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div class="relative w-full sm:w-64">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                                <i class="fa-solid fa-magnifying-glass text-xs"></i>
                            </span>
                            <input type="text" id="dept-search-input" placeholder="Öğrenci veya numara ara..." 
                                   class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-teal-700">
                        </div>

                        <div class="flex items-center gap-2">
                            <select id="dept-advisor-filter" class="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-teal-700">
                                <option value="">Tüm Öğrenciler</option>
                                <option value="unassigned">Sadece Danışmansızlar</option>
                            </select>
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
                                        <th>Mevcut Danışman</th>
                                        <th>Görev Birimi</th>
                                        <th class="text-center">Kalan İzin</th>
                                        <th class="text-center">Durum</th>
                                        <th class="text-right">Danışman Atama</th>
                                    </tr>
                                </thead>
                                <tbody id="dept-students-table-body">
                                    <tr>
                                        <td colspan="8" class="py-8 text-center text-gray-400">Yükleniyor...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ========================================================= -->
                <!-- 2. PANE: GENEL DUYURU / BİLDİRİM YAYINLAMA -->
                <!-- ========================================================= -->
                <div id="dept-pane-announcements" class="space-y-4 hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Duyuru Oluşturma Formu -->
                        <div class="box-card p-4 md:col-span-1 space-y-3">
                            <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
                                <i class="fa-solid fa-paper-plane text-teal-700"></i>
                                <h3 class="font-bold text-xs text-gray-900">Yeni Genel Duyuru Yayınla</h3>
                            </div>
                            <form id="create-announcement-form" class="space-y-3 text-xs">
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Duyuru Başlığı</label>
                                    <input type="text" id="ann-title" required placeholder="Örn: Aylık Çalışma Planı Onayları" 
                                           class="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700">
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block font-semibold text-gray-600 mb-1">Kategori</label>
                                        <select id="ann-category" class="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white">
                                            <option value="Genel">Genel</option>
                                            <option value="İŞKUR">İŞKUR</option>
                                            <option value="Mazeret">Mazeret</option>
                                            <option value="Önemli">Önemli</option>
                                        </select>
                                    </div>
                                    <div class="flex items-center pt-5">
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" id="ann-urgent" class="rounded text-teal-700">
                                            <span class="font-semibold text-rose-700">Acil / Önemli</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-semibold text-gray-600 mb-1">Duyuru İçeriği</label>
                                    <textarea id="ann-content" rows="4" required placeholder="Fakültede çalışan öğrencilere duyurmak istediğiniz mesajı yazınız..." 
                                              class="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700"></textarea>
                                </div>
                                <button type="submit" id="submit-ann-btn" class="w-full btn-primary justify-center">
                                    <i class="fa-solid fa-bullhorn text-xs"></i>
                                    <span>Tüm Öğrencilere Duyur</span>
                                </button>
                            </form>
                        </div>

                        <!-- Yayınlanan Duyurular Listesi -->
                        <div class="box-card p-4 md:col-span-2 space-y-3">
                            <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                                <h3 class="font-bold text-xs text-gray-900">Yayındaki Aktif Duyurular</h3>
                                <span class="text-[11px] text-gray-400">Tüm öğrencilerin panelinde anında görüntülenir</span>
                            </div>
                            <div id="dept-announcements-list" class="space-y-2.5">
                                <div class="py-8 text-center text-gray-400 text-xs">Duyurular yükleniyor...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Danışman Atama Modalı -->
            <div id="dept-assign-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs hidden">
                <div class="box-card bg-white p-5 max-w-sm w-full space-y-3 shadow-xl">
                    <h3 class="font-bold text-gray-900 text-sm">Öğrenciye Danışman Ata</h3>
                    <p class="text-xs text-gray-600">
                        <strong id="dept-assign-student-name">Öğrenci</strong> için danışman öğretim elemanını seçiniz:
                    </p>
                    <input type="hidden" id="dept-assign-student-id">
                    <div>
                        <label class="block text-[11px] font-semibold text-gray-500 mb-1">Öğretim Elemanı / Danışman</label>
                        <select id="dept-assign-advisor-select" class="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700 bg-white">
                            <option value="">Danışman Seçiniz...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-gray-500 mb-1">Atama Notu</label>
                        <input type="text" id="dept-assign-note" placeholder="Örn: 2026 Bahar Dönemi Görevlendirmesi" 
                               class="w-full p-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-teal-700">
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onclick="document.getElementById('dept-assign-modal').classList.add('hidden')" class="btn-secondary">
                            İptal
                        </button>
                        <button type="button" id="dept-confirm-assign-btn" class="btn-primary">
                            Danışmanı Ata
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.getElementById('dept-refresh-btn')?.addEventListener('click', () => this.loadInitialData());

        // Sekmeler
        const tabs = [
            { btn: 'dept-tab-students-btn', pane: 'dept-pane-students' },
            { btn: 'dept-tab-announcements-btn', pane: 'dept-pane-announcements' }
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

        // Arama ve Filtre
        document.getElementById('dept-search-input')?.addEventListener('input', () => this.renderStudentsTable());
        document.getElementById('dept-advisor-filter')?.addEventListener('change', () => this.renderStudentsTable());

        // Danışman Atama Onay Butonu
        document.getElementById('dept-confirm-assign-btn')?.addEventListener('click', () => this.executeAssignAdvisor());

        // Duyuru Formu Submit
        document.getElementById('create-announcement-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateAnnouncement();
        });
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadAdvisors(),
                this.loadDepartmentStudents(),
                this.loadAnnouncements()
            ]);
        } catch (err) {
            console.error("Bölüm Başkanı verileri yüklenirken hata:", err);
            AppToast.error("Veriler yüklenirken bir sorun oluştu.");
        }
    }

    async loadAdvisors() {
        try {
            const res = await ApiClient.Academic.getAdvisors();
            this.advisors = res.data || [];
            const select = document.getElementById('dept-assign-advisor-select');
            if (select) {
                select.innerHTML = '<option value="">Danışman Seçiniz...</option>';
                this.advisors.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = `${a.academicTitle ? a.academicTitle + ' ' : ''}${a.fullName}`;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.warn("Danışmanlar yüklenemedi:", err);
        }
    }

    async loadDepartmentStudents() {
        try {
            const res = await ApiClient.Academic.getDepartmentStudents();
            this.students = res.data || [];
            
            document.getElementById('dept-stat-total-students').textContent = this.students.length;
            const unassigned = this.students.filter(s => !s.advisorId || s.advisorName === 'Atanmadı');
            document.getElementById('dept-stat-unassigned').textContent = unassigned.length;

            this.renderStudentsTable();
        } catch (err) {
            console.warn("Bölüm öğrencileri yüklenemedi:", err);
        }
    }

    async loadAnnouncements() {
        try {
            const res = await ApiClient.Academic.getAnnouncements();
            this.announcements = res.data || [];
            document.getElementById('dept-stat-announcements').textContent = this.announcements.length;
            this.renderAnnouncementsList();
        } catch (err) {
            console.warn("Duyurular yüklenemedi:", err);
        }
    }

    renderStudentsTable() {
        const tbody = document.getElementById('dept-students-table-body');
        if (!tbody) return;

        const query = (document.getElementById('dept-search-input')?.value || '').toLowerCase().trim();
        const advisorFilter = document.getElementById('dept-advisor-filter')?.value || '';

        let filtered = [...this.students];

        if (query) {
            filtered = filtered.filter(s => 
                (s.studentNumber && s.studentNumber.toLowerCase().includes(query)) ||
                (s.fullName && s.fullName.toLowerCase().includes(query))
            );
        }

        if (advisorFilter === 'unassigned') {
            filtered = filtered.filter(s => !s.advisorId || s.advisorName === 'Atanmadı');
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-gray-400">Kriterlere uygun öğrenci bulunamadı.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(s => {
            const hasAdvisor = s.advisorId && s.advisorName !== 'Atanmadı';
            return `
                <tr>
                    <td class="font-mono">${s.studentNumber || '-'}</td>
                    <td class="font-bold text-gray-900">${s.fullName}</td>
                    <td>${s.departmentName || '-'}</td>
                    <td>
                        ${hasAdvisor 
                            ? `<span class="badge-minimal badge-success"><i class="fa-solid fa-user-check"></i> ${s.advisorName}</span>` 
                            : `<span class="badge-minimal badge-warning"><i class="fa-solid fa-clock"></i> Atanmadı</span>`}
                    </td>
                    <td>${s.unitName || 'Atanmadı'}</td>
                    <td class="text-center font-bold">${s.remainingLeaveDays ?? 10} Gün</td>
                    <td class="text-center">
                        <span class="badge-minimal ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                            ${s.status === 'Active' ? 'Aktif' : (s.status === 'Terminated' ? 'İlişik Kesildi' : s.status)}
                        </span>
                    </td>
                    <td class="text-right">
                        <button onclick="window.deptDashboard.openAssignModal('${s.studentId}', '${s.fullName}', '${s.advisorId || ''}')" 
                                class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-[11px] font-semibold transition">
                            <i class="fa-solid fa-user-pen mr-1"></i>Danışman Ata
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderAnnouncementsList() {
        const container = document.getElementById('dept-announcements-list');
        if (!container) return;

        if (this.announcements.length === 0) {
            container.innerHTML = `<div class="py-6 text-center text-gray-400 text-xs">Henüz yayınlanmış duyuru bulunmuyor.</div>`;
            return;
        }

        container.innerHTML = this.announcements.map(ann => {
            const dateStr = new Date(ann.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="p-3 rounded-lg border ${ann.isUrgent ? 'border-rose-200 bg-rose-50/50' : 'border-gray-200 bg-white'} space-y-1">
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center gap-1.5">
                            ${ann.isUrgent ? `<span class="badge-minimal badge-danger">ACİL</span>` : ''}
                            <span class="badge-minimal badge-neutral">${ann.category || 'Genel'}</span>
                            <span class="font-bold text-gray-900">${ann.title}</span>
                        </div>
                        <span class="text-[10px] text-gray-400">${dateStr}</span>
                    </div>
                    <p class="text-xs text-gray-600 pt-0.5 leading-relaxed">${ann.content}</p>
                    <div class="pt-1 text-[10px] text-gray-400 flex items-center justify-between border-t border-gray-100 mt-1">
                        <span>Yayınlayan: <strong>${ann.createdByName || 'Bölüm Başkanlığı'}</strong></span>
                        <span>Kapsam: <strong>${ann.departmentName || 'Fakülte Geneli'}</strong></span>
                    </div>
                </div>
            `;
        }).join('');
    }

    openAssignModal(studentId, studentName, currentAdvisorId) {
        document.getElementById('dept-assign-student-id').value = studentId;
        document.getElementById('dept-assign-student-name').textContent = studentName;
        document.getElementById('dept-assign-note').value = 'Bölüm Başkanlığı tarafından danışman ataması yapıldı.';
        
        const select = document.getElementById('dept-assign-advisor-select');
        if (select && currentAdvisorId) {
            select.value = currentAdvisorId;
        }

        document.getElementById('dept-assign-modal').classList.remove('hidden');
    }

    async executeAssignAdvisor() {
        const studentId = document.getElementById('dept-assign-student-id').value;
        const advisorId = document.getElementById('dept-assign-advisor-select').value;
        const note = document.getElementById('dept-assign-note').value.trim();

        if (!advisorId) {
            AppToast.warning("Lütfen atanacak danışmanı seçiniz.");
            return;
        }

        try {
            await ApiClient.Academic.assignAdvisor(studentId, advisorId, note);
            AppToast.success("Danışman başarıyla atandı.");
            document.getElementById('dept-assign-modal').classList.add('hidden');
            await this.loadDepartmentStudents();
        } catch (err) {
            console.error("Danışman atama hatası:", err);
            AppToast.error(err.message || "Danışman atanamadı.");
        }
    }

    async handleCreateAnnouncement() {
        const title = document.getElementById('ann-title').value.trim();
        const content = document.getElementById('ann-content').value.trim();
        const category = document.getElementById('ann-category').value;
        const isUrgent = document.getElementById('ann-urgent').checked;
        const btn = document.getElementById('submit-ann-btn');

        if (!title || !content) {
            AppToast.warning("Lütfen başlık ve duyuru içeriğini doldurunuz.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Yayınlanıyor...</span>`;

        try {
            await ApiClient.Academic.createAnnouncement({
                title,
                content,
                category,
                isUrgent,
                departmentId: this.currentDepartmentId || null
            });

            AppToast.success("Duyuru başarıyla tüm öğrencilere yayınlandı!");
            document.getElementById('create-announcement-form').reset();
            await this.loadAnnouncements();
        } catch (err) {
            console.error("Duyuru yayınlama hatası:", err);
            AppToast.error(err.message || "Duyuru yayınlanamadı.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-bullhorn text-xs"></i> <span>Tüm Öğrencilere Duyur</span>`;
        }
    }
}

window.deptDashboard = new DepartmentDashboard();
