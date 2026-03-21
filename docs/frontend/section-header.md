# Секция: Шапка матча

Верхний блок отчёта — информация о матче.

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

- Лига: `text-text-secondary text-[12px]`
- Команды: `font-display text-xl` (Press Start 2P)
- vs: `text-muted`
- Дата/время/арена: `text-text-secondary text-[14px]`
