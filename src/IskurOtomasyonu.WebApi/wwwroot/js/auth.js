// ============================================================================
// Kimlik Doğrulama & Kullanıcı Giriş Yöneticisi (Auth Manager)
// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu
// ============================================================================

class AuthManager {
    constructor() {
        this.departments = [];
        this.init();
    }

    init() {
        this.attachFormListeners();
        this.loadDepartments();
    }

    attachFormListeners() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const tabLogin = document.getElementById('auth-tab-login');
        const tabRegister = document.getElementById('auth-tab-register');

        // Giriş Sekmesi Tıklandığında
        tabLogin?.addEventListener('click', () => {
            tabLogin.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-sm');
            tabLogin.classList.remove('text-slate-500', 'dark:text-slate-400');
            tabRegister?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-sm');
            tabRegister?.classList.add('text-slate-500', 'dark:text-slate-400');

            loginForm?.classList.remove('hidden');
            registerForm?.classList.add('hidden');
        });

        // Kayıt Sekmesi Tıklandığında
        tabRegister?.addEventListener('click', () => {
            tabRegister.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-sm');
            tabRegister.classList.remove('text-slate-500', 'dark:text-slate-400');
            tabLogin?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-sm');
            tabLogin?.classList.add('text-slate-500', 'dark:text-slate-400');

            registerForm?.classList.remove('hidden');
            loginForm?.classList.add('hidden');
        });

        // Giriş Formu Submit
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Kayıt Formu Submit
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    }

    async loadDepartments() {
        try {
            const res = await ApiClient.Academic.getDepartments();
            this.departments = res.data || [];
            const select = document.getElementById('reg-dept');
            if (select) {
                select.innerHTML = '<option value="">Bölüm Seçiniz...</option>';
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

    async handleLogin() {
        const identifier = document.getElementById('login-identifier')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const btn = document.getElementById('login-btn');

        if (!identifier || !password) {
            AppToast.warning("Lütfen kullanıcı adı / e-posta ve parolanızı giriniz.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Giriş Yapılıyor...</span>`;

        try {
            const res = await ApiClient.Auth.login({
                userNameOrEmail: identifier,
                password: password
            });

            if (res.data && res.data.token) {
                ApiClient.setToken(res.data.token);
                ApiClient.setUser(res.data);
                AppToast.success(`Hoş geldiniz, ${res.data.fullName}!`);
                
                if (window.appRouter) {
                    await window.appRouter.onLoginSuccess(res.data);
                }
            } else {
                throw new Error("Giriş yanıtında geçerli token bulunamadı.");
            }
        } catch (error) {
            console.error("Giriş hatası:", error);
            AppToast.error(error.message || "Giriş işlemi başarısız oldu.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-right-to-bracket text-xs"></i> <span>Sisteme Giriş Yap</span>`;
        }
    }

    async handleRegister() {
        const firstName = document.getElementById('reg-firstname')?.value.trim();
        const lastName = document.getElementById('reg-lastname')?.value.trim();
        const studentNumber = document.getElementById('reg-studentno')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const departmentId = document.getElementById('reg-dept')?.value;
        const tcNo = document.getElementById('reg-tcno')?.value.trim();
        const iban = document.getElementById('reg-iban')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const btn = document.getElementById('register-btn');

        if (!firstName || !lastName || !studentNumber || !email || !departmentId || !tcNo || !iban || !password) {
            AppToast.warning("Lütfen tüm zorunlu alanları eksiksiz doldurunuz.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xs"></i> <span>Kaydediliyor...</span>`;

        try {
            const data = {
                firstName,
                lastName,
                studentNumber,
                email,
                departmentId,
                tcNo,
                iban,
                password,
                classLevel: 1
            };

            const res = await ApiClient.Auth.registerStudent(data);
            AppToast.success("Öğrenci kaydınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.");

            // Giriş sekmesine geri dön
            document.getElementById('auth-tab-login')?.click();
            document.getElementById('login-identifier').value = studentNumber;
            document.getElementById('login-password').value = password;
            document.getElementById('register-form')?.reset();

        } catch (error) {
            console.error("Kayıt hatası:", error);
            AppToast.error(error.message || "Öğrenci kaydı oluşturulamadı.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-user-check text-xs"></i> <span>Kayıt Ol</span>`;
        }
    }

    // Demo Kısayol Girişleri
    quickLogin(role) {
        const identifierEl = document.getElementById('login-identifier');
        const passwordEl = document.getElementById('login-password');

        // Otomatik sekme geçişi
        document.getElementById('auth-tab-login')?.click();

        switch (role.toLowerCase()) {
            case 'ogrenci':
                identifierEl.value = '2210206001';
                passwordEl.value = 'Ogrenci123!';
                AppToast.info("Öğrenci demo hesap bilgileri dolduruldu.");
                break;
            case 'danisman':
                identifierEl.value = 'danisman@tf.edu.tr';
                passwordEl.value = 'Danisman123!';
                AppToast.info("Danışman demo hesap bilgileri dolduruldu.");
                break;
            case 'bolumbaskani':
                identifierEl.value = 'bm_baskan@tf.edu.tr';
                passwordEl.value = 'Baskan123!';
                AppToast.info("Bölüm Başkanı demo hesap bilgileri dolduruldu.");
                break;
            case 'dekanlik':
                identifierEl.value = 'dekanlik@tf.edu.tr';
                passwordEl.value = 'Admin123!';
                AppToast.info("Dekanlık demo hesap bilgileri dolduruldu.");
                break;
        }

        // Otomatik formu tetikle
        document.getElementById('login-form')?.dispatchEvent(new Event('submit'));
    }
}

window.authManager = new AuthManager();
