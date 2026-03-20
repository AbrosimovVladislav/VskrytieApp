# Архитектура — Обзор

## Общая схема

```
User (Telegram Mini App)
  │  POST /api/analyze { query, sport }
  │  Header: X-Init-Data
  ▼
Next.js API Route → SSE stream
  │
  ├─ 1. Валидация initData + проверка баланса
  ├─ 2. Sports API + Perplexity (параллельно)  → [pipeline.md]
  ├─ 3. Расчёт метрик на сервере
  ├─ 4. Claude API → JSON отчёт (стрим)        → [sse.md]
  └─ 5. Сохранение в Supabase                  → [supabase.md]
```

## Источники данных

| Источник | Что даёт | Подробнее |
|---|---|---|
| **Sports API** (api-sports.io) | Факты: расписание, результаты, травмы, коэфы | [`pipeline.md`](pipeline.md) |
| **Perplexity API** | Контекст: мотивация, ротация, судья, погода | [`pipeline.md`](pipeline.md) |
| **Наш сервер** | Расчёты: средние голы, серии, BTTS%, форма | [`pipeline.md`](pipeline.md) |
| **Claude API** | Анализ: текст отчёта, рекомендации | [`pipeline.md`](pipeline.md) |

## API Routes

| Route | Method | Описание |
|---|---|---|
| `/api/analyze` | POST | Генерация отчёта → SSE стрим |
| `/api/webhook` | POST | Telegram Bot webhook (оплата) |
| `/api/payments/invoice` | POST | Создание инвойса Stars |

**Auth**: все routes требуют `X-Init-Data` заголовок (Telegram initData). Валидация: `lib/telegram/validate.ts`.

## Компоненты (файловая структура)

```
app/
  layout.tsx, page.tsx, report/[id]/page.tsx, history/page.tsx, settings/page.tsx

components/
  shared/   → bottom-nav, loading-skeleton
  report/   → 7 секций отчёта, report-card, stats-badge, recommendation
  payment/  → stars-button

lib/
  sports-api/client.ts, perplexity/client.ts, claude/client.ts
  supabase/client.ts, supabase/server.ts
  telegram/validate.ts, calculations/metrics.ts
```

## Связанные документы

- Пайплайн данных: [`pipeline.md`](pipeline.md)
- SSE события: [`sse.md`](sse.md)
- БД: [`supabase.md`](supabase.md)
- Оплата: [`payments.md`](payments.md)
