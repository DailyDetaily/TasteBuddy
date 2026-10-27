const AXES = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'];
const OUTCOMES = new Set(['positive', 'neutral', 'negative']);
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const localDay = value => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Reuse the type model's validated liking evidence; one vote per meal and taste axis. */
export function buildOverallTasteProfile(model, records, { userID, asOf = new Date().toISOString(), dayKey = localDay } = {}) {
  const empty = () => ({ axes: AXES.map(axis => ({ axis, current: summary([]), previous: summary([]) })), previousBefore: null });
  const cutoff = date(asOf);
  if (!userID || model?.userID !== userID || cutoff === null) return empty();
  const own = records.filter(row => row.userId === userID);
  const mealDays = new Map();
  for (const row of own) {
    const meal = row.mealId ?? row.experienceId, observed = date(row.observedAt);
    if (!mealDays.has(meal)) mealDays.set(meal, new Set());
    mealDays.get(meal).add(observed === null || observed > cutoff ? null : dayKey(observed));
  }
  const accepted = new Set((model.units ?? []).filter(unit => !unit.reference && AXES.includes(unit.attribute?.replace(/^taste\./, '')))
    .flatMap(unit => unit.evidenceIDs));
  const byID = new Map();
  for (const row of own) {
    if (!byID.has(row.observationId)) byID.set(row.observationId, []);
    byID.get(row.observationId).push(row);
  }
  const units = new Map();
  for (const [id, duplicates] of byID) {
    const row = duplicates[0], axis = row.attribute?.startsWith('taste.') ? row.attribute.slice(6) : null;
    const observed = date(row.observedAt), known = date(row.knownAt), meal = row.mealId ?? row.experienceId;
    const days = mealDays.get(meal);
    if (!accepted.has(id) || !AXES.includes(axis) || row.reference || row.kind !== 'attribute_liking'
      || row.scale !== 'attribute-three-category-v1' || !OUTCOMES.has(row.value)
      || !['explicit_user_choice', 'rule_extracted_statement'].includes(row.confirmationStatus)
      || observed === null || known === null || observed > cutoff || known > cutoff
      || days?.size !== 1 || days.has(null)) continue;
    const key = JSON.stringify([meal, axis]);
    if (!units.has(key)) units.set(key, { axis, mealID: meal, day: dayKey(observed), values: new Set(), evidenceIDs: new Set() });
    units.get(key).values.add(row.value);
    units.get(key).evidenceIDs.add(id);
  }
  const rows = [...units.values()];
  const latest = rows.map(row => row.day).sort().at(-1) ?? null;
  return {
    axes: AXES.map(axis => ({ axis, current: summary(rows.filter(row => row.axis === axis)),
      previous: summary(rows.filter(row => row.axis === axis && row.day < latest)) })),
    previousBefore: latest,
  };
}

function summary(rows) {
  const valid = rows.filter(row => row.values.size === 1);
  const positive = valid.filter(row => row.values.has('positive')).length;
  return { positive, rated: valid.length, mixed: rows.length - valid.length,
    value: valid.length ? positive / valid.length * 100 : null,
    mealIDs: valid.map(row => row.mealID).sort(),
    evidenceIDs: [...new Set(rows.flatMap(row => [...row.evidenceIDs]))].sort() };
}
