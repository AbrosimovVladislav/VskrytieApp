# Секция: H2H (история встреч)

Все матчи между командами в текущем сезоне.

## Компонент

`components/report/section-h2h.tsx` → `H2HSection`

## Данные

Из `AnalysisReport.h2h`:

```ts
{
  data: {
    games: H2HGame[];  // { date, score, venue }
  },
  analysis: string;
}
```

## Макет

Список встреч, каждая — тёмная карточка с цветовым индикатором победителя:

```
┌──────────────────────────────┐
│ ▌ ЦСКА      2 : 1      СКА  │  ← зелёная полоса слева (team1 win)
│   15.11          Арена ЦСКА  │
└──────────────────────────────┘
```

## Стили

- Имена команд: `text-[12px] flex-1 min-w-0` — **без truncate**, полные названия
- Победитель: `text-positive font-medium` / `text-negative font-medium`
- Счёт: `text-[16px] font-semibold tabular-nums shrink-0 mx-2`, по центру
- Индикатор: `w-1 bg-positive` (слева) / `w-1 bg-negative` (справа)
- Дата/арена: `text-[10px] text-text-secondary/60`
- Анализ Claude: `text-accent italic`
