# ВСКРЫТИЕ — Документация

## Для Claude: как начать сессию

1. Прочитай [`roadmap.md`](roadmap.md) — текущая фаза и статус
2. Уточни у пользователя задачу
3. Читай **только нужный файл** из таблицы ниже

---

## Навигация

| Задача | Файл |
|---|---|
| Что за проект? Стек? Принципы? | [`concept.md`](concept.md) |
| Текущая фаза, что делать? | [`roadmap.md`](roadmap.md) |
| Цвета, шрифты, компоненты | [`design.md`](design.md) |
| Конфиги лиг | [`league-configs.md`](league-configs.md) |

### Backend (pipeline)

| Задача | Файл |
|---|---|
| Архитектура pipeline, все шаги | [`backend.md`](backend.md) |
| Шаг 1: Поиск матча (API-Sports) | [`backend/step-find-match.md`](backend/step-find-match.md) |
| Шаг 2: Коэффициенты (API-Sports) | [`backend/step-odds.md`](backend/step-odds.md) |
| Шаг 3: Форма команд (API-Sports) | [`backend/step-form.md`](backend/step-form.md) |
| Шаг 4: Контекст (Perplexity) | [`backend/step-squad-context.md`](backend/step-squad-context.md) |
| Шаг 5: Анализ (Claude) | [`backend/step-analysis.md`](backend/step-analysis.md) |

### Frontend (UI отчёта)

| Задача | Файл |
|---|---|
| Общая структура UI | [`frontend.md`](frontend.md) |
| Лоадер pipeline | [`frontend/section-loader.md`](frontend/section-loader.md) |
| Шапка матча | [`frontend/section-header.md`](frontend/section-header.md) |
| Коэффициенты | [`frontend/section-odds.md`](frontend/section-odds.md) |
| Контекст | [`frontend/section-context.md`](frontend/section-context.md) |
| Форма команд | [`frontend/section-form.md`](frontend/section-form.md) |
| Рекомендация | [`frontend/section-recommendation.md`](frontend/section-recommendation.md) |

### Промпты

| Задача | Файл |
|---|---|
| Все промпты (индекс) | [`prompts.md`](prompts.md) |
| Промпт: контекст (Perplexity) | [`prompts/squad-context.md`](prompts/squad-context.md) |
| Промпт: анализ (Claude) | [`prompts/analysis-claude.md`](prompts/analysis-claude.md) |

---

## Правила

- **Один файл = одна тема.** Не дублируй информацию — ссылайся.
- **Обновляй `roadmap.md`** после завершения задачи.
- **Обновляй документацию** после изменений в коде.
- **Читай только нужные файлы** — не загружай всё в контекст.
