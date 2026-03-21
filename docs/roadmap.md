# Roadmap

## Текущая фаза: 3 (сбор данных)

---

## Фаза 0 — Документация + типы ✅

- ✅ Разбить `request-pipeline.md` на модульную документацию
- ✅ Создать `types/pipeline.ts` — все интерфейсы (LeagueConfig, MatchInfo, PipelineResult, AnalysisReport)
- ✅ Создать `lib/config/leagues/khl.ts` — стартовый конфиг КХЛ
- ✅ Проверить, что Telegram Mini App интеграция работает (layout, validate)

---

## Фаза 1 — Оркестратор (скелет) ✅

Цель: `lib/pipeline/orchestrator.ts` — функция `runPipeline(input) → result`, все 8 шагов — заглушки с фейковыми данными. UI показывает лоадер с прогрессом по шагам.

- ✅ Создать `lib/pipeline/orchestrator.ts`
- ✅ 8 шагов-заглушек (каждый в своём файле `lib/pipeline/steps/`)
- ✅ API route `app/api/analyze/route.ts`
- ✅ UI: лоадер pipeline (stepper с точками)
- ✅ UI: вывод результата текстом (JSON → читаемый текст)

Тестирование: пользователь вызывает оркестратор, видит flow с моками.

---

## Фаза 2 — Поиск матча (шаг 1) ✅

- ✅ `lib/pipeline/steps/find-match.ts` — реальный запрос в Perplexity
- ✅ Парсинг ответа → `MatchInfo`
- ✅ Логика уточнения (не нашли → вопрос пользователю с вариантами)
- ✅ UI: ввод (спорт → лига → запрос)

---

## Фаза 3 — Сбор данных (шаги 2–7)

Каждая подфаза — один шаг оркестратора, реальный запрос в Perplexity.

### 3.1 — Контекст и мотивация (шаг 2) ✅
- ✅ `lib/pipeline/steps/context-motivation.ts`
- ✅ Промпт из шаблона → Perplexity → парсинг → `MotivationData`

### 3.2 — Форма команд (шаг 3)
- ⬜ `lib/pipeline/steps/form.ts`
- ⬜ Промпт → Perplexity → парсинг → `FormData`

### 3.3 — H2H (шаг 4)
- ⬜ `lib/pipeline/steps/h2h.ts`
- ⬜ Промпт → Perplexity → парсинг → `H2HData`

### 3.4 — Статистика сезона (шаг 5)
- ⬜ `lib/pipeline/steps/stats.ts`
- ⬜ Промпт динамический из `statsFields` → Perplexity → парсинг → `StatsData`

### 3.5 — Кадры и контекст (шаг 6)
- ⬜ `lib/pipeline/steps/squad-context.ts`
- ⬜ Промпт → Perplexity → парсинг → `SquadContextData`

### 3.6 — Букмекерские линии (шаг 7)
- ⬜ `lib/pipeline/steps/odds.ts`
- ⬜ Промпт с букмекерами из конфига → Perplexity → парсинг → `OddsData`

---

## Фаза 4 — Анализ Claude (шаг 8)

- ⬜ `lib/pipeline/steps/analysis.ts`
- ⬜ Системный промпт-шаблон (спорт из конфига)
- ⬜ Сборка всех данных в user-промпт
- ⬜ Claude → JSON → `AnalysisReport`

---

## Фаза 5 — UI отчёта

- ⬜ Компонент отчёта: вертикальный скролл карточек-секций
- ⬜ Секция: шапка матча
- ⬜ Секция: мотивация
- ⬜ Секция: форма команд (dots + список)
- ⬜ Секция: H2H
- ⬜ Секция: статистика (сравнительные бары, динамический рендеринг)
- ⬜ Секция: контекст (кадры, новости)
- ⬜ Секция: коэффициенты (таблица)
- ⬜ Секция: рекомендация
- ⬜ Дисклеймер
- ⬜ Skeleton-loading, анимации по `design.md`

---

## Фаза 6 — Polish

- ⬜ End-to-end прогон: ввод → Perplexity → Claude → отчёт
- ⬜ Error handling, таймауты, fallback при частичных данных
- ⬜ Адаптация под Telegram Mini App (safe areas, theme)
- ⬜ Финальная полировка UI
