# Шаг 1 — Поиск матча

**Источник**: API-Sports Hockey v1
**Base URL**: `https://v1.hockey.api-sports.io`

## Вход

```ts
{
  query: string;   // запрос пользователя ("ЦСКА", "Спартак Динамо")
  sport: string;   // из UI
  league: string;  // из UI (id лиги)
}
```

## Логика

### 1. Поиск команды

`GET /teams?search={query}&league={api_league_id}&season={season}`

- Параметр `search` — минимум 3 символа
- Можно фильтровать по `league`, `country`, `season`
- Если API вернул несколько результатов — берём наиболее точное совпадение по названию

### 2. Получение следующего матча

`GET /games?team={team_id}&league={api_league_id}&season={season}`

Из ответа фильтруем матчи со статусом `NS` (Not Started) и берём ближайший по дате:
- **Дата > сегодня** → подходит
- **Дата = сегодня** → сравниваем время начала с текущим временем МСК
- **Дата < сегодня** → отбрасываем (завершённые матчи)

> **Важно**: в Hockey API нет параметров `next` / `last`. Получаем все матчи сезона и фильтруем на стороне сервера.

### Fallback: Perplexity

Если API-Sports не нашёл команду (неточное название, транслитерация) — запрос в Perplexity для уточнения правильного названия → повторный поиск в API.

### Если ничего не найдено

Возвращаем пользователю уточняющий вопрос с вариантами (если есть).

## Выход

```ts
interface MatchInfo {
  team1: string;
  team2: string;
  game_id: number;     // ID матча в API-Sports (в Hockey API это "game", не "fixture")
  team1_id: number;    // ID команды (нужен для шага 3)
  team2_id: number;
  date: string;        // "2026-03-25"
  time: string;        // "19:30 МСК"
  league: string;      // "КХЛ"
}
```

## Если не удалось определить

```ts
interface MatchClarification {
  message: string;
  suggestions?: string[];
}
```
