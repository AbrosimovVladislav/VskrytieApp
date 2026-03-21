# Секция: Статистика сезона

Сравнительные метрики обеих команд за сезон.

## Компонент

`components/report/section-stats.tsx` → `StatsSection`

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

Легенда сверху (точки + имена). Для каждой метрики — значения по сторонам, лейбл по центру. Бар team1 идёт справа-налево, team2 — слева-направо (зеркально):

```
● ЦСКА   ● СКА                    ← легенда (точки, не квадраты)

 3.0      Атака      2.6
     ████████████  ████████░░░░

 2.4      Оборона    2.5
     ██████████░░  ████████████
```

## Стили

- Легенда: `text-[11px]`, точка `w-2 h-2 rounded-full`
  - Team1: `bg-accent`
  - Team2: `bg-text-secondary`
- Значение team1: `text-text font-medium text-[13px] tabular-nums` — **слева**
- Лейбл: `text-text-secondary text-[12px] text-center flex-1`
- Значение team2: `text-text-secondary text-[13px] tabular-nums` — **справа**
- Бары: `h-[6px] rounded-full`, два рядом через `flex gap-1`
  - Team1 бар: `bg-accent`, выравнивание `justify-end` (растёт справа-налево)
  - Team2 бар: `bg-text-secondary` (растёт слева-направо)
- Анализ Claude: `text-accent italic`

## Динамический рендеринг

Набор метрик рендерится из ключей `data.team1` / `data.team2`. После `filterStats` в `analysis.ts` приходят 4 категории: Атака, Оборона, Большинство, Меньшинство.
