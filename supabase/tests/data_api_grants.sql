-- Read-only ACL/RLS smoke test, run as postgres after the FULL migration chain.
-- This is not a substitute for live PostgREST/JWT and cross-account tests.
-- Example: psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/data_api_grants.sql
begin;
set transaction read only;

do $test$
declare
    expectation record;
begin
    for expectation in select * from (values
        ('anon', 'restaurants', 'SELECT'),
        ('anon', 'chefs', 'SELECT'),
        ('anon', 'source_documents', 'SELECT'),
        ('anon', 'dish_entities', 'SELECT'),
        ('anon', 'dish_observed_facts', 'SELECT'),
        ('anon', 'dish_inference_profiles', 'SELECT'),
        ('anon', 'research_rules', 'SELECT'),
        ('anon', 'restaurant_place_index', 'SELECT'),
        ('anon', 'restaurant_operating_hours', 'SELECT'),
        ('anon', 'media_assets', 'SELECT'),
        ('authenticated', 'source_documents', 'SELECT'),
        ('authenticated', 'dish_entities', 'SELECT'),
        ('authenticated', 'dish_observed_facts', 'SELECT'),
        ('authenticated', 'dish_inference_profiles', 'SELECT'),
        ('authenticated', 'research_rules', 'SELECT'),
        ('authenticated', 'restaurant_place_index', 'SELECT'),
        ('authenticated', 'restaurant_operating_hours', 'SELECT'),
        ('authenticated', 'media_assets', 'SELECT'),
        ('authenticated', 'tcs_guidance_packets', 'SELECT'),
        ('authenticated', 'user_learned_deltas', 'SELECT'),
        ('authenticated', 'taste_social_profiles', 'SELECT'),
        ('authenticated', 'taste_dining_reviews', 'SELECT'),
        ('authenticated', 'restaurants', 'SELECT'),
        ('authenticated', 'restaurants', 'INSERT'),
        ('authenticated', 'chefs', 'SELECT'),
        ('authenticated', 'chefs', 'INSERT'),
        ('authenticated', 'measurement_results', 'SELECT'),
        ('authenticated', 'measurement_results', 'INSERT'),
        ('authenticated', 'tba_feedback_evidence_events', 'SELECT'),
        ('authenticated', 'tba_feedback_evidence_events', 'INSERT'),
        ('authenticated', 'profiles', 'SELECT'),
        ('authenticated', 'profiles', 'INSERT'),
        ('authenticated', 'profiles', 'UPDATE'),
        ('authenticated', 'measurement_sessions', 'SELECT'),
        ('authenticated', 'measurement_sessions', 'INSERT'),
        ('authenticated', 'reservations', 'SELECT'),
        ('authenticated', 'reservations', 'INSERT'),
        ('authenticated', 'reservations', 'UPDATE'),
        ('authenticated', 'reservation_dishes', 'SELECT'),
        ('authenticated', 'reservation_dishes', 'INSERT'),
        ('authenticated', 'reservation_dishes', 'UPDATE'),
        ('authenticated', 'feedback_submissions', 'SELECT'),
        ('authenticated', 'feedback_submissions', 'INSERT'),
        ('authenticated', 'feedback_submissions', 'UPDATE'),
        ('authenticated', 'feedback_items', 'SELECT'),
        ('authenticated', 'feedback_items', 'INSERT'),
        ('authenticated', 'feedback_items', 'UPDATE'),
        ('authenticated', 'feedback_parses', 'SELECT'),
        ('authenticated', 'feedback_parses', 'INSERT'),
        ('authenticated', 'feedback_parses', 'UPDATE'),
        ('authenticated', 'notifications', 'SELECT'),
        ('authenticated', 'notifications', 'INSERT'),
        ('authenticated', 'notifications', 'UPDATE'),
        ('authenticated', 'user_tba_confidence_states', 'SELECT'),
        ('authenticated', 'user_tba_confidence_states', 'INSERT'),
        ('authenticated', 'user_tba_confidence_states', 'UPDATE'),
        ('authenticated', 'profile_friendships', 'SELECT'),
        ('authenticated', 'profile_friendships', 'DELETE'),
        ('authenticated', 'restaurant_bookmark_lists', 'SELECT'),
        ('authenticated', 'restaurant_bookmark_lists', 'INSERT'),
        ('authenticated', 'restaurant_bookmark_lists', 'DELETE'),
        ('authenticated', 'restaurant_bookmarks', 'SELECT'),
        ('authenticated', 'restaurant_bookmarks', 'INSERT'),
        ('authenticated', 'restaurant_bookmarks', 'DELETE'),
        ('service_role', 'restaurants', 'SELECT'),
        ('service_role', 'restaurants', 'INSERT'),
        ('service_role', 'restaurants', 'UPDATE'),
        ('service_role', 'chefs', 'SELECT'),
        ('service_role', 'chefs', 'INSERT'),
        ('service_role', 'chefs', 'UPDATE'),
        ('service_role', 'source_documents', 'SELECT'),
        ('service_role', 'source_documents', 'INSERT'),
        ('service_role', 'source_documents', 'UPDATE'),
        ('service_role', 'dish_entities', 'SELECT'),
        ('service_role', 'dish_entities', 'INSERT'),
        ('service_role', 'dish_entities', 'UPDATE'),
        ('service_role', 'research_rules', 'SELECT'),
        ('service_role', 'research_rules', 'INSERT'),
        ('service_role', 'research_rules', 'UPDATE'),
        ('service_role', 'dish_observed_facts', 'SELECT'),
        ('service_role', 'dish_observed_facts', 'INSERT'),
        ('service_role', 'dish_observed_facts', 'DELETE'),
        ('service_role', 'dish_inference_profiles', 'SELECT'),
        ('service_role', 'dish_inference_profiles', 'INSERT'),
        ('service_role', 'dish_inference_profiles', 'DELETE'),
        ('authenticated', 'chatgpt_analysis_exports', 'SELECT'),
        ('authenticated', 'chatgpt_analysis_exports', 'INSERT'),
        ('authenticated', 'chatgpt_analysis_exports', 'UPDATE'),
        ('authenticated', 'chatgpt_analysis_exports', 'DELETE'),
        ('authenticated', 'native_account_data', 'SELECT'),
        ('service_role', 'chatgpt_analysis_exports', 'SELECT'),
        ('service_role', 'chatgpt_analysis_exports', 'DELETE'),
        ('service_role', 'chatgpt_oauth_configuration', 'SELECT')
    ) as required(role_name, table_name, operation) loop
        if not has_schema_privilege(expectation.role_name, 'public', 'USAGE') then
            raise exception 'Missing public schema USAGE for %', expectation.role_name;
        end if;
        if not has_table_privilege(expectation.role_name, 'public.' || expectation.table_name, expectation.operation) then
            raise exception 'Missing % on public.% for %', expectation.operation, expectation.table_name, expectation.role_name;
        end if;
        if not (select relrowsecurity from pg_class where oid = ('public.' || expectation.table_name)::regclass) then
            raise exception 'RLS disabled: %', expectation.table_name;
        end if;
    end loop;
    for expectation in select * from (values
        ('authenticated', 'account_legacy_bookmarks', 'SELECT'),
        ('authenticated', 'account_legacy_bookmarks', 'INSERT'),
        ('authenticated', 'account_legacy_bookmarks', 'UPDATE'),
        ('authenticated', 'account_legacy_bookmarks', 'DELETE'),
        ('authenticated', 'account_deletion_requests', 'SELECT'),
        ('authenticated', 'account_deletion_requests', 'INSERT'),
        ('authenticated', 'account_deletion_requests', 'UPDATE'),
        ('authenticated', 'account_deletion_requests', 'DELETE'),
        ('authenticated', 'account_media_uploads', 'SELECT'),
        ('authenticated', 'account_media_uploads', 'INSERT'),
        ('authenticated', 'account_media_uploads', 'UPDATE'),
        ('authenticated', 'account_media_uploads', 'DELETE'),
        ('authenticated', 'chatgpt_oauth_configuration', 'SELECT'),
        ('authenticated', 'chatgpt_oauth_configuration', 'INSERT'),
        ('authenticated', 'chatgpt_oauth_configuration', 'UPDATE'),
        ('authenticated', 'chatgpt_oauth_configuration', 'DELETE'),
        ('authenticated', 'native_account_data', 'INSERT'),
        ('authenticated', 'native_account_data', 'UPDATE'),
        ('authenticated', 'native_account_data', 'DELETE')
    ) as forbidden(role_name, table_name, operation) loop
        if has_table_privilege(expectation.role_name, 'public.' || expectation.table_name, expectation.operation) then
            raise exception 'Write/internal boundary violated: % % %', expectation.role_name, expectation.table_name, expectation.operation;
        end if;
    end loop;
end;
$test$;

do $rpc_test$
begin
    if not has_function_privilege('authenticated', 'public.save_dining_feedback_atomic(uuid,uuid,timestamp with time zone,jsonb,jsonb,boolean,boolean)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: save_dining_feedback_atomic(uuid,uuid,timestamp with time zone,jsonb,jsonb,boolean,boolean)';
    end if;
    if not has_function_privilege('authenticated', 'public.save_native_account_data(uuid,jsonb,bigint)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: save_native_account_data(uuid,jsonb,bigint)';
    end if;
    if not has_function_privilege('authenticated', 'public.search_profiles_by_identity(text)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: search_profiles_by_identity(text)';
    end if;
    if not has_function_privilege('authenticated', 'public.search_profiles_by_nickname(text)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: search_profiles_by_nickname(text)';
    end if;
    if not has_function_privilege('authenticated', 'public.add_friend_by_nickname(text)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: add_friend_by_nickname(text)';
    end if;
    if not has_function_privilege('authenticated', 'public.get_friend_summary()', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: get_friend_summary()';
    end if;
    if not has_function_privilege('authenticated', 'public.get_profile_connections(text)', 'EXECUTE') then
        raise exception 'Missing authenticated RPC grant: get_profile_connections(text)';
    end if;
    if (select prosecdef from pg_proc where oid = 'public.save_dining_feedback_atomic(uuid,uuid,timestamp with time zone,jsonb,jsonb,boolean,boolean)'::regprocedure) then
        raise exception 'Atomic feedback RPC must remain SECURITY INVOKER';
    end if;
end;
$rpc_test$;

-- Record effective ACLs and RLS policies to compare staging with production.
select n.nspname, c.relname, pg_get_userbyid(c.relowner) as owner,
    c.relrowsecurity, c.relacl
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p') order by c.relname;
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;
select pg_get_userbyid(defaclrole) as creator, defaclnamespace::regnamespace,
    defaclobjtype, defaclacl from pg_default_acl;
rollback;
