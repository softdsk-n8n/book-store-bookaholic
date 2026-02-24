// Управление локальным состоянием и кэшем

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

class Store {
    constructor() {
        this.token = null;
        this.userId = null;
        this.cart = null;
        this.imageCache = {};
    }

    // Сохранить текущее состояние в LocalStorage
    save() {
        localStorage.setItem('bookstore_token', this.token || '');
        localStorage.setItem('bookstore_userId', this.userId || '');
        localStorage.setItem('bookstore_imageCache', JSON.stringify(this.imageCache));
        localStorage.setItem('bookstore_cart', JSON.stringify(this.cart));
    }

    // Восстановить состояние из LocalStorage
    load() {
        this.token = localStorage.getItem('bookstore_token') || null;
        this.userId = localStorage.getItem('bookstore_userId') || null;

        try {
            const cachedImages = localStorage.getItem('bookstore_imageCache');
            this.imageCache = cachedImages ? JSON.parse(cachedImages) : {};
        } catch (e) {
            console.error('Ошибка при загрузке кеша изображений', e);
            this.imageCache = {};
        }

        try {
            const cartData = localStorage.getItem('bookstore_cart');
            if (cartData) this.cart = JSON.parse(cartData);
        } catch (e) {
            console.error('Ошибка загрузки корзины', e);
        }

        // Очистка старого кеша при загрузке
        this.cleanOldCache();
    }

    // Очистить кэш картинок, которые старше TTL
    cleanOldCache() {
        const now = Date.now();
        let changed = false;

        for (const [key, value] of Object.entries(this.imageCache)) {
            if (now - value.timestamp > CACHE_TTL) {
                delete this.imageCache[key];
                changed = true;
            }
        }

        if (changed) {
            this.save();
        }
    }

    // Проверка наличия валидного кэша для продукта
    getCachedImage(productId) {
        const cached = this.imageCache[productId];
        if (cached && Date.now() - cached.timestamp <= CACHE_TTL) {
            return cached.url;
        }
        return null; // Нет в кэше или устарел
    }

    // Сохранить картинку в кэш
    setCachedImage(productId, url) {
        this.imageCache[productId] = {
            url: url,
            timestamp: Date.now()
        };
        this.save();
    }

    // Очистить данные авторизации (при выходе)
    clear() {
        this.token = null;
        this.userId = null;
        // Корзину оставляем (гостевая корзина)
        localStorage.removeItem('bookstore_token');
        localStorage.removeItem('bookstore_userId');
        this.save();
    }
}

export const store = new Store();
