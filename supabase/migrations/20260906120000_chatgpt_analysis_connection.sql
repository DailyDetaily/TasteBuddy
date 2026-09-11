-- GPT receives an isolated OAuth identity, never an ordinary app session.
create role tb_chatgpt_reader nologin noinherit;
-- Intentionally DO NOT grant this role to authenticator. Its tokens cannot
-- access PostgREST/RPC/Storage; the MCP server only reads the export below.

create table public.chatgpt_analysis_exports (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object' and
    (payload->>'schemaVersion') is not distinct from '1' and
    octet_length(payload::text) <= 524288
  ),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
alter table public.chatgpt_analysis_exports enable row level security;
revoke all on public.chatgpt_analysis_exports from public, anon, authenticated;
grant select, insert, update, delete on public.chatgpt_analysis_exports to authenticated;
grant select, delete on public.chatgpt_analysis_exports to service_role;
create policy chatgpt_export_owner on public.chatgpt_analysis_exports
  for all to authenticated
  using (auth.uid() = user_id and (auth.jwt()->>'client_id') is null)
  with check (auth.uid() = user_id and (auth.jwt()->>'client_id') is null
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false);

create function public.set_chatgpt_export_expiry() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.expires_at := now() + interval '24 hours';
  return new;
end;
$$;
revoke all on function public.set_chatgpt_export_expiry() from public, anon, authenticated;
create trigger chatgpt_export_expiry before insert or update on public.chatgpt_analysis_exports
for each row execute function public.set_chatgpt_export_expiry();

create table public.chatgpt_oauth_configuration (
  singleton boolean primary key default true check (singleton),
  client_id text not null unique,
  resource_url text not null check (resource_url ~ '^https://[^/?#]+/mcp$')
);
alter table public.chatgpt_oauth_configuration enable row level security;
revoke all on public.chatgpt_oauth_configuration from public, anon, authenticated;
grant select on public.chatgpt_oauth_configuration to service_role;

-- Enable this hook in Auth only after inserting the registered ChatGPT client.
-- Merge with an existing hook if the deployment already has one.
create function public.chatgpt_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  claims jsonb := event->'claims';
  client text := coalesce(event->>'client_id', event->'claims'->>'client_id');
  config public.chatgpt_oauth_configuration;
begin
  if client is null then return event; end if;
  select * into config from public.chatgpt_oauth_configuration where client_id = client;
  if not found or coalesce((claims->>'is_anonymous')::boolean, false) then
    raise exception 'OAuth client not enabled for Taste Buddy';
  end if;
  claims := claims || jsonb_build_object('role', 'tb_chatgpt_reader',
    'aud', config.resource_url, 'client_id', client, 'tb_scope', 'taste:read');
  return jsonb_set(event, '{claims}', claims);
end;
$$;
revoke all on function public.chatgpt_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.chatgpt_access_token_hook(jsonb) to supabase_auth_admin;
