// ===================================
// ASTIK 관리자 페이지
// ===================================

(function () {

    // ── 설정 ──
    // 비밀번호를 변경하려면 아래 값만 바꾸세요
    var ADMIN_PASSWORD = '1234';

    var SCHEDULE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';
    var INQUIRY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIirQhHIyUuu49-spRR-yGSYoRxfavdHzCTfyUuj4-hUJ5rt2VPtXvpMvMohArMWkGs7Uq0zij6Nlm/pub?output=csv';

    // 일정 추가용 Apps Script URL
    var SCHEDULE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyowUNnmfJASb9iXhf8XNi95R6Sm_aK0NqClLWVhtIHgMlnzY8NZXkQ41-RDMSfRhnNiw/exec';

    var allInquiries = [];
    var allSchedules = [];

    // ══════════════════════════════════
    //  로그인
    // ══════════════════════════════════
    function initLogin() {
        var form = document.getElementById('loginForm');
        var pwInput = document.getElementById('loginPw');
        var errorEl = document.getElementById('loginError');
        var loginScreen = document.getElementById('loginScreen');
        var adminWrap = document.getElementById('adminWrap');
        var logoutBtn = document.getElementById('logoutBtn');

        if (sessionStorage.getItem('astik_admin') === 'true') {
            loginScreen.classList.add('hidden');
            adminWrap.classList.remove('hidden');
            loadAllData();
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (pwInput.value === ADMIN_PASSWORD) {
                sessionStorage.setItem('astik_admin', 'true');
                loginScreen.classList.add('hidden');
                adminWrap.classList.remove('hidden');
                errorEl.classList.add('hidden');
                loadAllData();
            } else {
                errorEl.classList.remove('hidden');
                pwInput.value = '';
                pwInput.focus();
            }
        });

        logoutBtn.addEventListener('click', function () {
            sessionStorage.removeItem('astik_admin');
            adminWrap.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            pwInput.value = '';
            pwInput.focus();
        });
    }

    // ══════════════════════════════════
    //  탭 전환
    // ══════════════════════════════════
    function initTabs() {
        var tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
                document.getElementById('tab-' + tab.getAttribute('data-tab')).classList.add('active');
            });
        });
    }

    // ══════════════════════════════════
    //  데이터 로드
    // ══════════════════════════════════
    function loadAllData() {
        loadInquiries();
        loadSchedules();
    }

    function parseCSVRows(csvText) {
        var lines = csvText.trim().split('\n');
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            var values = lines[i].split(',').map(function (v) { return v.trim().replace(/^"|"$/g, ''); });
            rows.push(values);
        }
        return rows;
    }

    // ── 문의 데이터 ──
    function loadInquiries() {
        fetch(INQUIRY_CSV_URL)
            .then(function (r) { return r.text(); })
            .then(function (csv) {
                var rows = parseCSVRows(csv);
                allInquiries = rows.map(function (v) {
                    return {
                        datetime: v[0] || '',
                        name: v[1] || '',
                        phone: v[2] || '',
                        email: v[3] || '',
                        organization: v[4] || '',
                        type: v[5] || '',
                        course: v[6] || '',
                        preferredDate: v[7] || '',
                        participants: v[8] || '',
                        message: v[9] || '',
                        replied: v[10] || ''
                    };
                });
                renderDashboard();
                renderInquiries();
            })
            .catch(function () {
                allInquiries = [];
                renderDashboard();
            });
    }

    // ── 일정 데이터 ──
    function loadSchedules() {
        fetch(SCHEDULE_CSV_URL)
            .then(function (r) { return r.text(); })
            .then(function (csv) {
                var rows = parseCSVRows(csv);
                allSchedules = rows.map(function (v) {
                    return {
                        startDate: v[0] || '',
                        endDate: v[1] || '',
                        type: v[2] || '',
                        title: v[3] || '',
                        location: v[4] || '',
                        capacity: v[5] || '',
                        status: v[6] || '',
                        visibility: v[7] || '',
                        note: v[8] || ''
                    };
                });
                renderDashboard();
                renderSchedules();
            })
            .catch(function () {
                allSchedules = [];
                renderDashboard();
            });
    }

    // ══════════════════════════════════
    //  대시보드
    // ══════════════════════════════════
    function renderDashboard() {
        var now = new Date();
        var thisMonth = now.getFullYear() + '-' + pad(now.getMonth() + 1);
        var today = new Date(); today.setHours(0, 0, 0, 0);

        var totalEl = document.getElementById('totalInquiries');
        var monthEl = document.getElementById('monthInquiries');
        if (totalEl) totalEl.textContent = allInquiries.length;

        var monthCount = allInquiries.filter(function (inq) {
            return inq.datetime.indexOf(thisMonth) === 0;
        }).length;
        if (monthEl) monthEl.textContent = monthCount;

        var upcomingEl = document.getElementById('upcomingSchedules');
        var openEl = document.getElementById('openSchedules');

        var upcoming = allSchedules.filter(function (s) {
            if (!s.endDate) return false;
            var end = parseDate(s.endDate); end.setHours(0, 0, 0, 0);
            return end >= today;
        });
        var open = upcoming.filter(function (s) { return s.status === '모집 중'; });

        if (upcomingEl) upcomingEl.textContent = upcoming.length;
        if (openEl) openEl.textContent = open.length;

        renderTypeBars();
        renderRecentInquiries();
    }

    function renderTypeBars() {
        var container = document.getElementById('typeBars');
        if (!container) return;

        var types = {};
        allInquiries.forEach(function (inq) {
            var t = inq.type || '기타';
            types[t] = (types[t] || 0) + 1;
        });

        var total = allInquiries.length || 1;
        var html = '';
        var colors = {
            '교육 문의': '#2563eb',
            '안전장비 구입': '#D94925',
            '기타 문의': '#666666',
            '기타': '#999999'
        };

        Object.keys(types).forEach(function (key) {
            var pct = Math.round((types[key] / total) * 100);
            var color = colors[key] || '#999999';
            html += '<div class="type-bar-item">' +
                '<div class="type-bar-label"><span>' + key + '</span><span>' + types[key] + '건 (' + pct + '%)</span></div>' +
                '<div class="type-bar-track"><div class="type-bar-fill" style="width:' + pct + '%;background-color:' + color + ';"></div></div>' +
                '</div>';
        });

        container.innerHTML = html;
    }

    function renderRecentInquiries() {
        var tbody = document.getElementById('recentInquiries');
        if (!tbody) return;

        var recent = allInquiries.slice().reverse().slice(0, 5);
        var html = '';
        recent.forEach(function (inq) {
            html += '<tr>' +
                '<td>' + inq.datetime + '</td>' +
                '<td>' + inq.name + '</td>' +
                '<td><span class="type-tag">' + inq.type + '</span></td>' +
                '<td>' + inq.organization + '</td>' +
                '<td>' + inq.course + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html || '<tr><td colspan="5" class="empty-cell">문의 내역이 없습니다.</td></tr>';
    }

    // ══════════════════════════════════
    //  연락처 포맷
    // ══════════════════════════════════
    function formatPhoneNumber(raw) {
        if (!raw) return '-';
        var num = raw.replace(/[^0-9]/g, '');
        if (num.length === 10 && num.charAt(0) !== '0') {
            num = '0' + num;
        }
        if (num.length === 11) {
            return num.substring(0, 3) + '-' + num.substring(3, 7) + '-' + num.substring(7);
        }
        if (num.length === 10) {
            if (num.substring(0, 2) === '02') {
                return num.substring(0, 2) + '-' + num.substring(2, 6) + '-' + num.substring(6);
            }
            return num.substring(0, 3) + '-' + num.substring(3, 6) + '-' + num.substring(6);
        }
        if (num.length === 9 && num.substring(0, 2) === '02') {
            return num.substring(0, 2) + '-' + num.substring(2, 5) + '-' + num.substring(5);
        }
        if (num.length === 8) {
            return num.substring(0, 4) + '-' + num.substring(4);
        }
        return raw;
    }

    // ══════════════════════════════════
    //  문의 내역 탭
    // ══════════════════════════════════
    function renderInquiries() {
        var wrap = document.getElementById('allInquiries');
        var countEl = document.getElementById('inquiryCount');
        if (!wrap) return;

        if (countEl) countEl.textContent = allInquiries.length;

        if (allInquiries.length === 0) {
            wrap.innerHTML = '<p class="inquiry-empty">문의 내역이 없습니다.</p>';
            return;
        }

        var readList = JSON.parse(localStorage.getItem('astik_read_inquiries') || '[]');

        var sorted = allInquiries.slice().reverse();
        var html = '';
        sorted.forEach(function (inq) {
            var inqId = btoa(unescape(encodeURIComponent(
                (inq.datetime || '') + '|' + (inq.name || '') + '|' + (inq.email || '') + '|' + (inq.message || '')
            )));
            var isRead = readList.indexOf(inqId) !== -1;
            var phone = formatPhoneNumber(inq.phone);

            html += '<div class="inquiry-item' + (isRead ? ' read' : '') + '" data-inq-id="' + inqId + '">';

            html += '  <div class="inq-summary">';
            html += '    <div class="inq-summary-left">';
            html += '      <span class="inq-unread-dot' + (isRead ? ' hidden' : '') + '"></span>';
            html += '      <span class="inq-summary-type">' + (inq.type || '기타') + '</span>';
            html += '      <span class="inq-summary-name">' + (inq.name || '-') + '</span>';
            html += '      <span class="inq-summary-org">' + (inq.organization || '') + '</span>';
            html += '    </div>';
            html += '    <div class="inq-summary-right">';
            html += '      <span class="inq-summary-date">' + (inq.datetime || '-') + '</span>';
            html += '      <i class="fas fa-chevron-down inq-chevron"></i>';
            html += '    </div>';
            html += '  </div>';

            html += '  <div class="inq-detail">';
            html += '    <div class="inq-detail-grid">';
            html += '      <div class="inq-field"><div class="inq-field-label">이름</div><div class="inq-field-value">' + (inq.name || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">연락처</div><div class="inq-field-value">' + phone + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">이메일</div><div class="inq-field-value">' + (inq.email || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">소속기관</div><div class="inq-field-value">' + (inq.organization || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">문의유형</div><div class="inq-field-value">' + (inq.type || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">희망과정</div><div class="inq-field-value">' + (inq.course || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">희망시작일</div><div class="inq-field-value">' + (inq.preferredDate || '-') + '</div></div>';
            html += '      <div class="inq-field"><div class="inq-field-label">인원</div><div class="inq-field-value">' + (inq.participants || '-') + '</div></div>';
            html += '    </div>';
            if (inq.message) {
                html += '    <div class="inq-message-section">';
                html += '      <div class="inq-field-label">문의내용</div>';
                html += '      <div class="inq-message-box">' + inq.message + '</div>';
                html += '    </div>';
            }
            html += '  </div>';

            html += '</div>';
        });
        wrap.innerHTML = html;

        var items = wrap.querySelectorAll('.inquiry-item');
        items.forEach(function (item) {
            var summary = item.querySelector('.inq-summary');
            summary.addEventListener('click', function () {
                var wasOpen = item.classList.contains('open');
                items.forEach(function (other) { other.classList.remove('open'); });

                if (!wasOpen) {
                    item.classList.add('open');
                    if (!item.classList.contains('read')) {
                        item.classList.add('read');
                        var dot = item.querySelector('.inq-unread-dot');
                        if (dot) dot.classList.add('hidden');
                        var id = item.getAttribute('data-inq-id');
                        var stored = JSON.parse(localStorage.getItem('astik_read_inquiries') || '[]');
                        if (stored.indexOf(id) === -1) {
                            stored.push(id);
                            localStorage.setItem('astik_read_inquiries', JSON.stringify(stored));
                        }
                    }
                }
            });
        });
    }

    // ══════════════════════════════════
    //  일정 관리 탭
    // ══════════════════════════════════
    function renderSchedules() {
        var tbody = document.getElementById('allSchedules');
        var countEl = document.getElementById('scheduleCount');
        if (!tbody) return;

        if (countEl) countEl.textContent = allSchedules.length;

        var sorted = allSchedules.slice().sort(function (a, b) {
            return a.startDate > b.startDate ? -1 : 1;
        });

        var html = '';
        sorted.forEach(function (s) {
            var visClass = s.visibility === '비공개' ? ' row-private' : '';
            html += '<tr class="' + visClass + '">' +
                '<td>' + s.startDate + '</td>' +
                '<td>' + s.endDate + '</td>' +
                '<td><span class="schedule-type-tag tag-' + s.type + '">' + s.type + '</span></td>' +
                '<td>' + s.title + '</td>' +
                '<td>' + s.location + '</td>' +
                '<td>' + s.status + '</td>' +
                '<td>' + s.visibility + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html || '<tr><td colspan="7" class="empty-cell">일정이 없습니다.</td></tr>';
    }

    // ══════════════════════════════════
    //  일정 추가
    // ══════════════════════════════════
    function initScheduleForm() {
        var form = document.getElementById('addScheduleForm');
        var btn = document.getElementById('addSchBtn');

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!SCHEDULE_SCRIPT_URL) {
                alert('일정 추가 기능을 사용하려면 Apps Script URL을 설정해야 합니다.\nadmin.js 상단의 SCHEDULE_SCRIPT_URL을 입력해주세요.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 추가 중...';

            var data = {
                startDate: document.getElementById('schStartDate').value,
                endDate: document.getElementById('schEndDate').value,
                type: document.getElementById('schType').value,
                title: document.getElementById('schTitle').value,
                location: document.getElementById('schLocation').value,
                capacity: document.getElementById('schCapacity').value,
                status: document.getElementById('schStatus').value,
                visibility: document.getElementById('schVisibility').value,
                note: document.getElementById('schNote').value
            };

            fetch(SCHEDULE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(function () {
                alert('일정이 추가되었습니다. 시트 반영까지 1~2분 소요될 수 있습니다.');
                form.reset();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> 일정 추가';
                setTimeout(loadSchedules, 3000);
            })
            .catch(function () {
                alert('일정 추가에 실패했습니다. 다시 시도해주세요.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> 일정 추가';
            });
        });
    }

    // ── 유틸 ──
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function parseDate(str) {
        if (!str) return new Date(0);
        var parts = str.split('-');
        if (parts.length === 3) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return new Date(str);
    }

    // ══════════════════════════════════
    //  초기화
    // ══════════════════════════════════
    document.addEventListener('DOMContentLoaded', function () {
        initLogin();
        initTabs();
        initScheduleForm();
    });

})();
