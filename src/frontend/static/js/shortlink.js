(function () {
    const form = document.getElementById('shortForm');
    const info = document.getElementById('info');
    const result = document.getElementById('result');

    function getToken() {
        if (window.auth && typeof window.auth.getAccessToken === 'function') return window.auth.getAccessToken();
        return sessionStorage.getItem('access_token');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        info.textContent = '';
        result.textContent = '';

        const token = getToken();
        if (!token) {
            info.style.color = 'crimson';
            info.textContent = 'Нет access_token. Пожалуйста, выполните вход.';
            return;
        }

        const payload = {link: form.link.value.trim()};

        try {
            const res = await fetch('/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            let body = null;
            try {
                body = await res.json();
            } catch (err) {
                // ignore json parse error
            }

            if (res.ok) {
                const shortUrl = body?.short_url;
                if (shortUrl) {
                    info.style.color = 'green';
                    // добавляем кнопку копирования и небольшой элемент для сообщения
                    result.innerHTML = `
                        Короткая ссылка: 
                        <a href="${shortUrl}" target="_blank" rel="noopener">${shortUrl}</a>
                        <button type="button" id="copyBtn" style="margin-left:8px">Скопировать</button>
                        <span id="copyInfo" aria-live="polite" style="margin-left:8px"></span>
                    `;

                    const copyBtn = document.getElementById('copyBtn');
                    const copyInfo = document.getElementById('copyInfo');

                    copyBtn.addEventListener('click', async () => {
                        copyInfo.textContent = '';
                        try {
                            // основной способ
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                await navigator.clipboard.writeText(shortUrl);
                            } else {
                                // fallback для старых браузеров
                                const textarea = document.createElement('textarea');
                                textarea.value = shortUrl;
                                // Скрываем от глаз, но добавляем в документ
                                textarea.style.position = 'fixed';
                                textarea.style.left = '-9999px';
                                document.body.appendChild(textarea);
                                textarea.select();
                                textarea.setSelectionRange(0, textarea.value.length);
                                const ok = document.execCommand('copy');
                                document.body.removeChild(textarea);
                                if (!ok) throw new Error('execCommand failed');
                            }
                            copyInfo.style.color = 'green';
                            copyInfo.textContent = 'Скопировано!';
                            setTimeout(() => {
                                copyInfo.textContent = '';
                            }, 2000);
                        } catch (err) {
                            copyInfo.style.color = 'crimson';
                            copyInfo.textContent = 'Не удалось скопировать';
                            setTimeout(() => {
                                copyInfo.textContent = '';
                            }, 2500);
                        }
                    });
                } else {
                    info.style.color = 'crimson';
                    info.textContent = 'Сервер вернул неожиданный ответ';
                }
            } else {
                if (res.status === 401) {
                    info.style.color = 'crimson';
                    info.textContent = 'Неавторизован. Пожалуйста, войдите снова.';
                } else {
                    info.style.color = 'crimson';
                    info.textContent = body?.detail || body?.error || `Ошибка ${res.status}`;
                }
            }
        } catch (err) {
            info.style.color = 'crimson';
            info.textContent = 'Ошибка сети: ' + err.message;
        }
    });
})();
