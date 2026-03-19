# VSKRYTIE — Roadmap

## Phase 0 — Подготовка ✅

- [x] Концепция продукта
- [x] CLAUDE.md
- [x] docs/ структура

---

## Phase 1 — Инфраструктура 🔲

**Цель**: Рабочее Next.js приложение внутри Telegram с базой данных.

- [ ] Инициализировать Next.js 15 проект (Turbopack, TypeScript, Tailwind v4)
- [ ] Установить зависимости: `@tma.js/sdk-react`, `@supabase/ssr`, shadcn/ui
- [ ] Создать Telegram Bot через @BotFather, получить токен
- [ ] Настроить Supabase проект, создать таблицы `users`, `reports`
- [ ] Настроить `lib/supabase/client.ts` и `lib/supabase/server.ts`
- [ ] Настроить `lib/telegram/validate.ts`
- [ ] Базовый layout с bottom navigation
- [ ] Деплой на Vercel, настроить HTTPS URL в Telegram Bot как Mini App

---

## Phase 2 — Ядро: Отчёт 🔲

**Цель**: Пользователь вводит запрос — получает аналитический отчёт.

- [ ] Главный экран с полем ввода запроса (команда/матч)
- [ ] `POST /api/analyze` endpoint
  - [ ] Валидация Telegram initData
  - [ ] Запрос к Perplexity API (sonar) — получение статистики
  - [ ] Запрос к Claude API (sonnet-4-6) — генерация отчёта
  - [ ] Стриминг ответа в клиент через Server-Sent Events или Response stream
- [ ] Экран отчёта с секциями:
  - Форма команды / результаты последних матчей
  - Травмы и состав
  - H2H история
  - Коэффициенты букмекеров
  - Итоговая рекомендация
- [ ] Сохранение отчёта в Supabase (`reports` таблица)
- [ ] Экран истории отчётов

---

## Phase 3 — Оплата: Telegram Stars 🔲

**Цель**: Монетизация через Telegram Stars.

- [ ] Модель: N бесплатных отчётов, далее — Stars
- [ ] `POST /api/payments/invoice` — создание инвойса через Bot API
- [ ] Telegram webhook (`POST /api/webhook`) — обработка `pre_checkout_query` и `successful_payment`
- [ ] Обновление баланса/статуса в Supabase после оплаты
- [ ] UI: экран покупки, счётчик оставшихся отчётов

---

## Phase 4 — Полировка UI 🔲

**Цель**: Продакшн-качество интерфейса.

- [ ] Анимации загрузки отчёта (skeleton, streaming индикатор)
- [ ] Onboarding экран для новых пользователей
- [ ] Экран настроек (язык, уведомления)
- [ ] Error states и empty states
- [ ] Telegram тема (dark/light) — финальная проверка
- [ ] Haptic feedback на ключевых действиях
- [ ] Performance audit (bundle size, LCP)

---

## Backlog

- Push-уведомления через Telegram Bot (напоминания)
- Избранные команды
- Экспорт отчёта в PDF
- Поддержка нескольких видов спорта (хоккей, теннис, баскетбол)
