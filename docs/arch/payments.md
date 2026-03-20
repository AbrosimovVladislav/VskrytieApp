# Оплата: Telegram Stars

## Модель

N бесплатных отчётов при регистрации. Далее — покупка пакетов за Telegram Stars.

## Поток

```
User нажимает "Купить отчёты"
  │
  ▼
POST /api/payments/invoice
  │
  ├─ Telegram Bot API: createInvoiceLink
  │    currency: "XTR" (Stars)
  │    payload: "topup_<userId>_<amount>"
  │
  └─ Возвращает invoice_link → клиент открывает через Telegram SDK

Telegram → POST /api/webhook
  │
  ├─ pre_checkout_query → AnswerPreCheckoutQuery (approve)
  │
  └─ successful_payment
         Supabase: users.reports_remaining += reports_granted
```

## Пакеты (MVP)

| Пакет | Stars | Отчётов |
|---|---|---|
| Малый | ? | 5 |
| Средний | ? | 10 |
| Большой | ? | 30 |

Цены определим после тестирования.

## Связанные файлы

- БД (таблица `payments`): [`supabase.md`](supabase.md)
- UI экран Balance: [`../ui/overview.md`](../ui/overview.md)
