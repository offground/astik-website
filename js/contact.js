// ===================================
// ASTIK 문의 폼 처리
// ===================================

document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formSuccess = document.getElementById('formSuccess');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // 버튼 로딩 상태
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';

        // Formspree로 전송
        const formData = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(function (response) {
            if (response.ok) {
                // 성공
                form.style.display = 'none';
                formSuccess.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('전송 실패');
            }
        })
        .catch(function (error) {
            alert('문의 전송에 실패했습니다. 이메일(astik@astik.co.kr)로 직접 문의해주세요.');
            submitBtn.disabled = false;
            submitBtn.textContent = '문의하기';
        });
    });

    // 문의 유형 선택에 따른 교육 과정 표시/숨김
    const inquiryType = document.getElementById('inquiry-type');
    const courseGroup = document.getElementById('course').closest('.form-group');

    if (inquiryType && courseGroup) {
        inquiryType.addEventListener('change', function () {
            if (this.value === '기타 문의') {
                courseGroup.style.display = 'none';
            } else {
                courseGroup.style.display = 'block';
            }
        });
    }

});
