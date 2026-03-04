# Search4U

Веб-застосунок для пошуку та планування пішохідних маршрутів у місті. Користувач обирає настрій, бюджет та час — застосунок знаходить підходящі маршрути, прокладає шлях від стартової точки та показує погоду.

## Технологічний стек

| Шар | Технології |
|-----|-----------|
| Backend | Python 3.12, Django 5, Django REST Framework, SimpleJWT |
| Frontend | React 19, Vite, Leaflet.js |
| Авторизація | JWT, Google OAuth (через dj-rest-auth + allauth) |
| Карти | OpenStreetMap, OSRM (маршрути), Nominatim (геокодинг) |
| БД | SQLite (dev) |
| Інше | django-filter, django-environ, Pillow, CORS headers |

## Можливості

- **Пошук маршрутів** за настроєм, бюджетом, часом та типом місця
- **Геолокація** — кнопка "Де я?" визначає поточне місцезнаходження
- **Адресний пошук** через Nominatim (OpenStreetMap)
- **Прокладання маршруту** від стартової точки до найближчої точки маршруту (OSRM)
- **Фото до точок** — адміністратор і користувачі можуть завантажувати фото
- **Офлайн-карта** — збереження тайлів Львова для роботи без інтернету
- **Темна тема** із збереженням у localStorage
- **Оцінки маршрутів** — від 1 до 5 зірок з коментарем
- **Погода** — поточна погода для міста через OpenWeatherMap
- **Профіль** — статистика маршрутів, збережені та завершені

## Структура проєкту

```
Search4U/
├── backend/
│   ├── config/          # Налаштування Django (settings, urls, wsgi)
│   ├── routes/          # Маршрути, точки, фото, оцінки
│   ├── users/           # Кастомна модель User, Google OAuth
│   ├── weather/         # Проксі до OpenWeatherMap
│   └── manage.py
└── frontend/
    └── app/
        ├── src/
        │   ├── api/         # Axios клієнт + всі API-запити
        │   ├── components/  # FilterItem, WeatherWidget тощо
        │   ├── context/     # AuthContext, ThemeContext
        │   └── pages/       # MainPage, AccountPage
        └── vite.config.js
```

## Встановлення та запуск

### Backend

**1. Клонуй репозиторій та перейди до бекенду:**
```bash
cd backend
```

**2. Створи та активуй віртуальне середовище:**
```bash
python -m venv venv
source venv/bin/activate      # Linux / macOS
venv\Scripts\activate         # Windows
```

**3. Встанови залежності:**
```bash
pip install -r requirements.txt
```

**4. Створи файл `.env` у папці `backend/`:**
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Опціонально
OPENWEATHER_API_KEY=your_openweathermap_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**5. Застосуй міграції та створи суперкористувача:**
```bash
python manage.py migrate
python manage.py createsuperuser
```

**6. Запусти сервер:**
```bash
python manage.py runserver
```

API доступне за адресою: `http://localhost:8000`
Адмін-панель: `http://localhost:8000/admin/`

---

### Frontend

**1. Перейди до фронтенду та встанови залежності:**
```bash
cd frontend/app
npm install
```

**2. Запусти dev-сервер:**
```bash
npm run dev
```

Застосунок доступний за адресою: `http://localhost:5173`

## Змінні середовища

| Змінна | Обов'язкова | Опис |
|--------|------------|------|
| `SECRET_KEY` | + | Django secret key |
| `DEBUG` | + | `True` для розробки, `False` для продакшну |
| `ALLOWED_HOSTS` | + | Дозволені хости (через кому) |
| `CORS_ALLOWED_ORIGINS` | + | Дозволені origins для CORS |
| `OPENWEATHER_API_KEY` | - | API ключ для погоди |
| `GOOGLE_CLIENT_ID` | - | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth Client Secret |

## API Endpoints

| Метод | URL | Опис | Auth |
|-------|-----|------|------|
| `GET` | `/api/routes/` | Список маршрутів (з фільтрами) | Ні |
| `GET` | `/api/routes/<id>/` | Деталі маршруту | Ні |
| `GET/POST` | `/api/routes/<id>/ratings/` | Оцінки маршруту | POST потребує |
| `POST` | `/api/routes/points/<id>/photos/` | Завантажити фото до точки | Так |
| `GET/POST` | `/api/user/routes/` | Збережені маршрути користувача | Так |
| `GET` | `/api/users/me/` | Профіль поточного користувача | Так |
| `GET` | `/api/weather/?city=Lviv` | Погода | Ні |
| `POST` | `/api/auth/login/` | Вхід (email + password) | Ні |
| `POST` | `/api/auth/google/` | Вхід через Google | Ні |
| `POST` | `/api/auth/token/refresh/` | Оновлення JWT токена | Ні |

### Фільтри для `/api/routes/`

```
?mood=calm|adventurous|curious
?category=parks|museums|cafes|mixed
?budget_max__lte=200
?budget_min__gte=50
?duration__lte=120
?search=назва або місто
?ordering=avg_rating|-avg_rating|estimated_duration|created_at
```

## Розробка

### Додати новий маршрут
Маршрути, точки та фото можна додавати через Django адмін-панель (`/admin/`).

### Міграції після зміни моделей
```bash
python manage.py makemigrations
python manage.py migrate
```

### Збірка фронтенду для продакшну
```bash
cd frontend/app
npm run build
```

## Автори

Розроблено як навчальний проєкт з використанням Django REST Framework та React.
