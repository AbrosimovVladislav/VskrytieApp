# Секция: Рекомендация

Итоговая рекомендация — ставки с обоснованием.

## Компонент

`components/report/section-recommendation.tsx` → `RecommendationSection`, `Disclaimer`

## Данные

Из `AnalysisReport.recommendation`:

```ts
{
  summary: string;  // "На основе анализа всех факторов..."
  bets: [
    {
      market: string;       // "Исход в основное время"
      pick: string;         // "П1"
      confidence: "high" | "medium" | "low";
      reasoning: string;    // "ЦСКА дома выиграл 80% матчей..."
    }
  ]
}
```

## Макет

```
┌──────────────────────────────┐
│ РЕКОМЕНДАЦИЯ                 │  ← border-accent
│                              │
│ "На основе анализа..."       │  ← text-accent italic
│                              │
│ ┌──────────────────────────┐ │
│ │ Исход в основное время   │ │  ← market (мелкий)
│ │ П1              ●●●○ HIGH│ │  ← pick (крупно) + confidence
│ │ ЦСКА дома выиграл 80%...  │ │  ← reasoning
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Тотал                    │ │
│ │ ТБ 4.5          ●●○○ MED│ │
│ │ Средний тотал в H2H...   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## Стили

- Блок: `bg-bg-card-dark border border-border-accent rounded-[--radius-card] p-3`
- Заголовок: `font-semibold text-accent text-[14px]`
- Summary: `text-accent text-[13px] italic` (зелёный)
- Карточка ставки: `bg-bg-overlay rounded-[12px] p-3 border border-border/50`
- Market: `text-text-secondary text-[12px]` — сверху отдельной строкой
- Pick: `font-display text-accent text-[16px]` — слева
- Confidence dots (●●●○) + label — справа на той же строке
  - `high` → `text-positive`
  - `medium` → `text-warning`
  - `low` → `text-negative`
- Reasoning: `text-text-secondary text-[13px]`

## Дисклеймер

Статичный текст после рекомендации:

> Данные носят информационный характер. Сервис не несёт ответственности за результаты ставок. Решение всегда за вами.

Стиль: `text-muted text-[12px] text-center`
