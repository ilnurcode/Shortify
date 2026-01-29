(function () {
    const usernameEl = document.getElementById('username');
    const tableBody = document.getElementById('links-table');
    let info = document.getElementById('account-alert-area') || document.querySelector('main.container');

    // создаём контейнер info если его нет
    if (!info) {
        info = document.createElement('div');
        info.id = 'account-alert-area';
        info.className = 'alert d-none';
        info.setAttribute('role', 'alert');
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) mainContainer.prepend(info);
    }

    function showAuthPromptInline() {
        if (!info) return;
        if (typeof window.renderAuthPrompt === 'function') {
            window.renderAuthPrompt(info, 'Вы не авторизованы', {showHome: true});
            return;
        }

        info.className = 'alert alert-warning';
        info.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
                <div>
                    <strong>Для просмотра личного кабинета нужно авторизоваться</strong>
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
        if (tableBody) tableBody.innerHTML = '';
    }

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
        await waitForAuthInit();

        if (window.auth?.getAccessToken && window.auth.getAccessToken()) return true;

        if (window.auth?.refreshAccessToken) {
            try {
                await window.auth.refreshAccessToken();
                return true;
            } catch {
            }
        }

        showAuthPromptInline();
        return false;
    }

    async function fetchAccountInfo() {
        const fetcher = (window.auth?.authFetch) ? window.auth.authFetch : (url => fetch(url, {credentials: 'include'}));

        try {
            const res = await fetcher('/account-info', {method: 'GET'});

            if (res.status === 401 || res.status === 403) {
                showAuthPromptInline();
                return;
            }

            if (!res.ok) {
                console.error('Ошибка загрузки данных аккаунта:', res.status);
                if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Ошибка загрузки данных: ${res.status}</td></tr>`;
                return;
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await res.text();
                console.error('Expected JSON but got:', text.slice(0, 1000));
                showAuthPromptInline();
                return;
            }

            const data = await res.json();

            usernameEl.textContent = data.username ?? '—';

            const links = Array.isArray(data.links) ? data.links : [];
            if (!links.length) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Ссылок пока нет</td></tr>`;
                return;
            }

            tableBody.innerHTML = links.map(link => {
                const long = escapeHtml(link.original_url || link.long || '');
                const shortSlug = link.short || (link.short_url ? String(link.short_url).split('/').pop() : '');
                const shortUrl = shortSlug ? `${location.origin}/${encodeURIComponent(shortSlug)}` : escapeHtml(link.short_url || '');
                const created = link.created_at ? new Date(link.created_at).toLocaleString() : '-';
                const clicks = Number(link.clicks || link.views || 0);

                return `
                    <tr>
                        <td class="text-break"><a href="${long}" target="_blank" rel="noopener noreferrer">${long}</a></td>
                        <td><a href="${escapeHtml(shortUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortUrl)}</a></td>
                        <td>${escapeHtml(created)}</td>
                        <td>${escapeHtml(clicks)}</td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            console.error('Account load error', err);
            showAuthPromptInline();
        }
    }

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function init() {
        const ok = await ensureAuthOrPrompt();
        if (!ok) return;
        await fetchAccountInfo();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
