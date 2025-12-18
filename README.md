Сборка проекта на Pug с использованием Gulp для автоматизации процессов разработки.

## Технологии
```
HTML: Pug (шаблонизатор)
CSS: Sass/SCSS + Autoprefixer
JavaScript: ES6+ с Babel
Оптимизация: ImageMin, SVG Sprite
Сервер: BrowserSync
Сборщик: Gulp 4
```

## Структура проекта
```
./
├── dist/
│   ├── assets/             # Исходные файлы
│   │   ├── data/           # JSON данные для Pug
│   │   ├── downloads/      # Файлы для скачивания
│   │   ├── pug/            # Pug шаблоны
│   │   ├── styles/         # Sass/SCSS стили
│   │   ├── js/             # JavaScript файлы
│   │   ├── img/            # Изображения
│   │   └── fonts/          # Шрифты
│   └── build/              # Собранные файлы
│       ├── html/           # Скомпилированные HTML
│       ├── downloads/      # Файлы для скачивания
│       ├── css/            # Скомпилированные CSS
│       ├── js/             # Скомпилированные JS
│       └── img/            # Оптимизированные изображения
├── gulpfile.js             # Конфигурация Gulp
└── package.json            # Зависимости проекта
└── .gitignore              # gitignore
```

## Предварительные требования
Node.js - версия 14 или выше
(запускаю на 18.12.1)

## Установка зависимостей
```
npm install
```

## Запуск в режиме разработки локально http://localhost:3000/html/
```
npm run dev
```

## Доступные команды
- `npm run dev` - Запуск сервера разработки с BrowserSync
- `npm run build` - Production сборка проекта
- `npm run clean` - Очистка папки сборки
- `npm run bitrix` - Build для битрикс проекта без Pug (не тестил)
