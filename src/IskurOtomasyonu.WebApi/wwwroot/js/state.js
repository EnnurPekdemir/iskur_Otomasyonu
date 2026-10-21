// Uygulama Durumu (State) ve Toast Bildirim Yöneticisi

class StateManager {
    constructor() {
        this.user = ApiClient.getUser();
        this.activeRole = this.user?.roles?.[0] || null;
        this.listeners = {};
    }

    setUser(user) {
        this.user = user;
        this.activeRole = user?.roles?.[0] || null;
        ApiClient.setUser(user);
        this.emit('user:changed', user);
    }

    setActiveRole(role) {
        if (this.user?.roles?.includes(role)) {
            this.activeRole = role;
            this.emit('role:changed', role);
        }
    }

    clearUser() {
        this.user = null;
        this.activeRole = null;
        ApiClient.removeToken();
        this.emit('user:logout');
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    init() {
        // Dark mode tercihi
        const isDark = localStorage.getItem('iskur_theme') === 'dark' || 
            (!('iskur_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('iskur_theme', isDark ? 'dark' : 'light');
    }
}

// Toast Bildirim Sistemi
class Toast {
    static container() {
        let el = document.getElementById('toast-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast-container';
            el.className = 'fixed top-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none';
            document.body.appendChild(el);
        }
        return el;
    }

    static show(message, type = 'info', title = null, duration = 4000) {
        const container = this.container();
        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-start p-4 mb-2 w-80 text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border toast-enter transition-all duration-300';

        let icon = 'fa-circle-info text-blue-500';
        let borderColor = 'border-blue-200 dark:border-blue-900/50';
        let defaultTitle = 'Bilgi';

        if (type === 'success') {
            icon = 'fa-circle-check text-emerald-500';
            borderColor = 'border-emerald-200 dark:border-emerald-900/50';
            defaultTitle = 'Başarılı';
        } else if (type === 'error') {
            icon = 'fa-circle-exclamation text-rose-500';
            borderColor = 'border-rose-200 dark:border-rose-900/50';
            defaultTitle = 'Hata';
        } else if (type === 'warning') {
            icon = 'fa-triangle-exclamation text-amber-500';
            borderColor = 'border-amber-200 dark:border-amber-900/50';
            defaultTitle = 'Uyarı';
        }

        toast.classList.add(...borderColor.split(' '));

        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg mt-0.5">
                <i class="fa-solid ${icon} text-lg"></i>
            </div>
            <div class="ml-3 text-sm font-normal flex-1">
                <span class="mb-1 text-sm font-bold text-gray-900 dark:text-white">${title || defaultTitle}</span>
                <div class="text-xs text-gray-600 dark:text-slate-300 mt-0.5">${message}</div>
            </div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg p-1.5 inline-flex h-8 w-8 items-center justify-center">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        `;

        const closeBtn = toast.querySelector('button');
        closeBtn.onclick = () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 200);
        };

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 200);
            }
        }, duration);
    }

    static success(msg, title) { this.show(msg, 'success', title); }
    static error(msg, title) { this.show(msg, 'error', title, 6000); }
    static warning(msg, title) { this.show(msg, 'warning', title, 5000); }
    static info(msg, title) { this.show(msg, 'info', title); }
}

// Modal Yardımcısı
window.Modal = {
    open(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    },
    close(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }
};

window.AppStateManager = new StateManager();
window.Toast = Toast;
window.AppToast = Toast;

