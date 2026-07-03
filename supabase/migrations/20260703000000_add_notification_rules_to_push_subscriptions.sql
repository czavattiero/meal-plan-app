alter table if exists push_subscriptions
  add column if not exists notification_rules jsonb;
