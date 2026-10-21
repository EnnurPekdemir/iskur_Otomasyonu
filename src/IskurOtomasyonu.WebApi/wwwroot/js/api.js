// API İstemcisi ve HTTP İstek Yöneticisi
const API_BASE_URL = window.location.origin;

class ApiClient {
    static getToken() {
        return localStorage.getItem('iskur_token');
    }

    static setToken(token) {
        localStorage.setItem('iskur_token', token);
    }

    static removeToken() {
        localStorage.removeItem('iskur_token');
        localStorage.removeItem('iskur_user');
    }

    static getUser() {
        const u = localStorage.getItem('iskur_user');
        return u ? JSON.parse(u) : null;
    }

    static setUser(user) {
        localStorage.setItem('iskur_user', JSON.stringify(user));
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // 401 Unauthorized ise oturumu sonlandır
            if (response.status === 401) {
                this.removeToken();
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapınız.');
            }

            // Dosya indirme yanıtı (Blob)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('spreadsheetml') || contentType.includes('text/csv')) {
                if (!response.ok) {
                    throw new Error('Dosya indirme işlemi başarısız oldu.');
                }
                const blob = await response.blob();
                return blob;
            }

            const data = await response.json();

            if (!response.ok) {
                const message = data.message || (data.errors && data.errors.join(', ')) || 'İşlem sırasında bir hata oluştu.';
                throw new Error(message);
            }

            return data;
        } catch (error) {
            console.error(`API Hatası [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==========================================
    // 1. Kimlik Doğrulama Servisleri
    // ==========================================
    static Auth = {
        login: (credentials) => ApiClient.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        registerStudent: (data) => ApiClient.request('/api/auth/register-student', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getProfile: () => ApiClient.request('/api/auth/me', { method: 'GET' })
    };

    // ==========================================
    // 2. Çalışma Planı Servisleri
    // ==========================================
    static Plan = {
        createOrUpdate: (data) => ApiClient.request('/api/plan', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        submit: (planId) => ApiClient.request(`/api/plan/${planId}/submit`, { method: 'POST' }),
        evaluate: (planId, decision, rejectionReason) => ApiClient.request(`/api/plan/${planId}/evaluate`, {
            method: 'POST',
            body: JSON.stringify({ decision, rejectionReason })
        }),
        getById: (planId) => ApiClient.request(`/api/plan/${planId}`, { method: 'GET' }),
        getStudentPlan: (studentId, year, month) => ApiClient.request(`/api/plan/student/${studentId}/${year}/${month}`, { method: 'GET' }),
        getPending: () => ApiClient.request('/api/plan/pending', { method: 'GET' })
    };

    // ==========================================
    // 3. Devam Takip & QR Servisleri
    // ==========================================
    static Attendance = {
        createQrSession: (unitId = null) => ApiClient.request('/api/attendance/qr-session', {
            method: 'POST',
            body: JSON.stringify({ unitId })
        }),
        checkIn: (tokenHash, deviceSignature = null) => ApiClient.request('/api/attendance/check-in', {
            method: 'POST',
            body: JSON.stringify({ tokenHash, deviceSignature })
        }),
        checkOut: (attendanceId) => ApiClient.request(`/api/attendance/${attendanceId}/check-out`, { method: 'POST' }),
        manualAttendance: (data) => ApiClient.request('/api/attendance/manual', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getStudentAttendances: (studentId, startDate, endDate) => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            return ApiClient.request(`/api/attendance/student/${studentId}?${params.toString()}`, { method: 'GET' });
        },
        getToday: (unitId = null) => {
            const params = unitId ? `?unitId=${unitId}` : '';
            return ApiClient.request(`/api/attendance/today${params}`, { method: 'GET' });
        }
    };

    // ==========================================
    // 4. İzin Yönetimi Servisleri
    // ==========================================
    static Leave = {
        create: (data) => ApiClient.request('/api/leave', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        evaluate: (leaveId, decision, rejectionReason) => ApiClient.request(`/api/leave/${leaveId}/evaluate`, {
            method: 'POST',
            body: JSON.stringify({ decision, rejectionReason })
        }),
        getBalance: (studentId) => ApiClient.request(`/api/leave/balance/${studentId}`, { method: 'GET' }),
        getPending: () => ApiClient.request('/api/leave/pending', { method: 'GET' }),
        getStudentLeaves: (studentId) => ApiClient.request(`/api/leave/student/${studentId}`, { method: 'GET' })
    };

    // ==========================================
    // 5. Görev ve Değerlendirme Servisleri
    // ==========================================
    static Task = {
        create: (data) => ApiClient.request('/api/task', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateStatus: (taskId, status, studentSubmissionNote) => ApiClient.request(`/api/task/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, studentSubmissionNote })
        }),
        evaluate: (taskId, advisorEvaluationNote, advisorScore) => ApiClient.request(`/api/task/${taskId}/evaluate`, {
            method: 'POST',
            body: JSON.stringify({ advisorEvaluationNote, advisorScore })
        }),
        getStudentTasks: (studentId, status = null) => {
            const params = status ? `?status=${status}` : '';
            return ApiClient.request(`/api/task/student/${studentId}${params}`, { method: 'GET' });
        },
        getAdvisorTasks: (advisorId) => ApiClient.request(`/api/task/advisor/${advisorId}`, { method: 'GET' })
    };

    // ==========================================
    // 6. Raporlama ve Puantaj Servisleri
    // ==========================================
    static Report = {
        getMonthlySummary: (filter) => {
            const params = new URLSearchParams();
            if (filter.year) params.append('year', filter.year);
            if (filter.month) params.append('month', filter.month);
            if (filter.departmentId) params.append('departmentId', filter.departmentId);
            if (filter.unitId) params.append('unitId', filter.unitId);
            return ApiClient.request(`/api/reports/monthly-summary?${params.toString()}`, { method: 'GET' });
        },
        getRiskWarnings: (filter = {}) => {
            const params = new URLSearchParams();
            if (filter.departmentId) params.append('departmentId', filter.departmentId);
            return ApiClient.request(`/api/reports/risk-warnings?${params.toString()}`, { method: 'GET' });
        },
        downloadExcel: async (year, month, departmentId = null) => {
            const params = new URLSearchParams({ year, month });
            if (departmentId) params.append('departmentId', departmentId);

            const blob = await ApiClient.request(`/api/reports/monthly-summary/export-excel?${params.toString()}`, {
                method: 'GET'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Iskur_Puantaj_${year}_${String(month).padStart(2, '0')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        },
        downloadCsv: async (year, month, departmentId = null) => {
            const params = new URLSearchParams({ year, month });
            if (departmentId) params.append('departmentId', departmentId);

            const blob = await ApiClient.request(`/api/reports/monthly-summary/export-csv?${params.toString()}`, {
                method: 'GET'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Iskur_Puantaj_${year}_${String(month).padStart(2, '0')}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        },
        downloadRiskExcel: async (departmentId = null) => {
            const params = new URLSearchParams();
            if (departmentId) params.append('departmentId', departmentId);

            const blob = await ApiClient.request(`/api/reports/risk-warnings/export-excel?${params.toString()}`, {
                method: 'GET'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Iskur_Risk_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }
    };

    // ==========================================
    // 7. Akademik Birim, Danışman & Öğrenci Yönetimi
    // ==========================================
    static Academic = {
        getDepartments: () => ApiClient.request('/api/academic/departments', { method: 'GET' }),
        getUnits: () => ApiClient.request('/api/academic/units', { method: 'GET' }),
        getAdvisors: (departmentId = null) => {
            const params = departmentId ? `?departmentId=${departmentId}` : '';
            return ApiClient.request(`/api/academic/advisors${params}`, { method: 'GET' });
        },
        getDepartmentStudents: (departmentId = null) => {
            const params = departmentId ? `?departmentId=${departmentId}` : '';
            return ApiClient.request(`/api/academic/department-students${params}`, { method: 'GET' });
        },
        getAllStudents: () => ApiClient.request('/api/academic/all-students', { method: 'GET' }),
        assignAdvisor: (studentId, advisorId, note = null) => ApiClient.request('/api/academic/assign-advisor', {
            method: 'POST',
            body: JSON.stringify({ studentId, advisorId, note })
        }),
        assignUnit: (studentId, unitId, note = null) => ApiClient.request('/api/academic/assign-unit', {
            method: 'POST',
            body: JSON.stringify({ studentId, unitId, note })
        }),
        updateStudentStatus: (studentId, status) => ApiClient.request('/api/academic/update-student-status', {
            method: 'POST',
            body: JSON.stringify({ studentId, status: parseInt(status) })
        }),
        getMyProfile: () => ApiClient.request('/api/academic/my-profile', { method: 'GET' })
    };
}

window.ApiClient = ApiClient;
