# Секция: Статистика сезона

Сравнительные метрики обеих команд за сезон.

## Данные

Из `AnalysisReport.stats`:

```ts
{
  data: {
    team1: Record<string, string | number>;
    team2: Record<string, string | number>;
  },
  analysis: string;
}
```

## Макет

Сравнительные бары — для каждой метрики горизонтальная шкала:

```
Голы забитые
ЦСКА  ████████████░░░░  156
СКА   ░░░░████████████  142

Большинство (%)
ЦСКА  ██████████░░░░░░  22.5%
СКА   ░░░░░░██████████  19.1%
```

## Важно: динамический рендеринг

Набор метрик **не захардкожен**. Рендерится из ключей `data.team1` / `data.team2`. Для каждого ключа из `statsFields` конфига лиги нужен human-readable лейбл. Маппинг лейблов:

| Ключ | Лейбл (КХЛ) |
|---|---|
| position | Позиция |
| points | Очки |
| goalsFor | Голы забитые |
| goalsAgainst | Голы пропущенные |
| avgGoalsFor | Ср. голов за матч |
| avgGoalsAgainst | Ср. пропущенных |
| powerPlayPct | Большинство (%) |
| penaltyKillPct | Меньшинство (%) |
| penaltyMinutes | Штрафные мин/матч |
| shotsPerGame | Броски за матч |

- Бары: `bg-accent` для team1, `bg-text-secondary` для team2
- Анализ Claude внизу секции
