# Frontend — UI отчёта

Дизайн-система: [`design.md`](design.md)

## Страница ввода

Пользователь выбирает:
1. **Вид спорта** — кнопки-табы
2. **Лига** — dropdown (зависит от спорта)
3. **Запрос** — текстовый ввод (команда или матч)

Дата определяется автоматически.

## Лоадер pipeline

Пока pipeline работает — отображаем прогресс. Визуально: точки, соединённые линиями (вертикальный stepper). Каждая точка = шаг оркестратора. Текущий шаг подсвечен, пройденные — зелёные.

Шаги для отображения:
1. Поиск матча
2. Контекст и мотивация
3. Форма команд
4. История встреч
5. Статистика
6. Кадры и новости
7. Коэффициенты
8. Анализ AI

Подробнее: [`frontend/section-loader.md`](frontend/section-loader.md)

## Отчёт

Вертикальный скролл из карточек-секций. Каждая секция = данные + анализ Claude.

| Секция | Документация |
|---|---|
| Шапка матча | [`frontend/section-header.md`](frontend/section-header.md) |
| Мотивация | [`frontend/section-motivation.md`](frontend/section-motivation.md) |
| Форма команд | [`frontend/section-form.md`](frontend/section-form.md) |
| H2H | [`frontend/section-h2h.md`](frontend/section-h2h.md) |
| Статистика | [`frontend/section-stats.md`](frontend/section-stats.md) |
| Контекст | [`frontend/section-context.md`](frontend/section-context.md) |
| Коэффициенты | [`frontend/section-odds.md`](frontend/section-odds.md) |
| Рекомендация | [`frontend/section-recommendation.md`](frontend/section-recommendation.md) |
| Дисклеймер | Статичный текст внизу отчёта |

## Принципы

- Набор метрик в секции "Статистика" рендерится **динамически** из данных, не захардкожен
- Каждая секция — отдельный компонент
- Skeleton-loading по `design.md`
