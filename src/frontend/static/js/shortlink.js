(function () {
    const form = document.getElementById('shortForm');
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
                    <strong>Чтобы создавать короткие ссылки, нужно авторизоваться</strong>
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

    // обработчик сабмита формы
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (info) {
            info.classList.add('d-none');
            info.textContent = '';
        }
        if (result) result.innerHTML = '';

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const link = form.link.value.trim();
        if (!link) {
            showError('Введите ссылку');
            return;
        }

        if (!window.auth?.getAccessToken || !window.auth.getAccessToken()) {
            try {
                await window.auth.refreshAccessToken();
            } catch {
                renderAuthPromptInline();
                return;
            }
        }

        try {
            const res = await window.auth.authFetch('/shortlink', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({link})
            });

            let body = null;
            try {
                body = await res.json();
            } catch {
            }

            if (!res.ok) {
                showError(body?.detail ?? body?.error ?? `Ошибка ${res.status}`);
                return;
            }

            const shortUrl = body?.short_url ?? body?.short ?? body?.url;
            if (!shortUrl) {
                showError('Сервер вернул неожиданный ответ');
                return;
            }

            showSuccess('Короткая ссылка создана');
            result.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <a href="${shortUrl}" target="_blank" rel="noopener noreferrer">${shortUrl}</a>
                    <button id="copyBtn" type="button" class="btn btn-sm btn-outline-secondary">Скопировать</button>
                    <span id="copyInfo" aria-live="polite" class="small ms-2"></span>
                </div>
            `;

            const copyBtn = document.getElementById('copyBtn');
            const copyInfo = document.getElementById('copyInfo');

            copyBtn?.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shortUrl);
                    copyInfo.textContent = 'Скопировано!';
                    copyInfo.style.color = 'green';
                    setTimeout(() => copyInfo.textContent = '', 2000);
                } catch {
                    copyInfo.textContent = 'Ошибка копирования';
                    copyInfo.style.color = 'crimson';
                    setTimeout(() => copyInfo.textContent = '', 2500);
                }
            });

        } catch (err) {
            showError('Ошибка сети: ' + (err?.message || String(err)));
        }
    });

    document.addEventListener('DOMContentLoaded', init);
})();
