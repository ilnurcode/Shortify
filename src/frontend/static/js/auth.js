// auth.js — лёгкая auth-утилита с initPromise
(function () {
    const TOKEN_KEY = 'access_token';

    function getAccessToken() {
        try {
            return sessionStorage.getItem(TOKEN_KEY);
        } catch (err) {
            console.error('auth.getAccessToken error', err);
            return null;
        }
    }

    function setAccessToken(token) {
        try {
            if (!token) {
                sessionStorage.removeItem(TOKEN_KEY);
                console.log('auth: access_token removed');
            } else {
                sessionStorage.setItem(TOKEN_KEY, token);
                console.log('auth: access_token saved (len=' + (token?.length ?? 0) + ')');
            }
        } catch (err) {
            console.error('auth.setAccessToken error', err);
        }
    }

    async function refreshAccessToken() {
        console.log('auth.refreshAccessToken: start');
        const res = await fetch('/refresh', {
            method: 'POST',
            credentials: 'include'
        });

        if (!res.ok) {
            console.warn('auth.refreshAccessToken: refresh returned', res.status);
            throw new Error('Not authenticated');
        }

        const body = await res.json().catch(() => null);
        const token = body?.access_token;
        if (!token) {
            console.warn('auth.refreshAccessToken: no token in response');
            throw new Error('No access_token in refresh response');
        }

        setAccessToken(token);
        console.log('auth.refreshAccessToken: success');
        return token;
    }

    async function authFetch(url, options = {}) {
        const opts = {
            credentials: 'include',
            ...options,
            headers: {
                ...(options.headers || {}),
            },
        };

        let token = getAccessToken();
        console.log('auth.authFetch: token present?', !!token);

        if (token) {
            opts.headers.Authorization = `Bearer ${token}`;
            const res = await fetch(url, opts);
            if (res.status !== 401) return res;
            console.warn('auth.authFetch: request returned 401, will try refresh');
        }

        try {
            token = await refreshAccessToken();
        } catch (err) {
            console.warn('auth.authFetch: refresh failed, proceeding without token');
            return fetch(url, opts);
        }

        opts.headers.Authorization = `Bearer ${token}`;
        return fetch(url, opts);
    }

    function isAuthenticated() {
        return !!getAccessToken();
    }

    // init state + promise для ожидания
    let _initDone = false;
    let _initResolve;
    const initPromise = new Promise((resolve) => {
        _initResolve = resolve;
    });

    function setInitDone(val = true) {
        _initDone = !!val;

        // Попытка безопасно обновить поле initDone на window.auth,
        // но только если там есть сеттер (иначе не пробуем — чтобы не вызывать TypeError).
        try {
            if (window.auth) {
                const desc = Object.getOwnPropertyDescriptor(window.auth, 'initDone');
                // если дескриптор отсутствует (undefined) — можно присвоить,
                // или если есть сеттер (desc.set) — тоже можно присвоить.
                if (!desc || typeof desc.set === 'function') {
                    window.auth.initDone = _initDone;
                }
            }
        } catch (e) {
            // безопасно игнорируем любые ошибки — это лишь попытка оповестить внешние коды
            console.warn('setInitDone: could not write window.auth.initDone', e);
        }

        if (_initResolve) {
            _initResolve(_initDone);
            _initResolve = null;
        }
    }


    async function initAuthOnLoad() {
        try {
            const token = getAccessToken();
            console.log('auth.initAuthOnLoad: token exists?', !!token);
            if (token) {
                setInitDone(true);
                return;
            }

            try {
                await refreshAccessToken();
                console.log('auth.initAuthOnLoad: refreshed token');
            } catch (err) {
                console.log('auth.initAuthOnLoad: no refresh (user not logged in)');
            } finally {
                setInitDone(true);
            }
        } catch (err) {
            console.error('auth.initAuthOnLoad error', err);
            setInitDone(true);
        }
    }

    // автоинициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthOnLoad);
    } else {
        setTimeout(initAuthOnLoad, 0);
    }

    // экспорт
    window.auth = {
        getAccessToken,
        setAccessToken,
        refreshAccessToken,
        authFetch,
        isAuthenticated,
        initPromise,
        get initDone() {
            return _initDone;
        }
    };

    console.log('[auth] loaded');
})();
