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
