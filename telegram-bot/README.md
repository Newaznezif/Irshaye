# Telegram bot

**Deferred by decision, not missing by accident.**

The planning phase treated Telegram as the MVP farmer interface. The approved implementation direction prioritises the farmer-facing web application instead, and defers Telegram, SMS, and USSD entirely. So:

- no bot code exists here;
- no `TELEGRAM_BOT_TOKEN` is expected, and `.env.example` keeps it commented out;
- nothing is configured with BotFather.

Reach to a feature-phone farmer is still the point of the product, and the design keeps that door open on purpose: the advisory path (`lib/advisor`), the reference layers (`lib/crops`, `lib/soil`), and every connector in `lib/data` are plain TypeScript modules that import nothing from Next.js or React. A future channel is a thin adapter over those functions — it would not duplicate business rules, and would still be bound by the same evidence discipline: cite the source, label the value kind, and abstain when the evidence cannot support an answer.
