# VSKRYTIE — Документация

## Текущий статус

**Фаза**: Phase 1 почти завершена
**Шаг**: Осталось — Telegram Bot + деплой на Vercel
**Дата**: 2026-03-19

---

## Что сделано

- [x] Идея и концепция продукта ([`docs/project-idea.md`](project-idea.md))
- [x] CLAUDE.md настроен под проект
- [x] Документация создана
- [x] Phase 1: Next.js 15 инициализирован, зависимости установлены
- [x] Phase 1: Supabase проект создан (`spgrwxwljbcsshopkwzp`), таблицы `users`, `reports`, `payments`
- [x] Phase 1: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/telegram/validate.ts`
- [x] Phase 1: `types/supabase.ts` — TypeScript типы из схемы
- [x] Phase 1: Root layout + Poppins font + design tokens
- [x] Phase 1: BottomNav component
- [x] Phase 1: Главная страница (placeholder)

## Что осталось

- [ ] Phase 1: Создать Telegram Bot через @BotFather → заполнить `.env.local`
- [ ] Phase 1: Заполнить `SUPABASE_SERVICE_ROLE_KEY` из Supabase Dashboard → Settings → API
- [ ] Phase 1: Деплой на Vercel
- [ ] Phase 2: Ядро — запрос → Perplexity → Claude → отчёт
- [ ] Phase 3: Оплата — Telegram Stars
- [ ] Phase 4: UI полировка

---

## Документация

| Файл | Содержание |
|---|---|
| [`docs/roadmap.md`](roadmap.md) | Фазы MVP, шаги, статусы |
| [`docs/architecture.md`](architecture.md) | Архитектура, схемы потоков, Supabase схема |
| [`docs/design.md`](design.md) | Дизайн-система, цвета, компоненты |
| [`docs/ui-flow.md`](ui-flow.md) | UI флоу, экраны, секции отчёта, скетчи |
| [`docs/project-idea.md`](project-idea.md) | Оригинальная идея продукта |

---

## Следующее действие

1. Получить `SUPABASE_SERVICE_ROLE_KEY` из [Supabase Dashboard](https://supabase.com/dashboard/project/spgrwxwljbcsshopkwzp/settings/api) → заполнить `.env.local`
2. Создать Telegram Bot через @BotFather → заполнить `TELEGRAM_BOT_TOKEN` и `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в `.env.local`
3. Получить ключи Perplexity и Anthropic → заполнить `.env.local`
4. Деплой на Vercel

Подробнее — [`docs/roadmap.md`](roadmap.md).
