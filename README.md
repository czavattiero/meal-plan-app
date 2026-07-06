# Meal Plan App

## Development

```bash
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Scheduled push notifications

Notification reminders are no longer scheduled by GitHub Actions. Use an external cron
service to call the deployed cron endpoint every 30 minutes:

- URL: `https://<your-app-domain>/api/push/cron`
- Auth: either add `?secret=<CRON_SECRET>` or send the same secret in the
  standard bearer authorization header
- Environment variable: `CRON_SECRET`

The endpoint calculates due reminders in Calgary time (`America/Edmonton`) and already
handles delayed runs by checking the current and previous half-hour slots.
