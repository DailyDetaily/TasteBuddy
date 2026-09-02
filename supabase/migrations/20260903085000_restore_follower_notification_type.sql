-- The linked database records 20260519 as applied but lacks this enum value.
-- Keep this in its own migration so PostgreSQL commits the new enum value before
-- the following migration creates the notification writer that uses it.
alter type public.notification_type add value if not exists 'follower_added';
