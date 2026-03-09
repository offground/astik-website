// ===================================
// ASTIK 교육일정 - 구글 시트 연동
// (2026-03-09 최종)
// ===================================

(function () {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';

    var allSchedules = [];
    var currentYear = new Date().getFullYear();
    var currentMonth = new Date().getMonth();
    var currentFilter = 'all';

    // ══════════════════════════════════
    //  공휴일 데이터
    // ══════════════════════════════════

    var fixedHolidays = {
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

    var lunarHolidays = {
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

    var substituteHolidays = {
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

    var temporaryHolidays = {
        2026: [
            { date: '06-03', name: '지방선거일' }
        ]
    };

    // ── 공휴일 판별 ──
    function getHolidayName(year, mm, dd) {
        var mmdd = mm + '-' + dd;
        if (fixedHolidays[mmdd]) return fixedHolidays[mmdd];
        if (lunarHolidays[year]) {
            for (var i = 0; i < lunarHolidays[year].length; i++) {
                if (lunarHolidays[year][i].date === mmdd) return lunarHolidays[year][i].name;
            }
        }
        if (substituteHolidays[year]) {
            for (var i = 0; i < substituteHolidays[year].length; i++) {
                if (substituteHolidays[year][i].date === mmdd) return substituteHolidays[year][i].name;
            }
        }
        if (temporaryHolidays[year]) {
            for (var i = 0; i < temporaryHolidays[year].length; i++) {
                if (temporaryHolidays[year][i].date === mmdd) return temporaryHolidays[year][i].name;
            }
        }
        return null;
    }

    // ── CSV 파싱 ──
    function parseCSV(csvText) {
        var lines = csvText.trim().split('\n');
        var data = [];
        for (var i = 1; i < lines.length; i++) {
            var values = lines[i].split(',').map(function (v) { return v.trim().replace(/^"|"$/g, ''); });
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

    // ── 날짜 유틸 ──
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatDate(dateStr) {
        var d = new Date(dateStr);
        return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    }

    function formatDateRange(start, end) {
        var s = new Date(start);
        var e = new Date(end);
        var sM = s.getMonth() + 1, sD = s.getDate();
        var eM = e.getMonth() + 1, eD = e.getDate();
        if (sM === eM) return sM + '월 ' + sD + '일 - ' + eD + '일';
        return sM + '월 ' + sD + '일 - ' + eM + '월 ' + eD + '일';
    }

    function getDayCount(start, end) {
        var s = new Date(start);
        var e = new Date(end);
        return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }

    function formatDateFull(dateStr) {
        var d = new Date(dateStr);
        var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '(' + weekdays[d.getDay()] + ')';
    }

    // ── 달력 렌더링 ──
    function renderCalendar() {
        var titleEl = document.getElementById('calTitle');
        var bodyEl = document.getElementById('calBody');
        if (!titleEl || !bodyEl) return;

        titleEl.textContent = currentYear + '년 ' + (currentMonth + 1) + '월';

        var firstDay = new Date(currentYear, currentMonth, 1).getDay();
        var lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        var today = new Date();
        var html = '';

        // 빈 셀
        for (var i = 0; i < firstDay; i++) {
            html += '<div class="cal-cell empty"></div>';
        }

        // 날짜 셀
        for (var d = 1; d <= lastDate; d++) {
            var mm = pad(currentMonth + 1);
            var dd = pad(d);
            var dateStr = currentYear + '-' + mm + '-' + dd;
            var dayOfWeek = new Date(currentYear, currentMonth, d).getDay();

            var isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);
            var holidayName = getHolidayName(currentYear, mm, dd);

            var cellClass = 'cal-cell';
            if (isToday) cellClass += ' today';

            // 공휴일·일요일 → 빨간색, 토요일 → 파란색
            if (holidayName || dayOfWeek === 0) {
                cellClass += ' cal-holiday';
            } else if (dayOfWeek === 6) {
                cellClass += ' cal-saturday-cell';
            }

            // 교육 일정 도트
            var daySchedules = allSchedules.filter(function (s) {
                var start = new Date(s.startDate);
                var end = new Date(s.endDate);
                var check = new Date(dateStr);
                return check >= start && check <= end;
            });

            var dotHTML = '';
            if (daySchedules.length > 0) {
                cellClass += ' has-event';
                var hasOpen = daySchedules.some(function (s) { return s.status === '모집중'; });
                var hasClosed = daySchedules.some(function (s) { return s.status === '마감'; });
                if (hasOpen) dotHTML += '<span class="cal-dot dot-open"></span>';
                if (hasClosed) dotHTML += '<span class="cal-dot dot-closed"></span>';
            }

            var titleAttr = holidayName ? ' title="' + holidayName + '"' : '';

            html += '<div class="' + cellClass + '" data-date="' + dateStr + '"' + titleAttr + '>' +
                '<span class="cal-date-num">' + d + '</span>' +
                '<div class="cal-dots">' + dotHTML + '</div>' +
                '</div>';
        }

        bodyEl.innerHTML = html;

        // 날짜 클릭 → 해당 일정으로 스크롤
        var cells = bodyEl.querySelectorAll('.cal-cell.has-event');
        cells.forEach(function (cell) {
            cell.addEventListener('click', function () {
                var date = cell.getAttribute('data-date');
                scrollToSchedule(date);
            });
        });
    }

    function scrollToSchedule(dateStr) {
        var items = document.querySelectorAll('.sch-item');
        items.forEach(function (item) {
            var start = item.getAttribute('data-start');
            var end = item.getAttribute('data-end');
            var check = new Date(dateStr);
            if (check >= new Date(start) && check <= new Date(end)) {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.classList.add('highlight');
                setTimeout(function () { item.classList.remove('highlight'); }, 2000);
            }
        });
    }

    // ── 스케줄 리스트 렌더링 ──
    function renderScheduleList() {
        var listEl = document.getElementById('scheduleList');
        var emptyEl = document.getElementById('emptyState');
        var listTitleEl = document.getElementById('listTitle');
        if (!listEl) return;

        var filtered = allSchedules.slice();

        if (currentFilter !== 'all') {
            filtered = filtered.filter(function (s) { return s.status === currentFilter; });
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(function (s) { return new Date(s.endDate) >= today; });
        filtered.sort(function (a, b) { return new Date(a.startDate) - new Date(b.startDate); });

        if (filtered.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (listTitleEl) listTitleEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');
        if (listTitleEl) listTitleEl.style.display = 'block';

        var html = '';
        filtered.forEach(function (s) {
            var sDate = new Date(s.startDate);
            var startMonth = sDate.getMonth() + 1;
            var startDay = sDate.getDate();
            var dateRange = formatDateFull(s.startDate) + ' ~ ' + formatDateFull(s.endDate);
            var days = getDayCount(s.startDate, s.endDate);
            var statusClass = s.status === '모집중' ? 'status-open' : 'status-closed';
            var statusIcon = s.status === '모집중' ? 'fa-circle-check' : 'fa-circle-xmark';

            html += '<div class="sch-item" data-start="' + s.startDate + '" data-end="' + s.endDate + '" data-status="' + s.status + '">' +
                '<div class="sch-date">' +
                '<span class="sch-month">' + startMonth + '월</span>' +
                '<span class="sch-day">' + startDay + '</span>' +
                '</div>' +
                '<div class="sch-content">' +
                '<div class="sch-top">' +
                '<h4 class="sch-course">' + s.course + '</h4>' +
                '<span class="sch-status ' + statusClass + '"><i class="fas ' + statusIcon + '"></i> ' + s.status + '</span>' +
                '</div>' +
                '<div class="sch-meta">' +
                '<span><i class="fas fa-calendar-days"></i> ' + dateRange + ' (' + days + '일)</span>' +
                '<span><i class="fas fa-location-dot"></i> ' + s.location + '</span>' +
                '<span><i class="fas fa-users"></i> ' + s.capacity + '</span>' +
                '</div>' +
                (s.note ? '<p class="sch-note">' + s.note + '</p>' : '') +
                '</div>' +
                (s.status === '모집중'
                    ? '<div class="sch-action"><a href="contact.html" class="btn btn-primary btn-sm">신청 문의</a></div>'
                    : '') +
                '</div>';
        });

        listEl.innerHTML = html;
    }

    // ── 필터 ──
    function initFilters() {
        var filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                renderScheduleList();
            });
        });
    }

    // ── 캘린더 네비게이션 ──
    function initCalendarNav() {
        var prevBtn = document.getElementById('calPrev');
        var nextBtn = document.getElementById('calNext');
        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                currentMonth--;
                if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                renderCalendar();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                currentMonth++;
                if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                renderCalendar();
            });
        }
    }

    // ── 데이터 로드 ──
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

    // ── 홈페이지 미리보기 (index.html) ──
    function loadHomePreview() {
        var previewEl = document.getElementById('schedulePreview');
        if (!previewEl || document.getElementById('scheduleList')) return;

        fetch(SHEET_CSV_URL)
            .then(function (response) { return response.text(); })
            .then(function (csvText) {
                var schedules = parseCSV(csvText);
                var today = new Date();
                today.setHours(0, 0, 0, 0);

                var upcoming = schedules
                    .filter(function (s) { return new Date(s.endDate) >= today && s.status === '모집중'; })
                    .sort(function (a, b) { return new Date(a.startDate) - new Date(b.startDate); })
                    .slice(0, 2);

                if (upcoming.length === 0) return;

                var html = '';
                upcoming.forEach(function (s) {
                    var sDate = new Date(s.startDate);
                    var dateRange = formatDateRange(s.startDate, s.endDate);

                    html += '<div class="schedule-item">' +
                        '<div class="schedule-date">' +
                        '<span class="month">' + (sDate.getMonth() + 1) + '월</span>' +
                        '<span class="day">' + sDate.getDate() + '</span>' +
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

    // ── 초기화 ──
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
