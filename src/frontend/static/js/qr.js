(function () {
    const form = document.getElementById('qrForm');
    const info = document.getElementById('info');
    const result = document.getElementById('result');

    function getToken() {
        if (window.auth && typeof window.auth.getAccessToken === 'function') return window.auth.getAccessToken();
        return sessionStorage.getItem('access_token');
    }

    let lastObjectUrl = null;

    function clearResult() {
        if (lastObjectUrl) {
            URL.revokeObjectURL(lastObjectUrl);
            lastObjectUrl = null;
        }
        result.innerHTML = '';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        info.textContent = '';
        info.style.color = '';
        clearResult();

        const token = getToken();
        if (!token) {
            info.style.color = 'crimson';
            info.textContent = 'Нет access_token. Пожалуйста, выполните вход.';
            return;
        }

        const link = form.link.value.trim();
        if (!link) {
            info.style.color = 'crimson';
            info.textContent = 'Введите ссылку';
            return;
        }

        const payload = {link};

        try {
            const res = await fetch('/qr/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) {
                let body = null;
                try {
                    body = await res.json();
                } catch {
                }
                info.style.color = 'crimson';
                info.textContent = body?.detail || body?.error || `Ошибка ${res.status}`;
                return;
            }

            // Получаем blob (SVG) и делаем object URL для показа
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            lastObjectUrl = objectUrl;

            info.style.color = 'green';
            info.textContent = 'QR-код успешно создан';

            // Вставляем кнопку (теперь обычная кнопка, не <a>) и картинку
            result.innerHTML = `
                <div style="display:flex; align-items:center; gap:20px;">
                    <button type="button" id="downloadBtn">Скачать QR-код</button>
                    <img id="qrImage" src="${objectUrl}" alt="QR код" style="width:300px; height:300px;">
                </div>
            `;

            // Обработчик кнопки: конвертируем текущий objectUrl (SVG) в PNG и скачиваем
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.addEventListener('click', async () => {
                try {
                    // Размер итогового PNG (тот же, что и на странице)
                    const size = 300;
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');

                    const img = new Image();
                    // Чтобы избежать tainted canvas, используем тот же objectUrl
                    img.onload = () => {
                        // Очистка и рисование
                        ctx.clearRect(0, 0, size, size);
                        ctx.drawImage(img, 0, 0, size, size);

                        // Скачиваем PNG
                        canvas.toBlob((blobPng) => {
                            if (!blobPng) return;
                            const pngUrl = URL.createObjectURL(blobPng);
                            const a = document.createElement('a');
                            a.href = pngUrl;
                            a.download = 'qr.png';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            // Освобождаем временный URL через небольшую задержку
                            setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
                        }, 'image/png');
                        // освобождаем объект изображения URL, если был создан специально (мы используем lastObjectUrl)
                    };
                    img.onerror = (err) => {
                        console.error('Ошибка загрузки SVG для конвертации:', err);
                        info.style.color = 'crimson';
                        info.textContent = 'Не удалось подготовить изображение для скачивания';
                    };

                    // Используем текущий objectUrl (lastObjectUrl) как src
                    img.src = objectUrl;
                } catch (err) {
                    console.error(err);
                    info.style.color = 'crimson';
                    info.textContent = 'Ошибка при скачивании: ' + err.message;
                }
            });

        } catch (err) {
            info.style.color = 'crimson';
            info.textContent = 'Ошибка сети: ' + err.message;
        }
    });
})();
