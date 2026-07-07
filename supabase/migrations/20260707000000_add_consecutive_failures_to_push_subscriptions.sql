alter table if exists push_subscriptions
  add column if not exists consecutive_failures integer not null default 0;
