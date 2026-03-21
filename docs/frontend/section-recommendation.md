# Секция: Рекомендация

Итоговая рекомендация — 2 ставки с обоснованием.

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
    },
    {
      market: string;       // "Тотал"
      pick: string;         // "ТБ 4.5"
      confidence: "high" | "medium" | "low";
      reasoning: string;
    }
  ]
}
```

## Макет

```
┌──────────────────────────────┐
│ 🎯 РЕКОМЕНДАЦИЯ             │
│                              │
│ "На основе анализа..."       │
│                              │
│ ┌──────────────────────────┐ │
│ │ Исход: П1                │ │
│ │ Уверенность: ●●●○ HIGH   │ │
│ │ ЦСКА дома выиграл 80%...  │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Тотал: ТБ 4.5            │ │
│ │ Уверенность: ●●○○ MEDIUM │ │
│ │ Средний тотал в H2H...   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## Стили

- Карточка: AI-блок (`bg-bg-card-dark`)
- Summary: `text-[14px] text-text-secondary`
- Pick: `font-display text-accent text-[16px]`
- Confidence:
  - `high` → `text-positive`
  - `medium` → `text-warning`
  - `low` → `text-negative`
- Reasoning: `text-[14px] text-text-secondary`

## Дисклеймер

Статичный текст после рекомендации:

> Данные носят информационный характер. Сервис не несёт ответственности за результаты ставок. Решение всегда за вами.

Стиль: `text-muted text-[12px] text-center`
