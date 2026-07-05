alter table if exists push_subscriptions
  add column if not exists last_notified_slot text;
