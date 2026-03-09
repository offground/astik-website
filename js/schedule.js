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
    //  공휴일
    // ══════════════════════════════════
    var fixedHolidays = {
        '01-01': '신정', '03-01': '삼일절', '05-05': '어린이날',
        '06-06': '현충일', '07-17': '제헌절', '08-15': '광복절',
        '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절'
    };

    var lunarHolidays = {
        2025: [
            { date: '01-28', name: '설날 연휴' }, { date: '01-29', name: '설날' },
            { date: '01-30', name: '설날 연휴' }, { date: '05-05', name: '부처님오신날' },
            { date: '10-05', name: '추석 연휴' }, { date: '10-06', name: '추석' },
            { date: '10-07', name: '추석 연휴' }
        ],
        2026: [
            { date: '02-16', name: '설날 연휴' }, { date: '02-17', name: '설날' },
            { date: '02-18', name: '설날 연휴' }, { date: '05-24', name: '부처님오신날' },
            { date: '09-24', name: '추석 연휴' }, { date: '09-25', name: '추석' },
            { date: '09-26', name: '추석 연휴' }
        ],
        2027: [
            { date: '02-06', name: '설날 연휴' }, { date: '02-07', name: '설날' },
            { date: '02-08', name: '설날 연휴' }, { date: '05-13', name: '부처님오신날' },
            { date: '10-14', name: '추석 연휴' }, { date: '10-15', name: '추석' },
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
        2026: [{ date: '06-03', name: '지방선거일' }]
    };

    function getHolidayName(year, mm, dd) {
        var mmdd = mm + '-' + dd;
        if (fixedHolidays[mmdd]) return fixedHolidays[mmdd];
        var lists = [lunarHolidays, substituteHolidays, temporaryHolidays];
        for (var li = 0; li < lists.length; li++) {
            if (lists[li][year]) {
                for (var i = 0; i < lists[li][year].length; i++) {
                    if (lists[li][year][i].date === mmdd) return lists[li][year][i].name;
                }
            }
        }
        return null;
    }

    // ── 유틸 ──
    function parseLocalDate(str) {
        if (!str) return null;
        str = str.trim();
        var parts = str.split('-');
        if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        parts = str.split('.');
        if (parts.length >= 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return new Date(str);
    }

    function parseCSV(csvText) {
        var lines = csvText.trim().split('\n');
        var data = [];
        for (var i = 1; i < lines.length; i++) {
            var values = lines[i].split(',').map(function (v) { return v.trim().replace(/^"|"$/g, ''); });
            if (values.length >= 6 && values[0]) {
                data.push({
                    startDate: values[0].trim(), endDate: values[1].trim(),
                    course: values[2].trim(), location: values[3].trim(),
                    capacity: values[4].trim(), status: values[5].trim(),
                    note: (values[6] || '').trim()
                });
            }
        }
        return data;
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatDateRange(start, end) {
        var s = parseLocalDate(start), e = parseLocalDate(end);
        var sM = s.getMonth() + 1, sD = s.getDate(), eM = e.getMonth() + 1, eD = e.getDate();
        if (sM === eM && sD === eD) return sM + '월 ' + sD + '일';
        if (sM === eM) return sM + '월 ' + sD + '일 - ' + eD + '일';
        return sM + '월 ' + sD + '일 - ' + eM + '월 ' + eD + '일';
    }

    function getDayCount(start, end) {
        var s = parseLocalDate(start), e = parseLocalDate(end);
        return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }

    function formatDateFull(dateStr) {
        var d = parseLocalDate(dateStr);
        var wd = ['일', '월', '화', '수', '목', '금', '토'];
        return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '(' + wd[d.getDay()] + ')';
    }

    function isDateInRange(year, month, day, startStr, endStr) {
        var check = new Date(year, month, day); check.setHours(0, 0, 0, 0);
        var s = parseLocalDate(startStr); s.setHours(0, 0, 0, 0);
        var e = parseLocalDate(endStr); e.setHours(0, 0, 0, 0);
        return check >= s && check <= e;
    }

    function isSameLocalDate(year, month, day, dateStr) {
        var d = parseLocalDate(dateStr); d.setHours(0, 0, 0, 0);
        var c = new Date(year, month, day); c.setHours(0, 0, 0, 0);
        return d.getTime() === c.getTime();
    }

    // ══════════════════════════════════
    //  달력 렌더링 (이전달/다음달 포함)
    // ══════════════════════════════════
    function renderCalendar() {
        var titleEl = document.getElementById('calTitle');
        var bodyEl = document.getElementById('calBody');
        if (!titleEl || !bodyEl) return;

        titleEl.textContent = currentYear + '년 ' + (currentMonth + 1) + '월';

        var firstDay = new Date(currentYear, currentMonth, 1).getDay();
        var lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
        var today = new Date(); today.setHours(0, 0, 0, 0);

        // 이전달 마지막 날짜
        var prevLastDate = new Date(currentYear, currentMonth, 0).getDate();

        // ★ 변경: 해당 월에 필요한 줄 수만큼만 (4~6줄 자동 계산)
        var rowCount = Math.ceil((firstDay + lastDate) / 7);
        var totalCells = rowCount * 7;

        var html = '';

        for (var cell = 0; cell < totalCells; cell++) {
            var dayNum, cellYear, cellMonth, isOtherMonth;

            if (cell < firstDay) {
                // 이전달
                dayNum = prevLastDate - firstDay + cell + 1;
                var prevDate = new Date(currentYear, currentMonth - 1, dayNum);
                cellYear = prevDate.getFullYear();
                cellMonth = prevDate.getMonth();
                isOtherMonth = true;
            } else if (cell - firstDay >= lastDate) {
                // 다음달
                dayNum = cell - firstDay - lastDate + 1;
                var nextDate = new Date(currentYear, currentMonth + 1, dayNum);
                cellYear = nextDate.getFullYear();
                cellMonth = nextDate.getMonth();
                isOtherMonth = true;
            } else {
                // 당월
                dayNum = cell - firstDay + 1;
                cellYear = currentYear;
                cellMonth = currentMonth;
                isOtherMonth = false;
            }

            var mm = pad(cellMonth + 1);
            var dd = pad(dayNum);
            var dayOfWeek = new Date(cellYear, cellMonth, dayNum).getDay();
            var cellDate = new Date(cellYear, cellMonth, dayNum); cellDate.setHours(0, 0, 0, 0);
            var isToday = (cellDate.getTime() === today.getTime());
            var holidayName = getHolidayName(cellYear, mm, dd);

            var cellClass = 'cal-cell';
            if (isOtherMonth) cellClass += ' other-month';
            if (isToday) cellClass += ' today';
            if (holidayName || dayOfWeek === 0) { cellClass += ' cal-holiday'; }
            else if (dayOfWeek === 6) { cellClass += ' cal-saturday-cell'; }

            // 교육 일정 찾기
            var daySchedules = [];
            for (var si = 0; si < allSchedules.length; si++) {
                if (isDateInRange(cellYear, cellMonth, dayNum, allSchedules[si].startDate, allSchedules[si].endDate)) {
                    daySchedules.push(allSchedules[si]);
                }
            }

            var eventHTML = '';
            if (daySchedules.length > 0) {
                cellClass += ' has-event';
                for (var ei = 0; ei < daySchedules.length; ei++) {
                    var ev = daySchedules[ei];
                    var evClass = ev.status === '모집 중' ? 'cal-event-open' : 'cal-event-closed';

                    var isStart = isSameLocalDate(cellYear, cellMonth, dayNum, ev.startDate);
                    var isEnd = isSameLocalDate(cellYear, cellMonth, dayNum, ev.endDate);
                    var isSingle = (isStart && isEnd);
                    var isRowEnd = (dayOfWeek === 6);
                    var isRowStart = (dayOfWeek === 0);

                    var posClass = '';
                    if (isSingle) { posClass = ' cal-ev-single'; }
                    else if (isStart || isRowStart) { posClass = ' cal-ev-start'; }
                    else if (isEnd || isRowEnd) { posClass = ' cal-ev-end'; }
                    else { posClass = ' cal-ev-mid'; }

                    var label = (isStart || isRowStart) ? ev.course : '';

                    eventHTML += '<span class="cal-event-label ' + evClass + posClass + '" title="' + ev.course + ' (' + ev.status + ')">' + label + '</span>';
                }
            }

            var dateStr = cellYear + '-' + mm + '-' + dd;
            var titleAttr = holidayName ? ' title="' + holidayName + '"' : '';

            html += '<div class="' + cellClass + '" data-date="' + dateStr + '"' + titleAttr + '>' +
                '<span class="cal-date-num">' + dayNum + '</span>' +
                '<div class="cal-events">' + eventHTML + '</div>' +
                '</div>';
        }

        bodyEl.innerHTML = html;

        // 클릭 이벤트
        var cells = bodyEl.querySelectorAll('.cal-cell.has-event');
        for (var ci = 0; ci < cells.length; ci++) {
            (function (c) {
                c.addEventListener('click', function () {
                    scrollToSchedule(c.getAttribute('data-date'));
                });
            })(cells[ci]);
        }
    }

    function scrollToSchedule(dateStr) {
        var items = document.querySelectorAll('.sch-item');
        var parts = dateStr.split('-');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (isDateInRange(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), item.getAttribute('data-start'), item.getAttribute('data-end'))) {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.classList.add('highlight');
                (function (el) { setTimeout(function () { el.classList.remove('highlight'); }, 2000); })(item);
                break;
            }
        }
    }

    // ══════════════════════════════════
    //  일정 카드 HTML
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
                statusClass = 'status-done'; statusIcon = 'fa-circle-check'; statusText = '완료';
            } else if (s.status === '모집 중') {
                statusClass = 'status-open'; statusIcon = 'fa-circle-check'; statusText = '모집 중';
            } else {
                statusClass = 'status-closed'; statusIcon = 'fa-circle-xmark'; statusText = '마감';
            }

            html += '<div class="sch-item' + (isPast ? ' sch-past' : '') + '" data-start="' + s.startDate + '" data-end="' + s.endDate + '" data-status="' + s.status + '">' +
                '<div class="sch-date"><span class="sch-month">' + startMonth + '월</span><span class="sch-day">' + startDay + '</span></div>' +
                '<div class="sch-content">' +
                '<div class="sch-top"><h4 class="sch-course">' + s.course + '</h4>' +
                '<span class="sch-status ' + statusClass + '"><i class="fas ' + statusIcon + '"></i> ' + statusText + '</span></div>' +
                '<div class="sch-meta">' +
                '<span><i class="fas fa-calendar-days"></i> ' + dateRange + ' (' + days + '일)</span>' +
                '<span><i class="fas fa-location-dot"></i> ' + s.location + '</span>' +
                '<span><i class="fas fa-users"></i> ' + s.capacity + '</span></div>' +
                (s.note ? '<p class="sch-note">' + s.note + '</p>' : '') +
                '</div>' +
                (!isPast && s.status === '모집 중' ? '<div class="sch-action"><a href="contact.html" class="btn btn-primary btn-sm">신청 문의</a></div>' : '') +
                '</div>';
        });
        return html;
    }

    // ══════════════════════════════════
    //  리스트 (예정 + 지난)
    // ══════════════════════════════════
    function renderScheduleList() {
        var listEl = document.getElementById('scheduleList');
        var emptyEl = document.getElementById('emptyState');
        var listTitleEl = document.getElementById('listTitle');
        var pastSection = document.getElementById('pastSection');
        var pastList = document.getElementById('pastList');
        if (!listEl) return;

        var today = new Date(); today.setHours(0, 0, 0, 0);

        var upcoming = allSchedules.filter(function (s) {
            var end = parseLocalDate(s.endDate); end.setHours(0, 0, 0, 0);
            return end >= today;
        });
        var past = allSchedules.filter(function (s) {
            var end = parseLocalDate(s.endDate); end.setHours(0, 0, 0, 0);
            return end < today;
        });

        if (currentFilter !== 'all') {
            upcoming = upcoming.filter(function (s) { return s.status === currentFilter; });
        }

        upcoming.sort(function (a, b) { return parseLocalDate(a.startDate) - parseLocalDate(b.startDate); });
        past.sort(function (a, b) { return parseLocalDate(b.startDate) - parseLocalDate(a.startDate); });

        if (upcoming.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (listTitleEl) listTitleEl.style.display = 'none';
        } else {
            if (emptyEl) emptyEl.classList.add('hidden');
            if (listTitleEl) listTitleEl.style.display = 'block';
            listEl.innerHTML = buildScheduleHTML(upcoming, false);
        }

        if (pastSection && pastList) {
            if (past.length > 0) {
                pastSection.style.display = 'block';
                pastList.innerHTML = buildScheduleHTML(past, true);
            } else {
                pastSection.style.display = 'none';
            }
        }
    }

    function initFilters() {
        var btns = document.querySelectorAll('.filter-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                renderScheduleList();
            });
        });
    }

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

    function loadScheduleData() {
        fetch(SHEET_CSV_URL)
            .then(function (r) { return r.text(); })
            .then(function (csv) {
                allSchedules = parseCSV(csv);
                renderCalendar();
                renderScheduleList();
            })
            .catch(function (err) {
                console.error('일정 로드 실패:', err);
                allSchedules = [];
                renderCalendar();
                renderScheduleList();
            });
    }

    function loadHomePreview() {
        var previewEl = document.getElementById('schedulePreview');
        if (!previewEl || document.getElementById('scheduleList')) return;
        fetch(SHEET_CSV_URL)
            .then(function (r) { return r.text(); })
            .then(function (csv) {
                var schedules = parseCSV(csv);
                var today = new Date(); today.setHours(0, 0, 0, 0);
                var upcoming = schedules
                    .filter(function (s) { var e = parseLocalDate(s.endDate); e.setHours(0, 0, 0, 0); return e >= today && s.status === '모집 중'; })
                    .sort(function (a, b) { return parseLocalDate(a.startDate) - parseLocalDate(b.startDate); })
                    .slice(0, 2);
                if (upcoming.length === 0) return;
                var html = '';
                upcoming.forEach(function (s) {
                    var sDate = parseLocalDate(s.startDate);
                    html += '<div class="schedule-item"><div class="schedule-date"><span class="month">' + (sDate.getMonth() + 1) + '월</span><span class="day">' + sDate.getDate() + '</span></div><div class="schedule-info"><h4>' + s.course + '</h4><p>' + formatDateRange(s.startDate, s.endDate) + ' · ' + s.location + '</p></div></div>';
                });
                previewEl.innerHTML = html;
            })
            .catch(function () { });
    }

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
