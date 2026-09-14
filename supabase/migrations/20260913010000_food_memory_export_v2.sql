-- Apply only with a separately authorized deployment, after the MCP reader accepts v2.
-- v1 remains readable; ownership, 24-hour expiry, and the existing size bound are unchanged.
alter table public.chatgpt_analysis_exports
  drop constraint chatgpt_analysis_exports_payload_check;
alter table public.chatgpt_analysis_exports
  add constraint chatgpt_analysis_exports_payload_check check (
    jsonb_typeof(payload) = 'object'
    and coalesce(payload->>'schemaVersion' in ('1', '2'), false)
    and octet_length(payload::text) <= 524288
  );
