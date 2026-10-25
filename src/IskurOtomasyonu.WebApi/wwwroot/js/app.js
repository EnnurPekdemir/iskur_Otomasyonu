// ============================================================================
// Uygulama Ana Yönlendiricisi (App Router & RBAC Guard)
// Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Otomasyonu
// ============================================================================

class AppRouter {
    constructor() {
        this.currentView = null;
        this.userProfile = null;
        this.availableRoles = ['Ogrenci', 'Danisman', 'BolumBaskani', 'FakulteSekreteri', 'Dekanlik'];
    }

    async init() {
        console.log("İŞKUR Otomasyonu UI Başlatılıyor...");

        // State Başlatma
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
                fullName: user.fullName || user.email,
                roles: user.roles || []
            };
        }

        this.updateTopBar(this.userProfile);
        this.buildSidebarNav(this.userProfile.roles || user.roles || []);

        // Varsayılan role göre ilk sayfaya yönlendir
        const roles = this.userProfile.roles || user.roles || [];
        if (roles.includes('Dekanlik')) {
            this.navigate('dean');
        } else if (roles.includes('FakulteSekreteri')) {
            this.navigate('secretary');
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
                <div class="px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Öğrenci Paneli</div>
                <a href="#student" onclick="window.appRouter.navigate('student'); return false;" id="nav-item-student"
                   class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <i class="fa-solid fa-calendar-days text-teal-700 w-4"></i>
                    <span>Çalışma Planı & Takvim</span>
                </a>
            `;
        }

        // 2. Danışman Menüleri
        if (roles.includes('Danisman')) {
            navItemsHtml += `
                <div class="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Danışman Paneli</div>
                <a href="#advisor" onclick="window.appRouter.navigate('advisor'); return false;" id="nav-item-advisor"
                   class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <i class="fa-solid fa-chalkboard-user text-teal-700 w-4"></i>
                    <span>Çalışan Öğrenciler & QR</span>
                </a>
            `;
        }

        // 3. Bölüm Başkanı Menüleri
        if (roles.includes('BolumBaskani')) {
            navItemsHtml += `
                <div class="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Bölüm Başkanlığı</div>
                <a href="#department" onclick="window.appRouter.navigate('department'); return false;" id="nav-item-department"
                   class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <i class="fa-solid fa-graduation-cap text-teal-700 w-4"></i>
                    <span>Danışman Atama & Duyurular</span>
                </a>
            `;
        }

        // 4. Fakülte Sekreteri Menüleri (İŞKUR Yönetim Merkezi)
        if (roles.includes('FakulteSekreteri') || roles.includes('Dekanlik')) {
            navItemsHtml += `
                <div class="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Fakülte Sekreterliği</div>
                <a href="#secretary" onclick="window.appRouter.navigate('secretary'); return false;" id="nav-item-secretary"
                   class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <i class="fa-solid fa-briefcase text-teal-700 w-4"></i>
                    <span>İŞKUR Yönetim Merkezi</span>
                </a>
            `;
        }

        // 5. Dekanlık Menüleri
        if (roles.includes('Dekanlik')) {
            navItemsHtml += `
                <div class="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Dekanlık Paneli</div>
                <a href="#dean" onclick="window.appRouter.navigate('dean'); return false;" id="nav-item-dean"
                   class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                    <i class="fa-solid fa-landmark text-teal-700 w-4"></i>
                    <span>Ödenek Planı & İlişik Kesme</span>
                </a>
            `;
        }

        // Ortak Profil Menüsü
        navItemsHtml += `
            <div class="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Hesap</div>
            <a href="#profile" onclick="window.appRouter.navigate('profile'); return false;" id="nav-item-profile"
               class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition">
                <i class="fa-solid fa-id-badge text-gray-500 w-4"></i>
                <span>Kullanıcı Bilgilerim</span>
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
        if (viewName === 'secretary' && !roles.includes('FakulteSekreteri') && !roles.includes('Dekanlik')) {
            AppToast.warning("Bu panele yalnızca Fakülte Sekreterliği ve Dekanlık erişebilir.");
            return;
        }
        if (viewName === 'dean' && !roles.includes('Dekanlik')) {
            AppToast.warning("Bu panele yalnızca Dekanlık erişebilir.");
            return;
        }

        this.currentView = viewName;

        // Tüm view konteynerlarını gizle
        const views = [
            'student-dashboard-view',
            'advisor-dashboard-view',
            'department-dashboard-view',
            'secretary-dashboard-view',
            'dean-dashboard-view',
            'profile-view'
        ];

        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.classList.add('hidden');
        });

        // Sidebar link aktiflik durumlarını güncelle
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('bg-gray-100', 'text-teal-800', 'font-bold');
            link.classList.add('text-gray-700');
        });

        const activeLink = document.getElementById(`nav-item-${viewName}`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-700');
            activeLink.classList.add('bg-gray-100', 'text-teal-800', 'font-bold');
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
            case 'secretary':
                document.getElementById('secretary-dashboard-view')?.classList.remove('hidden');
                if (window.secretaryDashboard) window.secretaryDashboard.init();
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
            <div class="space-y-6 animate-fadeIn">
                <!-- Başlık -->
                <div class="pb-4 border-b border-gray-200">
                    <h1 class="text-xl font-bold tracking-tight text-gray-900">Kullanıcı Profil ve Görev Bilgileri</h1>
                    <p class="text-xs text-gray-500 mt-0.5">Sistemdeki aktif kimlik ve yetkilendirme kartınız.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Temel Kimlik Kartı -->
                    <div class="box-card p-5 space-y-3">
                        <div class="flex items-center gap-3 pb-3 border-b border-gray-200">
                            <div class="w-12 h-12 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-base">
                                ${(p.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                                <h3 class="font-bold text-sm text-gray-900">${p.fullName || '-'}</h3>
                                <p class="text-xs text-teal-800 font-semibold">${this.getRoleTitle((p.roles && p.roles[0]) || '')}</p>
                            </div>
                        </div>

                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <span class="text-gray-500">E-Posta:</span>
                                <span class="font-semibold text-gray-800">${p.email || '-'}</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <span class="text-gray-500">Telefon:</span>
                                <span class="font-semibold text-gray-800">${p.phoneNumber || '-'}</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-gray-100">
                                <span class="text-gray-500">Fakülte / Birim:</span>
                                <span class="font-semibold text-gray-800">${p.departmentName || 'Teknoloji Fakültesi'}</span>
                            </div>
                            ${isStudent ? `
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <span class="text-gray-500">Öğrenci No:</span>
                                    <span class="font-mono font-bold text-gray-800">${p.studentNumber || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-gray-100">
                                    <span class="text-gray-500">Kalan İzin Kotası:</span>
                                    <span class="font-bold text-teal-800">${p.remainingLeaveDays ?? 10} / 10 Gün</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Akademik Danışman & Görevlendirilen Birim -->
                    <div class="box-card p-5 space-y-3">
                        <div class="pb-3 border-b border-gray-200">
                            <h3 class="font-bold text-xs uppercase tracking-wider text-gray-500">Atama & Görev Birimi</h3>
                        </div>

                        ${isStudent ? `
                            <div class="space-y-3 text-xs">
                                <div>
                                    <span class="text-gray-500 block text-[11px]">Atanmış Danışman:</span>
                                    <span class="font-bold text-gray-900">${p.advisor ? p.advisor.fullName : 'Henüz danışman atanmadı'}</span>
                                    ${p.advisor && p.advisor.email ? `<span class="block text-gray-400 text-[11px]">${p.advisor.email}</span>` : ''}
                                </div>
                                <div>
                                    <span class="text-gray-500 block text-[11px]">Görevlendirildiği Birim:</span>
                                    <span class="font-bold text-gray-900">${p.unit ? p.unit.name : 'Teknoloji Fakültesi Geneli'}</span>
                                </div>
                            </div>
                        ` : `
                            <div class="text-xs text-gray-600">
                                <p>Selçuk Üniversitesi Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu kapsamında yetkilendirilmiş kurumsal hesaptır.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    getRoleTitle(role) {
        switch (role) {
            case 'Dekanlik': return 'Dekan';
            case 'FakulteSekreteri': return 'Fakülte Sekreteri (İŞKUR Yönetim Merkezi)';
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
