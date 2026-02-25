import { apiPexels } from './apiPexels.js';

export const ui = {
    // Ссылки на DOM элементы
    els: {
        navStore: document.getElementById('nav-store'),
        navCart: document.getElementById('nav-cart'),
        navLogin: document.getElementById('nav-login'),
        navLogout: document.getElementById('nav-logout'),
        userInfo: document.getElementById('user-info'),
        userInfoWrapper: document.getElementById('user-info-wrapper'),
        storeScreen: document.getElementById('store-screen'),
        cartBadge: document.getElementById('cart-badge'),
        categoryList: document.getElementById('category-list'),
        productsGrid: document.getElementById('products-grid'),
        currentCategoryTitle: document.getElementById('current-category-title'),
        navLogo: document.getElementById('nav-logo'),

        loginScreen: document.getElementById('login-screen'),
        cartScreen: document.getElementById('cart-screen'),
        profileScreen: document.getElementById('profile-screen'),
        profileName: document.getElementById('profile-name'),
        profileInputName: document.getElementById('profile-input-name'),
        navProfile: document.getElementById('nav-profile'),

        loginForm: document.getElementById('login-form'),
        loginError: document.getElementById('login-error'),
        loginBtn: document.getElementById('login-btn'),
        cartItemsList: document.getElementById('cart-items-list'),
        totalQuantity: document.getElementById('total-quantity'),
        totalPrice: document.getElementById('total-price'),
        discountedTotal: document.getElementById('discounted-total'),
        checkoutGuestBox: document.getElementById('checkout-guest-box'),
        checkoutAuthBox: document.getElementById('checkout-auth-box'),
        checkoutGuestBtn: document.getElementById('checkout-guest-btn'),
        checkoutAuthBtn: document.getElementById('checkout-auth-btn'),
        checkoutLoginBtn: document.getElementById('checkout-login-btn'),
        guestName: document.getElementById('guest-name'),
        guestAddress: document.getElementById('guest-address'),
    },

    // Переключение экранов
    showScreen(screenName) {
        this.els.storeScreen.classList.add('hidden');
        this.els.loginScreen.classList.add('hidden');
        this.els.cartScreen.classList.add('hidden');
        if (this.els.profileScreen) this.els.profileScreen.classList.add('hidden');

        this.els.navStore.classList.remove('active');
        this.els.navStore.classList.remove('active');
        this.els.navCart.classList.remove('active');
        if (this.els.navProfile) this.els.navProfile.classList.remove('active');

        // Скроллим к началу страницы при смене экрана
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (screenName === 'store') {
            this.els.storeScreen.classList.remove('hidden');
            this.els.navStore.classList.add('active');
        } else if (screenName === 'login') {
            this.els.loginScreen.classList.remove('hidden');
        } else if (screenName === 'cart') {
            this.els.cartScreen.classList.remove('hidden');
            this.els.navCart.classList.add('active');
        } else if (screenName === 'profile') {
            if (this.els.profileScreen) this.els.profileScreen.classList.remove('hidden');
            if (this.els.navProfile) this.els.navProfile.classList.add('active');
        }

        // Обновление нижней навигации (мобильная)
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            const target = item.dataset.screen;
            if (target === screenName || (screenName === 'profile' && target === 'login')) {
                item.classList.add('active');
            }
        });
    },

    // Обновление состояния шапки (Авторизация)
    updateAuthNav(isAuth, username) {
        if (isAuth) {
            this.els.navLogin.classList.add('hidden');
            if (this.els.userInfoWrapper) this.els.userInfoWrapper.classList.remove('hidden');
            const displayChar = username ? username[0].toUpperCase() : 'U';
            if (this.els.userInfo) this.els.userInfo.textContent = displayChar;

            // Заполнеие данных в кабинете
            if (this.els.profileName && username) {
                this.els.profileName.textContent = username;
            }
            if (this.els.profileInputName && username) {
                this.els.profileInputName.value = username;
            }

            if (this.els.checkoutAuthBox) this.els.checkoutAuthBox.classList.remove('hidden');
            if (this.els.checkoutGuestBox) this.els.checkoutGuestBox.classList.add('hidden');
        } else {
            this.els.navLogin.classList.remove('hidden');
            if (this.els.userInfoWrapper) this.els.userInfoWrapper.classList.add('hidden');
            // При логауте бейджик корзины НЕ сбрасываем, так как гостевая остаётся

            if (this.els.checkoutAuthBox) this.els.checkoutAuthBox.classList.add('hidden');
            if (this.els.checkoutGuestBox) this.els.checkoutGuestBox.classList.remove('hidden');
        }

        // Обновление кнопки аккаунта в нижней навигации
        const bnavAccount = document.getElementById('bnav-account');
        const bnavLabel = document.getElementById('bnav-account-label');
        if (bnavAccount && bnavLabel) {
            if (isAuth) {
                bnavAccount.dataset.screen = 'profile';
                bnavLabel.textContent = 'Профиль';
            } else {
                bnavAccount.dataset.screen = 'login';
                bnavLabel.textContent = 'Войти';
            }
        }
    },

    // Обновление бейджика в корзине
    updateCartBadge(count) {
        this.els.cartBadge.textContent = count || '0';

        // Обновление бейджа нижней навигации
        const bnavBadge = document.getElementById('bnav-cart-badge');
        if (bnavBadge) {
            bnavBadge.textContent = count || '0';
            if (count > 0) {
                bnavBadge.classList.remove('hidden');
            } else {
                bnavBadge.classList.add('hidden');
            }
        }
    },

    // Рендер категорий
    renderCategories(categories, activeSlug) {
        this.els.categoryList.innerHTML = `<li class="category-item ${activeSlug === 'All' ? 'active' : ''}" data-genre="All">Все книги</li>`;

        // DummyJSON categories can be objects or strings.
        categories.slice(0, 10).forEach(cat => {
            const slug = typeof cat === 'string' ? cat : cat.slug;
            const name = typeof cat === 'string' ? cat : cat.name;
            const li = document.createElement('li');
            li.className = `category-item ${slug === activeSlug ? 'active' : ''}`;
            li.dataset.genre = slug;
            li.textContent = name;
            this.els.categoryList.appendChild(li);
        });
    },

    // Рендер продуктов (витрина)
    renderProducts(products) {
        this.els.productsGrid.innerHTML = '';
        if (!products || !products.length) {
            this.els.productsGrid.innerHTML = '<p>Товары не найдены</p>';
            return;
        }

        const template = document.createDocumentFragment();

        const genreMap = {
            'Fiction': 'Художественная литература',
            'Fantasy': 'Фэнтези',
            'Romance': 'Роман',
            'Science Fiction': 'Научная фантастика',
            'Business': 'Бизнес',
            'Psychology': 'Психология',
            'History': 'История',
            'Cooking': 'Кулинария',
            'Art & Design': 'Искусство и дизайн',
            'Kids': 'Детские книги'
        };

        products.forEach(product => {
            const el = document.createElement('div');
            el.className = 'product-card';
            const imgId = `img-store-${product.id}`;
            const internalCat = typeof product.category === 'string' ? product.category : 'Unknown';
            const genreName = genreMap[internalCat] || internalCat;

            el.innerHTML = `
                <div class="product-image-wrap">
                    <img id="${imgId}" src="assets/placeholder-book.jpg" alt="${product.title}">
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${product.title}">${product.title}</h3>
                    <div class="product-genre">${genreName}</div>
                    <div class="product-bottom">
                        <span class="product-price">${product.price} ₴</span>
                        <!-- Кнопка теперь активна -->
                        <button class="btn-add" data-id="${product.id}" title="Добавить в корзину">В корзину</button>
                    </div>
                </div>
            `;
            template.appendChild(el);

            // Асинхронно запускаем подгрузку картинок из Pexels
            this.loadProductImage(product.id, product.title, imgId);
        });

        this.els.productsGrid.appendChild(template);
    },

    // Логин: показ ошибок
    showLoginError(message) {
        this.els.loginError.textContent = message;
        this.els.loginError.classList.remove('hidden');
    },

    hideLoginError() {
        this.els.loginError.classList.add('hidden');
    },

    setLoginLoading(isLoading) {
        this.els.loginBtn.disabled = isLoading;
        this.els.loginBtn.textContent = isLoading ? 'Вход...' : 'Войти';
    },

    // Рендер элементов корзины
    async renderCartItems(cart) {
        this.els.cartItemsList.innerHTML = '';

        if (!cart || !cart.products || cart.products.length === 0) {
            this.els.cartItemsList.innerHTML = '<p style="text-align:center; padding: 2rem;">Ваша корзина пуста</p>';
            return;
        }

        const template = document.createDocumentFragment();

        // Сначала рендерим скелеты (плейсхолдеры)
        for (const product of cart.products) {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.dataset.id = product.id;

            // Заглушка, чтобы потом найти этот img и обновить src
            const imgId = `img-prod-${product.id}`;

            itemEl.innerHTML = `
                <img id="${imgId}" src="assets/placeholder-book.jpg" alt="${product.title}" class="item-image">
                <div class="item-details">
                    <div>
                        <h3 class="item-title">${product.title}</h3>
                        <p class="item-price">${product.price} ₴ / шт</p>
                    </div>
                    <div class="item-controls" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="quantity-controls">
                            <button class="quantity-btn minus-btn" data-id="${product.id}" ${product.quantity <= 1 ? 'disabled' : ''}>&minus;</button>
                            <span class="quantity-value" id="qty-${product.id}">${product.quantity}</span>
                            <button class="quantity-btn plus-btn" data-id="${product.id}">&plus;</button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="item-total" style="margin: 0;">
                                <span id="item-total-${product.id}">${product.total}</span> ₴
                            </div>
                            <button class="remove-btn" data-id="${product.id}" title="Удалить товар" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.2rem; display: flex; align-items: center; justify-content: center; transition: color 0.2s;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            template.appendChild(itemEl);

            // Асинхронно запускаем подгрузку картинок из Pexels
            this.loadProductImage(product.id, product.title, imgId);
        }

        this.els.cartItemsList.appendChild(template);
    },

    // Метод для асинхронной подмены src картинки
    async loadProductImage(productId, title, imgElementId) {
        const coverUrl = await apiPexels.getBookCover(productId, title);
        const imgEl = document.getElementById(imgElementId);
        if (imgEl && coverUrl) {
            imgEl.src = coverUrl;
        }
    },

    // Рендер блока общих итогов
    renderCartTotals(cart) {
        if (!cart) {
            this.els.totalQuantity.textContent = '0';
            this.els.totalPrice.textContent = '0 ₴';
            this.els.discountedTotal.textContent = '0 ₴';
            this.updateCartBadge(0);
            if (this.els.checkoutGuestBtn) this.els.checkoutGuestBtn.disabled = true;
            if (this.els.checkoutAuthBtn) this.els.checkoutAuthBtn.disabled = true;
            return;
        }

        this.els.totalQuantity.textContent = cart.totalQuantity;
        this.els.totalPrice.textContent = `${Number(cart.total).toFixed(2)} ₴`;
        this.els.discountedTotal.textContent = `${Number(cart.discountedTotal).toFixed(2)} ₴`;

        this.updateCartBadge(cart.totalQuantity);

        const disabled = cart.totalQuantity === 0;
        if (this.els.checkoutGuestBtn) this.els.checkoutGuestBtn.disabled = disabled;
        if (this.els.checkoutAuthBtn) this.els.checkoutAuthBtn.disabled = disabled;
    },

    // Блокировка UI корзины во время запроса
    setCartLoading(isLoading) {
        const buttons = this.els.cartItemsList.querySelectorAll('.quantity-btn');
        buttons.forEach(btn => {
            if (!btn.disabled || isLoading) {
                btn.disabled = isLoading;
            }
        });
        if (this.els.checkoutGuestBtn) this.els.checkoutGuestBtn.disabled = isLoading;
        if (this.els.checkoutAuthBtn) this.els.checkoutAuthBtn.disabled = isLoading;
    },

    // Летающая анимация добавления в корзину
    animateAddToCart(btnEl, imgId) {
        const imgEl = document.getElementById(imgId);
        const cartBtn = document.getElementById('nav-cart');
        if (!imgEl || !cartBtn) return;

        const imgRect = imgEl.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        const ghost = imgEl.cloneNode();
        ghost.className = 'ghost-image';
        ghost.style.left = `${imgRect.left}px`;
        ghost.style.top = `${imgRect.top}px`;
        ghost.style.width = `${imgRect.width}px`;
        ghost.style.height = `${imgRect.height}px`;

        document.body.appendChild(ghost);

        // Force reflow
        ghost.getBoundingClientRect();

        ghost.style.left = `${cartRect.left + (cartRect.width / 2)}px`;
        ghost.style.top = `${cartRect.top + (cartRect.height / 2)}px`;
        ghost.style.width = '20px';
        ghost.style.height = '30px';
        ghost.style.opacity = '0';
        ghost.style.transform = 'scale(0.1)';

        setTimeout(() => {
            ghost.remove();
            const badge = document.getElementById('cart-badge');
            if (badge) {
                badge.classList.remove('cart-pop');
                void badge.offsetWidth; // trigger reflow
                badge.classList.add('cart-pop');
            }
        }, 600);
    }
};
