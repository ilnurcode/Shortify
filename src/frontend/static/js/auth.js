(function (window) {
    async function refreshAccessToken() {
        if (_refreshing) return _refreshing;


        _refreshing = (async () => {
            try {
                const res = await fetch('/refresh', {
                    method: 'POST',
                    credentials: 'include'
                });


                if (!res.ok) {
                    setAccessToken(null);
                    throw new Error('Не удалось обновить токен');
                }


                const body = await res.json();
                if (body && body.access_token) {
                    setAccessToken(body.access_token);
                    return body.access_token;
                } else {
                    setAccessToken(null);
                    throw new Error('Нет access_token в ответе');
                }
            } finally {
                _refreshing = null;
            }
        })();


        return _refreshing;
    }


    async function authFetch(input, init = {}, retry = true) {
        init.headers = init.headers || {};
        if (!init.credentials) init.credentials = 'same-origin';


        const token = getAccessToken();
        if (token) {
            init.headers['Authorization'] = `Bearer ${token}`;
        }


        if (!init.headers['Content-Type'] && !(init.body instanceof FormData)) {
            init.headers['Content-Type'] = 'application/json';
        }


        let res = await fetch(input, init);


        if (res.status === 401 && retry) {
            try {
                await refreshAccessToken();
                const newToken = getAccessToken();
                if (newToken) {
                    init.headers['Authorization'] = `Bearer ${newToken}`;
                    res = await fetch(input, init);
                }
            } catch (err) {
                return res;
            }
        }


        return res;
    }


    async function initAuthOnLoad() {
        try {
            await refreshAccessToken();
        } catch (err) {
            console.info('Auth init: no token', err.message);
        }
    }


    window.auth = {
        initAuthOnLoad,
        getAccessToken,
        setAccessToken,
        refreshAccessToken,
        authFetch
    };


})(window);