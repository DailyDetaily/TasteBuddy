package com.tastebuddy.android.domain

import java.time.Instant
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable
data class PersonalRecord(
    val observationId: String,
    val userId: String,
    val experienceId: String,
    val mealId: String = experienceId,
    val kind: String = "attribute_liking",
    val attribute: String? = null,
    val attributeLabel: String? = null,
    val reference: String? = null,
    val value: JsonPrimitive,
    val scale: String = "attribute-three-category-v1",
    val target: String = "unspecified",
    val phase: String = "unspecified",
    val observedAt: String? = null,
    val knownAt: String? = null,
    val dishKindIDs: List<String> = emptyList(),
    val phrase: String = "",
    val sourceSpans: List<SourceSpan> = emptyList(),
    val confirmationStatus: String = "explicit_user_choice",
    val selectionEvidence: SelectionEvidence? = null,
    val conditionSources: List<ConditionSource> = emptyList(),
)

@Serializable data class Condition(val dimension: String, val value: String)

@Serializable
data class Distribution(
    val positive: Int,
    val neutral: Int,
    val negative: Int,
    val mixed: Int,
    val mealCount: Int,
)

@Serializable
data class Stability(val evaluatedMealCount: Int, val unchangedCount: Int, val stable: Boolean)

@Serializable
data class ConditionSource(
    val dimension: String,
    val value: String,
    val sourceField: String,
    val labelSnapshot: String? = null,
)

@Serializable
data class PersonalEvidence(
    val id: String,
    val mealID: String,
    val phrase: String,
    val sourceSpans: List<SourceSpan>,
    val selectionEvidence: SelectionEvidence? = null,
    val conditionSources: List<ConditionSource> = emptyList(),
)

@Serializable
data class PersonalUnit(
    val id: String,
    val mealID: String,
    val experienceIDs: List<String>,
    val attribute: String,
    val reference: String?,
    val label: String,
    val target: String,
    val phase: String,
    val intensity: String?,
    val dishKindIDs: List<String>,
    val liking: String,
    val intensityConflict: Boolean,
    val evidenceIDs: List<String>,
    val evidence: List<PersonalEvidence>,
)

@Serializable
data class PersonalCandidate(
    val id: String,
    val attribute: String,
    val reference: String?,
    val label: String,
    val conditions: List<Condition>,
    val title: String,
    val body: String,
    val status: String,
    val direction: String?,
    val distribution: Distribution,
    val baselineDistribution: Distribution,
    val supportMealIDs: List<String>,
    val counterMealIDs: List<String>,
    val neutralMealIDs: List<String>,
    val mixedMealIDs: List<String>,
    val evidenceIDs: List<String>,
    val evidence: List<PersonalEvidence>,
    val abstainReasons: List<String>,
    val stability: Stability,
    val contrastsWithBaseline: Boolean,
)

@Serializable
data class NextSelection(
    val id: String,
    val attribute: String,
    val label: String,
    val facet: String,
    val question: String,
    val reason: String,
    val evidenceIDs: List<String>,
    val mealIDs: List<String>,
    val createsEvidence: Boolean = false,
    val intent: String = "clarification",
    val proposedCondition: Condition? = null,
    val unobserved: Boolean = false,
)

@Serializable
data class OverallAssociation(
    val unitID: String,
    val mealID: String,
    val attribute: String,
    val individualValue: String,
    val overallValues: List<String>,
    val evidenceIDs: List<String>,
    val causalClaim: String? = null,
)

@Serializable data class ExcludedEvidence(val id: String, val reason: String)

@Serializable
data class TemporalValidity(
    val mode: String,
    val asOf: String?,
    val missingKnownAtCount: Int,
    val historicalReconstruction: Boolean = false,
)

@Serializable
data class PersonalPolicy(
    val minMeals: Int = 3,
    val minConditionMeals: Int = 3,
    val maxConditionDimensions: Int = 2,
)

@Serializable
data class PersonalSnapshot(
    val version: String,
    val userID: String,
    val policy: PersonalPolicy,
    val units: List<PersonalUnit>,
    val candidates: List<PersonalCandidate>,
    val nextSelection: NextSelection?,
    val overallAssociations: List<OverallAssociation>,
    val excludedEvidence: List<ExcludedEvidence>,
    val temporalValidity: TemporalValidity,
    val limits: List<String>,
)

@Serializable
data class PersonalPrediction(
    val direction: String?,
    val candidateID: String?,
    val status: String,
    val abstainReasons: List<String>,
    val evidenceIDs: List<String>,
)

@Serializable
data class PersonalQuery(
    val attribute: String,
    val reference: String? = null,
    val target: String? = null,
    val phase: String? = null,
    val intensity: String? = null,
    val dishKindIDs: List<String> = emptyList(),
)

/** 같은 식사의 여러 표현은 하나의 독립 관찰로 집계하고, 근거 부족·반례가 있으면 판단을 유보한다. */
object PersonalTasteModel {
    const val VERSION = "tba-personal-taste-model/1"
    private val outcomes = listOf("positive", "neutral", "negative")

    private fun unique(values: List<String>) = values.distinct().sorted()

    private fun scope(r: PersonalRecord) =
        jsonArray(r.experienceId, r.attribute, r.reference, r.target, r.phase).canonical()

    private fun attributeKey(u: PersonalUnit) = jsonArray(u.attribute, u.reference).canonical()

    private fun label(r: PersonalRecord) =
        r.reference
            ?: r.attributeLabel
            ?: mapOf(
                "taste.sweet" to "단맛",
                "taste.sour" to "산미",
                "taste.salty" to "짠맛",
                "taste.bitter" to "쓴맛",
                "taste.umami" to "감칠맛",
                "texture.crisp" to "바삭함",
                "texture.soft" to "부드러운 식감",
                "aroma.roasted" to "구운 향",
            )[r.attribute]
            ?: r.attribute.orEmpty()

    private fun vote(units: List<PersonalUnit>): Pair<List<Pair<String, String>>, Distribution> {
        val meals =
            units
                .groupBy { it.mealID }
                .toSortedMap()
                .map { (id, rows) ->
                    val values = unique(rows.map { it.liking })
                    id to if (values.size == 1) values[0] else "mixed"
                }
        return meals to
            Distribution(
                meals.count { it.second == "positive" },
                meals.count { it.second == "neutral" },
                meals.count { it.second == "negative" },
                meals.count { it.second == "mixed" },
                meals.size,
            )
    }

    private fun leader(d: Distribution): String? {
        val values =
            mapOf("positive" to d.positive, "neutral" to d.neutral, "negative" to d.negative)
        val maximum = values.values.maxOrNull() ?: 0
        return outcomes.filter { values[it] == maximum }.singleOrNull()?.takeIf { maximum > 0 }
    }

    private fun value(u: PersonalUnit, dimension: String) =
        when (dimension) {
            "target" -> u.target
            "phase" -> u.phase
            "intensity" -> u.intensity
            else -> null
        }

    private fun matches(u: PersonalUnit, conditions: List<Condition>) = conditions.all {
        if (it.dimension == "dishKind") it.value in u.dishKindIDs
        else value(u, it.dimension) == it.value
    }

    private fun conditionList(u: PersonalUnit) =
        listOf("target", "phase", "intensity").mapNotNull { d ->
            value(u, d)?.takeIf { it != "unspecified" }?.let { Condition(d, it) }
        } + u.dishKindIDs.map { Condition("dishKind", it) }

    fun conditionLabel(c: Condition): String =
        mapOf(
                "target" to
                    mapOf(
                        "sauce" to "소스",
                        "surface" to "겉",
                        "inside" to "속",
                        "whole_dish" to "음식 전체",
                        "broth" to "국물",
                    ),
                "phase" to SelectionLabels.phases,
                "intensity" to mapOf("weak" to "약한 강도", "medium" to "중간 강도", "strong" to "강한 강도"),
            )[c.dimension]
            ?.get(c.value) ?: c.value

    private fun evidence(records: List<PersonalRecord>) =
        records
            .associateBy { it.observationId }
            .toSortedMap()
            .values
            .map {
                PersonalEvidence(
                    it.observationId,
                    it.mealId,
                    it.phrase,
                    it.sourceSpans,
                    it.selectionEvidence,
                    it.conditionSources,
                )
            }

    private data class Rated(
        val record: PersonalRecord,
        val intensity: String?,
        val conflict: Boolean,
        val intensityRows: List<PersonalRecord>,
    )

    private fun sameSelection(a: PersonalRecord, b: PersonalRecord): Boolean {
        val x = a.selectionEvidence ?: return b.selectionEvidence == null
        val y = b.selectionEvidence ?: return false
        return x.selectionID == y.selectionID &&
            x.type == y.type &&
            x.catalogVersion == y.catalogVersion &&
            x.relatedBubbleID == y.relatedBubbleID
    }

    private fun subtract(d: Distribution, value: String) =
        d.copy(
            mealCount = d.mealCount - 1,
            positive = d.positive - if (value == "positive") 1 else 0,
            neutral = d.neutral - if (value == "neutral") 1 else 0,
            negative = d.negative - if (value == "negative") 1 else 0,
            mixed = d.mixed - if (value !in outcomes) 1 else 0,
        )

    private data class Question(
        val attribute: String,
        val reference: String?,
        val label: String,
        val facet: String,
        val reason: String,
        val score: Int,
        val evidenceIDs: List<String>,
        val mealIDs: List<String>,
        val target: String,
        val phase: String,
        val intent: String = "clarification",
        val proposedCondition: Condition? = null,
    )

    fun build(
        records: List<PersonalRecord>,
        userID: String,
        asOf: Instant? = null,
        policy: PersonalPolicy = PersonalPolicy(),
        suppressedQuestionIDs: List<String> = emptyList(),
    ): PersonalSnapshot {
        require(
            policy.minMeals >= 2 &&
                policy.minConditionMeals >= 2 &&
                policy.maxConditionDimensions == 2
        )
        val excluded = mutableListOf<ExcludedEvidence>()
        val included = mutableListOf<PersonalRecord>()
        var missingKnownAtCount = 0
        for ((id, duplicates) in records.groupBy { it.observationId }.toSortedMap()) {
            val r = duplicates[0]
            var reason =
                when {
                    duplicates.any { canonical(it) != canonical(r) } ->
                        "conflicting_record_identity"
                    r.userId != userID -> "different_user"
                    userID.isEmpty() ||
                        id.isEmpty() ||
                        r.experienceId.isEmpty() ||
                        r.mealId.isEmpty() -> "missing_record_identity"
                    else -> null
                }
            if (r.knownAt == null) missingKnownAtCount++
            if (reason == null && asOf != null)
                reason =
                    when {
                        parseInstant(r.observedAt) == null -> "observed_time_unknown"
                        parseInstant(r.knownAt) == null -> "known_time_unknown"
                        parseInstant(r.observedAt)!! > asOf || parseInstant(r.knownAt)!! > asOf ->
                            "after_cutoff"
                        else -> null
                    }
            if (
                reason == null &&
                    r.confirmationStatus !in
                        listOf("explicit_user_choice", "rule_extracted_statement")
            )
                reason = "unconfirmed"
            if (reason != null) {
                excluded += ExcludedEvidence(id, reason)
                continue
            }
            included += r.copy(dishKindIDs = unique(r.dishKindIDs))
        }
        val scopeGroups = included.groupBy(::scope)
        val ratingGroups = sortedMapOf<String, MutableList<Rated>>()
        for (r in included.filter { it.kind == "attribute_liking" }) {
            val reason =
                when {
                    r.attribute == null || r.attribute.endsWith(".unspecified") ->
                        "unknown_attribute"
                    r.value.sensoryText !in outcomes || r.scale != "attribute-three-category-v1" ->
                        "unsupported_liking"
                    scopeGroups[scope(r)].orEmpty().any {
                        it.kind == "sensory_presence" &&
                            it.value == JsonPrimitive(false) &&
                            sameSelection(it, r)
                    } -> "absence_qualified"
                    else -> null
                }
            if (reason != null) {
                excluded += ExcludedEvidence(r.observationId, reason)
                continue
            }
            val intensityRows =
                scopeGroups[scope(r)].orEmpty().filter {
                    it.kind == "sensory_intensity" &&
                        it.scale == "expression-strength-v1" &&
                        sameSelection(it, r)
                }
            val levels = unique(intensityRows.map { it.value.sensoryText })
            val intensity =
                levels.singleOrNull()?.takeIf { it in listOf("weak", "medium", "strong") }
            val key =
                jsonArray(
                        userID,
                        r.mealId,
                        r.attribute,
                        r.reference,
                        r.target,
                        r.phase,
                        intensity,
                        r.dishKindIDs,
                    )
                    .canonical()
            ratingGroups.getOrPut(key) { mutableListOf() } +=
                Rated(r, intensity, levels.size > 1, intensityRows)
        }
        val units = ratingGroups.map { (key, rows) ->
            val r = rows[0].record
            val values = unique(rows.map { it.record.value.sensoryText })
            PersonalUnit(
                personalID("unit", key),
                r.mealId,
                unique(rows.map { it.record.experienceId }),
                r.attribute!!,
                r.reference,
                label(r),
                r.target,
                r.phase,
                rows[0].intensity,
                r.dishKindIDs,
                values.singleOrNull() ?: "mixed",
                rows.any { it.conflict },
                unique(
                    rows.flatMap {
                        listOf(it.record.observationId) +
                            it.intensityRows.map { row -> row.observationId }
                    }
                ),
                evidence(rows.flatMap { listOf(it.record) + it.intensityRows }),
            )
        }
        val candidates = mutableListOf<PersonalCandidate>()
        val attributes = units.groupBy(::attributeKey).toSortedMap()
        for ((key, attributeUnits) in attributes) {
            val base = vote(attributeUnits).second
            val conditionSets = sortedMapOf("[]" to emptyList<Condition>())
            for (u in attributeUnits) {
                val available = conditionList(u).sortedBy { canonical(it) }
                for (c in available) conditionSets[canonical(listOf(c))] = listOf(c)
                for (i in available.indices) for (j in available.indices) if (
                    j > i && available[i].dimension != available[j].dimension
                ) {
                    val pair = listOf(available[i], available[j])
                    conditionSets[canonical(pair)] = pair
                }
            }
            for ((conditionKey, conditions) in conditionSets) {
                val selected = attributeUnits.filter { matches(it, conditions) }
                val (meals, distribution) = vote(selected)
                val rawDirection = leader(distribution)
                val opposite =
                    when (rawDirection) {
                        "positive" -> "negative"
                        "negative" -> "positive"
                        else -> null
                    }
                val counter =
                    if (opposite != null) meals.filter { it.second == opposite }.map { it.first }
                    else if (rawDirection == "neutral")
                        meals
                            .filter { it.second in listOf("positive", "negative") }
                            .map { it.first }
                    else emptyList()
                val minimum =
                    if (conditions.isEmpty()) policy.minMeals else policy.minConditionMeals
                val unchanged = meals.count {
                    rawDirection != null &&
                        leader(subtract(distribution, it.second)) == rawDirection
                }
                val stable = meals.size > 1 && unchanged == meals.size
                val reasons = buildList {
                    if (meals.size < minimum)
                        add(
                            if (conditions.isEmpty()) "needs_independent_meals"
                            else "condition_needs_repeated_meals"
                        )
                    if (distribution.mixed > 0) add("conflicting_reports_in_meal")
                    if (rawDirection == null) add("no_unique_direction")
                    if (counter.isNotEmpty()) add("counter_evidence_present")
                    if (!stable) add("leave_one_meal_out_unstable")
                    if (
                        conditions.any { it.dimension == "intensity" } &&
                            selected.any { it.intensityConflict }
                    )
                        add("intensity_conflict")
                }
                val direction = rawDirection.takeIf { reasons.isEmpty() }
                val status =
                    when {
                        direction != null -> "repeated_direction"
                        distribution.mixed > 0 || counter.isNotEmpty() || rawDirection == null ->
                            "mixed"
                        meals.size < minimum ->
                            if (conditions.isEmpty()) "first_signal" else "insufficient_context"
                        else -> "unstable"
                    }
                val first = selected[0]
                val conditionText = conditions.joinToString(" · ", transform = ::conditionLabel)
                val title =
                    if (conditions.isEmpty()) "${first.label}에 남긴 평가"
                    else "${first.label}, ${conditionText}에서 남긴 평가"
                val body =
                    if (direction != null)
                        "${meals.size}번의 식사에서 ${when (direction) { "positive" -> "호감"
 "negative" -> "아쉬움"
 else -> "중립" }} 방향이 반복됐어요. 관찰한 조건의 기록이며 원인을 뜻하지 않아요."
                    else "${meals.size}번의 식사를 비교했어요. 반례나 부족한 조건을 확인하며 판단을 유보해요."
                candidates +=
                    PersonalCandidate(
                        personalID("candidate", userID, key, conditionKey),
                        first.attribute,
                        first.reference,
                        first.label,
                        conditions,
                        title,
                        body,
                        status,
                        direction,
                        distribution,
                        base,
                        if (rawDirection == null) emptyList()
                        else meals.filter { it.second == rawDirection }.map { it.first },
                        counter,
                        meals.filter { it.second == "neutral" }.map { it.first },
                        meals.filter { it.second == "mixed" }.map { it.first },
                        unique(selected.flatMap { it.evidenceIDs }),
                        selected
                            .flatMap { it.evidence }
                            .associateBy { it.id }
                            .toSortedMap()
                            .values
                            .toList(),
                        reasons,
                        Stability(meals.size, unchanged, stable),
                        direction != null && leader(base) != direction,
                    )
            }
        }
        candidates.sortBy { it.id }
        val overallAssociations = units.mapNotNull { unit ->
            val overall = included.filter {
                it.kind == "overall_liking" &&
                    it.experienceId in unit.experienceIDs &&
                    it.scale == "overall-five-category-v1"
            }
            if (overall.isEmpty()) null
            else
                OverallAssociation(
                    unit.id,
                    unit.mealID,
                    unit.attribute,
                    unit.liking,
                    unique(overall.map { it.value.sensoryText }),
                    unique(unit.evidenceIDs + overall.map { it.observationId }),
                )
        }
        val questions = mutableListOf<Question>()
        for (r in
            included.filter {
                it.attribute != null &&
                    !it.attribute.endsWith(".unspecified") &&
                    it.kind == "sensory_presence" &&
                    it.value == JsonPrimitive(true)
            }) {
            if (included.any { it.kind == "attribute_liking" && scope(it) == scope(r) }) continue
            questions +=
                Question(
                    r.attribute!!,
                    r.reference,
                    label(r),
                    "liking",
                    "liking_not_reported",
                    100,
                    listOf(r.observationId),
                    listOf(r.mealId),
                    r.target,
                    r.phase,
                )
        }
        for (u in units) for ((facet, missing, score) in
            listOf(
                Triple("intensity", u.intensity == null, 70),
                Triple("target", u.target == "unspecified", 60),
                Triple("phase", u.phase == "unspecified", 50),
            )) {
            if (!missing) continue
            val unstable = candidates.any {
                it.attribute == u.attribute && it.reference == u.reference && it.status == "mixed"
            }
            questions +=
                Question(
                    u.attribute,
                    u.reference,
                    u.label,
                    facet,
                    if (unstable) "unstable_context_comparison" else "${facet}_not_reported",
                    if (unstable) 90 else score,
                    u.evidenceIDs,
                    listOf(u.mealID),
                    u.target,
                    u.phase,
                )
        }
        for ((_, rows) in attributes) {
            val known = unique(rows.mapNotNull { it.intensity })
            if (
                known.none { level ->
                    vote(rows.filter { it.intensity == level }).second.mealCount >=
                        policy.minConditionMeals
                }
            )
                continue
            val proposed =
                listOf("weak", "medium", "strong").firstOrNull { it !in known } ?: continue
            val first = rows[0]
            questions +=
                Question(
                    first.attribute,
                    first.reference,
                    first.label,
                    "intensity",
                    "unobserved_intensity_comparison",
                    10,
                    unique(rows.flatMap { it.evidenceIDs }),
                    unique(rows.map { it.mealID }),
                    "unspecified",
                    "unspecified",
                    "exploration",
                    Condition("intensity", proposed),
                )
        }
        val questionGroups = mutableMapOf<String, Question>()
        for (q in questions) {
            val key =
                jsonArray(
                        q.attribute,
                        q.reference,
                        q.facet,
                        q.target,
                        q.phase,
                        q.intent,
                        q.proposedCondition?.let {
                            mapOf("dimension" to it.dimension, "value" to it.value)
                        },
                    )
                    .canonical()
            val old = questionGroups[key]
            questionGroups[key] =
                if (old == null) q
                else
                    old.copy(
                        score = maxOf(old.score, q.score),
                        evidenceIDs = unique(old.evidenceIDs + q.evidenceIDs),
                        mealIDs = unique(old.mealIDs + q.mealIDs),
                    )
        }
        val ranked =
            questionGroups.keys.sortedWith(
                compareByDescending<String> { questionGroups.getValue(it).score }
                    .thenByDescending { questionGroups.getValue(it).mealIDs.size }
                    .thenBy { it }
            )
        val next =
            ranked
                .firstOrNull { personalID("next-selection", userID, it) !in suppressedQuestionIDs }
                ?.let { key ->
                    val q = questionGroups.getValue(key)
                    val question =
                        if (q.intent == "exploration")
                            "다음 식사에서 ${conditionLabel(q.proposedCondition!!)}로 느낀 ${q.label}는 어떤지 확인해 볼까요?"
                        else
                            when (q.facet) {
                                "liking" -> "${q.label} 자체는 어땠나요?"
                                "intensity" -> "${q.label}는 어느 정도로 느껴졌나요?"
                                "target" -> "${q.label}는 어느 부분에서 느껴졌나요?"
                                else -> "${q.label}는 언제 느껴졌나요?"
                            }
                    NextSelection(
                        personalID("next-selection", userID, key),
                        q.attribute,
                        q.label,
                        q.facet,
                        question,
                        q.reason,
                        unique(q.evidenceIDs),
                        unique(q.mealIDs),
                        false,
                        q.intent,
                        q.proposedCondition,
                        q.intent == "exploration",
                    )
                }
        return PersonalSnapshot(
            VERSION,
            userID,
            policy,
            units,
            candidates,
            next,
            overallAssociations,
            excluded.sortedWith(compareBy<ExcludedEvidence> { it.id }.thenBy { it.reason }),
            TemporalValidity(
                if (asOf == null) "current_snapshot" else "historical_as_of",
                asOf?.let(::timestamp),
                missingKnownAtCount,
            ),
            listOf(
                "분포는 기록한 식사 수이며 미래 호감 확률이 아니에요.",
                "조건별 차이는 연관이며 원인을 확정하지 않아요.",
                "전체 평가는 개별 감각의 평가를 바꾸지 않아요.",
                "과거 수정 이력이 없는 기록은 과거 상태로 복원하지 않아요.",
            ),
        )
    }

    fun predict(model: PersonalSnapshot, query: PersonalQuery): PersonalPrediction {
        val explicit =
            listOf("target" to query.target, "phase" to query.phase, "intensity" to query.intensity)
                .mapNotNull { (d, v) ->
                    v?.takeIf { it != "unspecified" }?.let { Condition(d, it) }
                } + query.dishKindIDs.map { Condition("dishKind", it) }
        val units =
            model.units.filter {
                it.attribute == query.attribute &&
                    it.reference == query.reference &&
                    matches(it, explicit)
            }
        val (exactMeals, distribution) = vote(units)
        val minimum =
            if (explicit.isEmpty()) model.policy.minMeals else model.policy.minConditionMeals
        fun failure(reason: String) =
            PersonalPrediction(
                null,
                null,
                "abstained",
                listOf(reason),
                unique(units.flatMap { it.evidenceIDs }),
            )
        if (units.isEmpty()) return failure("unobserved_attribute_or_conditions")
        if (distribution.mealCount < minimum) return failure("query_conditions_need_repeated_meals")
        if (distribution.mixed > 0 || distribution.positive > 0 && distribution.negative > 0)
            return failure("query_condition_counter_evidence")
        val exactDirection = leader(distribution)
        if (exactDirection == "neutral" && (distribution.positive > 0 || distribution.negative > 0))
            return failure("query_condition_counter_evidence")
        if (
            exactDirection == null ||
                exactMeals.any { leader(subtract(distribution, it.second)) != exactDirection }
        )
            return failure("query_leave_one_meal_out_unstable")
        val candidates =
            model.candidates.filter { c ->
                c.attribute == query.attribute &&
                    c.reference == query.reference &&
                    c.conditions.all {
                        when (it.dimension) {
                            "dishKind" -> it.value in query.dishKindIDs
                            "target" -> query.target == it.value
                            "phase" -> query.phase == it.value
                            "intensity" -> query.intensity == it.value
                            else -> false
                        }
                    }
            }
        val depth = candidates.maxOfOrNull { it.conditions.size } ?: -1
        val best =
            candidates
                .filter { it.conditions.size == depth }
                .sortedWith(
                    compareByDescending<PersonalCandidate> { it.distribution.mealCount }
                        .thenBy { it.id }
                )
        val supported = best.filter { it.direction != null }
        if (supported.isEmpty()) return failure("specific_condition_abstained")
        val directions = unique(supported.mapNotNull { it.direction })
        if (directions.size == 1 && directions[0] == leader(distribution))
            return PersonalPrediction(
                supported[0].direction,
                supported[0].id,
                "observed_condition_direction",
                emptyList(),
                unique(units.flatMap { it.evidenceIDs }),
            )
        return failure(
            if (directions.size > 1) "conflicting_matching_conditions" else "no_supported_condition"
        )
    }
}
