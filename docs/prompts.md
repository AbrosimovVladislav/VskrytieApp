# Промпты

## Perplexity API

| Шаг | Назначение | Файл |
|---|---|---|
| 1 (fallback) | Уточнение названия команды, если API-Sports не нашёл | Встроен в step-find-match |
| 4 | Кадры и контекст (травмы, вратарь, ротация) | [`prompts/squad-context.md`](prompts/squad-context.md) |

## Claude API

| Шаг | Назначение | Файл |
|---|---|---|
| 5 | Анализ и рекомендация | [`prompts/analysis-claude.md`](prompts/analysis-claude.md) |

Промпты шаблонизированы — лига, дата, команды подставляются из данных и конфига лиги ([`league-configs.md`](league-configs.md)).
