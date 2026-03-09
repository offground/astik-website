// ===================================
// ASTIK 교육일정 - 구글 시트 연동
// ===================================

(function () {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';

    // 전역 변수
    let allSchedules = [];
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentFilter = 'all';

    // ---------- CSV 파싱 ----------
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length >= 6 && values[0]) {
                data.push({
                    startDate: values[0],
                    endDate: values[1],
                    course: values[2],
                    location: values[3],
                    capacity: values[4],
                    status: values[5],
                    note: values[6] || ''
                });
            }
        }
        return data;
    }

    // ---------- 날짜 포맷 ----------
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return { month: month, day: day, full: d };
    }

    function formatDateRange(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const sMonth = s.getMonth() + 1;
        const sDay = s.getDate();
        const eMonth = e.getMonth() + 1;
        const eDay = e.getDate();

        if (sMonth === eMonth) {
            return sMonth + '월 ' + sDay + '일 - ' + eDay + '일';
        } else {
            return sMonth + '월 ' + sDay + '일 - ' + eMonth + '월 ' + eDay + '일';
        }
    }

    function getDayCount(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff + '일';
    }

    // ---------- 캘린더 렌더링 ----------
    function renderCalendar() {
        const titleEl = document.getElementById('calTitle');
        const bodyEl = document.getElementById('calBody');

        if (!titleEl || !bodyEl) return;

        titleEl.textContent = currentYear + '년 ' + (currentMonth + 1) + '월';

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();

        let html = '';

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-cell empty"></div>';
        }

        for (let d = 1; d <= lastDate; d++) {
            const dateStr = currentYear + '-' +
                String(currentMonth + 1).padStart(2, '0') + '-' +
                String(d).padStart(2, '0');

            const isToday = (today.getFullYear() === currentYear &&
                today.getMonth() === currentMonth &&
                today.getDate() === d);

            const daySchedules = allSchedules.filter(function (s) {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                const check = new Date(dateStr);
                return check >= start && check <= end;
            });

            let cellClass = 'cal-cell';
            if (isToday) cellClass += ' today';

            let dotHTML = '';
            if (daySchedules.length > 0) {
                cellClass += ' has-event';
                const hasOpen = daySchedules.some(s => s.status === '모집중');
                const hasClosed = daySchedules.some(s => s.status === '마감');
                if (hasOpen) dotHTML += '<span class="cal-dot dot-open"></span>';
                if (hasClosed) dotHTML += '<span class="cal-dot dot-closed"></span>';
            }

            html += '<div class="' + cellClass + '" data-date="' + dateStr + '">' +
                '<span class="cal-date-num">' + d + '</span>' +
                '<div class="cal-dots">' + dotHTML + '</div>' +
                '</div>';
        }

        bodyEl.innerHTML = html;

        const cells = bodyEl.querySelectorAll('.cal-cell.has-event');
        cells.forEach(function (cell) {
            cell.addEventListener('click', function () {
                const date = cell.getAttribute('data-date');
                scrollToSchedule(date);
            });
        });
    }

    function scrollToSchedule(dateStr) {
        const items = document.querySelectorAll('.sch-item');
        items.forEach(function (item) {
            const start = item.getAttribute('data-start');
            const end = item.getAttribute('data-end');
            const check = new Date(dateStr);
            if (check >= new Date(start) && check <= new Date(end)) {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.classList.add('highlight');
                setTimeout(function () {
                    item.classList.remove('highlight');
                }, 2000);
            }
        });
    }

    // ---------- 스케줄 리스트 렌더링 ----------
    function renderScheduleList() {
        const listEl = document.getElementById('scheduleList');
        const emptyEl = document.getElementById('emptyState');
        const listTitleEl = document.getElementById('listTitle');

        if (!listEl) return;

        let filtered = allSchedules;

        if (currentFilter !== 'all') {
            filtered = filtered.filter(function (s) {
                return s.status === currentFilter;
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filtered = filtered.filter(function (s) {
            return new Date(s.endDate) >= today;
        });

        filtered.sort(function (a, b) {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (listTitleEl) listTitleEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');
        if (listTitleEl) listTitleEl.style.display = 'block';

        let html = '';

        filtered.forEach(function (s) {
            const startInfo = formatDate(s.startDate);
            const dateRange = formatDateRange(s.startDate, s.endDate);
            const days = getDayCount(s.startDate, s.endDate);
            const statusClass = s.status === '모집중' ? 'status-open' : 'status-closed';
            const statusIcon = s.status === '모집중' ? 'fa-circle-check' : 'fa-circle-xmark';

            html += '<div class="sch-item" data-start="' + s.startDate + '" data-end="' + s.endDate + '" data-status="' + s.status + '">' +
                '<div class="sch-date">' +
                '<span class="sch-month">' + startInfo.month + '월</span>' +
                '<span class="sch-day">' + startInfo.day + '</span>' +
                '</div>' +
                '<div class="sch-content">' +
                '<div class="sch-top">' +
                '<h4 class="sch-course">' + s.course + '</h4>' +
                '<span class="sch-status ' + statusClass + '"><i class="fas ' + statusIcon + '"></i> ' + s.status + '</span>' +
                '</div>' +
                '<div class="sch-meta">' +
                '<span><i class="fas fa-calendar-days"></i> ' + dateRange + ' (' + days + ')</span>' +
                '<span><i class="fas fa-location-dot"></i> ' + s.location + '</span>' +
                '<span><i class="fas fa-users"></i> ' + s.capacity + '</span>' +
                '</div>' +
                (s.note ? '<p class="sch-note">' + s.note + '</p>' : '') +
                '</div>' +
                '<div class="sch-action">' +
                (s.status === '모집중'
                    ? '<a href="contact.html" class="btn btn-primary btn-sm">신청 문의</a>'
                    : '<span class="btn btn-disabled btn-sm">마감</span>') +
                '</div>' +
                '</div>';
        });

        listEl.innerHTML = html;
    }

    // ---------- 필터 이벤트 ----------
    function initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                renderScheduleList();
            });
        });
    }

    // ---------- 캘린더 네비게이션 ----------
    function initCalendarNav() {
        const prevBtn = document.getElementById('calPrev');
        const nextBtn = document.getElementById('calNext');

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar();
            });
        }
    }

    // ---------- 데이터 로드 ----------
    function loadScheduleData() {
        fetch(SHEET_CSV_URL)
            .then(function (response) { return response.text(); })
            .then(function (csvText) {
                allSchedules = parseCSV(csvText);
                renderCalendar();
                renderScheduleList();
            })
            .catch(function (error) {
                console.error('일정 로드 실패:', error);
                allSchedules = [];
                renderCalendar();
                renderScheduleList();
            });
    }

    // ---------- 홈페이지 미리보기용 (index.html) ----------
    function loadHomePreview() {
        const previewEl = document.getElementById('schedulePreview');
        if (!previewEl || document.getElementById('scheduleList')) return;

        fetch(SHEET_CSV_URL)
            .then(function (response) { return response.text(); })
            .then(function (csvText) {
                const schedules = parseCSV(csvText);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const upcoming = schedules
                    .filter(function (s) { return new Date(s.endDate) >= today && s.status === '모집중'; })
                    .sort(function (a, b) { return new Date(a.startDate) - new Date(b.startDate); })
                    .slice(0, 2);

                if (upcoming.length === 0) return;

                let html = '';
                upcoming.forEach(function (s) {
                    const startInfo = formatDate(s.startDate);
                    const dateRange = formatDateRange(s.startDate, s.endDate);

                    html += '<div class="schedule-item">' +
                        '<div class="schedule-date">' +
                        '<span class="month">' + startInfo.month + '월</span>' +
                        '<span class="day">' + startInfo.day + '</span>' +
                        '</div>' +
                        '<div class="schedule-info">' +
                        '<h4>' + s.course + '</h4>' +
                        '<p>' + dateRange + ' · ' + s.location + '</p>' +
                        '</div>' +
                        '</div>';
                });

                previewEl.innerHTML = html;
            })
            .catch(function () { });
    }

    // ---------- 초기화 ----------
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('scheduleList')) {
            initFilters();
            initCalendarNav();
            loadScheduleData();
        }

        if (document.getElementById('schedulePreview')) {
            loadHomePreview();
        }
    });

})();
