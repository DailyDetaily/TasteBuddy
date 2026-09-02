import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

// Runs real PostgreSQL SQL locally. Only Supabase Auth's platform-owned surface
// is stubbed; all application tables, policies, functions and triggers are real.
export async function createTestSupabaseDb({ through = '20260903090000', skipVersions = [] } = {}) {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users (
        id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}',
        created_at timestamptz not null default now()
      );
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
      $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      grant execute on all functions in schema auth to anon, authenticated, service_role;
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    `);
    const directory = path.resolve('supabase/migrations');
    for (const name of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
      const version = name.split('_')[0];
      if (version > through || skipVersions.includes(version)) continue;
      const sql = (await readFile(path.join(directory, name), 'utf8'))
        // PGlite has core gen_random_uuid; the optional pgcrypto extension is unused.
        .replace(/^create extension if not exists pgcrypto;\s*/m, '');
      await db.exec(sql);
    }
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}
