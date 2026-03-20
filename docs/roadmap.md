# VSKRYTIE — Roadmap

---

## POC — Proof of Concept

**Цель**: Рабочий прототип — пользователь открывает бота, вводит запрос, получает отчёт.

### Phase 0 — Подготовка ✅

- ✅ Концепция продукта
- ✅ CLAUDE.md
- ✅ docs/ структура

### Phase 1 — Инфраструктура ✅

- ✅ Next.js 15 проект (Turbopack, TypeScript, Tailwind v4)
- ✅ Зависимости: `@tma.js/sdk-react`, `@supabase/ssr`, shadcn/ui
- ✅ Telegram Bot через @BotFather
- ✅ Supabase проект, таблицы `users`, `reports`, `payments`
- ✅ `lib/supabase`, `lib/telegram/validate.ts`
- ✅ Layout с bottom navigation
- ✅ Деплой на Vercel, Mini App в BotFather

### Phase 2 — Ядро: Отчёт ✅

- ✅ Главный экран с полем ввода запроса
- ✅ `POST /api/analyze` — SSE endpoint
  - ❌ Реальная валидация Telegram initData (сейчас `'dev'`)
  - ✅ Perplexity sonar — поиск матча + статистика
  - ✅ Claude API (haiku-4-5) — генерация отчёта
  - ✅ Стриминг через Server-Sent Events
- ✅ Экран отчёта
- ✅ Сохранение в Supabase
- ✅ Экран истории

### Phase 3 — Визуальный отчёт ✅

- ✅ Типы `MatchData` + `AnalysisReport` + `FullReport` — двухчастная модель данных
- ✅ Claude промпт → JSON output: MatchData (context, form, h2h, stats, injuries, contextFactors, odds) + AnalysisReport (5 секционных анализов + recommendation с bets)
- ✅ Компоненты: Context (с мотивацией), Form+H2H (объединены), Stats (xG-перформанс + бары), Injuries (impact-иконки), ContextFactors (погода/судья/отдых), Odds (value-бейджи), Recommendation (confidence dots + bet-карточки)
- ✅ Симуляция стриминга для recommendation summary
- ✅ Skeleton states для 7 секций
- ✅ Анимации появления секций (fade-in + slide-up)
- ✅ Perplexity промпты расширены (xG, мотивация, судья, погода, трансферы)
- ✅ SSE: 3 шага (identify/collect/analyze) + 7 секций

> Дизайн: [`docs/ui-flow.md`](ui-flow.md) секции 3.0–3.6

### Phase 4 — Полировка POC 🔲

- ❌ Подключить реальный Telegram initData через `@tma.js/sdk-react`
- ❌ Upsert пользователя при первом запуске
- ❌ Счётчик оставшихся отчётов на главном экране
- ❌ Skeleton placeholder при загрузке
- ❌ Telegram тема (dark/light)
- ❌ Haptic feedback на ключевых действиях

---

## MVP

**Цель**: Монетизируемый продукт с оплатой и нормальным UX.

### Phase 5 — Оплата: Telegram Stars 🔲

- ❌ Модель: N бесплатных отчётов, далее — Stars
- ❌ `POST /api/payments/invoice` — создание инвойса
- ❌ `POST /api/webhook` — `pre_checkout_query` и `successful_payment`
- ❌ Обновление баланса в Supabase после оплаты
- ❌ UI: экран покупки, счётчик отчётов

### Phase 6 — Полировка MVP 🔲

- ❌ Onboarding для новых пользователей
- ❌ Экран настроек
- ❌ Error states и empty states (полный охват)
- ❌ Performance audit (bundle size, LCP)

---

## Backlog

- Оптимизация поискового флоу: TheSportsDB (расписание) + локальная классификация + Perplexity только для статистики → надёжность 60%→95%, стоимость -25%. [План](.claude/plans/magical-snacking-cocke.md)
- Push-уведомления через Telegram Bot
- Избранные команды
- Экспорт отчёта в PDF
- Поддержка нескольких видов спорта (хоккей, теннис, баскетбол)

