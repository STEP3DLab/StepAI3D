# StepAI3D

StepAI3D — одностраничный сайт очного мастер-класса по ИИ, 3D-моделированию и 3D-печати.

## Локальный запуск

Откройте проект любым статическим сервером, например:

```bash
python3 -m http.server 8000
```

После запуска откройте `http://localhost:8000`.

## Структура проекта

```text
.
├── index.html
├── consent.html
├── privacy-policy.html
├── terms.html
├── robots.txt
├── sitemap.xml
├── media-contact-sheet.jpg
└── assets/
    ├── styles/main.css
    ├── scripts/main.js
    ├── VK.jpg
    ├── gallery-chess.jpg
    ├── gallery-statues.jpg
    └── gallery-workshop.jpg
```

## Примечание по форме

Форма заявки оставлена без backend-интеграции: она проверяет структуру/валидацию на фронтенде и показывает техническое сообщение об отправке на следующем этапе.

## Публикация

Проект очищен и готов к публикации на GitHub Pages (статический хостинг, относительные пути, без локальных зависимостей).
