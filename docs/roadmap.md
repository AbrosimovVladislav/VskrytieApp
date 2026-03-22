# Roadmap

## Текущая фаза: 1

---

## Фаза 0 — Типы + конфиги + клиенты ✅

- ✅ `types/pipeline.ts` — интерфейсы (MatchInfo, OddsData, SquadContextData, FormData, AnalysisReport, LeagueConfig)
- ✅ `lib/config/leagues/khl.ts` — конфиг КХЛ (bookmakers, betMarkets, api_league_id, season)
- ✅ `lib/api/sports-api.ts` — клиент API-Sports Hockey v1 (fetch + auth, base URL: `https://v1.hockey.api-sports.io`)
- ✅ `lib/api/perplexity.ts` — клиент Perplexity API (OpenAI-совместимый SDK)
- ✅ `lib/api/claude.ts` — обёртка Anthropic SDK (structured output → JSON)

---

## Фаза 1 — Поиск матча + скелет pipeline

- ⬜ `lib/pipeline/steps/find-match.ts` — `/teams?search={query}` → `/games?team={id}&league={id}&season={year}` → фильтр NS
- ⬜ Fallback: Perplexity для уточнения названия → retry API
- ⬜ `lib/pipeline/orchestrator.ts` — базовый оркестратор (пока только шаг 1)
- ⬜ `app/api/analyze/route.ts` — API route, стриминг прогресса
- ⬜ UI: страница ввода (спорт → лига → запрос)
- ⬜ UI: лоадер pipeline (stepper, 5 шагов)
- ⬜ UI: если не нашли — уточнение у пользователя
- ⬜ E2E: ввёл команду → нашёл матч → видно в UI

---

## Фаза 2 — Сбор данных (шаги 2–4)

- ⬜ `lib/pipeline/steps/odds.ts` — `/odds?game={game_id}` → маппинг букмекеров через `/odds/bookmakers` → OddsData
- ⬜ `lib/pipeline/steps/form.ts` — `/games?team={id}&league={id}&season={year}` → фильтр FT/AOT/AP → последние 5 → FormData
- ⬜ `lib/pipeline/steps/squad-context.ts` — Perplexity → SquadContextData (травмы, вратарь, ротация)
- ⬜ Оркестратор: добавить шаги 2–4 (параллельно после шага 1)
- ⬜ E2E: ввёл команду → нашёл матч → собрал данные

---

## Фаза 3 — Анализ Claude + UI отчёта

- ⬜ `lib/pipeline/steps/analysis.ts` — Anthropic SDK, structured output
- ⬜ Системный промпт из `prompts/analysis-claude.md` (коэфы = основа, контекст = корректировка)
- ⬜ Оркестратор: добавить шаг 5 → полный pipeline
- ⬜ UI: секции отчёта (шапка, коэфы, контекст, форма, рекомендация)
- ⬜ E2E: полный прогон — ввод → поиск → данные → анализ → отчёт

---

## Фаза 4 — Polish

- ⬜ Error handling, таймауты, fallback при частичных данных
- ⬜ Адаптация под Telegram Mini App (safe areas, theme)
- ⬜ Финальная полировка UI
- ⬜ Авторизация через Telegram, личный кабинет

---

## После MVP

- Кэширование отчётов (матч = ключ, отдаём повторно)
- История анализов пользователя
- Больше лиг (НХЛ, РПЛ, АПЛ)
- Больше рынков ставок
- Больше секций в отчёте (H2H, статистика, мотивация)
- Telegram Stars оплата
