# Секция: Мотивация

Турнирное положение и мотивация каждой команды — инфографика.

## Компонент

`components/report/section-motivation.tsx` → `MotivationSection`

## Данные

Из `AnalysisReport.motivation` — **структурированные** `TeamMotivation`:

```ts
{
  data: {
    team1: TeamMotivation;  // { position, fighting_for, priority }
    team2: TeamMotivation;
    stage: string;          // "Плей-офф, 1/4 финала"
  },
  analysis: string;
}
```

## Макет

Бейдж стадии сезона сверху. Две карточки бок о бок (grid 2 cols), каждая содержит:

```
┌──────────────┬──────────────┐
│ ЦСКА         │ СКА          │
│              │              │
│ ┌──┐ 5-е     │ ┌──┐ 2-е     │  ← позиция: бейдж-число + текст
│ │ 5│ место   │ │ 2│ место   │
│ └──┘         │ └──┘         │
│              │              │
│ [плей-офф]   │ [лидерство]  │  ← fighting_for как тег (accent)
│              │              │
│ ████░ HIGH   │ ██░░░ MED    │  ← приоритет: шкала 3 полоски
└──────────────┴──────────────┘
── анализ ────────────────────
"ЦСКА мотивирован больше..."   ← text-accent italic
```

## Стили

- Стадия: `text-[11px] text-text-secondary bg-white-8 px-2 py-1 rounded-[5px]`
- Карточки: `bg-bg-card-dark rounded-[12px] p-3`, grid-cols-2 gap-2
- Имя команды: `font-medium text-[13px] text-text`
- Позиция бейдж: `w-9 h-9 rounded-lg bg-bg-overlay border border-border/50`, число `font-display text-[14px] text-accent`
- Позиция текст: `text-text-secondary text-[11px]`
- Fighting_for тег: `text-[11px] text-accent bg-accent-dim px-2 py-0.5 rounded-tag`
- Приоритет шкала: 3 полоски `w-4 h-1.5 rounded-full`, залитые = цвет приоритета, пустые = `bg-border`
  - HIGH/максимальный: `bg-positive`
  - MED/средний: `bg-warning`
  - LOW/низкий: `bg-negative`
