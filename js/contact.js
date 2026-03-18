/* 연락처 자동 하이픈 */
function formatPhone(input) {
    var num = input.value.replace(/[^0-9]/g, '');

    if (num.length <= 3) {
        input.value = num;
    } else if (num.substring(0, 2) === '02') {
        if (num.length <= 5) {
            input.value = num.substring(0, 2) + '-' + num.substring(2);
        } else if (num.length <= 9) {
            input.value = num.substring(0, 2) + '-' + num.substring(2, 5) + '-' + num.substring(5);
        } else {
            input.value = num.substring(0, 2) + '-' + num.substring(2, 6) + '-' + num.substring(6, 10);
        }
    } else {
        if (num.length <= 7) {
            input.value = num.substring(0, 3) + '-' + num.substring(3);
        } else if (num.length <= 11) {
            input.value = num.substring(0, 3) + '-' + num.substring(3, 7) + '-' + num.substring(7);
        } else {
            input.value = num.substring(0, 4) + '-' + num.substring(4, 8) + '-' + num.substring(8, 12);
        }
    }
}


/* 이메일 도메인 선택 */
function selectEmailDomain(select) {
    var domainInput = document.getElementById('emailDomain');
    if (select.value === '') {
        domainInput.value = '';
        domainInput.readOnly = false;
        domainInput.focus();
    } else {
        domainInput.value = select.value;
        domainInput.readOnly = true;
    }
    updateEmailHidden();
}

function updateEmailHidden() {
    var id = document.getElementById('emailId').value.trim();
    var domain = document.getElementById('emailDomain').value.trim();
    document.getElementById('email').value = (id && domain) ? id + '@' + domain : '';
}

/* 이메일 입력 시 hidden 필드 동기화 */
document.addEventListener('DOMContentLoaded', function() {
    var emailId = document.getElementById('emailId');
    var emailDomain = document.getElementById('emailDomain');
    if (emailId) emailId.addEventListener('input', updateEmailHidden);
    if (emailDomain) emailDomain.addEventListener('input', updateEmailHidden);
});

// ===================================
// 다국어 검증 메시지
// ===================================

function getValidationMessages() {
    var lang = document.documentElement.lang || 'ko';

    if (lang === 'en') {
        return {
            name: 'Please enter your name.',
            phone: 'Please enter a valid phone number.',
            email: 'Please enter a valid email address.',
            sending: 'Sending...',
            submit: 'Contact Us',
            fail: 'Failed to send. Please contact us directly at astik@astik.co.kr'
        };
    } else if (lang === 'ja') {
        return {
            name: 'お名前を入力してください。',
            phone: '正しい電話番号を入力してください。',
            email: '正しいメールアドレスを入力してください。',
            sending: '送信中...',
            submit: 'お問い合わせ',
            fail: '送信に失敗しました。メール（astik@astik.co.kr）で直接お問い合わせください。'
        };
    } else {
        return {
            name: '이름을 입력해주세요.',
            phone: '올바른 연락처를 입력해주세요.',
            email: '올바른 이메일을 입력해주세요.',
            sending: '전송 중...',
            submit: '문의하기',
            fail: '문의 전송에 실패했습니다. 이메일(astik@astik.co.kr)로 직접 문의해주세요.'
        };
    }
}

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

        var msg = getValidationMessages();

        submitBtn.disabled = true;
        submitBtn.textContent = msg.sending;

        // 입력값 검증
        var nameVal = document.getElementById('name').value.trim();
        var phoneVal = document.getElementById('phone').value;
        var emailVal = document.getElementById('email').value;

        if (!nameVal) {
            alert(msg.name);
            submitBtn.disabled = false;
            submitBtn.textContent = msg.submit;
            return;
        }

        if (!/^[0-9\-]+$/.test(phoneVal) || phoneVal.replace(/-/g, '').length < 9) {
            alert(msg.phone);
            submitBtn.disabled = false;
            submitBtn.textContent = msg.submit;
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            alert(msg.email);
            submitBtn.disabled = false;
            submitBtn.textContent = msg.submit;
            return;
        }

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
            if (typeof gtag === 'function') { gtag('event', 'form_submit', { event_category: 'contact', event_label: inquiryType }); }
            contactLayout.style.display = 'none';
            formSuccess.classList.remove('hidden');
            formSuccess.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(function (error) {
            alert(msg.fail);
            submitBtn.disabled = false;
            submitBtn.textContent = msg.submit;
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
