// ===================================
// ASTIK 문의 폼 - 구글 시트 연동
// ===================================

document.addEventListener('DOMContentLoaded', function () {

    var form = document.getElementById('contactForm');
    var submitBtn = document.getElementById('submitBtn');
    var formSuccess = document.getElementById('formSuccess');
    var contactLayout = document.querySelector('.contact-layout');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';

        var inquiryType = document.getElementById('inquiry-type').value;

        var formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            organization: document.getElementById('organization').value,
            inquiry_type: inquiryType,
            course: document.getElementById('course').value,
            preferred_date: document.getElementById('preferred-date').value,
            participants: document.getElementById('participants').value,
            message: document.getElementById('message').value,
            subject: '[ASTIK 문의] ' + inquiryType
        };

        fetch(form.action, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(function () {
            contactLayout.style.display = 'none';
            formSuccess.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(function (error) {
            alert('문의 전송에 실패했습니다. 이메일(astik@astik.co.kr)로 직접 문의해주세요.');
            submitBtn.disabled = false;
            submitBtn.textContent = '문의하기';
        });
    });

    var inquirySelect = document.getElementById('inquiry-type');
    var courseGroup = document.getElementById('course').closest('.form-group');

if (inquirySelect && courseGroup) {
    inquirySelect.addEventListener('change', function () {
        if (this.value === '안전장비 구입' || this.value === '기타 문의') {
            courseGroup.style.display = 'none';
        } else {
            courseGroup.style.display = 'block';
        }
    });
}


});
