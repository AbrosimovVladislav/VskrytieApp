# Промпт: H2H (шаг 4)

**API**: Perplexity

## Шаблон

```
Все матчи между {team1} и {team2} в {league.name} сезона {league.season}.
Дата, счёт, место проведения.
```

## Переменные

| Переменная | Источник |
|---|---|
| `{team1}`, `{team2}` | `MatchInfo` |
| `{league.name}` | `LeagueConfig.name` |
| `{league.season}` | `LeagueConfig.season` |

## Пример (КХЛ)

```
Все матчи между ЦСКА и СКА в КХЛ сезона 2025/2026.
Дата, счёт, место проведения.
```
