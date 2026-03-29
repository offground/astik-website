// ========================================
// ASTIK 교육 취소 신청 폼
// ========================================

(function() {
    var CANCEL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzO0alO80J3TjanT5rIi7Eg06gv97GPgG6jYxEVkblAXSnzF_pqvzuegLoimoIyKs4D/exec';
    var RECAPTCHA_SITE_KEY = '6Ld_L5EsAAAAAEO3YxVCIWfkk2WJN30jBSSttvNx';

    function containsXSS(str) {
        if (!str) return false;
        var pattern = /<script|<\/script|javascript:|on\w+\s*=|<iframe|<object|<embed|<form|<img\s+.*onerror/i;
        return pattern.test(str);
    }

    function sanitizeInput(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    }

    function formatAmount(input) {
        input.addEventListener('input', function() {
            var val = this.value.replace(/[^\d]/g, '');
            if (val) {
                this.value = Number(val).toLocaleString('ko-KR');
            }
        });
    }

    function numericOnly(input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d]/g, '');
        });
    }

    function init() {
        var form = document.getElementById('cancelForm');
        var submitBtn = document.getElementById('cancelSubmitBtn');
        var successDiv = document.getElementById('cancelSuccess');
        var timestampEl = document.getElementById('cancelTimestamp');

        if (!form) return;

        var amountInput = document.getElementById('cancel-amount');
        if (amountInput) formatAmount(amountInput);

        var accountInput = document.getElementById('cancel-account');
        if (accountInput) numericOnly(accountInput);

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = (document.getElementById('cancel-name').value || '').trim();
            var phone = (document.getElementById('cancel-phone').value || '').trim();
            var email = (document.getElementById('cancel-email').value || '').trim();
            var org = (document.getElementById('cancel-org').value || '').trim();
            var course = (document.getElementById('cancel-course').value || '').trim();
            var startDate = (document.getElementById('cancel-startdate').value || '').trim();
            var amount = (document.getElementById('cancel-amount').value || '').replace(/,/g, '').trim();
            var reason = (document.getElementById('cancel-reason').value || '').trim();

            var bankSelect = document.getElementById('cancel-bank');
            var bank = bankSelect.value === '__direct__'
                ? (document.getElementById('cancel-bank-direct').value || '').trim()
                : bankSelect.value;

            var account = (document.getElementById('cancel-account').value || '').trim();
            var holder = (document.getElementById('cancel-holder').value || '').trim();
            var agree = document.getElementById('cancel-agree').checked;

            if (!name || !phone || !email || !org || !course || !startDate || !amount || !reason || !bank || !account || !holder) {
                alert('필수 항목을 모두 입력해 주세요.');
                return;
            }
            if (!agree) {
                alert('환불 규정 확인에 동의해 주세요.');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('올바른 이메일 형식을 입력해 주세요.');
                return;
            }

            var fields = [name, phone, email, org, course, startDate, amount, reason, bank, account, holder];
            for (var i = 0; i < fields.length; i++) {
                if (containsXSS(fields[i])) {
                    alert('유효하지 않은 입력이 포함되어 있습니다.');
                    return;
                }
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 제출 중...';

            grecaptcha.ready(function() {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'cancel_submit' })
                .then(function(token) {

                    var formData = new FormData();
                    formData.append('name', sanitizeInput(name));
                    formData.append('phone', sanitizeInput(phone));
                    formData.append('email', sanitizeInput(email));
                    formData.append('organization', sanitizeInput(org));
                    formData.append('course', sanitizeInput(course));
                    formData.append('startDate', sanitizeInput(startDate));
                    formData.append('amount', sanitizeInput(amount));
                    formData.append('reason', sanitizeInput(reason));
                    formData.append('bank', sanitizeInput(bank));
                    formData.append('account', sanitizeInput(account));
                    formData.append('holder', sanitizeInput(holder));
                    formData.append('recaptchaToken', token);

                    fetch(CANCEL_SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: formData
                    })
                    .then(function() {
                        form.style.display = 'none';
                        var noticeEl = document.querySelector('.cancel-notice');
                        if (noticeEl) noticeEl.style.display = 'none';
                        successDiv.style.display = 'flex';
                        if (timestampEl) {
                            var now = new Date();
                            var y = now.getFullYear();
                            var m = String(now.getMonth() + 1).padStart(2, '0');
                            var d = String(now.getDate()).padStart(2, '0');
                            var h = String(now.getHours()).padStart(2, '0');
                            var min = String(now.getMinutes()).padStart(2, '0');
                            var s = String(now.getSeconds()).padStart(2, '0');
                            timestampEl.textContent = y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    })
                    .catch(function() {
                        alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
                    });

                })
                .catch(function() {
                    alert('보안 인증에 실패했습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
                });
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
