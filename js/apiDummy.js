// Работа с API DummyJSON
import { store } from './store.js';

const API_BASE = 'https://dummyjson.com';

export const apiDummy = {
    // Получить все жанры (категории)
    async fetchCategories() {
        return [
            { slug: 'Fiction', name: 'Художественная литература' },
            { slug: 'Fantasy', name: 'Фэнтези' },
            { slug: 'Romance', name: 'Роман' },
            { slug: 'Science Fiction', name: 'Научная фантастика' },
            { slug: 'Business', name: 'Бизнес' },
            { slug: 'Psychology', name: 'Психология' },
            { slug: 'History', name: 'История' },
            { slug: 'Cooking', name: 'Кулинария' },
            { slug: 'Art & Design', name: 'Искусство и дизайн' },
            { slug: 'Kids', name: 'Детские книги' }
        ];
    },

    // Получить книги (товары)
    async fetchProducts(category = '') {
        try {
            // Искусственная задержка для загрузки (UI-loader)
            await new Promise(r => setTimeout(r, 300));

            const BOOKS_DB = [
                { id: 1, title: "The Great Gatsby", price: 299, category: "Fiction" },
                { id: 2, title: "To Kill a Mockingbird", price: 349, category: "Fiction" },
                { id: 3, title: "1984", price: 250, category: "Science Fiction" },
                { id: 4, title: "Pride and Prejudice", price: 199, category: "Romance" },
                { id: 5, title: "The Catcher in the Rye", price: 250, category: "Fiction" },
                { id: 6, title: "Lord of the Rings", price: 999, category: "Fantasy" },
                { id: 7, title: "Animal Farm", price: 150, category: "Fiction" },
                { id: 8, title: "Dune", price: 450, category: "Science Fiction" },
                { id: 9, title: "The Hobbit", price: 399, category: "Fantasy" },
                { id: 10, title: "Fahrenheit 451", price: 299, category: "Science Fiction" },
                { id: 11, title: "Sapiens", price: 550, category: "History" },
                { id: 12, title: "Thinking, Fast and Slow", price: 490, category: "Psychology" },
                { id: 13, title: "Atomic Habits", price: 400, category: "Business" },
                { id: 14, title: "The Diary of a Young Girl", price: 250, category: "History" },
                { id: 15, title: "The Lean Startup", price: 350, category: "Business" },
                { id: 16, title: "Rich Dad Poor Dad", price: 320, category: "Business" },
                { id: 17, title: "Clean Code", price: 600, category: "Art & Design" },
                { id: 18, title: "JavaScript: The Good Parts", price: 450, category: "Art & Design" },
                { id: 19, title: "A Game of Thrones", price: 550, category: "Fantasy" },
                { id: 20, title: "Harry Potter and the Sorcerer's Stone", price: 380, category: "Fantasy" }
            ];

            if (category && category !== 'All') {
                return BOOKS_DB.filter(book => book.category === category);
            }

            return BOOKS_DB;
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    // Авторизация (моковая)
    async login(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    token: 'mock_token_' + username,
                    userId: 999
                });
            }, 500);
        });
    },

    // Проверка текущего пользователя по токену (моковая)
    async checkAuth() {
        if (!store.token) return false;

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id: store.userId, username: 'Покупатель' });
            }, 300);
        });
    },

    // Получить корзину пользователя
    async fetchCart(userId) {
        try {
            const response = await fetch(`${API_BASE}/carts/user/${userId}`);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке корзины');
            }

            const data = await response.json();

            // Если у пользователя нет корзины, API возвращает объект с пустым массивом carts
            if (data.carts && data.carts.length > 0) {
                return data.carts[0]; // Берем первую корзину
            }
            return null;
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            throw error;
        }
    },

    // Обновление всей корзины (или частичное)
    async updateCartQuantity(cartId, productId, quantity) {
        try {
            const response = await fetch(`${API_BASE}/carts/${cartId}`, {
                method: 'PATCH', // Используем PATCH по ТЗ
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merge: true,
                    products: [
                        {
                            id: productId,
                            quantity: quantity
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка обновления корзины');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Ошибка изменения количества:', error);
            throw error;
        }
    }
};
