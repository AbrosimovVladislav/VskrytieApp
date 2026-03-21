# Секция: Коэффициенты

Таблица коэффициентов от 5 букмекеров.

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

Таблица:

```
           П1    X    П2    ТБ4.5  ТМ4.5
Фонбет    2.10  3.40  3.15  1.85   1.95
Винлайн   2.05  3.50  3.20  1.80   2.00
PARI      2.15  3.35  3.10  1.82   1.98
Олимпбет  2.08  3.45  3.18  1.87   1.93
Лига Ст.  2.12  3.38  3.12  1.83   1.97
```

## Стили

- Заголовки столбцов: `text-text-secondary text-[12px] font-semibold`
- Названия БК: `text-text text-[14px]`
- Коэффициенты: `font-display text-[14px] tabular-nums`
- Лучший (максимальный) коэффициент в столбце: `text-accent font-semibold`
- Анализ Claude внизу секции
