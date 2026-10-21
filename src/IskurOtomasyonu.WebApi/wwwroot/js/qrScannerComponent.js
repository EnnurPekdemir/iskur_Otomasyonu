// ============================================================================
// Mobil Dinamik Karekod (QR) Okuyucu ve Devam Takip Bileşeni
// Teknoloji Fakültesi İŞKUR Öğrenci Otomasyonu
// ============================================================================

class QrAttendanceScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.isProcessing = false;
        this.cameraId = null;
        this.modalElement = null;
        this.init();
    }

    init() {
        this.injectModalHtml();
        this.bindEvents();

        // Sayfadan ayrılınca donanım kamerasını kesin olarak serbest bırak
        window.addEventListener('beforeunload', () => this.stopCameraStream());
        window.addEventListener('pagehide', () => this.stopCameraStream());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isScanning) {
                this.stopCameraStream();
            }
        });
    }

    injectModalHtml() {
        if (document.getElementById('mobile-qr-scanner-modal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'mobile-qr-scanner-modal';
        modalDiv.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md hidden transition-opacity duration-200';
        modalDiv.innerHTML = `
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn">
                <!-- Modal Başlık Çubuğu -->
                <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                    <div class="flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                            <i class="fa-solid fa-qrcode"></i>
                        </span>
                        <div>
                            <h3 class="font-bold text-sm text-slate-900 dark:text-white leading-tight">Devam Yoklaması (QR)</h3>
                            <p class="text-[11px] text-slate-400">Danışman ekranındaki kodu vizöre tutunuz</p>
                        </div>
                    </div>
                    <button id="qr-modal-close-btn" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-base"></i>
                    </button>
                </div>

                <!-- Modal Ana Gövde -->
                <div class="p-5 flex-1 overflow-y-auto space-y-4">
                    <!-- 1. Canlı Kamera Vizörü ve Tarama Alanı -->
                    <div id="qr-camera-container" class="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center shadow-inner">
                        <!-- html5-qrcode video akışı buraya yerleşir -->
                        <div id="qr-interactive-reader" class="w-full h-full"></div>

                        <!-- Vizör Hedef Çerçevesi (Köşe Çizgileri) -->
                        <div id="qr-viewfinder-overlay" class="absolute inset-8 pointer-events-none flex flex-col justify-between hidden">
                            <div class="flex justify-between">
                                <span class="w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></span>
                                <span class="w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></span>
                            </div>
                            <div class="flex justify-between">
                                <span class="w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></span>
                                <span class="w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></span>
                            </div>
                            <!-- Kayan Yeşil Lazer Çizgisi -->
                            <div class="qr-scan-laser"></div>
                        </div>

                        <!-- Kamera Yükleniyor Göstergesi -->
                        <div id="qr-camera-loading" class="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-3 p-4 text-center">
                            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-400"></i>
                            <p class="text-xs font-medium text-slate-300">Kamera başlatılıyor, lütfen bekleyiniz...</p>
                        </div>

                        <!-- Kamera İzin / Hata Uyarısı (Varsayılan Gizli) -->
                        <div id="qr-camera-error-box" class="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white space-y-3 p-6 text-center hidden">
                            <span class="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl">
                                <i class="fa-solid fa-video-slash"></i>
                            </span>
                            <h4 class="font-bold text-sm text-rose-300">Kamera Erişimi Sağlanamadı</h4>
                            <p id="qr-camera-error-message" class="text-xs text-slate-400 leading-relaxed max-w-xs">
                                Tarayıcınızda kamera izni engellenmiş olabilir. Lütfen adres çubuğundaki kilit simgesine dokunarak kamera iznini onaylayınız.
                            </p>
                            <button id="qr-retry-camera-btn" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition">
                                <i class="fa-solid fa-arrows-rotate mr-1.5"></i> Tekrar Dene
                            </button>
                        </div>
                    </div>

                    <!-- 2. Tarama / Doğrulama Sonuç Kartı (Durum Paneli) -->
                    <div id="qr-status-feedback" class="hidden rounded-2xl p-4 transition-all duration-300">
                        <!-- JS tarafından dinamik doldurulur (Başarı, Süre Aşımı, Hata) -->
                    </div>

                    <!-- 3. Manuel Kod Giriş Seçeneği (Kamera Olmayan Cihazlar İçin) -->
                    <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button id="toggle-manual-token-btn" type="button" class="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between w-full">
                            <span>Kameranız çalışmıyor mu? Kodu elle girin</span>
                            <i id="manual-chevron" class="fa-solid fa-chevron-down text-[10px] transition-transform"></i>
                        </button>
                        <div id="manual-token-container" class="mt-2.5 hidden space-y-2">
                            <div class="flex gap-2">
                                <input type="text" id="manual-qr-token-input" placeholder="Danışman token imzası..." 
                                    class="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                                <button id="submit-manual-qr-btn" type="button" class="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm whitespace-nowrap">
                                    Doğrula
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Alt Barı -->
                <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span class="flex items-center gap-1.5">
                        <i class="fa-solid fa-shield-halved text-emerald-500"></i>
                        <span>30 Sn Dinamik Kripto Doğrulama</span>
                    </span>
                    <button id="qr-modal-cancel-btn" class="font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
        this.modalElement = modalDiv;
    }

    bindEvents() {
        const modal = document.getElementById('mobile-qr-scanner-modal');
        const closeBtn = document.getElementById('qr-modal-close-btn');
        const cancelBtn = document.getElementById('qr-modal-cancel-btn');
        const retryBtn = document.getElementById('qr-retry-camera-btn');
        const toggleManualBtn = document.getElementById('toggle-manual-token-btn');
        const manualSubmitBtn = document.getElementById('submit-manual-qr-btn');

        closeBtn?.addEventListener('click', () => this.close());
        cancelBtn?.addEventListener('click', () => this.close());
        retryBtn?.addEventListener('click', () => this.startCamera());

        // Manuel Token Akordeon
        toggleManualBtn?.addEventListener('click', () => {
            const container = document.getElementById('manual-token-container');
            const chevron = document.getElementById('manual-chevron');
            if (container) {
                container.classList.toggle('hidden');
                chevron?.classList.toggle('rotate-180');
            }
        });

        // Manuel Token Doğrulama
        manualSubmitBtn?.addEventListener('click', async () => {
            const input = document.getElementById('manual-qr-token-input');
            const token = input?.value?.trim();
            if (!token) {
                AppToast.warning("Lütfen karekod token kodunu giriniz.");
                return;
            }
            await this.handleQrCodeDetected(token);
        });

        // Dış alana tıklayınca kapatma
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    }

    // Modalı aç ve kamerayı başlat
    async open() {
        if (!this.modalElement) this.injectModalHtml();

        this.modalElement?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Durum alanını ve hata kutularını sıfırla
        this.resetStateUI();

        // Kamerayı başlat
        await this.startCamera();
    }

    // Modalı kapat ve kamerayı durdur
    close() {
        this.stopCameraStream();
        if (this.modalElement) {
            this.modalElement.classList.add('hidden');
        }
        document.body.style.overflow = '';
        this.isProcessing = false;
    }

    resetStateUI() {
        const statusBox = document.getElementById('qr-status-feedback');
        const loadingBox = document.getElementById('qr-camera-loading');
        const errorBox = document.getElementById('qr-camera-error-box');
        const overlay = document.getElementById('qr-viewfinder-overlay');

        if (statusBox) statusBox.className = 'hidden';
        if (loadingBox) loadingBox.classList.remove('hidden');
        if (errorBox) errorBox.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');
    }

    // HTML5 Kamera Başlatma (Mobil Arka Kamera Öncelikli)
    async startCamera() {
        const loadingBox = document.getElementById('qr-camera-loading');
        const errorBox = document.getElementById('qr-camera-error-box');
        const overlay = document.getElementById('qr-viewfinder-overlay');
        const errorMsgEl = document.getElementById('qr-camera-error-message');

        loadingBox?.classList.remove('hidden');
        errorBox?.classList.add('hidden');

        // Önceki kamera oturumu varsa kapat
        this.stopCameraStream();

        try {
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error("html5-qrcode kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol ediniz.");
            }

            this.html5QrCode = new Html5Qrcode("qr-interactive-reader");

            // Mobil cihazlarda arka kamerayı (environment) seç
            const qrConfig = {
                fps: 12,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.75);
                    return { width: qrboxSize, height: qrboxSize };
                },
                aspectRatio: 1.0
            };

            await this.html5QrCode.start(
                { facingMode: "environment" },
                qrConfig,
                async (decodedText, decodedResult) => {
                    await this.handleQrCodeDetected(decodedText);
                },
                (errorMessage) => {
                    // Karekod aranırken oluşan rutin anlık okunamama adımları
                }
            );

            this.isScanning = true;
            loadingBox?.classList.add('hidden');
            overlay?.classList.remove('hidden');

        } catch (error) {
            console.error("Kamera başlatma hatası:", error);
            loadingBox?.classList.add('hidden');
            errorBox?.classList.remove('hidden');

            let userFriendlyMsg = "Kamera başlatılamadı. Cihazınızın kamera izinlerini kontrol ediniz.";
            if (error.name === "NotAllowedError" || error.message?.includes("Permission")) {
                userFriendlyMsg = "Kamera erişim izni reddedildi. Tarayıcı ayarlarınızdan bu site için kamera erişimine izin veriniz.";
            } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                userFriendlyMsg = "Cihazınızda kullanılabilir bir kamera bulunamadı.";
            } else if (error.name === "NotReadableError") {
                userFriendlyMsg = "Kamera başka bir uygulama tarafından kullanılıyor olabilir. Lütfen diğer uygulamaları kapatıp tekrar deneyiniz.";
            }

            if (errorMsgEl) errorMsgEl.textContent = userFriendlyMsg;
        }
    }

    // Kamera Akışını Durdurma ve Donanımı Serbest Bırakma (Kritik)
    stopCameraStream() {
        if (this.html5QrCode && this.isScanning) {
            try {
                this.html5QrCode.stop().then(() => {
                    this.html5QrCode.clear();
                    this.html5QrCode = null;
                    this.isScanning = false;
                }).catch(err => {
                    console.warn("Kamera durdurulurken uyarı:", err);
                    this.html5QrCode = null;
                    this.isScanning = false;
                });
            } catch (e) {
                this.html5QrCode = null;
                this.isScanning = false;
            }
        } else {
            this.html5QrCode = null;
            this.isScanning = false;
        }
    }

    // Karekod Algılandığında Tetiklenen Ana Akış Mantığı
    async handleQrCodeDetected(decodedToken) {
        if (this.isProcessing) return; // Çift okumayı kesin olarak engelle
        this.isProcessing = true;

        // 1. Kamera akışını hemen durdur (donanımı ve pili korumak için)
        this.stopCameraStream();

        // 2. Titreşim (Haptic Feedback)
        if (navigator.vibrate) {
            try { navigator.vibrate([80, 50, 80]); } catch (e) {}
        }

        // 3. Durum göstergesini "Yoklama Doğrulanıyor..." olarak ayarla
        this.renderStatusBox('loading', 'Karekod okundu, devam kaydınız alınıyor...');

        try {
            // Cihaz tarayıcı imzasını topla
            const deviceSignature = navigator.userAgent;

            // 4. Backend `/api/attendance/check-in` uç noktasına POST et
            const response = await ApiClient.Attendance.checkIn(decodedToken, deviceSignature);

            if (response.success && response.data) {
                const att = response.data;
                const checkInDate = new Date(att.checkInTime || Date.now());
                const timeStr = checkInDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = checkInDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

                // 200 OK: Başarılı Durum Arayüzü
                this.renderStatusBox('success', {
                    title: "Devam Kaydınız Alındı!",
                    message: "İŞKUR çalışma devamınız sisteme başarıyla işlendi.",
                    details: [
                        { label: "Öğrenci", value: att.studentFullName || AppStateManager.user?.fullName },
                        { label: "Tarih & Saat", value: `${dateStr} - ${timeStr}` },
                        { label: "Doğrulama", value: "30 Sn Dinamik QR ile Onaylandı" }
                    ]
                });

                AppToast.success("Devam kaydınız başarıyla alındı. İyi çalışmalar!");

                // Paneli yenilemek için global event tetikle
                window.dispatchEvent(new CustomEvent('attendance:success', { detail: att }));
                if (window.studentDashboard) {
                    await window.studentDashboard.loadRecentAttendances();
                    await window.studentDashboard.loadMonthlyPlan();
                }

            } else {
                throw new Error(response.message || "Devam kaydı oluşturulamadı.");
            }

        } catch (error) {
            console.error("Yoklama check-in hatası:", error);
            const errMsg = error.message || "Devam kaydı alınamadı.";

            // Hata Tipine Göre Kullanıcı Dostu Görünüm
            if (errMsg.toLowerCase().includes("süresi dolmuş") || errMsg.toLowerCase().includes("geçersiz") || errMsg.toLowerCase().includes("oturum")) {
                // Süre Aşımı (400 Bad Request)
                this.renderStatusBox('expired', {
                    title: "Karekodun Süresi Dolmuş!",
                    message: "Okutulan karekodun 30 saniyelik güvenlik süresi dolmuştur. Lütfen danışman ekranındaki güncel karekodu okutunuz."
                });
                AppToast.warning("Karekod süresi dolmuş. Lütfen danışman ekranındaki güncel kodu okutunuz.");
            } else if (errMsg.toLowerCase().includes("plan") || errMsg.toLowerCase().includes("onaylanmış")) {
                // Plan Yok
                this.renderStatusBox('error', {
                    title: "Çalışma Planı Bulunamadı",
                    message: errMsg
                });
                AppToast.error(errMsg);
            } else if (errMsg.toLowerCase().includes("zaten") || errMsg.toLowerCase().includes("mükerrer")) {
                // Mükerrer Kayıt
                this.renderStatusBox('warning', {
                    title: "Mükerrer Devam Kaydı",
                    message: errMsg
                });
                AppToast.info(errMsg);
            } else {
                // Genel Hata
                this.renderStatusBox('error', {
                    title: "Yoklama Alınamadı",
                    message: errMsg
                });
                AppToast.error(errMsg);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    // Modal Üzerinde Zengin Geri Bildirim Kartı Render Etme
    renderStatusBox(type, content) {
        const box = document.getElementById('qr-status-feedback');
        const cameraContainer = document.getElementById('qr-camera-container');
        if (!box) return;

        box.classList.remove('hidden');

        if (type === 'loading') {
            box.className = 'rounded-2xl p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center gap-3 text-indigo-900 dark:text-indigo-200 text-xs font-medium animate-fadeIn';
            box.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-600 dark:text-indigo-400"></i>
                <div>
                    <div class="font-bold">Yoklama Gönderiliyor</div>
                    <div class="text-[11px] opacity-80">${content}</div>
                </div>
            `;
            return;
        }

        // Başarılı (200 OK)
        if (type === 'success') {
            cameraContainer?.classList.add('hidden'); // Kamerayı gizle, başarı kartını öne çıkar
            box.className = 'rounded-2xl p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-4 animate-scaleIn';
            box.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/30">
                        <i class="fa-solid fa-check"></i>
                    </span>
                    <div>
                        <h4 class="font-bold text-slate-900 dark:text-white text-base">${content.title}</h4>
                        <p class="text-xs text-emerald-700 dark:text-emerald-400">${content.message}</p>
                    </div>
                </div>

                <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-2 text-xs">
                    ${content.details.map(d => `
                        <div class="flex items-center justify-between">
                            <span class="text-slate-400">${d.label}:</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${d.value}</span>
                        </div>
                    `).join('')}
                </div>

                <button type="button" onclick="window.qrScanner.close()" class="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition">
                    Harika, Kapat
                </button>
            `;
            return;
        }

        // Süre Aşımı (400 Expired)
        if (type === 'expired') {
            box.className = 'rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3 animate-fadeIn';
            box.innerHTML = `
                <div class="flex items-start gap-3">
                    <span class="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg mt-0.5">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </span>
                    <div class="flex-1">
                        <h4 class="font-bold text-xs text-rose-900 dark:text-rose-200">${content.title}</h4>
                        <p class="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">${content.message}</p>
                    </div>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                    <button type="button" onclick="window.qrScanner.startCamera()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Yeniden Tara</span>
                    </button>
                </div>
            `;
            return;
        }

        // Genel Hata veya Uyarı
        const isWarn = type === 'warning';
        const color = isWarn ? 'amber' : 'rose';
        box.className = `rounded-2xl p-4 bg-${color}-50 dark:bg-${color}-950/40 border border-${color}-200 dark:border-${color}-900 space-y-3 animate-fadeIn`;
        box.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-xl bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center text-lg mt-0.5">
                    <i class="fa-solid ${isWarn ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'}"></i>
                </span>
                <div class="flex-1">
                    <h4 class="font-bold text-xs text-${color}-900 dark:text-${color}-200">${content.title}</h4>
                    <p class="text-[11px] text-${color}-700 dark:text-${color}-300 mt-0.5">${content.message}</p>
                </div>
            </div>
            <div class="flex justify-end gap-2 pt-1">
                <button type="button" onclick="window.qrScanner.startCamera()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-${color}-600 hover:bg-${color}-700 text-white shadow-sm flex items-center gap-1.5">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>Tekrar Dene</span>
                </button>
            </div>
        `;
    }
}

// Global Örnek
window.qrScanner = new QrAttendanceScanner();
