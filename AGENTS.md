<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Правила для агентов

## Начало работы

1. Прочитай `docs/INDEX.md` — навигация по документации
2. Прочитай `docs/roadmap.md` — текущая фаза и статус
3. Читай **только те доки, которые нужны для твоей задачи** (см. таблицу в INDEX.md)
4. Не читай всю документацию — экономь контекст

## Код

- **Типы** — импортируй из `types/pipeline.ts`. Не создавай дублирующие интерфейсы.
- **API клиенты** — используй `lib/api/sports-api.ts` и `lib/api/perplexity.ts`. Не пиши fetch inline.
- **Конфиги лиг** — импортируй из `lib/config/leagues/`. Не хардкодь league_id, season, bookmakers.
- **Env vars** — см. `.env.example`. Не хардкодь ключи.
- **Каждый pipeline step** — отдельный файл в `lib/pipeline/steps/`. Экспортирует одну async функцию.

## Стиль

- TypeScript strict
- Без лишних абстракций — прямой код
- Ошибки: бросай, не глотай молча
- Комментарии только если логика неочевидна
