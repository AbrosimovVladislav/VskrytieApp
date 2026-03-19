# VSKRYTIE — Design System

## Aesthetic Direction

**Dark / Minimal / Data-rich**

Вдохновение: крипто-биржевые дашборды (тёмный UI, лаймовый акцент, pixel-шрифт для чисел).
Цель: структурированные данные, чёткая иерархия, минимум декора. Данные — главный герой.

> Figma-источник: `figma.com/design/zhtYkkEiLLt7tDYFE2EYMa/`
> Фреймы: 108:234 (Home), 108:695 (Stats), 108:4029 (Onboarding), 108:2612 (AI Detail)

---

## Color Tokens

```css
@theme {
  /* Фон */
  --color-bg: #1f1f1f;              /* основной фон */
  --color-bg-secondary: #252525;    /* панели, bottom nav */
  --color-bg-card: #2a2a2a;         /* карточки, кнопки */
  --color-bg-card-dark: #181818;    /* тёмные карточки (AI блоки) */
  --color-bg-inner: #393939;        /* активный таб внутри switcher */
  --color-bg-overlay: rgba(0,0,0,0.24);      /* overlay фон карточек */
  --color-bg-overlay-heavy: rgba(0,0,0,0.52); /* полупрозрачные кнопки */

  /* Акцент — лаймовый */
  --color-accent: #c2ef79;
  --color-accent-dim: rgba(194, 239, 121, 0.15);

  /* Семантические */
  --color-positive: #95f6b5;        /* рост, победы */
  --color-negative: #c33846;        /* падение, поражения */
  --color-warning: #ecbb80;         /* нейтральный/предупреждение */
  --color-candle-green: #15a344;    /* свечи графика */

  /* Текст */
  --color-text: #ffffff;
  --color-text-secondary: #989898;
  --color-text-dim: #444444;        /* символы типа "$", "." в числах */
  --color-text-highlight: #cacaca;  /* акцентированные слова в описаниях */
  --color-muted: #6f6f6f;

  /* Границы */
  --color-border: #292929;
  --color-border-secondary: #323232;
  --color-border-card: #2b2b2b;
  --color-border-accent: rgba(194, 239, 121, 0.3);

  /* Белый overlay (теги, бейджи) */
  --color-white-8: rgba(255, 255, 255, 0.08);

  /* Тени */
  --shadow-card: 2px 2px 12px rgba(0,0,0,0.35);
  --shadow-light: 2px 4px 28px rgba(0,0,0,0.02);
  --shadow-nav: -36px 4px 44px black;

  /* Радиусы */
  --radius-card: 20px;     /* карточки, большие блоки */
  --radius-button: 10px;   /* кнопки, инпуты */
  --radius-tab: 8px;       /* внутренние табы */
  --radius-tag: 4px;       /* теги, бейджи */
}
```

---

## Typography

### Шрифты

| Шрифт | Назначение | CSS-переменная |
|---|---|---|
| **Inter** | UI текст, кнопки, описания | `--font-sans` |
| **Press Start 2P** | Числа/баланс, заголовки акцентные | `--font-display` |

### Размеры и веса

| Роль | Шрифт | Вес | Размер | Пример |
|---|---|---|---|---|
| Баланс / крупное число | Press Start 2P | 400 | `text-[28px]` | `$45,548.29` |
| Заголовок страницы | Press Start 2P | 400 | `text-2xl` | `ВСКРЫТИЕ` |
| Заголовок секции | Inter | 600 (Semi Bold) | `text-[14px]` | `Smart AI Guidance` |
| Название актива/команды | Inter | 500 (Medium) | `text-[16px]` | `Ethereum`, `ЦСКА` |
| Основной текст | Inter | 400 (Regular) | `text-[14px]` | Описания, параграфы |
| Мелкий текст / лейблы | Inter | 400 (Regular) | `text-[12px]` | Даты, метки, бейджи |
| Таб-бар active | Inter | 600 (Semi Bold) | `text-[12px]` | `1d`, `7d` |
| Таб-бар inactive | Inter | 400 | `text-[12px]` | `7d`, `1m` |

### Паттерн чисел (Press Start 2P)

Большие числа разделяются стилями:
```jsx
<span className="text-text-dim">$</span>
<span className="text-text">45,548</span>
<span className="text-text-dim">.29</span>
```

Числа: `font-variant-numeric: tabular-nums` для выравнивания в таблицах.

---

## Компоненты

### Карточка (Card)

```
bg-bg-card rounded-[--radius-card] border border-border px-4 py-4 shadow-[--shadow-card]
```

Вариант с overlay фоном (как баланс):
```
bg-bg-overlay rounded-[--radius-card] border border-border px-3 py-4
```

### Кнопка Primary (CTA)

```
bg-accent text-bg-card-dark font-semibold text-[14px] h-12 rounded-[--radius-button]
```

### Кнопка Secondary

```
bg-bg-card text-white font-semibold text-[14px] rounded-[--radius-button] shadow-[--shadow-card]
```

### Input (Search)

```
border border-border-secondary rounded-[--radius-button] px-3 py-2.5 shadow-[--shadow-light]
```

Иконка: `text-muted`, текст: `text-muted` (placeholder), `text-text` (value).

### Tab Switcher

Контейнер:
```
bg-bg-card h-[32px] p-[3px] rounded-[--radius-button] shadow-[2px_2px_12px_rgba(0,0,0,0.25)]
```

Активный таб:
```
bg-accent text-bg-card-dark font-semibold rounded-[--radius-tab]
```
или:
```
bg-bg-inner text-white font-normal rounded-[--radius-tab]
```

Неактивный таб:
```
text-muted font-normal
```

### Tag / Badge

```
bg-white-8 px-[6px] py-[2px] rounded-[5px] text-text-secondary text-[14px]
```

Мелкий вариант:
```
bg-white-8 px-1 py-0.5 rounded-[--radius-tag] text-text-secondary text-[12px]
```

### AI-блок (тёмная карточка)

```
bg-bg-card-dark border border-border-card rounded-[--radius-card] overflow-hidden
```

Кнопка внутри: `bg-accent text-bg-card-dark rounded-[--radius-tab] px-5 py-2 font-semibold text-[12px]`

### Change Indicator

Позитивный:
```
text-positive text-[12px] font-medium
```

Нейтральный/предупреждение:
```
text-warning text-[12px] font-medium
```

---

## Bottom Navigation

```
bg-bg-secondary shadow-[--shadow-nav] pt-5 pb-8 px-4
```

- 4 вкладки: Главная, Анализы, Баланс, Ещё
- Активная: `text-accent`
- Неактивная: `text-muted`
- Иконки: 24px, `strokeWidth: 2` (active) / `1.5` (inactive)

Вариант с центральной AI-кнопкой (из фрейма 108:2612):
- Центральный элемент: круг 46px с gradient border, иконка бота
- `pb-6` (меньше padding)

---

## Skeleton / Loading

- Цвет: `bg-bg-card animate-pulse rounded-[--radius-card]`
- Текст: `bg-bg-card animate-pulse h-4 rounded`

---

## Иконки

Из `lucide-react`:
- `Home` — главная
- `BarChart3` — анализы/история
- `Wallet` — баланс
- `Settings` — настройки
- `Search` — поиск
- `Star` — избранное
- `Plus` — добавить
- `Share2` — поделиться
- `ArrowUp` — назад
- `MoreHorizontal` — меню

---

## Анимации

| Элемент | Анимация |
|---|---|
| Секция появляется | `fade-in + slide-up`, 200ms ease-out |
| Skeleton → контент | `fade-in`, 150ms |
| Typing в рекомендации | `cursor blink`, 500ms interval |
| Прогресс-бар | `width transition`, 300ms linear |
| Карточка tap | `scale 0.98 → 1.0` |
| Табы switch | `background transition`, 200ms |
