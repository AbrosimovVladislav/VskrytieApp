# SSE Event Model

Формат: `data: { type, payload }\n\n`

## Шаги прогресса

| Событие | Payload | Когда |
|---|---|---|
| `step:identify` | `{ status: 'done' }` | initData валидна, матч найден |
| `step:collect` | `{ status: 'in_progress' \| 'done' }` | Sports API + Perplexity |
| `step:analyze` | `{ status: 'in_progress' }` | Claude запрос начат |

## Секции отчёта

| Событие | Payload | Описание |
|---|---|---|
| `section:context` | `ContextSection` | Контекст матча |
| `section:form` | `FormSection` | Форма + H2H |
| `section:stats` | `StatsSection[]` | Статистика |
| `section:injuries` | `InjuriesSection[]` | Травмы |
| `section:context_factors` | `ContextFactorsSection` | Погода, судья, отдых |
| `section:odds` | `OddsSection[]` | Коэффициенты |
| `section:recommendation` | `{ token: string }` | Токен за токеном |

## Завершение

| Событие | Payload | Когда |
|---|---|---|
| `done` | `{ reportId: string }` | Отчёт готов |
| `error` | `{ message: string, code?: string }` | Ошибка |

## Типы данных секций

См. [`../ui/data-types.md`](../ui/data-types.md)
