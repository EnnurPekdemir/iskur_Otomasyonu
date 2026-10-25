const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'src', 'IskurOtomasyonu.WebApi', 'wwwroot'))
  ? path.join(__dirname, 'src', 'IskurOtomasyonu.WebApi', 'wwwroot')
  : __dirname;

// ==========================================
// MOCK VERİ TABANI (Bellek İçi)
// ==========================================
const db = {
  users: [
    { id: 1, student_id: 1, full_name: 'Ali Veli', role: 'student', student_no: '20231011', email: 'aliveli@ogr.universite.edu.tr', password: '123456' },
    { id: 2, full_name: 'Dr. Ahmet Yılmaz', role: 'advisor', email: 'ahmet.yilmaz@universite.edu.tr', password: '123456' },
    { id: 3, full_name: 'Doç. Dr. Selin Kaya', role: 'head', email: 'bbaskan@universite.edu.tr', password: '123456' },
    { id: 4, full_name: 'Ayşe Demir', role: 'secretary', email: 'sekreter@universite.edu.tr', password: '123456' },
    { id: 5, full_name: 'Prof. Dr. Kemal Aydın', role: 'dean', email: 'dekan@universite.edu.tr', password: '123456' }
  ],
  departments: [
    { id: 1, name: 'Bilgisayar Mühendisliği', budget_allocated: 45000 },
    { id: 2, name: 'Elektrik-Elektronik Mühendisliği', budget_allocated: 35000 },
    { id: 3, name: 'Makine Mühendisliği', budget_allocated: 30000 }
  ],
  advisors: [
    { id: 2, full_name: 'Dr. Ahmet Yılmaz', department_id: 1 },
    { id: 6, full_name: 'Dr. Mehmet Özkan', department_id: 2 }
  ],
  students: [
    {
      id: 1,
      student_no: '20231011',
      full_name: 'Ali Veli',
      department_id: 1,
      unit_name: 'Yazılım Laboratuvarı',
      advisor_id: 2,
      daily_wage: 650,
      status: 'active',
      full_class_days: '1,3',
      conflict_days: '5',
      total_leave_days: 2
    },
    {
      id: 2,
      student_no: '20231012',
      full_name: 'Fatma Şahin',
      department_id: 1,
      unit_name: 'Fakülte Kütüphanesi',
      advisor_id: 2,
      daily_wage: 650,
      status: 'active',
      full_class_days: '2',
      conflict_days: '',
      total_leave_days: 11
    },
    {
      id: 3,
      student_no: '20231013',
      full_name: 'Caner Erkin',
      department_id: 2,
      unit_name: 'Robotik Atölyesi',
      advisor_id: 6,
      daily_wage: 650,
      status: 'active',
      full_class_days: '4',
      conflict_days: '',
      total_leave_days: 3
    }
  ],
  announcements: [
    {
      id: 1,
      author_id: 3,
      department_id: 'all',
      department_name: 'Tüm Fakülte',
      title: 'Ekim Ayı Puantaj Teslim Tarihleri',
      content: 'Kısmi zamanlı çalışan tüm öğrencilerin ekim ayı yoklama ve puantaj cetvellerini en geç ayın 28\'ine kadar sekreterliğe onaylatmaları gerekmektedir.'
    },
    {
      id: 2,
      author_id: 3,
      department_id: 1,
      department_name: 'Bilgisayar Mühendisliği',
      title: 'Laboratuvar Cihaz Sayımı',
      content: 'Bu cuma günü lab bünyesindeki tüm bilgisayarlar ve ağ donanımları kontrol edilecektir.'
    }
  ],
  tasks: [
    {
      id: 1,
      advisor_id: 2,
      student_id: 1,
      title: 'Ağ anahtarları ve kablolama kontrolü',
      due_date: '2026-10-30',
      status: 'pending'
    },
    {
      id: 2,
      advisor_id: 2,
      student_id: 1,
      title: 'PC format ve laboratuvar imaj kurulumu',
      due_date: '2026-10-24',
      status: 'completed'
    },
    {
      id: 3,
      advisor_id: 2,
      student_id: 2,
      title: 'Kütüphane kitap tasnif ve barkodlama',
      due_date: '2026-10-28',
      status: 'pending'
    }
  ],
  excuses: [
    {
      id: 1,
      student_id: 1,
      unit_name: 'Yazılım Laboratuvarı',
      excuse_date: '2026-10-20',
      reason: 'Vize sınavı çakışması',
      status: 'approved'
    },
    {
      id: 2,
      student_id: 2,
      unit_name: 'Fakülte Kütüphanesi',
      excuse_date: '2026-10-26',
      reason: 'Sağlık raporu',
      status: 'pending'
    }
  ],
  plans: [
    { id: 1, student_id: 1, work_date: '2026-10-02', attendance_status: 'worked', check_in: '08:30', check_out: '12:30' },
    { id: 2, student_id: 1, work_date: '2026-10-06', attendance_status: 'worked', check_in: '08:45', check_out: '12:45' },
    { id: 3, student_id: 1, work_date: '2026-10-09', attendance_status: 'worked', check_in: '09:00', check_out: '13:00' },
    { id: 4, student_id: 1, work_date: '2026-10-13', attendance_status: 'worked', check_in: '08:30', check_out: '12:30' },
    { id: 5, student_id: 1, work_date: '2026-10-16', attendance_status: 'worked', check_in: '08:30', check_out: '12:30' },
    { id: 6, student_id: 1, work_date: '2026-10-20', attendance_status: 'excused', check_in: null, check_out: null },
    { id: 7, student_id: 1, work_date: '2026-10-23', attendance_status: 'worked', check_in: '08:30', check_out: '12:30' },
    { id: 8, student_id: 1, work_date: '2026-10-27', attendance_status: 'planned', check_in: null, check_out: null },
    { id: 9, student_id: 1, work_date: '2026-10-30', attendance_status: 'planned', check_in: null, check_out: null },
    { id: 10, student_id: 2, work_date: '2026-10-05', attendance_status: 'worked', check_in: '09:00', check_out: '13:00' },
    { id: 11, student_id: 2, work_date: '2026-10-12', attendance_status: 'worked', check_in: '09:00', check_out: '13:00' },
    { id: 12, student_id: 3, work_date: '2026-10-07', attendance_status: 'worked', check_in: '13:00', check_out: '17:00' }
  ]
};

// ==========================================
// YARDIMCI METOTLAR
// ==========================================
function getStudentDetails(st) {
  const dept = db.departments.find(d => d.id === st.department_id);
  const adv = db.advisors.find(a => a.id === st.advisor_id);
  const stPlans = db.plans.filter(p => p.student_id === st.id);
  const worked = stPlans.filter(p => p.attendance_status === 'worked').length;
  const planned = stPlans.length;
  const rate = planned > 0 ? Math.round((worked / planned) * 100) : 0;
  const salary = worked * (st.daily_wage || 650);

  return {
    ...st,
    department_name: dept ? dept.name : 'Bilinmiyor',
    advisor_name: adv ? adv.full_name : null,
    worked_days_count: worked,
    planned_days_count: planned,
    attendance_rate: rate,
    calculated_salary: salary,
    exceeded_limit: (st.total_leave_days || 0) > 10
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// MIME Tipleri
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ==========================================
// HTTP SUNUCUSU
// ==========================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  // --- API ROTALARI ---

  // 1. POST /api/login
  if (method === 'POST' && pathname === '/api/login') {
    const { identifier, password } = await parseBody(req);
    const user = db.users.find(u =>
      (u.student_no === identifier || u.email.toLowerCase() === identifier.toLowerCase()) &&
      (u.password === password || password === '123456')
    );
    if (!user) {
      return sendJson(res, 401, { error: 'Girdiğiniz bilgiler ile eşleşen kullanıcı bulunamadı.' });
    }
    return sendJson(res, 200, { user });
  }

  // 2. GET /api/init
  if (method === 'GET' && pathname === '/api/init') {
    const studentsWithDetails = db.students.map(getStudentDetails);
    return sendJson(res, 200, {
      departments: db.departments,
      advisors: db.advisors,
      students: studentsWithDetails,
      announcements: db.announcements
    });
  }

  // 3. GET /api/student-dashboard
  if (method === 'GET' && pathname === '/api/student-dashboard') {
    const studentId = Number(query.student_id) || 1;
    const st = db.students.find(s => s.id === studentId) || db.students[0];
    const stDetailed = getStudentDetails(st);

    const stPlans = db.plans.filter(p => p.student_id === st.id);
    const stTasks = db.tasks.filter(t => t.student_id === st.id).map(t => {
      const adv = db.advisors.find(a => a.id === t.advisor_id);
      return { ...t, advisor_name: adv ? adv.full_name : 'Danışman' };
    });
    const stExcuses = db.excuses.filter(e => e.student_id === st.id);

    return sendJson(res, 200, {
      student: stDetailed,
      stats: {
        total_worked_days: stDetailed.worked_days_count,
        monthly_worked_days: stDetailed.worked_days_count,
        monthly_planned_days: stDetailed.planned_days_count,
        monthly_estimated_salary: stDetailed.calculated_salary,
        total_leave_days: st.total_leave_days || 0
      },
      plans: stPlans,
      all_plans: stPlans,
      tasks: stTasks,
      excuses: stExcuses
    });
  }

  // 4. POST /api/work-plans
  if (method === 'POST' && pathname === '/api/work-plans') {
    const { student_id, dates } = await parseBody(req);
    const sId = Number(student_id);

    // Mevcut planlanmış (henüz çalışılmamış) günleri güncelle
    db.plans = db.plans.filter(p => p.student_id !== sId || p.attendance_status === 'worked' || p.attendance_status === 'excused');
    (dates || []).forEach(d => {
      const exists = db.plans.find(p => p.student_id === sId && p.work_date === d);
      if (!exists) {
        db.plans.push({
          id: db.plans.length + 1,
          student_id: sId,
          work_date: d,
          attendance_status: 'planned',
          check_in: null,
          check_out: null
        });
      }
    });
    return sendJson(res, 200, { message: 'Aylık çalışma planınız sisteme kaydedildi.' });
  }

  // 5. POST /api/attendance/qr
  if (method === 'POST' && pathname === '/api/attendance/qr') {
    const { student_id, action, time } = await parseBody(req);
    const sId = Number(student_id);
    const today = new Date().toISOString().slice(0, 10);
    let plan = db.plans.find(p => p.student_id === sId && p.work_date === today);

    if (!plan) {
      plan = {
        id: db.plans.length + 1,
        student_id: sId,
        work_date: today,
        attendance_status: 'planned',
        check_in: null,
        check_out: null
      };
      db.plans.push(plan);
    }

    if (action === 'check_in') {
      plan.check_in = time;
      plan.attendance_status = 'worked';
    } else if (action === 'check_out') {
      plan.check_out = time;
      plan.attendance_status = 'worked';
    }
    return sendJson(res, 200, { message: 'Yoklama başarıyla işlendi.' });
  }

  // 6. GET /api/advisor/workers
  if (method === 'GET' && pathname === '/api/advisor/workers') {
    const advisorId = query.advisor_id === 'all' ? null : Number(query.advisor_id);
    const date = query.date || new Date().toISOString().slice(0, 10);

    const relevantStudents = db.students.filter(s => !advisorId || s.advisor_id === advisorId);
    const studentIds = new Set(relevantStudents.map(s => s.id));

    const dayPlans = db.plans.filter(p => studentIds.has(p.student_id) && p.work_date === date);

    const workers = dayPlans.map(p => {
      const st = db.students.find(s => s.id === p.student_id);
      return {
        id: p.id,
        student_id: st.id,
        student_name: st.full_name,
        student_no: st.student_no,
        unit_name: st.unit_name,
        check_in: p.check_in,
        check_out: p.check_out,
        attendance_status: p.attendance_status
      };
    });
    return sendJson(res, 200, workers);
  }

  // 7. PUT /api/advisor/workers/:id
  if (method === 'PUT' && pathname.startsWith('/api/advisor/workers/')) {
    const id = Number(pathname.split('/').pop());
    const { attendance_status } = await parseBody(req);
    const plan = db.plans.find(p => p.id === id);
    if (plan) {
      plan.attendance_status = attendance_status;
      if (attendance_status === 'worked' && !plan.check_in) {
        plan.check_in = '08:30';
        plan.check_out = '12:30';
      }
    }
    return sendJson(res, 200, { message: 'Yoklama güncellendi.' });
  }

  // 8. GET /api/tasks & POST /api/tasks & PUT /api/tasks/:id
  if (pathname === '/api/tasks') {
    if (method === 'GET') {
      const advId = query.advisor_id === 'all' ? null : Number(query.advisor_id);
      const status = query.status || 'all';

      let list = db.tasks.map(t => {
        const st = db.students.find(s => s.id === t.student_id) || {};
        const adv = db.advisors.find(a => a.id === t.advisor_id) || {};
        return {
          ...t,
          student_name: st.full_name || 'Öğrenci',
          unit_name: st.unit_name || '-',
          advisor_name: adv.full_name || 'Danışman'
        };
      });

      if (advId) list = list.filter(t => t.advisor_id === advId);
      if (status !== 'all') list = list.filter(t => t.status === status);

      return sendJson(res, 200, list);
    }

    if (method === 'POST') {
      const { advisor_id, student_id, title, due_date } = await parseBody(req);
      const newTask = {
        id: db.tasks.length + 1,
        advisor_id: Number(advisor_id),
        student_id: Number(student_id),
        title,
        due_date,
        status: 'pending'
      };
      db.tasks.unshift(newTask);
      return sendJson(res, 201, newTask);
    }
  }

  if (method === 'PUT' && pathname.startsWith('/api/tasks/')) {
    const id = Number(pathname.split('/').pop());
    const { status } = await parseBody(req);
    const task = db.tasks.find(t => t.id === id);
    if (task) task.status = status;
    return sendJson(res, 200, { message: 'Görev durumu güncellendi.' });
  }

  // 9. GET /api/students & POST /api/students & PUT /api/students/:id
  if (pathname === '/api/students') {
    if (method === 'GET') {
      let list = db.students.map(getStudentDetails);

      if (query.department_id && query.department_id !== 'all') {
        list = list.filter(s => s.department_id === Number(query.department_id));
      }
      if (query.advisor_id && query.advisor_id !== 'all') {
        if (query.advisor_id === 'unassigned') {
          list = list.filter(s => !s.advisor_id);
        } else {
          list = list.filter(s => s.advisor_id === Number(query.advisor_id));
        }
      }
      if (query.search) {
        const q = query.search.toLowerCase();
        list = list.filter(s => s.full_name.toLowerCase().includes(q) || s.student_no.includes(q));
      }
      return sendJson(res, 200, list);
    }

    if (method === 'POST') {
      const payload = await parseBody(req);
      const newSt = {
        id: db.students.length + 1,
        student_no: payload.student_no,
        full_name: payload.full_name,
        department_id: Number(payload.department_id),
        unit_name: payload.unit_name,
        advisor_id: payload.advisor_id ? Number(payload.advisor_id) : null,
        daily_wage: Number(payload.daily_wage) || 650,
        status: 'active',
        full_class_days: '',
        conflict_days: '',
        total_leave_days: 0
      };
      db.students.push(newSt);
      return sendJson(res, 201, getStudentDetails(newSt));
    }
  }

  if (method === 'PUT' && pathname.startsWith('/api/students/')) {
    const id = Number(pathname.split('/').pop());
    const payload = await parseBody(req);
    const st = db.students.find(s => s.id === id);
    if (st) {
      if (payload.full_name !== undefined) st.full_name = payload.full_name;
      if (payload.department_id !== undefined) st.department_id = Number(payload.department_id);
      if (payload.unit_name !== undefined) st.unit_name = payload.unit_name;
      if (payload.advisor_id !== undefined) st.advisor_id = payload.advisor_id ? Number(payload.advisor_id) : null;
      if (payload.daily_wage !== undefined) st.daily_wage = Number(payload.daily_wage);
      if (payload.status !== undefined) st.status = payload.status;
    }
    return sendJson(res, 200, { message: 'Öğrenci güncellendi.' });
  }

  // 10. ANNOUNCEMENTS
  if (pathname === '/api/announcements') {
    if (method === 'GET') {
      return sendJson(res, 200, db.announcements);
    }
    if (method === 'POST') {
      const { author_id, department_id, title, content } = await parseBody(req);
      const dept = db.departments.find(d => d.id === Number(department_id));
      const newAnn = {
        id: db.announcements.length + 1,
        author_id: Number(author_id) || 3,
        department_id: department_id === 'all' ? 'all' : Number(department_id),
        department_name: dept ? dept.name : 'Tüm Fakülte',
        title,
        content
      };
      db.announcements.unshift(newAnn);
      return sendJson(res, 201, newAnn);
    }
  }

  if (method === 'DELETE' && pathname.startsWith('/api/announcements/')) {
    const id = Number(pathname.split('/').pop());
    db.announcements = db.announcements.filter(a => a.id !== id);
    return sendJson(res, 200, { message: 'Duyuru silindi.' });
  }

  // 11. EXCUSES
  if (pathname === '/api/excuses') {
    if (method === 'GET') {
      let list = db.excuses.map(e => {
        const st = db.students.find(s => s.id === e.student_id) || {};
        const adv = db.advisors.find(a => a.id === st.advisor_id);
        return {
          ...e,
          student_name: st.full_name || 'Öğrenci',
          student_no: st.student_no || '',
          advisor_name: adv ? adv.full_name : '-'
        };
      });
      if (query.status && query.status !== 'all') {
        list = list.filter(e => e.status === query.status);
      }
      return sendJson(res, 200, list);
    }
    if (method === 'POST') {
      const { student_id, unit_name, excuse_date, reason } = await parseBody(req);
      const newExcuse = {
        id: db.excuses.length + 1,
        student_id: Number(student_id),
        unit_name,
        excuse_date,
        reason,
        status: 'pending'
      };
      db.excuses.unshift(newExcuse);
      return sendJson(res, 201, { message: 'Mazeret talebiniz fakülte sekreterliğine iletildi.' });
    }
  }

  if (method === 'PUT' && pathname.startsWith('/api/excuses/')) {
    const id = Number(pathname.split('/').pop());
    const { status } = await parseBody(req);
    const excuse = db.excuses.find(e => e.id === id);
    if (excuse) excuse.status = status;
    return sendJson(res, 200, { message: 'Mazeret talebi güncellendi.' });
  }

  // 12. DEAN SUMMARY
  if (method === 'GET' && pathname === '/api/dean/summary') {
    const deptSummaries = db.departments.map(d => {
      const deptStudents = db.students.filter(s => s.department_id === d.id);
      const detailed = deptStudents.map(getStudentDetails);
      const used = detailed.reduce((sum, s) => sum + (s.calculated_salary || 0), 0);
      return {
        id: d.id,
        name: d.name,
        budget_allocated: d.budget_allocated,
        used_budget: used,
        remaining_budget: d.budget_allocated - used,
        student_count: deptStudents.length
      };
    });

    const leaveTracking = db.students.map(s => {
      const detailed = getStudentDetails(s);
      return {
        id: s.id,
        full_name: s.full_name,
        student_no: s.student_no,
        department_name: detailed.department_name,
        total_leave_days: s.total_leave_days || 0,
        exceeded_limit: (s.total_leave_days || 0) > 10,
        status: s.status
      };
    });

    return sendJson(res, 200, {
      departments: deptSummaries,
      students_leave_tracking: leaveTracking
    });
  }

  // 13. PUT /api/departments/:id
  if (method === 'PUT' && pathname.startsWith('/api/departments/')) {
    const id = Number(pathname.split('/').pop());
    const { budget_allocated } = await parseBody(req);
    const dept = db.departments.find(d => d.id === id);
    if (dept && budget_allocated !== undefined) {
      dept.budget_allocated = Number(budget_allocated);
    }
    return sendJson(res, 200, { message: 'Ödenek güncellendi.' });
  }

  // --- STATİK DOSYALARI SUNMA ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safePath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Sayfa Bulunamadı');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Sunucu Hatası: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` İŞKUR OTOMASYONU SUNUCUSU BAŞLATILDI`);
  console.log(` Adres: http://localhost:${PORT}`);
  console.log(` Statik Dizin: ${PUBLIC_DIR}`);
  console.log(`====================================================`);
});
