// ===================================
// ASTIK 교육일정 - 구글 시트 연동
// (2026-03-09 최종)
// ===================================

(function () {

    var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';

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

    // ── 날짜 파싱 (UTC 문제 방지) ──
    function parseLocalDate(str) {
        if (!str) return null;
        str = str.trim();
        var parts = str.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        parts = str.split('.');
        if (parts.length >= 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date(str);
    }

    // ── CSV 파싱 ──
    function parseCSV(csvText) {
        var lines = csvText.trim().split('\n');
        var data = [];
        for (var i = 1; i < lines.length; i++) {
            var values = lines[i].split(',').map(function (v) { return v.trim().replace(/^"|"$/g, ''); });
            if (values.length >= 6 && values[0]) {
                data.push({
                    startDate: values[0].trim(),
                    endDate: values[1].trim(),
                    course: values[2].trim(),
                    location: values[3].trim(),
                    capacity: values[4].trim(),
                    status: values[5].trim(),
                    note: (values[6] || '').trim()
                });
            }
        }
        return data;
    }

    // ── 날짜 유틸 ──
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatDateRange(start, end) {
        var s = parseLocalDate(start);
        var e = parseLocalDate(end);
        var sM = s.getMonth() + 1, sD = s.getDate();
        var eM = e.getMonth() + 1, eD = e.getDate();
        if (sM === eM && sD === eD) return sM + '월 ' + sD + '일';
        if (sM === eM) return sM + '월 ' + sD + '일 - ' + eD + '일';
        return sM + '월 ' + sD + '일 - ' + eM + '월 ' + eD + '일';
    }

    function getDayCount(start, end) {
        var s = parseLocalDate(start);
        var e = parseLocalDate(end);
        return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }

    function formatDateFull(dateStr) {
        var d = parseLocalDate(dateStr);
        var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '(' + weekdays[d.getDay()] + ')';
    }

    // ── 날짜 범위 비교 (로컬 기준) ──
    function isDateInRange(year, month, day, startStr, endStr) {
        var check = new Date(year, month, day);
        check.setHours(0, 0, 0, 0);
        var s = parseLocalDate(startStr);
        s.setHours(0, 0, 0, 0);
        var e = parseLocalDate(endStr);
        e.setHours(0, 0, 0, 0);
        return check >= s && check <= e;
    }

    // ── 과정명 줄임 ──
    function shortenName(name, maxLen) {
        if (!maxLen) maxLen = 6;
        if (name.length <= maxLen) return name;
        return name.substring(0, maxLen) + '…';
    }

    // ══════════════════════════════════
    //  달력 렌더링
    // ══════════════════════════════════
    function renderCalendar() {
        var titleEl = document.getElementById('calTitle');
        var bodyEl = document.getElementById('calBody');
        if (!titleEl || !bodyEl) return;

        titleEl.textContent = currentYear + '년 ' + (currentMonth + 1) + '월';

        var firstDay = new Date(currentYear, currentMonth, 1).getDay();
        var lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var html = '';

        for (var i = 0; i < firstDay; i++) {
            html += '<div class="cal-cell empty"></div>';
        }

        for (var d = 1; d <= lastDate; d++) {
            var mm = pad(currentMonth + 1);
            var dd = pad(d);
            var dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
            var cellDate = new Date(currentYear, currentMonth, d);
            cellDate.setHours(0, 0, 0, 0);

            var isToday = (cellDate.getTime() === today.getTime());
            var holidayName = getHolidayName(currentYear, mm, dd);

            var cellClass = 'cal-cell';
            if (isToday) cellClass += ' today';
            if (holidayName || dayOfWeek === 0) {
                cellClass += ' cal-holiday';
            } else if (dayOfWeek === 6) {
                cellClass += ' cal-saturday-cell';
            }

            var daySchedules = [];
            for (var si = 0; si < allSchedules.length; si++) {
                var s = allSchedules[si];
                if (isDateInRange(currentYear, currentMonth, d, s.startDate, s.endDate)) {
                    daySchedules.push(s);
                }
            }

            var eventHTML = '';
            if (daySchedules.length > 0) {
                cellClass += ' has-event';
                for (var ei = 0; ei < daySchedules.length; ei++) {
                    var ev = daySchedules[ei];
                    var evClass = ev.status === '모집 중' ? 'cal-event-open' : 'cal-event-closed';
                    eventHTML += '<span class="cal-event-label ' + evClass + '" title="' + ev.course + ' (' + ev.status + ')">' + shortenName(ev.course, 5) + '</span>';
                }
            }

            var titleAttr = holidayName ? ' title="' + holidayName + '"' : '';

            html += '<div class="' + cellClass + '" data-date="' + currentYear + '-' + mm + '-' + dd + '"' + titleAttr + '>' +
                '<span class="cal-date-num">' + d + '</span>' +
                '<div class="cal-events">' + eventHTML + '</div>' +
                '</div>';
        }

        bodyEl.innerHTML = html;

        var cells = bodyEl.querySelectorAll('.cal-cell.has-event');
        for (var ci = 0; ci < cells.length; ci++) {
            (function (cell) {
                cell.addEventListener('click', function () {
                    var date = cell.getAttribute('data-date');
                    scrollToSchedule(date);
                });
            })(cells[ci]);
        }
    }

    function scrollToSchedule(dateStr) {
        var items = document.querySelectorAll('.sch-item');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var start = item.getAttribute('data-start');
            var end = item.getAttribute('data-end');
            var parts = dateStr.split('-');
            if (isDateInRange(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), start, end)) {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.classList.add('highlight');
                (function (el) {
                    setTimeout(function () { el.classList.remove('highlight'); }, 2000);
                })(item);
                break;
            }
        }
    }

    // ══════════════════════════════════
    //  공통 일정 카드 HTML 생성
    // ══════════════════════════════════
    function buildScheduleHTML(items, isPast) {
        var html = '';
        items.forEach(function (s) {
            var sDate = parseLocalDate(s.startDate);
            var startMonth = sDate.getMonth() + 1;
            var startDay = sDate.getDate();
            var dateRange = formatDateFull(s.startDate) + ' ~ ' + formatDateFull(s.endDate);
            var days = getDayCount(s.startDate, s.endDate);

            var statusClass, statusIcon, statusText;
            if (isPast) {
                statusClass = 'status-done';
                statusIcon = 'fa-circle-check';
                statusText = '완료';
            } else if (s.status === '모집 중') {
                statusClass = 'status-open';
                statusIcon = 'fa-circle-check';
                statusText = '모집 중';
            } else {
                statusClass = 'status-closed';
                statusIcon = 'fa-circle-xmark';
                statusText = '마감';
            }

            html += '<div class="sch-item' + (isPast ? ' sch-past' : '') + '" data-start="' + s.startDate + '" data-end="' + s.endDate + '" data-status="' + s.status + '">' +
                '<div class="sch-date">' +
                '<span class="sch-month">' + startMonth + '월</span>' +
                '<span class="sch-day">' + startDay + '</span>' +
                '</div>' +
                '<div class="sch-content">' +
                '<div class="sch-top">' +
                '<h4 class="sch-course">' + s.course + '</h4>' +
                '<span class="sch-status ' + statusClass + '"><i class="fas ' + statusIcon + '"></i> ' + statusText + '</span>' +
                '</div>' +
                '<div class="sch-meta">' +
                '<span><i class="fas fa-calendar-days"></i> ' + dateRange + ' (' + days + '일)</span>' +
                '<span><i class="fas fa-location-dot"></i> ' + s.location + '</span>' +
                '<span><i class="fas fa-users"></i> ' + s.capacity + '</span>' +
                '</div>' +
                (s.note ? '<p class="sch-note">' + s.note + '</p>' : '') +
                '</div>' +
                (!isPast && s.status === '모집 중'
                    ? '<div class="sch-action"><a href="contact.html" class="btn btn-primary btn-sm">신청 문의</a></div>'
                    : '') +
                '</div>';
        });
        return html;
    }

    // ══════════════════════════════════
    //  스케줄 리스트 렌더링 (예정 + 지난 교육)
    // ══════════════════════════════════
    function renderScheduleList() {
        var listEl = document.getElementById('scheduleList');
        var emptyEl = document.getElementById('emptyState');
        var listTitleEl = document.getElementById('listTitle');
        var pastSection = document.getElementById('pastSection');
        var pastList = document.getElementById('pastList');
        if (!listEl) return;

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        // 예정된 교육 (종료일 >= 오늘)
        var upcoming = allSchedules.filter(function (s) {
            var end = parseLocalDate(s.endDate);
            end.setHours(0, 0, 0, 0);
            return end >= today;
        });

        // 지난 교육 (종료일 < 오늘)
        var past = allSchedules.filter(function (s) {
            var end = parseLocalDate(s.endDate);
            end.setHours(0, 0, 0, 0);
            return end < today;
        });

        // 필터 적용 (예정된 교육에만)
        if (currentFilter !== 'all') {
            upcoming = upcoming.filter(function (s) { return s.status === currentFilter; });
        }

        upcoming.sort(function (a, b) { return parseLocalDate(a.startDate) - parseLocalDate(b.startDate); });
        past.sort(function (a, b) { return parseLocalDate(b.startDate) - parseLocalDate(a.startDate); });

        // ── 예정된 교육 ──
        if (upcoming.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (listTitleEl) listTitleEl.style.display = 'none';
        } else {
            if (emptyEl) emptyEl.classList.add('hidden');
            if (listTitleEl) listTitleEl.style.display = 'block';
            listEl.innerHTML = buildScheduleHTML(upcoming, false);
        }

        // ── 지난 교육 ──
        if (pastSection && pastList) {
            if (past.length > 0) {
                pastSection.style.display = 'block';
                pastList.innerHTML = buildScheduleHTML(past, true);
            } else {
                pastSection.style.display = 'none';
            }
        }
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

    // ── 지난 교육 토글 ──
    function initPastToggle() {
        var toggleBtn = document.getElementById('pastToggle');
        var pastList = document.getElementById('pastList');
        var arrow = document.getElementById('pastArrow');
        if (!toggleBtn || !pastList) return;

        toggleBtn.addEventListener('click', function () {
            var isOpen = pastList.style.display !== 'none';
            pastList.style.display = isOpen ? 'none' : 'block';
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
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
                    .filter(function (s) {
                        var end = parseLocalDate(s.endDate);
                        end.setHours(0, 0, 0, 0);
                        return end >= today && s.status === '모집 중';
                    })
                    .sort(function (a, b) { return parseLocalDate(a.startDate) - parseLocalDate(b.startDate); })
                    .slice(0, 2);

                if (upcoming.length === 0) return;

                var html = '';
                upcoming.forEach(function (s) {
                    var sDate = parseLocalDate(s.startDate);
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

    // ══════════════════════════════════
    //  초기화
    // ══════════════════════════════════
    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('scheduleList')) {
            initFilters();
            initPastToggle();
            initCalendarNav();
            loadScheduleData();
        }
        if (document.getElementById('schedulePreview')) {
            loadHomePreview();
        }
    });

})();
