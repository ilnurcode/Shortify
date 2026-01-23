(function () {
    const form = document.getElementById('loginForm');
    const info = document.getElementById('info');


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        info.textContent = '';


        const payload = {
            email: form.email.value.trim(),
            password: form.password.value
        };


        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
                credentials: 'include'
            });


            let body = null;
            try {
                body = await res.json();
            } catch (err) {
            }


            if (res.ok) {
                if (body && body.access_token) {
                    if (window.auth && typeof window.auth.setAccessToken === 'function') {
                        window.auth.setAccessToken(body.access_token);
                    } else {
                        sessionStorage.setItem('access_token', body.access_token);
                    }
                }
                info.style.color = 'green';
                info.textContent = body?.message || 'Вход успешен';
// опционально: редирект
// window.location.href = '/shortlink';
            } else {
                info.style.color = 'crimson';
                info.textContent = body?.detail || body?.error || `Ошибка ${res.status}`;
            }
        } catch (err) {
            info.style.color = 'crimson';
            info.textContent = 'Ошибка сети: ' + err.message;
        }
    });
})();