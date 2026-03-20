# Supabase Schema

Проект: `spgrwxwljbcsshopkwzp`

## Таблица: `users`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | UNIQUE, основной идентификатор |
| `username` | `text` | Telegram username (nullable) |
| `first_name` | `text` | Имя пользователя |
| `reports_remaining` | `int` | Баланс отчётов |
| `created_at` | `timestamptz` | Регистрация |
| `updated_at` | `timestamptz` | Обновление |

## Таблица: `reports`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | FK → users |
| `query` | `text` | Запрос пользователя |
| `raw_stats` | `text` | Сырые данные от Sports API + Perplexity |
| `structured_report` | `jsonb` | FullReport JSON (MatchData + AnalysisReport) |
| `summary` | `text` | Итоговый текст от Claude |
| `status` | `text` | `pending` / `completed` / `error` |
| `created_at` | `timestamptz` | Дата |

## Таблица: `payments`

| Колонка | Тип | Описание |
|---|---|---|
| `id` | `uuid` | PK, auto |
| `telegram_user_id` | `bigint` | FK → users |
| `telegram_payment_charge_id` | `text` | ID платежа Telegram |
| `stars_amount` | `int` | Количество Stars |
| `reports_granted` | `int` | Добавлено отчётов |
| `created_at` | `timestamptz` | Дата |

## Типы данных

Для `structured_report` JSON см. [`../ui/data-types.md`](../ui/data-types.md)
