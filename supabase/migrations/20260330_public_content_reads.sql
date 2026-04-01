create policy "restaurants_select_public"
on public.restaurants
for select
to anon, authenticated
using (true);

create policy "chefs_select_public"
on public.chefs
for select
to anon, authenticated
using (true);

create policy "source_documents_select_public"
on public.source_documents
for select
to anon, authenticated
using (true);

create policy "dish_entities_select_public"
on public.dish_entities
for select
to anon, authenticated
using (true);

create policy "dish_observed_facts_select_public"
on public.dish_observed_facts
for select
to anon, authenticated
using (true);

create policy "dish_inference_profiles_select_public"
on public.dish_inference_profiles
for select
to anon, authenticated
using (true);

create policy "research_rules_select_public"
on public.research_rules
for select
to anon, authenticated
using (true);
