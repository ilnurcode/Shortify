// utils.js — подключать ВСЕГДА перед shortlink.js, qr.js, account.js
(function () {
    // простая очередь: если renderAuthPrompt ещё не определён — stub принимает вызовы
    if (!window.renderAuthPrompt) {
        const q = [];
        window.__renderAuthPrompt_queue = q;
        window.renderAuthPrompt = function (container, text, options) {
            q.push({container, text, options});
        };
        console.log('[utils] renderAuthPrompt stub installed');
    }

    /**
     * Показывает alert с кнопками Войти/Регистрация/На главную.
     * container — DOM element или CSS selector.
     * text — основной текст алерта.
     * options: { showHome: boolean } — показывать ли кнопку "На главную".
     */
    function renderAuthPromptImpl(container, text = 'Для доступа к этой странице необходима авторизация', options = {}) {
        if (!container) {
            console.warn('renderAuthPrompt: container not provided');
            return;
        }
        const el = (typeof container === 'string') ? document.querySelector(container) : container;
        if (!el) {
            console.warn('renderAuthPrompt: container element not found', container);
            return;
        }

        const showHome = options.showHome !== false; // по умолчанию true
        el.innerHTML = `
      <div class="alert alert-warning" role="alert" aria-live="polite">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
          <div>
            <strong>${text}</strong>
            <div class="mt-2 small text-muted">Пожалуйста, войдите или зарегистрируйтесь, чтобы продолжить.</div>
          </div>
          <div class="d-flex gap-2 mt-2 mt-md-0">
                    <a href="/login" class="btn btn-sm btn-primary">Войти</a>
                    <a href="/registration" class="btn btn-sm btn-outline-secondary">Регистрация</a>
                    <a href="/" class="btn btn-sm btn-outline-secondary">На главную</a>
                </div>
        </div>
      </div>
    `;
    }

    // заменяем stub (если был) и проталкиваем flush очереди
    (function expose() {
        // если stub поставил window.renderAuthPrompt как функцию — заменим её на реализацию
        window.renderAuthPrompt = renderAuthPromptImpl;
        if (Array.isArray(window.__renderAuthPrompt_queue) && window.__renderAuthPrompt_queue.length) {
            console.log('[utils] flushing renderAuthPrompt queue:', window.__renderAuthPrompt_queue.length);
            window.__renderAuthPrompt_queue.forEach(item => {
                try {
                    renderAuthPromptImpl(item.container, item.text, item.options);
                } catch (e) {
                    console.error('flush renderAuthPrompt failed', e);
                }
            });
            delete window.__renderAuthPrompt_queue;
        }
    })();

    // Утилита: ждём пока renderAuthPrompt станет функцией (timeout ms)
    window.waitForRenderAuth = async function (timeout = 2000) {
        let waited = 0;
        const interval = 50;
        while (typeof window.renderAuthPrompt !== 'function' && waited < timeout) {
            await new Promise(r => setTimeout(r, interval));
            waited += interval;
        }
        return typeof window.renderAuthPrompt === 'function';
    };

    console.log('[utils] loaded');
})();
