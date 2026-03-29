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
// XSS 방어 — 입력값 검증
// ===================================

function containsXSS(value) {
    if (!value) return false;
    var patterns = [
        /<script/i,
        /<\/script/i,
        /javascript\s*:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /<img[^>]+onerror/i,
        /<svg[^>]+onload/i,
        /eval\s*\(/i,
        /document\s*\.\s*cookie/i,
        /document\s*\.\s*location/i,
        /window\s*\.\s*location/i,
        /<link[^>]+rel\s*=\s*["']?import/i
    ];
    for (var i = 0; i < patterns.length; i++) {
        if (patterns[i].test(value)) return true;
    }
    return false;
}

function sanitizeInput(value) {
    if (!value) return '';
    return String(value)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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
            xss: 'Invalid characters detected. Please remove special characters like < > and try again.',
            sending: 'Sending...',
            submit: 'Contact Us',
            fail: 'Failed to send. Please contact us directly at astik@astik.co.kr'
        };
    } else if (lang === 'ja') {
        return {
            name: 'お名前を入力してください。',
            phone: '正しい電話番号を入力してください。',
            email: '正しいメールアドレスを入力してください。',
            xss: '無効な文字が検出されました。< > などの特殊文字を削除してもう一度お試しください。',
            sending: '送信中...',
            submit: 'お問い合わせ',
            fail: '送信に失敗しました。メール（astik@astik.co.kr）で直接お問い合わせください。'
        };
    } else {
        return {
            name: '이름을 입력해주세요.',
            phone: '올바른 연락처를 입력해주세요.',
            email: '올바른 이메일을 입력해주세요.',
            xss: '허용되지 않는 문자가 포함되어 있습니다. < > 등의 특수문자를 제거하고 다시 시도해주세요.',
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

        // 입력값 수집
        var nameVal = document.getElementById('name').value.trim();
        var phoneVal = document.getElementById('phone').value;
        var emailVal = document.getElementById('email').value;
        var orgVal = document.getElementById('organization').value;
        var messageVal = document.getElementById('message').value;
        var courseVal = document.getElementById('course').value;
        var dateVal = document.getElementById('preferred-date').value;
        var partVal = document.getElementById('participants').value;

        // 필수 입력 검증
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

        // XSS 검사 — 모든 텍스트 필드 확인
        var emailIdVal = document.getElementById('emailId').value;
        var emailDomainVal = document.getElementById('emailDomain').value;
        var fieldsToCheck = [nameVal, orgVal, messageVal, courseVal, dateVal, partVal, emailVal, emailIdVal, emailDomainVal];
        var hasXSS = false;
        for (var i = 0; i < fieldsToCheck.length; i++) {
            if (containsXSS(fieldsToCheck[i])) {
                hasXSS = true;
                break;
            }
        }

        if (hasXSS) {
            alert(msg.xss);
            submitBtn.disabled = false;
            submitBtn.textContent = msg.submit;
            return;
        }

        var inquiryType = document.getElementById('inquiry-type').value;

        grecaptcha.ready(function() {
            grecaptcha.execute('6Ld_L5EsAAAAAEO3YxVCIWfkk2WJN30jBSSttvNx', { action: 'contact_submit' })
            .then(function(token) {

                var formData = {
                    name: sanitizeInput(nameVal),
                    phone: phoneVal,
                    email: emailVal,
                    organization: sanitizeInput(orgVal),
                    inquiry_type: inquiryType,
                    course: sanitizeInput(courseVal),
                    preferred_date: sanitizeInput(dateVal),
                    participants: sanitizeInput(partVal),
                    message: sanitizeInput(messageVal),
                    subject: '[ASTIK 문의] ' + inquiryType,
                    recaptcha_token: token
                };

                fetch(form.action, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: JSON.stringify(formData)
                })
                .then(function() {
    if (typeof gtag === 'function') { gtag('event', 'form_submit', { event_category: 'contact', event_label: inquiryType }); }
    contactLayout.style.display = 'none';

    // 접수 시점 표시
    var tsEl = document.getElementById('contactTimestamp');
    if (tsEl) {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, '0');
        var d = String(now.getDate()).padStart(2, '0');
        var h = String(now.getHours()).padStart(2, '0');
        var min = String(now.getMinutes()).padStart(2, '0');
        var s = String(now.getSeconds()).padStart(2, '0');
        tsEl.textContent = y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
    }

    formSuccess.classList.remove('hidden');
    formSuccess.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
})
                .catch(function(error) {
                    alert(msg.fail);
                    submitBtn.disabled = false;
                    submitBtn.textContent = msg.submit;
                });

            }).catch(function() {
                alert(msg.fail);
                submitBtn.disabled = false;
                submitBtn.textContent = msg.submit;
            });
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
