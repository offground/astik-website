// ========================================
// ASTIK 교육 취소 신청 폼
// ========================================

(function() {
    var CANCEL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqsizssWFYi5yuYlF8YHMESPmLTcRkX8YvkAUD8F58GoWcOG0pvk0kfB4kFVqtO8s3/exec';

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

        // 금액 포맷
        var amountInput = document.getElementById('cancel-amount');
        if (amountInput) formatAmount(amountInput);

        // 계좌번호 숫자만
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

            // 은행명: 직접입력 처리
            var bankSelect = document.getElementById('cancel-bank');
            var bank = bankSelect.value === '__direct__'
                ? (document.getElementById('cancel-bank-direct').value || '').trim()
                : bankSelect.value;

            var account = (document.getElementById('cancel-account').value || '').trim();
            var holder = (document.getElementById('cancel-holder').value || '').trim();
            var agree = document.getElementById('cancel-agree').checked;

            // 필수 체크
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

            // XSS 검사
            var fields = [name, phone, email, org, course, startDate, amount, reason, bank, account, holder];
            for (var i = 0; i < fields.length; i++) {
                if (containsXSS(fields[i])) {
                    alert('유효하지 않은 입력이 포함되어 있습니다.');
                    return;
                }
            }

            // 전송
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 제출 중...';

            var params = new URLSearchParams();
            params.append('name', sanitizeInput(name));
            params.append('phone', sanitizeInput(phone));
            params.append('email', sanitizeInput(email));
            params.append('organization', sanitizeInput(org));
            params.append('course', sanitizeInput(course));
            params.append('startDate', sanitizeInput(startDate));
            params.append('amount', sanitizeInput(amount));
            params.append('reason', sanitizeInput(reason));
            params.append('bank', sanitizeInput(bank));
            params.append('account', sanitizeInput(account));
            params.append('holder', sanitizeInput(holder));

            fetch(CANCEL_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.result === 'success') {
                    form.style.display = 'none';
                    document.querySelector('.cancel-notice').style.display = 'none';
                    successDiv.style.display = 'block';
                    if (timestampEl && data.timestamp) {
                        timestampEl.textContent = data.timestamp;
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    alert(data.message || '오류가 발생했습니다. 다시 시도해 주세요.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
                }
            })
            .catch(function() {
                alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
