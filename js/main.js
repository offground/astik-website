// ══════════════════════════════════
//  사이트 설정 (메뉴 on/off)
// ══════════════════════════════════
(function() {
    var SETTINGS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQuHxjOjTjIBT2YBW74MLhS_oCcMAxnFw5XRX0ohcrwJhbjMVqmXiUUtpTQbZ9DcTRMvYEdgoyu8_cT/pub?gid=342543323&single=true&output=csv';

    fetch(SETTINGS_CSV_URL)
        .then(function(r) { return r.text(); })
        .then(function(csv) {
            var settings = {};
            var lines = csv.trim().split('\n');
            for (var i = 1; i < lines.length; i++) {
                var parts = lines[i].split(',');
                if (parts.length >= 2) {
                    settings[parts[0].trim()] = parts[1].trim();
                }
            }

            // 교육일정 메뉴 숨기기
            if (settings['교육일정메뉴'] === '숨김') {
                // PC 메뉴
                var gnbLinks = document.querySelectorAll('.gnb-link');
                gnbLinks.forEach(function(link) {
                    if (link.getAttribute('href') === 'schedule.html') {
                        link.parentElement.style.display = 'none';
                    }
                });
                // 모바일 메뉴
                var mobileLinks = document.querySelectorAll('.mobile-link');
                mobileLinks.forEach(function(link) {
                    if (link.getAttribute('href') === 'schedule.html') {
                        link.parentElement.style.display = 'none';
                    }
                });
            }

            // 홈 교육일정 + CTA 섹션 숨기기
            if (settings['홈교육일정'] === '숨김') {
                var schedulePreview = document.querySelector('.schedule-preview');
                var ctaSection = document.querySelector('.cta-section');
                if (schedulePreview) schedulePreview.style.display = 'none';
                if (ctaSection) ctaSection.style.display = 'none';
            }

            // 교육일정 페이지 일정 목록 숨기기
            if (settings['일정목록'] === '숨김') {
                var filters = document.querySelector('.schedule-filters');
                var listSections = document.querySelectorAll('.schedule-list-section');
                var pastSection = document.querySelector('.past-schedule-section');
                var emptyState = document.querySelector('.schedule-empty-state');
                if (filters) filters.style.display = 'none';
                listSections.forEach(function(s) { s.style.display = 'none'; });
                if (pastSection) pastSection.style.display = 'none';
                if (emptyState) emptyState.style.display = 'none';
            }
        })
        .catch(function() {
            // 설정 로드 실패 시 기본값(모두 보임) 유지
        });
})();

// ===================================
// ASTIK 한국모험안전기술원 - Main JS
// ===================================

document.addEventListener('DOMContentLoaded', function () {

    // ---------- 모바일 햄버거 메뉴 ----------
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // 메뉴 링크 클릭 시 닫기
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }

    // ---------- 헤더 스크롤 효과 ----------
    const header = document.getElementById('header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ---------- 스크롤 애니메이션 (Fade In) ----------
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 애니메이션 대상 요소들
    const animateElements = document.querySelectorAll(
        '.service-card, .trust-item, .stat-item, .section-title, .section-desc'
    );

    animateElements.forEach(function (el) {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // ---------- 교육일정 미리보기 (구글 시트 연동용) ----------
    // 나중에 구글 스프레드시트 API 연동 시 이 함수를 사용합니다
    // 지금은 빈 상태로 두고, 스케줄 페이지에서 본격 구현합니다

    /*
    function loadSchedulePreview() {
        const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
        const API_KEY = 'YOUR_API_KEY';
        const RANGE = 'Sheet1!A2:E';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // 스케줄 데이터 렌더링
            })
            .catch(error => {
                console.log('Schedule load error:', error);
            });
    }
    */

});
