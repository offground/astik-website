// ========================================
// ASTIK 교육 취소 신청 폼
// ========================================

(function() {
    'use strict';

    var CANCEL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqsizssWFYi5yuYlF8YHMESPmLTcRkX8YvkAUD8F58GoWcOG0pvk0kfB4kFVqtO8s3/exec';

    // XSS 검사
    function containsXSS(str) {
        if (!str) return false;
        var xssPattern = /<script|<\/script|javascript:|on\w+\s*=|<iframe|<object|<embed|<form|<img\s+.*onerror/i;
        return xssPattern.test(str);
    }

    // 입력값 정리
    function sanitizeInput(str) {
        if (!str) return '';
        return str.replace(/[<>"'&]/g, function(match) {
            var map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
            return map[match];
        });
    }

    // 금액 포맷 (콤마 자동 입력)
    function formatAmount(input) {
        input.addEventListener('input', function() {
            var value = this.value.replace(/[^\d]/g, '');
            if (value) {
                this.value = Number(value).toLocaleString('ko-KR');
            }
        });
    }

    // 계좌번호 숫자만 허용
    function numericOnly(input) {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d]/g, '');
        });
    }

    // 폼 초기화
    function init() {
        var form = document.getElementById('cancelForm');
        var submitBtn = document.getElementById('cancelSubmitBtn');
        var amountInput = document.getElementById('cancel-amount');
        var accountInput = document.getElementById('cancel-account');

        if (!form) return;

        // 금액 콤마 자동 입력
        formatAmount(amountInput);

        // 계좌번호 숫자만
        numericOnly(accountInput);

        // 폼 제출
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // 동의 체크 확인
            var agreeBox = document.getElementById('cancel-agree');
            if (!agreeBox.checked) {
                alert('환불 규정 적용에 동의해 주세요.');
                agreeBox.focus();
                return;
            }

            // 입력값 수집
            var fields = {
                name: document.getElementById('cancel-name').value.trim(),
                phone: document.getElementById('cancel-phone').value.trim(),
                email: document.getElementById('cancel-email').value.trim(),
                organization: document.getElementById('cancel-org').value.trim(),
                course: document.getElementById('cancel-course').value,
                startDate: document.getElementById('cancel-startdate').value,
                amount: amountInput.value.replace(/,/g, ''),
                reason: document.getElementById('cancel-reason').value.trim(),
                bank: document.getElementById('cancel-bank').value,
                account: accountInput.value.trim(),
                holder: document.getElementById('cancel-holder').value.trim()
            };

            // 필수값 검증
            for (var key in fields) {
                if (!fields[key]) {
                    alert('모든 필수 항목을 입력해 주세요.');
                    return;
                }
            }

            // 이메일 형식 검증
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fields.email)) {
                alert('올바른 이메일 형식을 입력해 주세요.');
                document.getElementById('cancel-email').focus();
                return;
            }

            // XSS 검사
            for (var key in fields) {
                if (containsXSS(fields[key])) {
                    alert('유효하지 않은 입력이 포함되어 있습니다.');
                    return;
                }
            }

            // 제출 버튼 비활성화
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 접수 중...';

            // 데이터 전송
            var formData = new URLSearchParams();
            for (var key in fields) {
                formData.append(key, sanitizeInput(fields[key]));
            }

            fetch(CANCEL_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.result === 'success') {
                    // 폼 숨기고 완료 메시지 표시
                    form.style.display = 'none';
                    document.querySelector('.cancel-notice').style.display = 'none';

                    var successDiv = document.getElementById('cancelSuccess');
                    var timestampEl = document.getElementById('cancelTimestamp');
                    timestampEl.textContent = data.timestamp;
                    successDiv.style.display = 'block';

                    // 상단으로 스크롤
                    successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    alert(data.message || '오류가 발생했습니다. 다시 시도해 주세요.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
                }
            })
            .catch(function(error) {
                alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 취소 신청하기';
            });
        });
    }

    // DOM 로드 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
