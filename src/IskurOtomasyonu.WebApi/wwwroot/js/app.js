// ============================================================================
// Uygulama Ana Yönlendiricisi (App Router & RBAC Guard)
// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu
// ============================================================================

class AppRouter {
    constructor() {
        this.currentView = null;
        this.userProfile = null;
        this.availableRoles = ['Ogrenci', 'Danisman', 'BolumBaskani', 'Dekanlik'];
    }

    async init() {
        console.log("İŞKUR Otomasyonu UI Başlatılıyor...");

        // Tema ve State Başlatma
        AppStateManager.init();

        // Olay Dinleyicileri
        this.attachGlobalEvents();

        // Oturum Kontrolü
        const token = ApiClient.getToken();
        const user = ApiClient.getUser();

        if (token && user) {
            await this.onLoginSuccess(user);
        } else {
            this.showLoginView();
        }
    }

    attachGlobalEvents() {
        // Oturum süresi dolunca
        window.addEventListener('auth:expired', () => {
            AppToast.error("Oturum süreniz sona erdi. Lütfen tekrar giriş yapınız.");
            this.logout();
        });

        // Çıkış Butonları
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        document.getElementById('mobile-logout-btn')?.addEventListener('click', () => this.logout());

        // Tema Değiştirici Buton
        document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
            AppStateManager.toggleDarkMode();
        });

        // Mobil Menü Aç/Kapa
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        mobileMenuBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('-translate-x-full');
        });

        // Profil Menüsü Aç/Kapa
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown?.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            userDropdown?.classList.add('hidden');
        });

        // Profil Butonu
        document.getElementById('nav-profile-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('profile');
        });
    }

    async onLoginSuccess(user) {
        console.log("Giriş başarılı, kullanıcı:", user);
        AppStateManager.setUser(user);

        // UI düzenlemeleri
        document.getElementById('auth-view')?.classList.add('hidden');
        document.getElementById('app-shell')?.classList.remove('hidden');

        // Kullanıcı Profilini Çek
        try {
            const profileRes = await ApiClient.Academic.getMyProfile();
            this.userProfile = profileRes.data || {};
        } catch (err) {
            console.warn("Profil yüklenirken hata:", err);
            this.userProfile = {
                fullName: user.email,
                roles: user.roles || []
            };
        }

        this.updateTopBar(this.userProfile);
        this.buildSidebarNav(this.userProfile.roles || user.roles || []);

        // Varsayılan role göre ilk sayfaya yönlendir
        const roles = this.userProfile.roles || user.roles || [];
        if (roles.includes('Dekanlik')) {
            this.navigate('dean');
        } else if (roles.includes('BolumBaskani')) {
            this.navigate('department');
        } else if (roles.includes('Danisman')) {
            this.navigate('advisor');
        } else {
            this.navigate('student');
        }
    }

    updateTopBar(profile) {
        const nameEl = document.getElementById('topbar-user-name');
        const roleEl = document.getElementById('topbar-user-role');
        const avatarEl = document.getElementById('topbar-user-avatar');

        const primaryRole = (profile.roles && profile.roles[0]) || 'Kullanıcı';
        const roleDisplayName = this.getRoleTitle(primaryRole);

        if (nameEl) nameEl.textContent = profile.fullName || 'Kullanıcı';
        if (roleEl) roleEl.textContent = roleDisplayName;
        if (avatarEl) {
            const initials = (profile.fullName || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            avatarEl.textContent = initials;
        }
    }

    buildSidebarNav(roles) {
        const navContainer = document.getElementById('sidebar-nav');
        if (!navContainer) return;

        let navItemsHtml = '';

        // 1. Öğrenci Menüleri
        if (roles.includes('Ogrenci')) {
            navItemsHtml += `
                <div class="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Öğrenci İşlemleri</div>
                <a href="#student" onclick="window.appRouter.navigate('student'); return false;" id="nav-item-student"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-calendar-days text-indigo-500 w-5"></i>
                    <span>Çalışma Planı & Takvim</span>
                </a>
                <a href="#student-qr" onclick="window.appRouter.navigate('student'); window.studentDashboard.openQrScanner(); return false;"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-qrcode text-emerald-500 w-5"></i>
                    <span>Devam Kaydı (QR Tara)</span>
                </a>
                <a href="#student-leaves" onclick="window.appRouter.navigate('student'); window.studentDashboard.switchTab('leaves'); return false;"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-file-signature text-amber-500 w-5"></i>
                    <span>İzin Taleplerim</span>
                </a>
                <a href="#student-tasks" onclick="window.appRouter.navigate('student'); window.studentDashboard.switchTab('tasks'); return false;"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-list-check text-blue-500 w-5"></i>
                    <span>Görevlerim</span>
                </a>
            `;
        }

        // 2. Danışman Menüleri
        if (roles.includes('Danisman') || roles.includes('Dekanlik')) {
            navItemsHtml += `
                <div class="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Danışman Yönetimi</div>
                <a href="#advisor" onclick="window.appRouter.navigate('advisor'); return false;" id="nav-item-advisor"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-chalkboard-user text-indigo-500 w-5"></i>
                    <span>Danışman Paneli & QR</span>
                </a>
            `;
        }

        // 3. Bölüm Başkanı Menüleri
        if (roles.includes('BolumBaskani') || roles.includes('Dekanlik')) {
            navItemsHtml += `
                <div class="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Bölüm Yönetimi</div>
                <a href="#department" onclick="window.appRouter.navigate('department'); return false;" id="nav-item-department"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-graduation-cap text-indigo-600 w-5"></i>
                    <span>Bölüm Başkanı Paneli</span>
                </a>
            `;
        }

        // 4. Dekanlık Menüleri
        if (roles.includes('Dekanlik')) {
            navItemsHtml += `
                <div class="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Dekanlık & İdare</div>
                <a href="#dean" onclick="window.appRouter.navigate('dean'); return false;" id="nav-item-dean"
                   class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <i class="fa-solid fa-landmark text-purple-600 w-5"></i>
                    <span>Dekanlık Puantaj & Onay</span>
                </a>
            `;
        }

        // Ortak Profil Menüsü
        navItemsHtml += `
            <div class="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Hesap</div>
            <a href="#profile" onclick="window.appRouter.navigate('profile'); return false;" id="nav-item-profile"
               class="sidebar-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <i class="fa-solid fa-id-badge text-teal-500 w-5"></i>
                <span>Profilim ve Bilgilerim</span>
            </a>
        `;

        navContainer.innerHTML = navItemsHtml;
    }

    // RBAC Guard ve Sayfa Yönlendirme
    navigate(viewName) {
        const user = AppStateManager.user;
        const roles = (this.userProfile && this.userProfile.roles) || (user && user.roles) || [];

        // Yetki Kontrolleri (RBAC Guard)
        if (viewName === 'student' && !roles.includes('Ogrenci')) {
            AppToast.warning("Bu panele yalnızca İŞKUR öğrencileri erişebilir.");
            return;
        }
        if (viewName === 'advisor' && !roles.includes('Danisman') && !roles.includes('Dekanlik')) {
            AppToast.warning("Bu panele erişim yetkiniz bulunmamaktadır.");
            return;
        }
        if (viewName === 'department' && !roles.includes('BolumBaskani') && !roles.includes('Dekanlik')) {
            AppToast.warning("Bu panele yalnızca Bölüm Başkanları ve Dekanlık erişebilir.");
            return;
        }
        if (viewName === 'dean' && !roles.includes('Dekanlik')) {
            AppToast.warning("Bu panele yalnızca Dekanlık ve Fakülte Sekreterliği erişebilir.");
            return;
        }

        this.currentView = viewName;

        // Tüm view konteynerlarını gizle
        const views = [
            'student-dashboard-view',
            'advisor-dashboard-view',
            'department-dashboard-view',
            'dean-dashboard-view',
            'profile-view'
        ];

        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.add('hidden');
        });

        // Sidebar link aktiflik durumlarını güncelle
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/40', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold');
            link.classList.add('text-slate-600', 'dark:text-slate-300');
        });

        const activeLink = document.getElementById(`nav-item-${viewName}`);
        if (activeLink) {
            activeLink.classList.remove('text-slate-600', 'dark:text-slate-300');
            activeLink.classList.add('bg-indigo-50', 'dark:bg-indigo-950/40', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold');
        }

        // İlgili görünümü aç ve initialize et
        switch (viewName) {
            case 'student':
                document.getElementById('student-dashboard-view')?.classList.remove('hidden');
                if (window.studentDashboard) window.studentDashboard.init();
                break;
            case 'advisor':
                document.getElementById('advisor-dashboard-view')?.classList.remove('hidden');
                if (window.advisorDashboard) window.advisorDashboard.init();
                break;
            case 'department':
                document.getElementById('department-dashboard-view')?.classList.remove('hidden');
                if (window.deptDashboard) window.deptDashboard.init();
                break;
            case 'dean':
                document.getElementById('dean-dashboard-view')?.classList.remove('hidden');
                if (window.deanDashboard) window.deanDashboard.init();
                break;
            case 'profile':
                document.getElementById('profile-view')?.classList.remove('hidden');
                this.renderProfileView();
                break;
        }

        // Mobil menüyü kapat
        document.getElementById('sidebar')?.classList.add('-translate-x-full');
    }

    renderProfileView() {
        const container = document.getElementById('profile-view');
        if (!container) return;

        const p = this.userProfile || {};
        const isStudent = (p.roles || []).includes('Ogrenci');

        container.innerHTML = `
            <div class="space-y-6 max-w-5xl mx-auto animate-fadeIn">
                <!-- Profil Başlık Kartı -->
                <div class="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div class="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div class="w-24 h-24 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg ring-4 ring-white/10">
                            ${(p.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div class="text-center md:text-left flex-1">
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">${p.fullName || 'Kullanıcı'}</h1>
                                <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                                    ${this.getRoleTitle((p.roles && p.roles[0]) || 'Kullanıcı')}
                                </span>
                            </div>
                            <p class="text-indigo-200 text-sm mt-1">
                                ${p.departmentName || 'Teknoloji Fakültesi'} 
                                ${p.academicTitle ? ` • ${p.academicTitle}` : ''}
                            </p>
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-indigo-300">
                                <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-envelope"></i> ${p.email || '-'}</span>
                                <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-phone"></i> ${p.phoneNumber || 'Belirtilmedi'}</span>
                                ${p.studentNumber ? `<span class="inline-flex items-center gap-1.5 font-mono"><i class="fa-solid fa-id-card"></i> ${p.studentNumber}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detay Kartları Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- 1. Atanmış Görev Birimi Kartı -->
                    <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div class="flex items-center gap-2.5">
                                <span class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                    <i class="fa-solid fa-building-circle-check"></i>
                                </span>
                                <h3 class="font-bold text-slate-900 dark:text-white">Görevlendirme Birimi</h3>
                            </div>
                            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Aktif Birim
                            </span>
                        </div>

                        ${p.unit ? `
                            <div class="space-y-2">
                                <div class="text-lg font-bold text-slate-900 dark:text-white">${p.unit.name}</div>
                                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${p.unit.description || 'Birim görev tanımı belirtilmemiş.'}</p>
                            </div>
                        ` : `
                            <div class="py-6 text-center text-slate-400">
                                <i class="fa-solid fa-building text-3xl mb-2 text-slate-300"></i>
                                <p class="text-sm">Henüz birim görevlendirmesi tanımlanmamıştır.</p>
                            </div>
                        `}
                    </div>

                    <!-- 2. Danışman Bilgileri Kartı -->
                    <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div class="flex items-center gap-2.5">
                                <span class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                    <i class="fa-solid fa-chalkboard-user"></i>
                                </span>
                                <h3 class="font-bold text-slate-900 dark:text-white">Akademik İŞKUR Danışmanı</h3>
                            </div>
                        </div>

                        ${p.advisor ? `
                            <div class="space-y-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        <i class="fa-solid fa-user-tie"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-slate-900 dark:text-white">${p.advisor.fullName}</div>
                                        <div class="text-xs text-slate-400">Akademik Danışman</div>
                                    </div>
                                </div>
                                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                    <div class="flex items-center justify-between">
                                        <span class="text-slate-400">E-Posta:</span>
                                        <span class="font-medium">${p.advisor.email || '-'}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-slate-400">İletişim:</span>
                                        <span class="font-medium">${p.advisor.phoneNumber || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="py-6 text-center text-slate-400">
                                <i class="fa-solid fa-user-xmark text-3xl mb-2 text-slate-300"></i>
                                <p class="text-sm">Henüz danışman ataması yapılmamıştır.</p>
                            </div>
                        `}
                    </div>

                    ${isStudent ? `
                        <!-- 3. İzin Durumu & Kota Kartı -->
                        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                        <i class="fa-solid fa-clock-rotate-left"></i>
                                    </span>
                                    <h3 class="font-bold text-slate-900 dark:text-white">Yıllık İzin Kotası</h3>
                                </div>
                                <span class="font-bold text-sm text-slate-900 dark:text-white">
                                    ${p.remainingLeaveDays} / 10 Gün Kalan
                                </span>
                            </div>

                            <div class="space-y-2">
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                    <div class="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                                         style="width: ${(p.remainingLeaveDays / 10) * 100}%"></div>
                                </div>
                                <p class="text-xs text-slate-500">
                                    Yılda en fazla 10 iş günü mazeret veya sağlık izni hakkı bulunmaktadır.
                                </p>
                            </div>
                        </div>

                        <!-- 4. KVKK ve Güvenlik Kartı -->
                        <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <i class="fa-solid fa-shield-halved"></i>
                                    </span>
                                    <h3 class="font-bold text-slate-900 dark:text-white">KVKK & Veri Güvenliği</h3>
                                </div>
                                <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    AES-256 Korumalı
                                </span>
                            </div>

                            <p class="text-xs text-slate-500 leading-relaxed">
                                T.C. Kimlik Numaranız ve IBAN bilginiz, 6698 sayılı KVKK kapsamında donanımsal düzeyde AES-256 simetrik anahtarlar ile şifrelenmiş olarak güvenli veritabanında saklanmaktadır.
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getRoleTitle(role) {
        switch (role) {
            case 'Dekanlik': return 'Dekanlık / Sekreterlik';
            case 'BolumBaskani': return 'Bölüm Başkanı';
            case 'Danisman': return 'Danışman Öğretim Elemanı';
            case 'Ogrenci': return 'İŞKUR Öğrencisi';
            default: return role;
        }
    }

    showLoginView() {
        document.getElementById('app-shell')?.classList.add('hidden');
        document.getElementById('auth-view')?.classList.remove('hidden');
    }

    logout() {
        ApiClient.removeToken();
        AppStateManager.clearUser();
        this.showLoginView();
        AppToast.info("Güvenli bir şekilde oturum kapatıldı.");
    }
}

// Uygulamayı başlat
window.appRouter = new AppRouter();
document.addEventListener('DOMContentLoaded', () => {
    window.appRouter.init();
});
