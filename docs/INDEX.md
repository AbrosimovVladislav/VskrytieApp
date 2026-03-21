# ВСКРЫТИЕ — Документация

## Для Claude: как начать сессию

1. Прочитай [`roadmap.md`](roadmap.md) — текущая фаза и статус
2. Уточни у пользователя задачу
3. Читай **только нужный файл** из таблицы ниже

---

## Навигация

| Задача | Файл |
|---|---|
| Что за проект? Стек? | [`concept.md`](concept.md) |
| Текущая фаза, что делать? | [`roadmap.md`](roadmap.md) |
| Цвета, шрифты, компоненты, анимации | [`design.md`](design.md) |
| Конфиги лиг (КХЛ, добавление новых) | [`league-configs.md`](league-configs.md) |

### Backend (оркестратор + шаги)

| Задача | Файл |
|---|---|
| Как работает pipeline, все шаги | [`backend.md`](backend.md) |
| Шаг 1: Поиск матча | [`backend/step-find-match.md`](backend/step-find-match.md) |
| Шаг 2: Контекст и мотивация | [`backend/step-context-motivation.md`](backend/step-context-motivation.md) |
| Шаг 3: Форма команд | [`backend/step-form.md`](backend/step-form.md) |
| Шаг 4: H2H | [`backend/step-h2h.md`](backend/step-h2h.md) |
| Шаг 5: Статистика сезона | [`backend/step-stats.md`](backend/step-stats.md) |
| Шаг 6: Кадры и контекст | [`backend/step-squad-context.md`](backend/step-squad-context.md) |
| Шаг 7: Букмекерские линии | [`backend/step-odds.md`](backend/step-odds.md) |
| Шаг 8: Анализ Claude | [`backend/step-analysis.md`](backend/step-analysis.md) |

### Frontend (UI отчёта)

| Задача | Файл |
|---|---|
| Общая структура UI | [`frontend.md`](frontend.md) |
| Лоадер pipeline | [`frontend/section-loader.md`](frontend/section-loader.md) |
| Шапка матча | [`frontend/section-header.md`](frontend/section-header.md) |
| Мотивация | [`frontend/section-motivation.md`](frontend/section-motivation.md) |
| Форма команд | [`frontend/section-form.md`](frontend/section-form.md) |
| H2H | [`frontend/section-h2h.md`](frontend/section-h2h.md) |
| Статистика | [`frontend/section-stats.md`](frontend/section-stats.md) |
| Контекст (кадры, новости) | [`frontend/section-context.md`](frontend/section-context.md) |
| Коэффициенты | [`frontend/section-odds.md`](frontend/section-odds.md) |
| Рекомендация | [`frontend/section-recommendation.md`](frontend/section-recommendation.md) |

### Промпты

| Задача | Файл |
|---|---|
| Все промпты (оглавление) | [`prompts.md`](prompts.md) |
| Промпт: поиск матча | [`prompts/find-match.md`](prompts/find-match.md) |
| Промпт: контекст | [`prompts/context-motivation.md`](prompts/context-motivation.md) |
| Промпт: форма | [`prompts/form.md`](prompts/form.md) |
| Промпт: H2H | [`prompts/h2h.md`](prompts/h2h.md) |
| Промпт: статистика | [`prompts/stats.md`](prompts/stats.md) |
| Промпт: кадры | [`prompts/squad-context.md`](prompts/squad-context.md) |
| Промпт: коэффициенты | [`prompts/odds.md`](prompts/odds.md) |
| Промпт: анализ Claude | [`prompts/analysis-claude.md`](prompts/analysis-claude.md) |

---

## Правила

- **Один файл = одна тема.** Не дублируй информацию между файлами — ссылайся.
- **Обновляй `roadmap.md`** после завершения задачи.
- **Читай только нужные файлы** — не загружай всю документацию в контекст.
