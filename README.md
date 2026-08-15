# Student Progress Tracker

Статический сайт для просмотра прогресса учеников и защищённая Firebase Authentication административная панель учителя.

## Технологии

- HTML
- CSS
- Vanilla JavaScript
- Firebase Firestore
- Firebase Authentication
- GitHub Pages

## Firebase configuration

1. Откройте `js/firebase-config.js`.
2. Замените placeholder-значения в `firebaseConfig` данными вашего существующего Firebase web app.
3. Сохраните файл.

В Firebase Console включите Email/Password sign-in и создайте учётную запись учителя. Пароль не хранится в репозитории. Firestore Security Rules должны разрешать публичное чтение `students` и запись только авторизованному учителю с нужным UID.

Ожидаемая структура данных: `students/{studentId}` с полем `name`, а результаты — в `students/{studentId}/units/{unitId}` с числовыми полями `vocabulary`, `grammar`, `speaking`, `average`.

## Локальный запуск

ES modules не следует открывать через `file://`. Запустите папку через локальный веб-сервер, например VS Code Live Server, и откройте `index.html`. Установка npm-пакетов и сборка не нужны.

## GitHub Pages

Загрузите содержимое проекта в репозиторий, затем в **Settings → Pages** выберите публикацию нужной ветки и папки. Все внутренние пути относительные, поэтому сайт работает и по адресу репозитория GitHub Pages.

Перед публикацией проверьте публичный трекер, вход/выход учителя, сохранение, добавление и удаление Unit, а также отказ в записи для неавторизованного пользователя.
