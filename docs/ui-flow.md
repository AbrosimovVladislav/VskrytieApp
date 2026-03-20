# VSKRYTIE — Данные, Аналитика, UI

Спецификация для Claude Code. Описывает: какие данные собираем, как анализируем, что и как показываем пользователю.

---

## Пайплайн

```
Запрос пользователя → [Perplexity API: сбор данных] → [Claude API Sonnet: анализ] → [UI: отчёт]
```

---

## Структура данных

### Входные данные (собираем через Perplexity)

```ts
interface MatchData {
  context: {
    sport: "football" | "hockey" | "basketball" | "tennis";
    homeTeam: string;
    awayTeam: string;
    competition: string; // "РПЛ", "КХЛ", "Евролига"
    round?: string; // "Тур 28", "1/4 финала"
    date: string;
    time?: string;
    venue?: string;
    motivation: {
      home: { level: "high" | "medium" | "low"; reason: string };
      away: { level: "high" | "medium" | "low"; reason: string };
    };
  };

  form: {
    home: {
      last5: ("W" | "D" | "L")[];
      streak: string; // "3W", "2L"
      homeRecord: ("W" | "D" | "L")[]; // только дома последние 4-5
    };
    away: {
      last5: ("W" | "D" | "L")[];
      streak: string;
      awayRecord: ("W" | "D" | "L")[]; // только на выезде
    };
  };

  h2h: {
    homeWins: number;
    awayWins: number;
    draws: number;
    recentGames: { date: string; score: string; competition: string }[];
  };

  stats: {
    home: TeamStats;
    away: TeamStats;
  };

  injuries: {
    home: Absence[];
    away: Absence[];
  };

  contextFactors: {
    weather?: { temp: number; condition: string };
    restDays: { home: number; away: number };
    referee?: {
      name: string;
      avgYellowCards: number;
      penaltiesPerGame: number;
    };
    recentTransfers?: string[];
  };

  odds: {
    bookmakers: {
      name: string;
      values: Record<string, number>; // { "П1": 1.85, "X": 3.40, "П2": 4.20 }
    }[];
  };
}

interface TeamStats {
  goalsScored: number; // среднее за последние 5-10 матчей
  goalsConceded: number;
  xG?: number; // expected goals (ключевая метрика)
  xGA?: number; // expected goals against
  shotsOnTarget: number;
  possession: number; // %
  corners: number;
  yellowCards: number;
  cleanSheets: number; // из последних N
  bttsPct: number; // % матчей где обе забивали
  over25Pct: number; // % матчей с тоталом > 2.5
}

interface Absence {
  name: string;
  role: string; // "Нападающий", "Защитник"
  reason: "injury" | "suspension" | "personal";
  details?: string;
  impact: "key" | "rotation" | "minor";
}
```

### Выходные данные (генерирует Claude API)

```ts
interface AnalysisReport {
  sections: {
    formAnalysis: string; // 2-3 предложения: оценка формы + H2H
    statsAnalysis: string; // 2-3 предложения: xG-инсайт, сравнение метрик
    injuriesAnalysis: string; // 1-2 предложения: влияние потерь
    contextAnalysis: string; // 1-2 предложения: погода, усталость, судья
    oddsAnalysis: string; // 1-2 предложения: оценка линий
  };

  odds: {
    average: Record<string, number>;
    bestValue?: { market: string; bookmaker: string; odds: number };
    valueAssessment: {
      market: string;
      indicator: "underpriced" | "fair" | "overpriced";
    }[];
  };

  recommendation: {
    summary: string; // 1-2 предложения: главный вывод
    confidence: "high" | "medium" | "low";
    bets: {
      market: string; // "П1", "ТБ 2.5", "BTTS Да", "ЖК Б 3.5"
      reasoning: string;
      confidence: "high" | "medium" | "low";
      value: "underpriced" | "fair" | "overpriced";
    }[]; // 1-3 рынка
  };
}
```

---

## Экраны и UI

### Карта экранов

Home (поиск) → Analyzing (загрузка/стриминг) → Report (отчёт). Плюс History (список прошлых отчётов) и Balance (покупка отчётов за Stars). Навигация — bottom tab bar: Главная, Анализы, Баланс, Ещё.

### Home

Поле ввода запроса (свободный текст: "ЦСКА — Спартак", "Реал завтра"), кнопка CTA "Анализировать", примеры запросов (тап = автозаполнение), список 2-3 последних запросов. Индикатор остатка отчётов (⚡ 5) в шапке, тап → Balance.

### Analyzing

Прогресс-бар + пошаговые статусы (определяем матч → собираем статистику → анализируем → формируем отчёт). Секции отчёта появляются по мере готовности через SSE-события. Skeleton-заглушки до появления контента.

SSE-события: `step:identify`, `step:collect`, `step:analyze`, затем посекционно: `section:context`, `section:form`, `section:stats`, `section:injuries`, `section:context_factors`, `section:odds`, `section:recommendation`.

### Report

Вертикальный скролл, 7 секций-карточек. Каждая секция = карточка `bg-bg-card rounded border shadow`. Появление: fade-in + slide-up, 200ms. Кнопка Share в шапке.

#### Секция 1 — Контекст матча

Шапка: лига, тур/стадия, дата, время, стадион, гербы команд.
Плашка мотивации для каждой команды: уровень (high=зелёный, medium=жёлтый, low=красный) + причина текстом ("Борьба за чемпионство", "Мёртвый матч").

#### Секция 2 — Форма и результаты

Dots формы (последние 5): ● победа (зелёный), ◐ ничья (серый), ○ поражение (красный). Рядом рекорд (3W 1D 1L) и текущая серия.
Подсекция дома/на выезде: отдельная строка dots.
H2H: крупные цифры побед (7 : 3), пропорциональный бар, список 3 последних встреч (дата + счёт).
Текст анализа от Claude (2-3 предложения).

#### Секция 3 — Продвинутая статистика

**xG-перформанс блок** (ключевой): для каждой команды показываем реальные голы vs xG. Индикатор: голы > xG → "▲ Забивают больше xG" (warning-цвет, возможна регрессия), голы < xG → "▼ Забивают меньше xG" (positive-цвет, могут прибавить), голы ≈ xG → "≈ В рамках ожиданий".
Сравнительные горизонтальные бары: голов забито, голов пропущено, xG, удары в створ, владение %, BTTS %, тотал Б2.5 %. Бар лидера — accent, бар отстающего — bg-inner. Для метрик "меньше = лучше" (голы пропущено) accent у команды с меньшим значением.
Текст инсайта от Claude (2-3 предложения).

#### Секция 4 — Кадровая ситуация

Для каждой команды: или "✓ Все в строю" (text-positive), или список потерь. Каждая потеря: иконка критичности (🔴 key, 🟡 rotation, ⚪ minor), имя, позиция, причина, срок возвращения.
Текст оценки от Claude (1-2 предложения).

#### Секция 5 — Контекстные факторы

Компактные плашки в сетке (2 колонки): погода (если открытый стадион), дни отдыха, судья (имя + ср. ЖК + пенальти/матч), свежие трансферы. Если данных нет — плашка не показывается.
Текст от Claude (1-2 предложения).

#### Секция 6 — Коэффициенты

Таблица: 2-3 букмекера × рынки (П1/X/П2). Строка среднего. Highlight лучшего коэффициента (text-accent).
Value-оценка: для каждого основного рынка бейдж — 🟢 "Коэф занижен" (positive), ⚪ "В рынке" (muted), 🔴 "Коэф завышен" (negative).
Текст от Claude (1-2 предложения).

#### Секция 7 — Рекомендация

Выделенный блок (bg-bg-card-dark). Summary текст стримится с typing-cursor. Confidence: dots ●○ + текст (Высокая/Средняя/Низкая), цвет по уровню.
1-3 карточки рекомендованных рынков: название рынка, value-бейдж, reasoning (1 предложение).
Дисклеймер: "Решение всегда за вами. ВСКРЫТИЕ предоставляет аналитику, не финансовые рекомендации."

Доступные рынки для рекомендаций: 1X2, тотал (Б/М), BTTS, фора, угловые (Б/М), карточки (Б/М).

### History

Список карточек прошлых отчётов: команды, лига, дата, краткая рекомендация (рынок + confidence dots). Тап → полный отчёт.

### Balance

Остаток отчётов крупно. Пакеты для покупки за Telegram Stars (5/10/30 отчётов).

---

## Микровзаимодействия

Haptics: light на CTA и появление секции, medium на готовый отчёт, error на ошибку, success на оплату.
Анимации: секции fade-in + slide-up 200ms, skeleton → контент fade 150ms, typing cursor 500ms, confidence dots заливка по одному 100ms.
