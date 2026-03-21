# Секция: Кадры и контекст

Травмы, медиа-сводка, ротации — структурированно.

## Компонент

`components/report/section-context.tsx` → `ContextSection`

## Данные

Из `AnalysisReport.context` — **структурированные** `TeamSquadContext` + AI-анализ:

```ts
{
  team1: TeamSquadContext;  // { injuries, media_summary, rotation_expected }
  team2: TeamSquadContext;
  team1_analysis: string;   // AI-анализ (fallback если squad пуст)
  team2_analysis: string;
}
```

## Макет

Две карточки. Каждая — имя + структурированные блоки с иконками:

```
┌──────────────────────────────┐
│ ЦСКА                         │
│ 🏥 Травмы                    │
│    Нападающий Иванов (колено)│  ← text-warning если есть травмы
│ 📰 Медиа                     │
│    Нестабильная оборона      │
│ 🔄 Ротация                   │
│    Без изменений             │
└──────────────────────────────┘
```

## Стили

- Карточка: `bg-bg-card-dark rounded-[12px] p-3`
- Имя команды: `font-medium text-[14px] text-text`
- Иконка: `text-[14px] shrink-0`
- Лейбл (Травмы/Медиа/Ротация): `text-[11px] text-text-secondary`
- Значение: `text-[13px] leading-relaxed`
  - С травмами: `text-warning`
  - Обычный: `text-text-secondary`
- Fallback (если squad пуст): `border-l-2 border-border` стиль с analysis текстом
