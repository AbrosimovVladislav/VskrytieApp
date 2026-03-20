# VSKRYTIE — Roadmap

---

## POC — Proof of Concept ✅

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
- ✅ Perplexity sonar — классификация запроса + поиск матча
- ✅ Perplexity sonar-pro — сбор статистики
- ✅ Claude API (haiku-4-5) — два вызова: MatchData JSON + AnalysisReport JSON
- ✅ Стриминг через Server-Sent Events (3 шага + 7 секций)
- ✅ Экран отчёта с 7 секциями
- ✅ Сохранение в Supabase
- ✅ Экран истории

### Phase 3 — Визуальный отчёт ✅

- ✅ Типы `MatchData` + `AnalysisReport` + `FullReport` — двухчастная модель данных
- ✅ Компоненты: Context, Form+H2H, Stats (xG-перформанс + бары), Injuries, ContextFactors, Odds (value-бейджи), Recommendation (confidence dots + bet-карточки)
- ✅ Симуляция стриминга для recommendation summary
- ✅ Skeleton states для 7 секций
- ✅ Анимации появления секций (fade-in + slide-up)
- ✅ Perplexity промпты расширены (xG, мотивация, судья, погода, трансферы)

> Секции отчёта: [`ui/report-sections.md`](ui/report-sections.md)

---

## MVP

**Цель**: Надёжные данные, авторизация, доведённый UI.

### Phase 4 — Sports API: надёжные данные ✅

Гибридный пайплайн реализован (подробнее — [`arch/pipeline.md`](arch/pipeline.md)):

- ✅ Подключить API-Sports (api-sports.io) — бесплатный план, 100 запросов/день
- ✅ `lib/sports-api/client.ts` — обёртка для API-Football, API-Hockey, API-Basketball
- ✅ Шаг 1: Поиск матча через Sports API вместо Perplexity
- ✅ Шаг 2: Структурированные данные параллельно (~10 запросов)
- ✅ Шаг 3: Perplexity остаётся только для контекста (мотивация, ротация, судья, погода, трансферы)
- ✅ `lib/calculations/metrics.ts` — расчёт производных метрик
- ✅ Обновить `POST /api/analyze` — новый 5-шаговый пайплайн
- ✅ Fallback: Sports API недоступен → Perplexity с пометкой о неточности

### Phase 5 — UI по документации 🔲

Довести фронтенд до состояния из спецификации (см. [`ui/overview.md`](ui/overview.md), [`ui/report-sections.md`](ui/report-sections.md), [`design.md`](design.md)):

- ✅ Выбор спорта — табы ⚽🏒🏀 над полем ввода
- ❌ Счётчик оставшихся отчётов на главном экране
- ❌ Telegram тема (dark/light)
- ❌ Haptic feedback на ключевых действиях
- ❌ Аудит компонентов отчёта vs спецификация — привести к дизайну из [`design.md`](design.md)
- ❌ Страница Balance (заглушка без оплаты)
- ❌ Страница Settings

### Phase 6 — Авторизация и пользователи 🔲

Каждый пользователь видит свою историю и баланс:

- ❌ Реальная валидация Telegram initData через `@tma.js/sdk-react` (сейчас `'dev'`)
- ❌ Upsert пользователя в Supabase при первом запуске
- ❌ Привязка отчётов к `telegram_user_id` — история только своя
- ❌ Баланс `reports_remaining` — проверка перед генерацией, декремент после

### Phase 7 — Полировка MVP 🔲

- ❌ Error states и empty states (полный охват)
- ❌ Onboarding для новых пользователей
- ❌ Performance audit (bundle size, LCP)
- ❌ Всё что осталось после Phase 4-6

---

## Post-MVP — Backlog

- Оплата: Telegram Stars (инвойсы, webhook, пакеты)
- Push-уведомления через Telegram Bot
- Избранные команды
- Экспорт отчёта в PDF
- Расширение спортов (теннис — отдельный API)
- xG из платного API (Sportmonks) вместо Perplexity
