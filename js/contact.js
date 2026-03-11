/* 연락처 자동 하이픈 */
function formatPhone(input) {
    var num = input.value.replace(/[^0-9]/g, '');

    if (num.length <= 3) {
        input.value = num;
    } else if (num.substring(0, 2) === '02') {
        // 서울 02
        if (num.length <= 5) {
            input.value = num.substring(0, 2) + '-' + num.substring(2);
        } else if (num.length <= 9) {
            input.value = num.substring(0, 2) + '-' + num.substring(2, 5) + '-' + num.substring(5);
        } else {
            input.value = num.substring(0, 2) + '-' + num.substring(2, 6) + '-' + num.substring(6, 10);
        }
    } else {
        // 010, 031 등
        if (num.length <= 7) {
            input.value = num.substring(0, 3) + '-' + num.substring(3);
        } else if (num.length <= 10) {
            input.value = num.substring(0, 3) + '-' + num.substring(3, 6) + '-' + num.substring(6);
        } else {
            input.value = num.substring(0, 3) + '-' + num.substring(3, 7) + '-' + num.substring(7, 11);
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
            formSuccess.style.display = 'block';
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
