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
2. Коэффициенты
3. Контекст
4. Форма команд
5. Анализ AI

Подробнее: [`frontend/section-loader.md`](frontend/section-loader.md)

## Отчёт

Вертикальный скролл из карточек-секций. Каждая секция = данные + анализ Claude.

| Секция | Документация |
|---|---|
| Шапка матча | [`frontend/section-header.md`](frontend/section-header.md) |
| Коэффициенты | [`frontend/section-odds.md`](frontend/section-odds.md) |
| Контекст | [`frontend/section-context.md`](frontend/section-context.md) |
| Форма команд | [`frontend/section-form.md`](frontend/section-form.md) |
| Рекомендация | [`frontend/section-recommendation.md`](frontend/section-recommendation.md) |
| Дисклеймер | Статичный текст внизу отчёта |

## Принципы

- Каждая секция — отдельный компонент
- Skeleton-loading по `design.md`
