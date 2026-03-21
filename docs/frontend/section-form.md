# Секция: Форма (последние 5 матчей)

Визуализация последних 5 результатов каждой команды.

## Компонент

`components/report/section-form.tsx` → `FormSection`

## Данные

Из `AnalysisReport.form`:

```ts
{
  data: {
    team1_last5: GameResult[];
    team2_last5: GameResult[];
  },
  analysis: string;
}
```

## Макет

Для каждой команды — карточка с названием, процентом побед и полосой из цветных сегментов:

```
┌──────────────────────────────┐
│ ЦСКА                     60% │  ← имя + процент побед (font-display)
│ ┌──┬──┬──┬──┬──┐            │
│ │ В│ В│ П│ В│ П│            │  ← цветные сегменты (зелёный/красный)
│ └──┴──┴──┴──┴──┘            │
│ 3:1 2:0 1:3 4:2 0:2         │  ← счета мелко под сегментами
└──────────────────────────────┘
```

**Список матчей НЕ показывается** — данные из Perplexity ненадёжны. Когда подключим Sports API (фаза 6), можно вернуть.

## Стили

- Карточка: `bg-bg-card-dark rounded-[12px] p-3`
- Имя: `text-text font-medium text-[13px]`
- Процент побед: `font-display text-[12px] text-accent`
- Сегменты: `flex-1 h-8 rounded-md`, с буквой результата по центру
  - W: `bg-positive text-bg`
  - L: `bg-negative text-white`
  - OTW: `bg-positive/60 text-bg`
  - OTL: `bg-negative/60 text-white`
- Буква: `text-[11px] font-semibold`
- Счёт: `text-[9px] text-text-secondary`
- Анализ Claude: `text-accent italic`
