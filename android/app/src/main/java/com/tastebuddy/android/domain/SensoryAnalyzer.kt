package com.tastebuddy.android.domain

import java.time.Instant
import kotlinx.serialization.json.JsonPrimitive

class SensoryAnalyzer(private val contract: SensoryContract, private val preferenceQuestions: List<PreferenceQuestion> = emptyList()) {
    private val parser = SensoryParser(contract)
    private val labels =
        contract.semantic.attributes.associate { it.id to (it.label ?: it.meaning) }

    private data class Source(val field: String, val original: String, val result: RuleResult)

    private fun evidenceIdentity(evidence: SelectionEvidence?) =
        evidence?.let { canonical(it).replace("/", "\\/") } ?: "null"

    fun analyze(
        entries: List<DiningEntry>,
        userID: String = "local-owner",
        asOf: Instant? = null,
        suppressedQuestionIDs: List<String> = emptyList(),
        preferenceSubmissions: List<PreferenceSubmission> = emptyList(),
    ): SensorySnapshot {
        val completed = entries.filter { it.hasCompletedTasteFeedback }.distinctBy { it.id }
        val observations = mutableListOf<SensoryObservation>()
        val unresolved = mutableListOf<SensoryUnresolved>()
        for (entry in completed) {
            val sources = mutableListOf<Source>()
            entry.overallEvaluation?.let {
                sources += Source("overallEvaluation:liking", it.responseLabelSnapshot, it.parse())
            }
            val selections =
                entry.sensorySelections
                    ?: (entry.tasteExperienceIDs.map { it to "bubble" } +
                            entry.detailTagIDs.map { it to "detailTag" })
                        .map { (id, type) ->
                            SensorySelection(
                                id,
                                type,
                                labelSnapshot =
                                    contract.selectionCatalog.entries
                                        .firstOrNull { it.id == id && it.type == type }
                                        ?.label ?: id,
                            )
                        }
            val chosen = SelectionParser.parse(selections, contract.selectionCatalog)
            for (atom in chosen.observations) {
                val evidence = atom.selectionEvidence
                val field =
                    "sensorySelections:${evidence?.type.orEmpty()}:${evidence?.selectionID.orEmpty()}:${evidence?.facet ?: "selection"}"
                sources +=
                    Source(field, atom.phrase.orEmpty(), RuleResult(observations = listOf(atom)))
            }
            for (pending in chosen.unresolved) {
                val evidence = pending.selectionEvidence
                val field =
                    "sensorySelections:${evidence?.type.orEmpty()}:${evidence?.selectionID.orEmpty()}:${evidence?.facet ?: "selection"}"
                sources += Source(field, pending.phrase, RuleResult(unresolved = listOf(pending)))
            }
            if (entry.note.isNotBlank() && !isLegacySelectionSummary(entry.note))
                sources += Source("note", entry.note, parser.parse(entry.note))
            for ((field, original, result) in sources) {
                for (atom in result.observations) {
                    val phrase = atom.phrase ?: continue
                    val spans = atom.sourceSpans ?: continue
                    if (
                        !spans.all {
                            it.start >= 0 &&
                                it.end > it.start &&
                                it.end <= original.length &&
                                original.substring(it.start, it.end) == it.quote
                        }
                    )
                        continue
                    val id =
                        stableID(
                            listOf(
                                entry.id.uppercase(),
                                field,
                                atom.kind,
                                atom.attribute.orEmpty(),
                                atom.value.sensoryText,
                                atom.target ?: "whole_dish",
                                atom.phase ?: "unspecified",
                                phrase,
                                (spans.firstOrNull()?.start ?: 0).toString(),
                                evidenceIdentity(atom.selectionEvidence),
                            )
                        )
                    observations +=
                        SensoryObservation(
                            id,
                            entry.id,
                            entry.menu,
                            entry.date,
                            field,
                            atom.kind,
                            atom.attribute,
                            atom.reference ?: labels[atom.attribute] ?: "음식 전체",
                            atom.value,
                            atom.scale,
                            atom.target ?: "whole_dish",
                            atom.phase ?: "unspecified",
                            phrase,
                            spans,
                            atom.reference,
                            atom.combinationComponents.orEmpty(),
                            atom.selectionEvidence,
                            entry.mealID,
                            entry.observedAt,
                            entry.updatedAt ?: entry.savedAt,
                            entry.dishKindIDs,
                            entry.restaurantID,
                            entry.menuItemID,
                            entry.restaurant,
                        )
                }
                for (pending in result.unresolved) unresolved +=
                    SensoryUnresolved(
                        stableID(
                            listOf(
                                entry.id.uppercase(),
                                field,
                                pending.reason,
                                pending.phrase,
                                (pending.sourceSpans.firstOrNull()?.start ?: 0).toString(),
                                evidenceIdentity(pending.selectionEvidence),
                            )
                        ),
                        entry.id,
                        entry.menu,
                        entry.date,
                        field,
                        pending.phrase,
                        pending.reason,
                        pending.sourceSpans,
                        result.needsAI || pending.selectionEvidence != null,
                        pending.selectionEvidence,
                        entry.observedAt,
                        entry.updatedAt ?: entry.savedAt,
                    )
            }
        }
        val unique = observations.distinctBy { it.id }
        val pending = unresolved.distinctBy { it.id }
        val entriesByID = completed.associateBy { it.id }
        val personal =
            PersonalTasteModel.build(
                unique.map { o ->
                    PersonalRecord(
                        o.id,
                        userID,
                        o.experienceID.lowercase(),
                        o.mealID.lowercase(),
                        o.kind,
                        o.attribute,
                        o.attributeLabel,
                        o.reference,
                        o.value,
                        o.scale,
                        o.target,
                        o.phase,
                        o.observedAt?.let { parseInstant(it)?.let(::timestamp) },
                        o.knownAt?.let { parseInstant(it)?.let(::timestamp) },
                        o.dishKindIDs,
                        o.phrase,
                        o.sourceSpans,
                        if (o.selectionEvidence == null) "rule_extracted_statement"
                        else "explicit_user_choice",
                        o.selectionEvidence,
                        conditionSources(o, entriesByID[o.experienceID]),
                    )
                },
                userID,
                asOf,
                suppressedQuestionIDs = suppressedQuestionIDs,
            )
        fun before(observed: String?, known: String?) =
            asOf == null ||
                ((parseInstant(observed) ?: Instant.MAX) <= asOf &&
                    (parseInstant(known) ?: Instant.MAX) <= asOf)
        val visible = unique.filter { before(it.observedAt, it.knownAt) }
        val visiblePending = pending.filter { before(it.observedAt, it.knownAt) }
        return SensorySnapshot(
            "tba-native-sensory/2:${contract.ruleVersion}",
            visible,
            visiblePending,
            buildInsights(visible),
            buildProfile(visible),
            completed.count { before(it.observedAt, it.updatedAt ?: it.savedAt) },
            visible
                .filter {
                    (it.kind != "sensory_detail" && it.kind != "unresolved") ||
                        (it.selectionEvidence != null &&
                            it.selectionEvidence.resolution != "unresolved")
                }
                .map { it.experienceID }
                .distinct()
                .size,
            0,
            visiblePending.any { it.needsMeaningReview },
            listOf(
                "직접 남긴 감각과 평가만 해석하며 음식 이름·기존 점수로 취향을 추정하지 않아요.",
                "미등록 표현과 복잡한 조건은 원문으로 보관하고 의미 확인을 기다려요.",
                "메인·윙은 반복 기록을 구분하는 표시 정책이며 검증된 확률이나 고정 성격이 아니에요.",
                "같은 식사의 여러 기록은 mealID로 묶어 반복 횟수를 계산해요.",
            ),
            personal,
            TastePerception.build(visible, asOf),
            PreferenceIntakeEvidence.build(preferenceSubmissions, preferenceQuestions, userID, asOf),
        )
    }

    private fun conditionSources(
        o: SensoryObservation,
        entry: DiningEntry?,
    ): List<ConditionSource> {
        val result =
            o.dishKindIDs.map { ConditionSource("dishKind", it, "dishKindIDs:$it") }.toMutableList()
        for ((dimension, value) in
            listOf("target" to o.target, "phase" to o.phase).filter {
                it.second != "unspecified"
            }) {
            var field = o.sourceField
            var label = o.phrase
            o.selectionEvidence?.let { evidence ->
                val selected =
                    entry?.sensorySelections?.firstOrNull {
                        it.id == evidence.selectionID && it.type == evidence.type
                    }
                val parent =
                    entry?.sensorySelections?.firstOrNull {
                        it.type == "bubble" && it.id == evidence.relatedBubbleID
                    }
                val directValue = if (dimension == "target") selected?.target else selected?.phase
                val parentValue = if (dimension == "target") parent?.target else parent?.phase
                if (directValue == value && selected != null) {
                    field = "sensorySelections:${selected.type}:${selected.id}:$dimension"
                    label = SelectionLabels.fields[dimension]?.get(value) ?: value
                } else if (parentValue == value && parent != null) {
                    field = "sensorySelections:bubble:${parent.id}:$dimension"
                    label = SelectionLabels.fields[dimension]?.get(value) ?: value
                } else {
                    field = "sensorySelections:${evidence.type}:${evidence.selectionID}:selection"
                    label = evidence.labelSnapshot
                }
            }
            result += ConditionSource(dimension, value, field, label)
        }
        if (o.kind == "sensory_intensity")
            result +=
                ConditionSource(
                    "intensity",
                    o.value.sensoryText,
                    o.sourceField,
                    o.selectionEvidence?.labelValue ?: o.phrase,
                )
        return result
    }

    private fun isLegacySelectionSummary(note: String): Boolean {
        val suffix = "으로 기억에 남은 식후 피드백입니다."
        if (!note.endsWith(suffix)) return false
        val known =
            contract.selectionCatalog.entries
                .filter { it.type == "bubble" }
                .map { it.label }
                .toSet()
        val segments = note.removeSuffix(suffix).split(", ")
        return segments.isNotEmpty() &&
            segments.withIndex().all { (index, text) ->
                val prefix = if (index == 0) "메인 미각 " else "보조 미각 "
                text.startsWith(prefix) && text.removePrefix(prefix) in known
            }
    }

    private fun directLiking(records: List<SensoryObservation>) = records.filter { item ->
        item.kind == "attribute_liking" &&
            item.attribute?.endsWith(".unspecified") != true &&
            records.none {
                it.kind == "sensory_presence" &&
                    it.value == JsonPrimitive(false) &&
                    it.scopeKey == item.scopeKey
            }
    }

    private fun buildInsights(records: List<SensoryObservation>): List<SensoryInsight> {
        val groups =
            directLiking(records)
                .groupBy { "${it.attribute.orEmpty()}|${it.reference.orEmpty()}" }
                .toSortedMap()
        val findings = mutableListOf<SensoryInsight>()
        for ((key, items) in groups) {
            val first = items[0]
            val positive = items.filter { it.value == JsonPrimitive("positive") }
            val negative = items.filter { it.value == JsonPrimitive("negative") }
            if (positive.isEmpty() && negative.isEmpty()) continue
            val meals = items.map { it.experienceID }.distinct().sorted()
            val kind: String
            val title: String
            val body: String
            if (positive.isNotEmpty() && negative.isNotEmpty()) {
                val good = positive[0]
                val bad = negative[0]
                val different =
                    items.map { listOf(it.foodName, it.target, it.phase) }.distinct().size > 1
                kind = if (different) "contextual_preference" else "variable_preference"
                title = "${first.attributeLabel}, 달랐던 반응"
                body =
                    "${good.foodName}에서는 ${good.evidenceText}, ${bad.foodName}에서는 ${bad.evidenceText}라고 남겼어요."
            } else {
                kind = if (meals.size > 1) "repeated_preference" else "scoped_preference"
                title =
                    if (positive.isEmpty()) "${first.attributeLabel}이 아쉬웠던 기록"
                    else "${first.attributeLabel}에서 찾은 즐거움"
                body =
                    if (meals.size > 1)
                        "${meals.size}개 기록에서 ${if (positive.isEmpty()) "아쉬움" else "호감"}을 직접 남겼어요. ${first.evidenceText}"
                    else "${first.foodName}에서 ${first.evidenceText}라고 남겼어요."
            }
            findings +=
                SensoryInsight(
                    stableID(listOf("insight", key, kind) + items.map { it.id }.sorted()),
                    kind,
                    first.attribute,
                    title,
                    body,
                    items.map { it.id },
                    meals,
                )
        }
        for (item in
            records.filter {
                it.kind == "attribute_liking" &&
                    it.attribute?.endsWith(".unspecified") == true &&
                    it.selectionEvidence != null
            }) {
            val evidence = item.selectionEvidence!!
            findings +=
                SensoryInsight(
                    stableID(listOf("selected_descriptor", item.id)),
                    "selected_descriptor_preference",
                    item.attribute,
                    "${evidence.labelSnapshot}에 남긴 평가",
                    "선택한 표현 ‘${evidence.labelSnapshot}’에 ‘${evidence.labelValue}’라고 응답했어요.",
                    listOf(item.id),
                    listOf(item.experienceID),
                )
        }
        for (item in
            records.filter {
                it.kind == "combination_liking" || it.kind == "preference_fit"
            }) findings +=
            SensoryInsight(
                stableID(listOf("scoped", item.id)),
                item.kind,
                item.attribute,
                if (item.kind == "combination_liking") "함께 먹을 때 남긴 느낌" else "이 음식에서 느낀 알맞은 정도",
                "${item.foodName}: ${item.evidenceText}",
                listOf(item.id),
                listOf(item.experienceID),
            )
        for (item in records.filter { it.kind == "attribute_liking" }) {
            val absence = records.filter {
                it.kind == "sensory_presence" &&
                    it.value == JsonPrimitive(false) &&
                    it.scopeKey == item.scopeKey
            }
            if (absence.isEmpty()) continue
            findings +=
                SensoryInsight(
                    stableID(listOf("qualified", item.id)),
                    "qualified_preference",
                    item.attribute,
                    "감각이 없었던 경험의 평가",
                    "${item.foodName}에서 ${item.evidenceText}라고 남겼어요. 감각의 부재를 포함한 이 경험의 평가예요.",
                    (listOf(item) + absence).map { it.id },
                    listOf(item.experienceID),
                )
        }
        val direct = directLiking(records)
        for ((key, liking) in direct.groupBy { it.scopeKey }.toSortedMap()) {
            val first = liking[0]
            val intensity = records.filter { it.kind == "sensory_intensity" && it.scopeKey == key }
            val level = intensity.firstOrNull() ?: continue
            if (
                intensity.map { it.value }.distinct().size != 1 ||
                    liking.map { it.value }.distinct().size != 1
            )
                continue
            val evidence = liking + intensity
            findings +=
                SensoryInsight(
                    stableID(listOf("intensity_liking", key) + evidence.map { it.id }.sorted()),
                    "intensity_and_liking",
                    first.attribute,
                    "${first.attributeLabel}, 함께 남긴 강도와 평가",
                    "${first.foodName}에서 ${level.evidenceText}, ${first.evidenceText}라고 남겼어요. 같은 대상과 시점에 남긴 표현이에요.",
                    evidence.map { it.id },
                    listOf(first.experienceID),
                )
        }
        for (dimension in listOf("phase", "target")) {
            val scopeLabels =
                if (dimension == "phase") SelectionLabels.phases - "unspecified"
                else SelectionLabels.targets - setOf("unspecified", "whole_dish")
            val scoped =
                direct
                    .groupBy {
                        listOf(
                                it.experienceID,
                                it.attribute.orEmpty(),
                                it.reference.orEmpty(),
                                if (dimension == "phase") it.target else it.phase,
                            )
                            .joinToString("|")
                    }
                    .toSortedMap()
            for ((key, all) in scoped) {
                val items = all.filter {
                    (if (dimension == "phase") it.phase else it.target) in scopeLabels
                }
                val first = items.firstOrNull() ?: continue
                if (
                    items
                        .map { if (dimension == "phase") it.phase else it.target }
                        .distinct()
                        .size <= 1 || items.map { it.value }.distinct().size <= 1
                )
                    continue
                val kind =
                    if (dimension == "phase") "within_meal_difference"
                    else "target_preference_difference"
                val details =
                    items.joinToString(" / ") {
                        "${scopeLabels[if (dimension == "phase") it.phase else it.target]}에는 ${it.evidenceText}"
                    }
                findings +=
                    SensoryInsight(
                        stableID(listOf(kind, key) + items.map { it.id }.sorted()),
                        kind,
                        first.attribute,
                        "${first.attributeLabel}, ${if (dimension == "phase") "시점" else "부위"}에 따라 달랐던 평가",
                        details,
                        items.map { it.id },
                        listOf(first.experienceID),
                    )
            }
        }
        val priorities =
            mapOf(
                "within_meal_difference" to 6,
                "target_preference_difference" to 6,
                "contextual_preference" to 5,
                "qualified_preference" to 4,
                "intensity_and_liking" to 3,
            )
        return findings.sortedWith(
            compareByDescending<SensoryInsight> { priorities[it.kind] ?: 0 }
                .thenByDescending { it.experienceIDs.size }
                .thenBy { it.id }
        )
    }

    private fun buildProfile(records: List<SensoryObservation>): MainWing {
        val direct = directLiking(records)
        val candidates =
            contract.styles.map { style ->
                val relevant =
                    (if (style.id == "harmonist")
                            direct + records.filter { it.kind == "combination_liking" }
                        else direct)
                        .filter { item ->
                            when {
                                style.id == "harmonist" && item.kind == "combination_liking" -> true
                                style.id == "texturalist" ->
                                    item.attribute?.startsWith("texture.") == true
                                style.id == "maximalist" ->
                                    item.domain in listOf("taste", "aroma", "trigeminal") &&
                                        records
                                            .filter {
                                                it.kind == "sensory_intensity" &&
                                                    it.scopeKey == item.scopeKey
                                            }
                                            .map { it.value }
                                            .toSet() == setOf(JsonPrimitive("strong"))
                                else -> item.attribute in style.attributes
                            }
                        }
                val support = relevant.filter { it.value == JsonPrimitive("positive") }
                val counter = relevant.filter { it.value == JsonPrimitive("negative") }
                val supportCount = support.map { it.mealID }.distinct().size
                val counterCount = counter.map { it.mealID }.distinct().size
                val status =
                    when {
                        support.isNotEmpty() && counter.isNotEmpty() -> "mixed"
                        supportCount >= 2 -> "repeated_support"
                        support.isNotEmpty() -> "first_signal"
                        counter.isNotEmpty() -> "scoped_dislike"
                        else -> "unknown"
                    }
                StyleCandidate(
                    style.id,
                    style.name,
                    style.label,
                    status,
                    support.map { it.id },
                    counter.map { it.id },
                    supportCount,
                    counterCount,
                    supportCount >= 2 && supportCount > counterCount,
                )
            }
        fun rank(c: StyleCandidate) =
            (c.supportExperienceCount - c.counterExperienceCount) to c.supportExperienceCount
        fun leader(options: List<StyleCandidate>): StyleCandidate? {
            val first =
                options
                    .sortedWith(
                        compareByDescending<StyleCandidate> { rank(it).first }
                            .thenByDescending { rank(it).second }
                    )
                    .firstOrNull() ?: return null
            return first.takeIf { options.count { rank(it) == rank(first) } == 1 }
        }
        val eligible = candidates.filter { it.eligible }
        val main = leader(eligible)
        val wings = eligible.filter { item ->
            main != null &&
                item.id != main.id &&
                records
                    .filter {
                        it.id in item.supportEvidenceIDs && it.id !in main.supportEvidenceIDs
                    }
                    .map { it.mealID }
                    .distinct()
                    .size >= 2
        }
        val wing = leader(wings)
        return MainWing(
            if (main != null) "provisional_profile"
            else if (eligible.isEmpty()) "learning" else "ambiguous_main",
            main,
            wing,
            candidates,
            main?.let { it.name + (wing?.let { w -> " · ${w.name} 윙" } ?: "") }
                ?: if (eligible.isEmpty()) "입맛을 알아가는 중이에요" else "여러 취향이 함께 보여요",
        )
    }
}
