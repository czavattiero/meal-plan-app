-- Push subscription storage (replaces Upstash Redis)
create table if not exists push_subscriptions (
  device_id      text        primary key,
  subscription   jsonb       not null,
  updated_at     timestamptz not null default now(),
  expires_at     timestamptz
);

create index if not exists push_subscriptions_updated_at_idx
  on push_subscriptions (updated_at);
