CREATE TABLE sources(id text PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE foods(id text PRIMARY KEY, name text NOT NULL, payload jsonb NOT NULL);
CREATE TABLE food_claims(id text PRIMARY KEY, food_id text NOT NULL REFERENCES foods, payload jsonb NOT NULL);
CREATE TABLE claim_sources(claim_id text REFERENCES food_claims ON DELETE CASCADE, source_id text REFERENCES sources, provenance jsonb NOT NULL, PRIMARY KEY(claim_id,source_id,provenance));
CREATE TABLE users(id text PRIMARY KEY, evidence_class text NOT NULL CHECK(evidence_class IN ('synthetic_fixture','user_report')));
CREATE TABLE meals(id text PRIMARY KEY, owner text NOT NULL REFERENCES users, UNIQUE(id,owner));
CREATE TABLE experiences(id text PRIMARY KEY, owner text NOT NULL REFERENCES users, meal_id text NOT NULL, food_id text NOT NULL REFERENCES foods, context jsonb NOT NULL DEFAULT '{}'::jsonb, revision integer NOT NULL DEFAULT 0 CHECK(revision>=0), UNIQUE(id,owner), FOREIGN KEY(meal_id,owner) REFERENCES meals(id,owner));
CREATE TABLE tombstones(experience_id text PRIMARY KEY, owner text NOT NULL REFERENCES users, revision integer NOT NULL);
CREATE TABLE receipts(owner text REFERENCES users, mutation_id text, experience_id text NOT NULL, payload_hash text NOT NULL, revision integer NOT NULL, PRIMARY KEY(owner,mutation_id));
CREATE TABLE input_events(id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, revision integer NOT NULL, payload jsonb NOT NULL, recorded_at timestamptz NOT NULL, FOREIGN KEY(experience_id,owner) REFERENCES experiences(id,owner) ON DELETE CASCADE, UNIQUE(experience_id,revision), UNIQUE(id,experience_id,owner));
CREATE TABLE answers(id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, question text NOT NULL, answer_key text NOT NULL, event_id text NOT NULL, payload jsonb NOT NULL, active boolean NOT NULL DEFAULT true, recorded_at timestamptz NOT NULL, FOREIGN KEY(experience_id,owner) REFERENCES experiences(id,owner) ON DELETE CASCADE);
ALTER TABLE answers ADD UNIQUE(id,experience_id,owner);
ALTER TABLE answers ADD FOREIGN KEY(event_id,experience_id,owner) REFERENCES input_events(id,experience_id,owner) ON DELETE CASCADE;
CREATE UNIQUE INDEX one_active_answer ON answers(experience_id,answer_key) WHERE active;
CREATE TABLE observations(id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, answer_id text NOT NULL, semantic_key text NOT NULL, payload jsonb NOT NULL, active boolean NOT NULL DEFAULT true, recorded_at timestamptz NOT NULL, FOREIGN KEY(experience_id,owner) REFERENCES experiences(id,owner) ON DELETE CASCADE);
ALTER TABLE observations ADD UNIQUE(id,experience_id,owner);
ALTER TABLE observations ADD FOREIGN KEY(answer_id,experience_id,owner) REFERENCES answers(id,experience_id,owner) ON DELETE CASCADE;
CREATE UNIQUE INDEX one_active_atom ON observations(experience_id,semantic_key) WHERE active;
CREATE TABLE interpretations(id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, revision integer NOT NULL, status text NOT NULL CHECK(status IN ('scoped_fact','candidate','contested')), payload jsonb NOT NULL, FOREIGN KEY(experience_id,owner) REFERENCES experiences(id,owner) ON DELETE CASCADE);
ALTER TABLE interpretations ADD UNIQUE(id,experience_id,owner);
CREATE TABLE interpretation_dependencies(interpretation_id text, observation_id text, experience_id text NOT NULL, owner text NOT NULL, PRIMARY KEY(interpretation_id,observation_id), FOREIGN KEY(interpretation_id,experience_id,owner) REFERENCES interpretations(id,experience_id,owner) ON DELETE CASCADE, FOREIGN KEY(observation_id,experience_id,owner) REFERENCES observations(id,experience_id,owner) ON DELETE CASCADE);

CREATE TABLE extraction_artifacts(
 id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, answer_id text NOT NULL,
 origin text NOT NULL CHECK(origin IN ('rules','ai')), status text NOT NULL, request_key text,
 payload jsonb NOT NULL, recorded_at timestamptz NOT NULL,
 UNIQUE(id,experience_id,owner), UNIQUE(id,answer_id,experience_id,owner),
 FOREIGN KEY(answer_id,experience_id,owner) REFERENCES answers(id,experience_id,owner) ON DELETE CASCADE
);
CREATE TABLE observation_sources(
 observation_id text NOT NULL, answer_id text NOT NULL, experience_id text NOT NULL, owner text NOT NULL,
 artifact_id text NOT NULL, source_ref jsonb NOT NULL,
 PRIMARY KEY(observation_id,answer_id,artifact_id,source_ref),
 FOREIGN KEY(observation_id,experience_id,owner) REFERENCES observations(id,experience_id,owner) ON DELETE CASCADE,
 FOREIGN KEY(answer_id,experience_id,owner) REFERENCES answers(id,experience_id,owner) ON DELETE CASCADE,
 FOREIGN KEY(artifact_id,answer_id,experience_id,owner) REFERENCES extraction_artifacts(id,answer_id,experience_id,owner) ON DELETE CASCADE
);
CREATE TABLE unresolved_signals(
 id text PRIMARY KEY, experience_id text NOT NULL, owner text NOT NULL, answer_id text NOT NULL,
 artifact_id text NOT NULL, payload jsonb NOT NULL, active boolean NOT NULL,
 FOREIGN KEY(answer_id,experience_id,owner) REFERENCES answers(id,experience_id,owner) ON DELETE CASCADE,
 FOREIGN KEY(artifact_id,answer_id,experience_id,owner) REFERENCES extraction_artifacts(id,answer_id,experience_id,owner) ON DELETE CASCADE
);
