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
  - ✅ OpenAI web search (`gpt-4o-search-preview`) — статистика
  - ✅ Claude API (sonnet-4-6) — генерация отчёта
  - ✅ Стриминг через Server-Sent Events
- ✅ Экран отчёта
- ✅ Сохранение в Supabase
- ✅ Экран истории

### Phase 3 — Полировка POC 🔲

- ❌ Подключить реальный Telegram initData через `@tma.js/sdk-react`
- ❌ Upsert пользователя при первом запуске
- ❌ Счётчик оставшихся отчётов на главном экране
- ❌ Skeleton placeholder при загрузке
- ❌ Telegram тема (dark/light)
- ❌ Haptic feedback на ключевых действиях

---

## MVP

**Цель**: Монетизируемый продукт с оплатой и нормальным UX.

### Phase 4 — Оплата: Telegram Stars 🔲

- ❌ Модель: N бесплатных отчётов, далее — Stars
- ❌ `POST /api/payments/invoice` — создание инвойса
- ❌ `POST /api/webhook` — `pre_checkout_query` и `successful_payment`
- ❌ Обновление баланса в Supabase после оплаты
- ❌ UI: экран покупки, счётчик отчётов

### Phase 5 — Полировка MVP 🔲

- ❌ Onboarding для новых пользователей
- ❌ Экран настроек
- ❌ Error states и empty states (полный охват)
- ❌ Performance audit (bundle size, LCP)

---

## Backlog

- Push-уведомления через Telegram Bot
- Избранные команды
- Экспорт отчёта в PDF
- Поддержка нескольких видов спорта (хоккей, теннис, баскетбол)
