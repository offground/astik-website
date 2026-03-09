// ===================================
// ASTIK 교육일정 - 구글 시트 연동
// (2026-03-09 최종 업데이트)
// ===================================

(function () {

    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?output=csv';

    // ── 전역 변수 ──
    let allSchedules = [];
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentFilter = 'all';

    // ══════════════════════════════════
    //  공휴일 데이터
    // ══════════════════════════════════

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

    // 대체공휴일 (연도별)
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

    // 임시공휴일 (선거일 등)
    const temporaryHolidays = {
        2026: [
            { date: '06-03', name: '지방선거일' }
        ]
    };

    // ── 공휴일 판별 ──
    function getHolidayName(year, mm, dd) {
        var mmdd
