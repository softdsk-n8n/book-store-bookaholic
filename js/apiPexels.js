import { store } from './store.js';

// Список жанров
const GENRES = [
    "Fiction", "Fantasy", "Romance", "Science Fiction",
    "Business", "Psychology", "History", "Cooking",
    "Art & Design", "Kids"
];

// Fallback изображение
const FALLBACK_IMAGE = 'assets/placeholder-book.jpg';

// Резервный пул реальных обложек книг (с Амазона / OpenLibrary для 100% надёжности)
const REAL_COVERS_MAP = {
    "The Great Gatsby": "https://covers.openlibrary.org/b/id/10455502-L.jpg",
    "To Kill a Mockingbird": "https://m.media-amazon.com/images/I/81gepf1eMqL._AC_UF1000,1000_QL80_.jpg",
    "1984": "https://covers.openlibrary.org/b/id/153229-L.jpg",
    "Pride and Prejudice": "https://m.media-amazon.com/images/I/71Q1tPupKjL._AC_UF1000,1000_QL80_.jpg",
    "The Catcher in the Rye": "https://covers.openlibrary.org/b/id/8259441-L.jpg",
    "Lord of the Rings": "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg",
    "Animal Farm": "https://m.media-amazon.com/images/I/71JUJ6pGoIL._AC_UF1000,1000_QL80_.jpg",
    "Dune": "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg",
    "The Hobbit": "https://m.media-amazon.com/images/I/712cDO7d73L._AC_UF1000,1000_QL80_.jpg",
    "Fahrenheit 451": "https://covers.openlibrary.org/b/id/8301777-L.jpg",
    "Sapiens": "https://covers.openlibrary.org/b/id/12470796-L.jpg",
    "Thinking, Fast and Slow": "https://covers.openlibrary.org/b/id/7340003-L.jpg",
    "Atomic Habits": "https://m.media-amazon.com/images/I/81YkqyaFVEL._AC_UF1000,1000_QL80_.jpg",
    "The Diary of a Young Girl": "https://covers.openlibrary.org/b/id/12519114-L.jpg",
    "The Lean Startup": "https://m.media-amazon.com/images/I/81-QB7nDh4L._AC_UF1000,1000_QL80_.jpg",
    "Rich Dad Poor Dad": "https://m.media-amazon.com/images/I/81bsw6fnUiL._AC_UF1000,1000_QL80_.jpg",
    "Clean Code": "https://m.media-amazon.com/images/I/41xShlnTZTL._AC_UF1000,1000_QL80_.jpg",
    "JavaScript: The Good Parts": "https://m.media-amazon.com/images/I/81kqrwS1nNL._AC_UF1000,1000_QL80_.jpg",
    "A Game of Thrones": "https://m.media-amazon.com/images/I/91dSMhdIzTL._AC_UF1000,1000_QL80_.jpg",
    "Harry Potter and the Sorcerer's Stone": "https://m.media-amazon.com/images/I/81iqZ2HHD-L._AC_UF1000,1000_QL80_.jpg",
};

export const apiPexels = {
    // Получить обложку для продукта
    async getBookCover(productId, queryTitle = '') {
        // Если у нас есть напрямую прописанная обложка книги в базе (без ключей, без лимитов, работает 100%)
        if (REAL_COVERS_MAP[queryTitle]) {
            return REAL_COVERS_MAP[queryTitle];
        }

        // 1. Проверяем кэш на всякий случай
        const cachedUrl = store.getCachedImage(productId);
        if (cachedUrl) {
            return cachedUrl;
        }

        const apiKey = window.CONFIG && window.CONFIG.PEXELS_API_KEY;
        const randomGenre = GENRES[productId % GENRES.length];
        const shortTitle = queryTitle.split(' ').slice(0, 2).join(' ').replace(/[^a-zA-Z0-9 ]/g, '');

        const queries = [
            `${shortTitle} book cover`, // По названию
            `${randomGenre} book theme`
        ];

        for (const query of queries) {
            const url = await this.searchImage(query, apiKey);
            if (url) {
                store.setCachedImage(productId, url);
                return url;
            }
        }

        store.setCachedImage(productId, FALLBACK_IMAGE);
        return FALLBACK_IMAGE;
    },

    // Вспомогательный метод поиска на Pexels
    async searchImage(query, apiKey) {
        if (!apiKey || apiKey === 'YOUR_PEXELS_API_KEY_HERE') return null;

        try {
            // Ищем вертикальные обложки
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=1`, {
                headers: {
                    'Authorization': apiKey
                }
            });

            if (!res.ok) {
                console.warn(`Pexels API error status: ${res.status} for query: ${query}`);
                return null;
            }

            const data = await res.json();

            if (data.photos && data.photos.length > 0) {
                // Возвращаем large (или среднюю, чтобы не было слишком тяжелым)
                return data.photos[0].src.medium || data.photos[0].src.large;
            }

            return null;
        } catch (error) {
            console.error('Pexels search error:', error);
            return null;
        }
    }
};
