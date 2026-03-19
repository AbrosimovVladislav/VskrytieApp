# VSKRYTIE — Architecture

## Поток данных: Генерация отчёта

```
User (Telegram Mini App)
  │
  │  POST /api/analyze
  │  { query: "ЦСКА vs Спартак" }
  │  Header: X-Init-Data: <raw initData>
  │
  ▼
Next.js API Route (/app/api/analyze/route.ts)  →  SSE stream открывается сразу
  │
  ├─ 1. Валидация Telegram initData                 SSE: step:identify {done}
  │      lib/telegram/validate.ts
  │
  ├─ 2. Проверка баланса
  │      Supabase: users.reports_remaining          → 0? SSE: error {paywall}
  │      Supabase: INSERT report {status: pending}
  │
  ├─ 3. Perplexity API (sonar)                      SSE: step:stats {in_progress}
  │      lib/perplexity/client.ts
  │      промпт → форма, травмы, H2H, составы,
  │               коэффициенты букмекеров
  │      ← raw_stats: string                        SSE: step:stats {done}
  │
  ├─ 4. Claude API (sonnet-4-6, stream)             SSE: step:analyze {in_progress}
  │      lib/claude/client.ts
  │      промпт: raw_stats → ReportJSON
  │      ← JSON парсится по мере стриминга
  │        каждая готовая секция → SSE event:
  │          SSE: section:header  { data }
  │          SSE: section:form    { data }
  │          SSE: section:stats   { data }
  │          SSE: section:injuries{ data }
  │          SSE: section:h2h     { data }
  │          SSE: section:odds    { data }
  │          SSE: section:reco    { token } × N  ← токен за токеном
  │
  └─ 5. Сохранение                                  SSE: done { reportId }
         Supabase: UPDATE report
           raw_stats, summary, status='completed'
         Supabase: users.reports_remaining - 1
```

---

## SSE Event Model

Все события имеют формат: `data: { type, payload }\n\n`

| Событие | Payload | Когда |
|---|---|---|
| `step:identify` | `{ status: 'done' }` | initData валидна |
| `step:stats` | `{ status: 'in_progress' \| 'done' }` | Perplexity запрос |
| `step:analyze` | `{ status: 'in_progress' }` | Claude запрос |
| `section:header` | `HeaderSection` | Первая секция от Claude |
| `section:form` | `FormSection` | — |
| `section:stats` | `StatsSection[]` | — |
| `section:injuries` | `InjuriesSection[]` | — |
| `section:h2h` | `H2HSection` | — |
| `section:odds` | `OddsSection[]` | — |
| `section:reco` | `{ token: string }` | Каждый токен текста |
| `done` | `{ reportId: string }` | Всё готово |
| `error` | `{ message: string, code?: string }` | Любая ошибка |

---

## ReportJSON — формат ответа Claude

Claude получает промпт с `raw_stats` и возвращает JSON следующей структуры. Бэкенд парсит JSON по мере стриминга и отправляет готовые секции через SSE.

```typescript
interface ReportJSON {
  header: {
    homeTeam: string
    awayTeam: string
    league: string
    date: string       // ISO: "2026-03-23"
    time?: string      // "19:00"
    venue?: string
  }
  form: {
    teams: {
      name: string
      results: ('W' | 'D' | 'L')[]   // последние 5
    }[]
    homeAtHome: ('W' | 'D' | 'L')[]   // форма хозяев дома
    awayAway: ('W' | 'D' | 'L')[]     // форма гостей в гостях
  }
  stats: {
    metric: string     // "Голов забито", "xG", "Голов пропущено"
    home: number
    away: number
  }[]
  injuries: {
    team: 'home' | 'away'
    player: string
    role: string       // "Нападающий", "Полузащитник"
    type: 'injury' | 'suspension' | 'doubt'
    duration?: string  // "сезон", "1 матч"
  }[]
  h2h: {
    homeWins: number
    awayWins: number
    draws: number
    matches: {
      date: string     // "15 окт 2025"
      homeTeam: string
      score: string    // "2:1"
      awayTeam: string
    }[]
    homeAtHomeRecord: string  // "4П 0Н 1П"
  }
  odds: {
    bookmaker: string  // "Фонбет" | "Winline" | "PARI" | "BetBoom"
    home: number
    draw: number
    away: number
  }[]
  recommendation: string  // финальный текст, стримится последним
}
```

## Поток данных: Оплата Telegram Stars

```
User
  │  Нажимает "Купить отчёты"
  │
  ▼
Next.js: POST /api/payments/invoice
  │
  ├─ Telegram Bot API: createInvoiceLink
  │    currency: "XTR" (Stars)
  │    payload: "topup_<userId>_<amount>"
  │
  └─ Возвращает invoice_link → клиент открывает через SDK

Telegram → Webhook: POST /api/webhook
  │
  ├─ pre_checkout_query → AnswerPreCheckoutQuery (approve)
  │
  └─ successful_payment
         Supabase: users.reports_remaining (INCREMENT)
```

---

## Supabase Schema

### Таблица: `users`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | UNIQUE, основной идентификатор |
| `username` | `text` | Telegram username (nullable) |
| `first_name` | `text` | Имя пользователя |
| `reports_remaining` | `int` | Баланс бесплатных/оплаченных отчётов |
| `created_at` | `timestamptz` | Дата регистрации |
| `updated_at` | `timestamptz` | Последнее обновление |

### Таблица: `reports`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | FK → users.telegram_user_id |
| `query` | `text` | Запрос пользователя |
| `raw_stats` | `text` | Сырые данные от Perplexity |
| `summary` | `text` | Итоговый отчёт от Claude |
| `status` | `text` | `pending` / `completed` / `error` |
| `created_at` | `timestamptz` | Дата создания |

### Таблица: `payments`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | FK → users.telegram_user_id |
| `telegram_payment_charge_id` | `text` | ID платежа от Telegram |
| `stars_amount` | `int` | Количество Stars |
| `reports_granted` | `int` | Добавлено отчётов |
| `created_at` | `timestamptz` | Дата платежа |

---

## Компонентная структура

```
app/
  layout.tsx              # Root layout: шрифт, bottom nav
  page.tsx                # Главный экран: поле ввода запроса
  report/[id]/page.tsx    # Экран отчёта
  history/page.tsx        # История отчётов
  settings/page.tsx       # Настройки

components/
  shared/
    bottom-nav.tsx        # Bottom navigation
    loading-skeleton.tsx  # Skeleton для отчёта
  report/
    report-card.tsx       # Карточка отчёта в истории
    report-section.tsx    # Секция внутри отчёта
    stats-badge.tsx       # Бейдж с числовой статистикой
    recommendation.tsx    # Блок итоговой рекомендации
  payment/
    stars-button.tsx      # Кнопка покупки отчётов
```

---

## API Routes

| Route | Method | Описание |
|---|---|---|
| `/api/analyze` | POST | Генерация отчёта (Perplexity + Claude) |
| `/api/webhook` | POST | Telegram Bot webhook |
| `/api/payments/invoice` | POST | Создание инвойса Telegram Stars |

## Auth

Все API routes требуют заголовок:
```
X-Init-Data: <raw initData string from Telegram SDK>
```

Валидация: `lib/telegram/validate.ts` → бросает 401 если невалидно.
