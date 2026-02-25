import { store } from './store.js';
import { apiDummy } from './apiDummy.js';
import { ui } from './ui.js';

// Состояние приложения (таймеры для debounce)
const appState = {
    debounceTimer: null,
    pendingQuantities: {}, // { productId: requestQty }
    activeCategory: 'All',
    categories: [],
    products: []
};

// Функция инициализации
async function init() {
    store.load();

    // Проверяем авторизацию для шапки
    const isAuth = !!(store.token && store.userId);
    ui.updateAuthNav(isAuth, 'Покупатель'); // В DummyJSON API auth/me можно было бы достать имя, но для демо ставим статик

    // При входе всегда показываем витрину
    ui.showScreen('store');

    // Асинхронно грузим витрину и корзину
    loadStoreData();

    // Всегда загружаем корзину (даже для гостей, из localStorage)
    loadCartData();

    setupEventListeners();
}

// Загрузка интерфейса магазина
async function loadStoreData(category = '') {
    try {
        ui.els.productsGrid.innerHTML = '<p>Загрузка товаров...</p>';
        const [categories, products] = await Promise.all([
            appState.categories.length ? appState.categories : apiDummy.fetchCategories(),
            apiDummy.fetchProducts(category === 'All' ? '' : category)
        ]);

        appState.categories = categories;
        appState.activeCategory = category || 'All';
        appState.products = products;

        ui.renderCategories(categories, appState.activeCategory);
        ui.renderProducts(products);

        if (category === 'All' || !category) {
            ui.els.currentCategoryTitle.textContent = 'Все книги';
            document.title = 'Все книги - Bookaholic';
        } else {
            const catObj = categories.find(c => c.slug === category);
            const translatedName = catObj ? catObj.name : category;
            ui.els.currentCategoryTitle.textContent = translatedName;
            document.title = `${translatedName} - Bookaholic`;
        }
    } catch (e) {
        console.error('Ошибка загрузки витрины', e);
        ui.els.productsGrid.innerHTML = '<p>Ошибка загрузки товаров</p>';
    }
}

// Загрузка и рендер корзины
async function loadCartData() {
    try {
        ui.setCartLoading(true);

        if (!store.cart) {
            store.cart = { id: 'local', products: [], totalQuantity: 0, total: 0, discountedTotal: 0 };
        }

        // В реальном приложении здесь был бы API вызов для залогиненного пользователя
        // Для демонстрации мы фокусируемся на локальной корзине (гостевой и авторизованной)

        ui.updateCartBadge(store.cart.totalQuantity);
        await ui.renderCartItems(store.cart);
        ui.renderCartTotals(store.cart);
    } catch (error) {
        console.error('Не удалось загрузить корзину', error);
    } finally {
        ui.setCartLoading(false);
    }
}

// Изменение количества товара с оптимистичным UI
function handleQuantityChange(productId, delta) {
    if (!store.cart) return;

    const existing = store.cart.products.find(p => p.id === productId);
    if (!existing) return;

    existing.quantity += delta;
    if (existing.quantity < 1) existing.quantity = 1;
    existing.total = Number((existing.price * existing.quantity).toFixed(2));

    // Пересчет корзины локально
    store.cart.totalQuantity = store.cart.products.reduce((sum, p) => sum + p.quantity, 0);
    store.cart.total = store.cart.products.reduce((sum, p) => sum + p.total, 0);
    store.cart.discountedTotal = store.cart.total; // Для демо просто равно

    // Сразу сохраняем локально и обновляем UI для быстрой реакции
    store.save();
    ui.renderCartItems(store.cart);
    ui.renderCartTotals(store.cart);

    // Фоновый запрос на сервер, если авторизованы
    if (store.token && store.cart.id !== 'local') {
        if (appState.debounceTimer) clearTimeout(appState.debounceTimer);
        appState.pendingQuantities[productId] = existing.quantity;

        appState.debounceTimer = setTimeout(async () => {
            const updates = { ...appState.pendingQuantities };
            appState.pendingQuantities = {};
            try {
                for (const [pIdStr, qty] of Object.entries(updates)) {
                    await apiDummy.updateCartQuantity(store.cart.id, parseInt(pIdStr, 10), qty);
                }
            } catch (error) {
                console.error('Ошибка изменения количества на сервере:', error);
            }
        }, 500);
    }
}

// Удаление товара из корзины
function handleRemoveItem(productId) {
    if (!store.cart) return;

    const existingIndex = store.cart.products.findIndex(p => p.id === productId);
    if (existingIndex === -1) return;

    store.cart.products.splice(existingIndex, 1);

    // Пересчет корзины локально
    store.cart.totalQuantity = store.cart.products.reduce((sum, p) => sum + p.quantity, 0);
    store.cart.total = store.cart.products.reduce((sum, p) => sum + p.total, 0);
    store.cart.discountedTotal = store.cart.total;

    store.save();
    ui.updateCartBadge(store.cart.totalQuantity);
    ui.renderCartItems(store.cart);
    ui.renderCartTotals(store.cart);

    // Фоновый запрос на сервер, если авторизованы
    if (store.token && store.cart.id !== 'local') {
        // Установка quantity = 0 удаляет товар в DummyJSON
        apiDummy.updateCartQuantity(store.cart.id, productId, 0).catch(console.error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация
    ui.els.navStore.addEventListener('click', () => ui.showScreen('store'));
    ui.els.navCart.addEventListener('click', () => {
        loadCartData(); // Синхронизируем интерфейс корзины с актуальным store.cart
        ui.showScreen('cart');
    });

    ui.els.navLogo.addEventListener('click', () => {
        ui.showScreen('store');
        loadStoreData('All');
    });
    ui.els.navLogin.addEventListener('click', () => ui.showScreen('login'));
    if (ui.els.navProfile) {
        ui.els.navProfile.addEventListener('click', () => ui.showScreen('profile'));
    }
    if (ui.els.checkoutLoginBtn) {
        ui.els.checkoutLoginBtn.addEventListener('click', () => ui.showScreen('login'));
    }

    // Выход
    ui.els.navLogout.addEventListener('click', () => {
        store.clear();
        ui.updateAuthNav(false);
        ui.showScreen('store');
        // Очищаем корзину из UI
        ui.els.cartItemsList.innerHTML = '';
        ui.renderCartTotals(null);
    });

    // Оформление заказа
    const handleCheckout = () => {
        alert('Спасибо за заказ! Ваша покупка успешно оформлена.');
        store.cart = { id: 'local', products: [], totalQuantity: 0, total: 0, discountedTotal: 0 };
        store.save();
        ui.updateCartBadge(0);
        loadCartData();
        ui.showScreen('store');
    };

    if (ui.els.checkoutGuestBtn) ui.els.checkoutGuestBtn.addEventListener('click', handleCheckout);
    if (ui.els.checkoutAuthBtn) ui.els.checkoutAuthBtn.addEventListener('click', handleCheckout);

    // Форма логина
    ui.els.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.hideLoginError();
        ui.setLoginLoading(true);

        const username = ui.els.loginForm.username.value.trim();
        const password = ui.els.loginForm.password.value;

        try {
            const { token, userId } = await apiDummy.login(username, password);
            store.token = token;
            store.userId = userId;
            store.save();

            ui.updateAuthNav(true, username);
            ui.showScreen('cart');
            await loadCartData();

            ui.els.loginForm.reset();
        } catch (error) {
            ui.showLoginError(error.message || 'Произошла ошибка');
        } finally {
            ui.setLoginLoading(false);
        }
    });

    // Изменение количества и удаление
    ui.els.cartItemsList.addEventListener('click', (e) => {
        const productId = parseInt(e.target.dataset.id, 10);
        if (isNaN(productId)) return;

        if (e.target.classList.contains('plus-btn')) {
            handleQuantityChange(productId, 1);
        } else if (e.target.classList.contains('minus-btn')) {
            handleQuantityChange(productId, -1);
        } else if (e.target.classList.contains('remove-btn') || e.target.closest('.remove-btn')) {
            // Клик мог быть по самой кнопке или по иконке внутри
            const id = e.target.classList.contains('remove-btn') ? productId : parseInt(e.target.closest('.remove-btn').dataset.id, 10);
            handleRemoveItem(id);
        }
    });

    // Смена категории в витрине
    ui.els.categoryList.addEventListener('click', (e) => {
        const li = e.target.closest('.category-item');
        if (!li) return;
        const genre = li.dataset.genre;
        if (genre !== appState.activeCategory) {
            document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            loadStoreData(genre);
        }
    });

    // Обработка кнопки добавления в корзину из витрины
    ui.els.productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add')) {
            const productId = parseInt(e.target.dataset.id, 10);

            // Запускаем красивую анимацию полета
            ui.animateAddToCart(e.target, `img-store-${productId}`);

            const product = appState.products.find(p => p.id === productId);
            if (!product) return;

            // Локальное добавление в store.cart
            if (!store.cart) {
                store.cart = { id: 'local', products: [], totalQuantity: 0, total: 0, discountedTotal: 0 };
            }

            const existing = store.cart.products.find(p => p.id === productId);
            if (existing) {
                existing.quantity++;
                existing.total = Number((existing.price * existing.quantity).toFixed(2));
            } else {
                store.cart.products.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: 1,
                    total: product.price
                });
            }
            // Пересчитываем общие итоги
            store.cart.totalQuantity = store.cart.products.reduce((sum, p) => sum + p.quantity, 0);
            store.cart.total = store.cart.products.reduce((sum, p) => sum + p.total, 0);
            store.cart.discountedTotal = store.cart.total; // Для демо просто равно

            ui.updateCartBadge(store.cart.totalQuantity);
            store.save(); // Сохраняем в localStorage

            // Фоновый запрос на сервер (Только для авторизованных)
            if (store.token && store.cart.id !== 'local') {
                apiDummy.updateCartQuantity(store.cart.id, productId, existing ? existing.quantity : 1).catch(console.error);
            }
        }
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', init);
