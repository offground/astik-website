/* =========================================================
   ASTIK – schedule.js  (2026-03-09 업데이트)
   ========================================================= */

// ── Google Sheets CSV URL ──
const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';

// ── 공휴일 데이터 ──

// 양력 고정 공휴일 (MM-DD)
const fixedHolidays = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '07-17': '제헌절',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절'
};

// 음력 기반 공휴일 (연도별 양력 변환)
const lunarHolidays = {
  2025: [
    { date: '01-28', name: '설날 연휴' },
    { date: '01-29', name: '설날' },
    { date: '01-30', name: '설날 연휴' },
    { date: '05-05', name: '부처님오신날' },
    { date: '10-05', name: '추석 연휴' },
    { date: '10-06', name: '추석' },
    { date: '10-07', name: '추석 연휴' }
  ],
  2026: [
    { date: '02-16', name: '설날 연휴' },
    { date: '02-17', name: '설날' },
    { date: '02-18', name: '설날 연휴' },
    { date: '05-24', name: '부처님오신날' },
    { date: '09-24', name: '추석 연휴' },
    { date: '09-25', name: '추석' },
    { date: '09-26', name: '추석 연휴' }
  ],
  2027: [
    { date: '02-06', name: '설날 연휴' },
    { date: '02-07', name: '설날' },
    { date: '02-08', name: '설날 연휴' },
    { date: '05-13', name: '부처님오신날' },
    { date: '10-14', name: '추석 연휴' },
    { date: '10-15', name: '추석' },
    { date: '10-16', name: '추석 연휴' }
  ]
};

// 대체공휴일 (공휴일이 주말과 겹칠 때 지정되는 대체 휴일, 연도별)
const substituteHolidays = {
  2025: [
    { date: '03-03', name: '대체공휴일(삼일절)' },
    { date: '05-06', name: '대체공휴일(어린이날)' },
    { date: '10-08', name: '대체공휴일(추석)' }
  ],
  2026: [
    { date: '03-02', name: '대체공휴일(삼일절)' },
    { date: '05-25', name: '대체공휴일(부처님오신날)' },
    { date: '08-17', name: '대체공휴일(광복절)' },
    { date: '10-05', name: '대체공휴일(개천절)' }
  ],
  2027: [
    { date: '02-09', name: '대체공휴일(설날)' },
    { date: '10-18', name: '대체공휴일(추석)' }
  ]
};

// 임시공휴일 (선거일 등, 연도별)
const temporaryHolidays = {
  2026: [
    { date: '06-03', name: '지방선거일' }
  ]
};

/* ── 공휴일 판별 함수 ── */
function getHolidayName(year, monthStr, dayStr) {
  const mmdd = monthStr + '-' + dayStr;

  // 1) 양력 고정 공휴일
  if (fixedHolidays[mmdd]) return fixedHolidays[mmdd];

  // 2) 음력 기반 공휴일
  if (lunarHolidays[year]) {
    const found = lunarHolidays[year].find(h => h.date === mmdd);
    if (found) return found.name;
  }

  // 3) 대체공휴일
  if (substituteHolidays[year]) {
    const found = substituteHolidays[year].find(h => h.date === mmdd);
    if (found) return found.name;
  }

  // 4) 임시공휴일
  if (temporaryHolidays[year]) {
    const found = temporaryHolidays[year].find(h => h.date === mmdd);
    if (found) return found.name;
  }

  return null;
}

function isHoliday(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return getHolidayName(year, mm, dd) !== null;
}

/* ── CSV 파싱 ── */
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const rows = lines.slice(1);
  return rows.map(row => {
    const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return {
      startDate: cols[0] || '',
      endDate: cols[1] || '',
      course: cols[2] || '',
      location: cols[3] || '',
      capacity: cols[4] || '',
      status: cols[5] || '',
      note: cols[6] || ''
    };
  }).filter(s => s.startDate);
}

/* ── 날짜 유틸 ── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${weekdays[d.getDay()]})`;
}

function formatDateRange(start, end) {
  if (!start) return '';
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

function getDayCount(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function isDateInRange(dateStr, startStr, endStr) {
  const d = new Date(dateStr);
  const s = new Date(startStr);
  const e = endStr ? new Date(endStr) : s;
  return d >= s && d <= e;
}

/* ── 달력 렌더링 ── */
let currentYear, currentMonth, scheduleData = [];

function renderCalendar(year, month) {
  currentYear = year;
  currentMonth = month;

  const calTitle = document.getElementById('calendarTitle');
  const calGrid = document.getElementById('calendarGrid');
  if (!calTitle || !calGrid) return;

  calTitle.textContent = `${year}년 ${month}월`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 요일 헤더
  let html = '';
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  dayLabels.forEach((label, i) => {
    let cls = 'cal-header';
    if (i === 0) cls += ' cal-sunday';
    if (i === 6) cls += ' cal-saturday';
    html += `<div class="${cls}">${label}</div>`;
  });

  // 빈 셀
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell cal-empty"></div>';
  }

  // 날짜 셀
  for (let d = 1; d <= lastDate; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();

    let cls = 'cal-cell';
    const holidayName = getHolidayName(year, mm, dd);

    if (dateStr === todayStr) cls += ' cal-today';
    if (holidayName || dayOfWeek === 0) {
      cls += ' cal-holiday';
    } else if (dayOfWeek === 6) {
      cls += ' cal-saturday';
    }

    // 교육 일정 도트
    let dot = '';
    scheduleData.forEach(s => {
      if (isDateInRange(dateStr, s.startDate, s.endDate || s.startDate)) {
        if (s.status === '모집중') {
          dot = '<span class="cal-dot dot-open"></span>';
        } else if (s.status === '마감') {
          dot = dot || '<span class="cal-dot dot-closed"></span>';
        }
      }
    });

    const title = holidayName ? ` title="${holidayName}"` : '';

    html += `<div class="${cls}" data-date="${dateStr}"${title}>
      <span class="cal-date-num">${d}</span>${dot}
    </div>`;
  }

  calGrid.innerHTML = html;

  // 날짜 클릭 이벤트
  calGrid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      const target = document.querySelector(`.schedule-item[data-start="${date}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

/* ── 월 이동 ── */
function prevMonth() {
  let y = currentYear, m = currentMonth - 1;
  if (m < 1) { m = 12; y--; }
  renderCalendar(y, m);
}
function nextMonth() {
  let y = currentYear, m = currentMonth + 1;
  if (m > 12) { m = 1; y++; }
  renderCalendar(y, m);
}

/* ── 교육 일정 목록 ── */
function renderScheduleList(filter) {
  const listEl = document.getElementById('scheduleList');
  if (!listEl) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let filtered = scheduleData.filter(s => {
    const end = new Date(s.endDate || s.startDate);
    return end >= now;
  });

  if (filter && filter !== '전체') {
    filtered = filtered.filter(s => s.status === filter);
  }

  filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="schedule-empty"><p>현재 예정된 교육 일정이 없습니다.</p></div>';
    return;
  }

  listEl.innerHTML = filtered.map(s => {
    const days = getDayCount(s.startDate, s.endDate);
    const statusClass = s.status === '모집중' ? 'status-open' : 'status-closed';
    return `
      <div class="schedule-item" data-start="${s.startDate}">
        <div class="schedule-header">
          <span class="schedule-badge ${statusClass}">${s.status}</span>
          <h3 class="schedule-course">${s.course}</h3>
        </div>
        <div class="schedule-details">
          <span><i class="fas fa-calendar-days"></i> ${formatDateRange(s.startDate, s.endDate)} (${days}일)</span>
          <span><i class="fas fa-location-dot"></i> ${s.location}</span>
          <span><i class="fas fa-users"></i> ${s.capacity}</span>
          ${s.note ? `<span><i class="fas fa-circle-info"></i> ${s.note}</span>` : ''}
        </div>
        ${s.status === '모집중' ? '<a href="contact.html" class="schedule-register">교육 신청하기 →</a>' : ''}
      </div>
    `;
  }).join('');
}

/* ── 필터 버튼 ── */
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderScheduleList(btn.dataset.filter);
    });
  });
}

/* ── 홈페이지 미리보기 ── */
function renderHomePreview() {
  const previewEl = document.getElementById('schedulePreview');
  if (!previewEl) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = scheduleData
    .filter(s => new Date(s.startDate) >= now && s.status === '모집중')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 2);

  if (upcoming.length === 0) {
    previewEl.innerHTML = '<p class="preview-empty">현재 모집 중인 교육 일정이 없습니다.</p>';
    return;
  }

  previewEl.innerHTML = upcoming.map(s => {
    const days = getDayCount(s.startDate, s.endDate);
    return `
      <div class="preview-card">
        <span class="preview-badge">모집중</span>
        <h4>${s.course}</h4>
        <p><i class="fas fa-calendar-days"></i> ${formatDateRange(s.startDate, s.endDate)} (${days}일)</p>
        <p><i class="fas fa-location-dot"></i> ${s.location}</p>
      </div>
    `;
  }).join('');
}

/* ── 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  fetch(SHEET_CSV_URL)
    .then(res => res.text())
    .then(csv => {
      scheduleData = parseCSV(csv);

      // 스케줄 페이지
      if (document.getElementById('calendarGrid')) {
        const now = new Date();
        renderCalendar(now.getFullYear(), now.getMonth() + 1);
        renderScheduleList('전체');
        initFilters();

        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        if (prevBtn) prevBtn.addEventListener('click', prevMonth);
        if (nextBtn) nextBtn.addEventListener('click', nextMonth);
      }

      // 홈 미리보기
      if (document.getElementById('schedulePreview')) {
        renderHomePreview();
      }
    })
    .catch(err => console.error('Schedule fetch error:', err));
});
