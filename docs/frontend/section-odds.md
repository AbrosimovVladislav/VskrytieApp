# Секция: Коэффициенты

Коэффициенты от букмекеров — единая таблица-грид.

## Компонент

`components/report/section-odds.tsx` → `OddsSection`

## Данные

Из `AnalysisReport.odds`:

```ts
{
  data: {
    bookmakers: BookmakerOdds[];
    // { name, outcome_home, outcome_draw, outcome_away, total_over, total_under }
  },
  analysis: string;
}
```

## Макет

Единая таблица с заголовком и строками:

```
┌──────────────────────────────────┐
│           П1   X    П2  ТБ   ТМ │  ← заголовок
│ ─────────────────────────────── │
│ Фонбет  2.10 3.40 3.15 1.85 1.95│  ← строка
│ Винлайн 2.05 3.50 3.20 1.80 2.00│
│ PARI    2.08 3.45 3.18 1.82 1.98│
└──────────────────────────────────┘
```

## Стили

- Обёртка: `bg-bg-card-dark rounded-[12px] overflow-hidden`
- Заголовок: `px-3 py-2 border-b border-border/30`
- Лейблы (П1, X, П2, ТБ, ТМ): `text-text-secondary text-[10px] uppercase flex-1 text-center`
- Строки: `px-3 py-2`, разделитель `border-b border-border/15`
- Название БК: `w-[80px] shrink-0 text-text text-[12px] font-medium`
- Коэффициенты: `font-display text-[12px] tabular-nums flex-1 text-center`
- Лучший в столбце: `text-accent`
- Обычный: `text-text-secondary`
- Анализ Claude: `text-accent italic`
