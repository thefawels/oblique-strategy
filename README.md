# oblique strategy

PWA с 155 карточками на русском, тактильным откликом на поддерживаемых iPhone и офлайн-режимом после первого открытия. Включены последние исправления стопки и плавная смена текста кнопки. Сборка и установка зависимостей не нужны.

## Опубликовать на GitHub Pages

1. Распакуй архив на компьютере.
2. [Создай репозиторий](https://github.com/new) с именем `oblique-strategy`: выбери **Public**, включи **Add README** и нажми **Create repository**.
3. В репозитории открой **Add file → Upload files**. Перетащи всё содержимое распакованной папки, включая папки `assets` и `source`. Файл `index.html` должен оказаться сразу в корне репозитория. Сам ZIP загружать не нужно. Сохрани изменения в ветку **main** кнопкой **Commit changes**.
4. Открой **Settings → Pages**. В **Source** выбери **Deploy from a branch**, ниже — **main** и **/(root)**. Нажми **Save**.
5. Дождись завершения публикации. В **Settings → Pages** появится ссылка на сайт вида `https://USERNAME.github.io/oblique-strategy/`.

Для бесплатного GitHub Pages используется публичный репозиторий. Порядок публикации описан в [документации GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site); загрузка файлов — [здесь](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

На iPhone открой новый адрес в Safari и добавь его на экран «Домой». Если уже установлена версия с прежнего адреса, новая ссылка устанавливается отдельно.

## Обновления

Загружай изменённые файлы в **main** — GitHub Pages опубликует их автоматически. Для обновления офлайн-копии увеличивай номер `v3` одновременно в `index.html` и `sw.js`.

Тексты находятся в `cards.js`, а оригинал сохранён в `source/ObliqueStrategiesRU.txt`. Номер карточки соответствует её строке в оригинале.
