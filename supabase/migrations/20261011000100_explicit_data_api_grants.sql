-- Explicit Data API grants for clean installations without Supabase default ACLs.
-- Additive only: preserve existing RLS, RPC write boundaries and operating data.
-- Apply after all earlier migrations. No blanket/default/sequence grants.

-- Refuse to expose a relation if an earlier migration failed to enable RLS.
do $access_guard$
declare
    relation_name text;
begin
    foreach relation_name in array array[
        'chefs',
        'dish_entities',
        'dish_inference_profiles',
        'dish_observed_facts',
        'feedback_items',
        'feedback_parses',
        'feedback_submissions',
        'measurement_results',
        'measurement_sessions',
        'media_assets',
        'notifications',
        'profile_friendships',
        'profiles',
        'research_rules',
        'reservation_dishes',
        'reservations',
        'restaurant_bookmark_lists',
        'restaurant_bookmarks',
        'restaurant_operating_hours',
        'restaurant_place_index',
        'restaurants',
        'source_documents',
        'taste_dining_reviews',
        'taste_social_profiles',
        'tba_feedback_evidence_events',
        'tcs_guidance_packets',
        'user_learned_deltas',
        'user_tba_confidence_states'
    ] loop
        if not exists (
            select 1 from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relname = relation_name
              and c.relkind in ('r', 'p') and c.relrowsecurity
        ) then
            raise exception 'Required RLS table missing or unprotected: public.%', relation_name;
        end if;
    end loop;
end;
$access_guard$;

-- anon: reviewed client/worker operations; row visibility still uses RLS.
grant select on table
    public.restaurants,
    public.chefs,
    public.source_documents,
    public.dish_entities,
    public.dish_observed_facts,
    public.dish_inference_profiles,
    public.research_rules,
    public.restaurant_place_index,
    public.restaurant_operating_hours,
    public.media_assets
to anon;

-- authenticated: reviewed client/worker operations; row visibility still uses RLS.
grant select on table
    public.source_documents,
    public.dish_entities,
    public.dish_observed_facts,
    public.dish_inference_profiles,
    public.research_rules,
    public.restaurant_place_index,
    public.restaurant_operating_hours,
    public.media_assets,
    public.tcs_guidance_packets,
    public.user_learned_deltas,
    public.taste_social_profiles,
    public.taste_dining_reviews
to authenticated;

grant select, insert on table
    public.restaurants,
    public.chefs,
    public.measurement_sessions,
    public.measurement_results,
    public.tba_feedback_evidence_events
to authenticated;

grant select, insert, update on table
    public.profiles,
    public.reservations,
    public.reservation_dishes,
    public.feedback_submissions,
    public.feedback_items,
    public.feedback_parses,
    public.notifications,
    public.user_tba_confidence_states
to authenticated;

grant select, delete on table
    public.profile_friendships
to authenticated;

grant select, insert, delete on table
    public.restaurant_bookmark_lists,
    public.restaurant_bookmarks
to authenticated;

-- service_role: seed importer only. BYPASSRLS does not replace table ACLs.
grant select, insert, update on table
    public.restaurants,
    public.chefs,
    public.source_documents,
    public.dish_entities,
    public.research_rules
to service_role;

grant select, insert, delete on table
    public.dish_observed_facts,
    public.dish_inference_profiles
to service_role;

-- These older app RPCs depended on implicit EXECUTE privileges.
-- Only the authenticated role is added; existing function guards are unchanged.
grant execute on function public.search_profiles_by_identity(text),
    public.search_profiles_by_nickname(text),
    public.add_friend_by_nickname(text),
    public.get_friend_summary(),
    public.get_profile_connections(text)
to authenticated;

-- save_dining_feedback_atomic is SECURITY INVOKER: its existing EXECUTE grant
-- also requires the explicit table grants above. Do not change it to DEFINER.

notify pgrst, 'reload schema';
