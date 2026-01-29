(function () {
    const form = document.getElementById('qrForm');
    let info = document.getElementById('info');
    const result = document.getElementById('result');

    // создаём контейнер info если его нет
    if (!info && form && form.parentNode) {
        info = document.createElement('div');
        info.id = 'info';
        info.className = 'alert d-none';
        info.setAttribute('role', 'alert');
        form.parentNode.insertBefore(info, form);
    }

    function clearResult() {
        if (result) result.innerHTML = '';
    }

    function showError(text) {
        if (!info) return console.error(text);
        info.classList.remove('d-none', 'alert-success');
        info.classList.add('alert-danger');
        info.textContent = text;
    }

    function showSuccess(text) {
        if (!info) return console.log(text);
        info.classList.remove('d-none', 'alert-danger');
        info.classList.add('alert-success');
        info.textContent = text;
    }

    function disableForm() {
        if (!form) return;
        Array.from(form.elements).forEach(el => el.disabled = true);
    }

    function renderAuthPromptInline() {
        if (!info) return;
        info.className = 'alert alert-warning';
        info.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
                <div>
                    <strong>Чтобы создавать QR-коды, нужно авторизоваться</strong>
                    <div class="mt-2 small text-muted">Пожалуйста, войдите или зарегистрируйтесь, чтобы продолжить.</div>
                </div>
                <div class="d-flex gap-2 mt-2 mt-md-0">
                    <a href="/login" class="btn btn-sm btn-primary">Войти</a>
                    <a href="/registration" class="btn btn-sm btn-outline-secondary">Регистрация</a>
                    <a href="/" class="btn btn-sm btn-outline-secondary">На главную</a>
                </div>
            </div>
        `;
        info.classList.remove('d-none');
        disableForm();
    }

    // ждём инициализации auth.js
    async function waitForAuthInit(timeout = 2000) {
        let waited = 0;
        const interval = 50;
        while ((!window.auth || !window.auth.initDone) && waited < timeout) {
            await new Promise(r => setTimeout(r, interval));
            waited += interval;
        }
        return !!window.auth?.initDone;
    }

    async function ensureAuthOrPrompt() {
        if (window.auth?.getAccessToken && window.auth.getAccessToken()) return true;
        if (window.auth?.refreshAccessToken) {
            try {
                await window.auth.refreshAccessToken();
                return true;
            } catch {
                renderAuthPromptInline();
                return false;
            }
        }
        renderAuthPromptInline();
        return false;
    }

    async function init() {
        if (!form) {
            showError('Форма не найдена (qrForm).');
            return;
        }

        const authReady = await waitForAuthInit();
        if (!authReady) {
            renderAuthPromptInline();
            return;
        }

        const ok = await ensureAuthOrPrompt();
        if (!ok) return;
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (info) {
            info.classList.add('d-none');
            info.textContent = '';
        }
        clearResult();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const link = form.link.value.trim();
        if (!link) {
            showError('Введите ссылку');
            return;
        }

        if (window.auth?.getAccessToken && !window.auth.getAccessToken()) {
            try {
                await window.auth.refreshAccessToken();
            } catch {
                renderAuthPromptInline();
                return;
            }
        }

        try {
            const res = await window.auth.authFetch('/qr/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({link})
            });

            if (!res.ok) {
                let body = null;
                try {
                    body = await res.json();
                } catch {
                }
                showError(body?.detail ?? body?.error ?? `Ошибка ${res.status}`);
                return;
            }

            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            showSuccess('QR-код успешно создан');

            if (result) {
                result.innerHTML = `
                    <div class="d-flex flex-column align-items-center gap-3">
                        <img id="qrImage" src="${objectUrl}" alt="QR" width="300" height="300">
                        <button id="downloadBtn" type="button" class="btn btn-outline-primary">Скачать QR-код</button>
                    </div>
                `;
                const downloadBtn = document.getElementById('downloadBtn');
                downloadBtn?.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = blob.type === 'image/svg+xml' ? 'qr.svg' : 'qr.png';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                });
            }
        } catch (err) {
            showError('Ошибка сети: ' + (err?.message || String(err)));
        }
    });

    document.addEventListener('DOMContentLoaded', init);
})();
