# Roadmap

## Текущая фаза: 6 (Sports API)

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

**Подход**: каждый реализованный шаг сразу передаёт реальные данные в UI (через `analysis.ts` → `AnalysisReport`). Поле `analysis` (зелёный текст) — заглушка до фазы 4. Все ответы Perplexity очищаются от ссылок `[N]` через `clean()`.

### 3.1 — Контекст и мотивация (шаг 2) ✅

- ✅ `lib/pipeline/steps/context-motivation.ts`
- ✅ Промпт из шаблона → Perplexity → парсинг → `MotivationData`
- ✅ Очистка ссылок `[N]` из ответов Perplexity
- ✅ Передача реальных данных в UI через `analysis.ts`

### 3.2 — Форма команд (шаг 3) ✅

- ✅ `lib/pipeline/steps/form.ts` — Perplexity → парсинг → `FormData`
- ✅ Передача реальных данных в UI через `analysis.ts`
- ⚠️ **→ Sports API (фаза 6)**: Perplexity выдаёт неверные счета матчей

### 3.3 — H2H (шаг 4) ✅

- ✅ `lib/pipeline/steps/h2h.ts` — Perplexity → парсинг → `H2HData`
- ✅ Передача реальных данных в UI через `analysis.ts`
- ⚠️ **→ Sports API (фаза 6)**: точные счета встреч нужны из API

### 3.4 — Статистика сезона (шаг 5) ✅

- ✅ `lib/pipeline/steps/stats.ts` — `statsFields` из конфига → Perplexity → `StatsData`
- ✅ Передача реальных данных в UI через `analysis.ts`
- ⚠️ **→ Sports API (фаза 6)**: точные цифры статистики нужны из API

### 3.5 — Кадры и контекст (шаг 6) ✅

- ✅ `lib/pipeline/steps/squad-context.ts` — Perplexity → парсинг → `SquadContextData`
- ✅ Передача реальных данных в UI через `analysis.ts`

### 3.6 — Букмекерские линии (шаг 7) ✅

- ✅ `lib/pipeline/steps/odds.ts` — букмекеры из конфига → Perplexity → `OddsData`
- ✅ Передача реальных данных в UI через `analysis.ts`

---

## Фаза 4 — Анализ Claude (шаг 8) ✅

- ✅ `lib/pipeline/steps/analysis.ts`
- ✅ Системный промпт-шаблон (спорт из конфига)
- ✅ Сборка всех данных в user-промпт
- ✅ Claude → JSON → `AnalysisReport`

---

## Фаза 5 — UI отчёта ✅

- ✅ Компонент отчёта: вертикальный скролл карточек-секций
- ✅ Секция: шапка матча
- ✅ Секция: мотивация
- ✅ Секция: форма команд (dots + список)
- ✅ Секция: H2H
- ✅ Секция: статистика (сравнительные бары, динамический рендеринг)
- ✅ Секция: контекст (кадры, новости)
- ✅ Секция: коэффициенты (таблица)
- ✅ Секция: рекомендация
- ✅ Дисклеймер
- ✅ Skeleton-loading, анимации по `design.md`

---

## Фаза 6 — Sports API

Perplexity ненадёжен для фактических данных (счета матчей, результаты). Подключаем спортивные API для точных данных.

- ⬜ Выбор и подключение Sports API (API-Hockey, API-Football и т.д.)
- ⬜ Переделать шаг 3.2 (Форма) на Sports API
- ⬜ Переделать шаг 3.3 (H2H) на Sports API
- ⬜ Переделать шаг 3.4 (Статистика) на Sports API
- ⬜ Адаптер: единый интерфейс для разных спортов/лиг

---

## Фаза 7 — Polish

- ⬜ End-to-end прогон: ввод → данные → Claude → отчёт
- Пункт меню с историей запросов конкретного юзера
- ⬜ Error handling, таймауты, fallback при частичных данных
- ⬜ Адаптация под Telegram Mini App (safe areas, theme)
- Авторизация через телегу автоматом, личный кабинет
- 
- ⬜ Финальная полировка UI

