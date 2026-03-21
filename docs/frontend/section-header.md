# Секция: Шапка матча

Верхний блок отчёта — информация о матче.

## Компонент

`components/report/match-header.tsx` → `MatchHeader`

## Данные

Из `AnalysisReport.match`:

```ts
{
  team1: string;   // "ЦСКА"
  team2: string;   // "СКА"
  date: string;    // "25 марта 2026"
  time: string;    // "19:30 МСК"
  venue: string;   // "Арена ЦСКА"
  league: string;  // "КХЛ"
}
```

## Макет

```
┌──────────────────────────────┐
│           КХЛ                │
│                              │
│     ЦСКА    vs    СКА        │
│                              │
│  25 марта 2026 · 19:30 МСК  │
│       Арена ЦСКА             │
└──────────────────────────────┘
```

## Стили

- Лига: `text-text-secondary text-[12px] uppercase tracking-wider`
- Команды: `font-semibold text-text` — адаптивный размер:
  - До 10 символов: `text-[18px]`
  - До 14 символов: `text-[16px]`
  - 15+: `text-[14px]`
- Команды занимают `flex-1 min-w-0 wrap-break-word` — без truncate, полные названия
- vs: `text-muted text-[14px] shrink-0`
- Дата/время/арена: `text-text-secondary text-[13px]`
- Карточка: `bg-bg-card rounded-[--radius-card] border border-border p-4 text-center`
