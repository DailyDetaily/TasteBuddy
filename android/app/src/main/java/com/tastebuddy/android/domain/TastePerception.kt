package com.tastebuddy.android.domain

import java.time.Instant
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class PerceptionPeriod(
    val evidenceIDs: List<String>, val experienceIDs: List<String>, val mealIDs: List<String>,
    val start: Long?, val end: Long?,
)

@Serializable
data class PerceptionPattern(
    val id: String, val axis: TasteAxis, val foodKey: String, val foodName: String, val restaurantName: String?,
    val target: String, val phase: String, val currentLevel: Int?, val previousLevel: Int?,
    val counts: List<Int>, val conflictCount: Int, val recent: PerceptionPeriod, val previous: PerceptionPeriod,
    val evidenceIDs: List<String>, val experienceIDs: List<String>, val mealIDs: List<String>,
) {
    val hasChange get() = currentLevel != null && previousLevel != null && currentLevel != previousLevel
    val conditionLabel get() = listOfNotNull(restaurantName, foodName, SelectionLabels.targets[target] ?: "부위 확인 중", SelectionLabels.phases[phase] ?: "시점 확인 중").joinToString(" · ")
}

@Serializable
data class PerceptionContrast(val first: PerceptionPattern, val second: PerceptionPattern) {
    val evidenceIDs get() = (first.recent.evidenceIDs + second.recent.evidenceIDs).distinct().sorted()
    val mealIDs get() = (first.recent.mealIDs + second.recent.mealIDs).distinct().sorted()
}

@Serializable
data class PerceptionSnapshot(
    val patterns: List<PerceptionPattern> = emptyList(), val contrasts: List<PerceptionContrast> = emptyList(), val evidenceCount: Int = 0,
) {
    val changes get() = patterns.filter { it.hasChange }
    fun current(axis: TasteAxis) = patterns.filter { it.axis == axis }
        .sortedWith(compareByDescending<PerceptionPattern> { it.recent.end }.thenBy { it.id }).firstOrNull()
}

object TastePerception {
    const val version = "taste-perception/1"
    const val minimumMeals = 3
    val levels = listOf("weak", "medium", "strong")
    val levelLabels = listOf("약하게", "중간 정도로", "강하게")
    private fun key(parts: List<String>) = canonical(parts)
    private fun foodKey(row: SensoryObservation) = key(listOf(row.restaurantID ?: row.restaurantName?.trim().orEmpty(), row.menuItemID.orEmpty(), row.foodName.trim(), key(row.dishKindIDs.distinct().sorted())))
    private fun contextKey(row: SensoryObservation) = key(listOf(row.attribute.orEmpty(), foodKey(row), row.target, row.phase))
    private data class Unit(val first: SensoryObservation, val date: Long, val level: Int?, val evidenceIDs: List<String>, val experienceIDs: List<String>)
    private fun period(units: List<Unit>) = PerceptionPeriod(
        units.flatMap { it.evidenceIDs }.distinct().sorted(), units.flatMap { it.experienceIDs }.distinct().sorted(),
        units.map { it.first.mealID }.distinct().sorted(), units.firstOrNull()?.date, units.lastOrNull()?.date,
    )
    private fun median(units: List<Unit>): Int? = if (units.size >= minimumMeals && units.all { it.level != null })
        units.mapNotNull { it.level }.sorted()[units.size / 2] else null

    // 호출하는 SensoryAnalyzer가 완료된 실제 식사와 원문 출처를 검증한다.
    fun build(observations: List<SensoryObservation>, asOf: Instant? = null): PerceptionSnapshot {
        val conflicting = observations.groupBy { it.id }.filterValues { it.distinct().size > 1 }.keys
        fun visible(row: SensoryObservation): Boolean {
            val observed = parseInstant(row.observedAt) ?: return false
            val known = parseInstant(row.knownAt) ?: return false
            return asOf == null || observed <= asOf && known <= asOf
        }
        val absent = observations.filter { it.kind == "sensory_presence" && it.value == JsonPrimitive(false) && visible(it) }
            .map { key(listOf(it.mealID, contextKey(it))) }.toSet()
        val valid = observations.filter { row ->
            row.id !in conflicting && row.kind == "sensory_intensity" && row.scale == "expression-strength-v1" && row.reference == null
                && row.attribute?.startsWith("taste.") == true && TasteAxis.entries.any { it.name == row.attribute.removePrefix("taste.") }
                && row.value.sensoryText in levels && visible(row)
        }
        val units = valid.groupBy { key(listOf(it.mealID, contextKey(it))) }.map { (id, rows) ->
            val first = rows.first()
            Unit(first, rows.maxOf { parseInstant(it.observedAt)!!.toEpochMilli() },
                if (rows.map { it.value }.distinct().size == 1 && id !in absent) levels.indexOf(first.value.sensoryText) else null,
                rows.map { it.id }.distinct().sorted(), rows.map { it.experienceID }.distinct().sorted())
        }
        val patterns = units.groupBy { contextKey(it.first) }.map { (id, values) ->
            val rows = values.sortedWith(compareBy<Unit> { it.date }.thenBy { it.first.mealID })
            val first = rows.first().first
            val recent = rows.takeLast(minimumMeals)
            val previous = rows.dropLast(minOf(minimumMeals, rows.size)).takeLast(minimumMeals)
            val comparable = first.foodName.isNotBlank() && listOf(first.restaurantID, first.restaurantName, first.menuItemID).any { !it.isNullOrBlank() }
                && first.target != "unspecified" && first.target in SelectionLabels.targets
                && first.phase != "unspecified" && first.phase in SelectionLabels.phases
            val old = if (comparable && previous.size == minimumMeals && previous.last().date < recent.first().date) median(previous) else null
            val all = period(rows)
            PerceptionPattern(id, TasteAxis.valueOf(first.attribute!!.removePrefix("taste.")), foodKey(first), first.foodName.trim(), first.restaurantName, first.target, first.phase,
                if (comparable) median(recent) else null, old, levels.indices.map { level -> recent.count { it.level == level } }, recent.count { it.level == null },
                period(recent), period(previous), all.evidenceIDs, all.experienceIDs, all.mealIDs)
        }.sortedBy { it.id }
        val contrasts = mutableListOf<PerceptionContrast>()
        // ponytail: 조건 쌍의 제곱 비교. 조건 수가 커지면 음식별 인덱스로 나눈다.
        for (i in patterns.indices) for (j in i + 1 until patterns.size) {
            val a = patterns[i]; val b = patterns[j]
            if (a.axis == b.axis && a.foodKey == b.foodKey && a.currentLevel != null && b.currentLevel != null && a.currentLevel != b.currentLevel
                && (if (a.target != b.target) 1 else 0) + (if (a.phase != b.phase) 1 else 0) == 1
                && maxOf(a.recent.start!!, b.recent.start!!) <= minOf(a.recent.end!!, b.recent.end!!)) contrasts += PerceptionContrast(a, b)
        }
        return PerceptionSnapshot(patterns, contrasts, units.map { it.first.mealID }.distinct().size)
    }
}

data class SurveyPerceptionPoint(
    val axis: TasteAxis, val item: SurveyItem?, val submission: SurveySubmission?, val value: Int?,
    val previousSubmission: SurveySubmission?, val previousValue: Int?,
) { val hasChange get() = value != null && previousValue != null && value != previousValue }

object SurveyPerception {
    fun points(submissions: List<SurveySubmission>): List<SurveyPerceptionPoint> {
        val history = submissions.filter { it.schemaVersion == 2 && it.source == "reference-food-recall" && parseInstant(it.recordedAt) != null }
            .distinctBy { parseInstant(it.recordedAt) }.sortedByDescending { parseInstant(it.recordedAt) }
        val current = history.firstOrNull()
        return TasteAxis.entries.map { axis ->
            val item = current?.items?.firstOrNull { it.tasteId == axis }
            val previous = history.drop(1).firstOrNull { candidate ->
                current != null && item != null && candidate.instrument == current.instrument && candidate.scale == current.scale
                    && candidate.recallWindow == current.recallWindow && item in candidate.items
            }
            fun value(submission: SurveySubmission?) = submission?.normalizedResponses?.firstOrNull { it.itemId == item?.id && !it.uncertain }?.selectedValue
            SurveyPerceptionPoint(axis, item, current, value(current), previous, value(previous))
        }
    }
}

data class TasteChangePoint(
    val id: String, val date: Long, val start: Long, val value: Int, val label: String,
    val evidenceIDs: List<String>, val experienceIDs: List<String>, val count: Int,
)
data class TasteChangeSeries(
    val id: String, val axis: TasteAxis, val source: String, val condition: String, val maximum: Int,
    val points: List<TasteChangePoint>, val details: List<String>,
) {
    companion object {
        fun build(model: PerceptionSnapshot, survey: List<SurveyPerceptionPoint>): List<TasteChangeSeries> {
            val meals = model.patterns.map { pattern ->
                val points = listOf(Triple("이전", pattern.previousLevel, pattern.previous), Triple("최근", pattern.currentLevel, pattern.recent)).mapNotNull { (name, value, period) ->
                    if (value == null || period.start == null || period.end == null) null else TasteChangePoint(name, period.end, period.start, value,
                        TastePerception.levelLabels[value], period.evidenceIDs, period.experienceIDs, period.mealIDs.size)
                }
                TasteChangeSeries(pattern.id, pattern.axis, "식사 기록", pattern.conditionLabel, 2, points,
                    listOf("같은 음식·부위·시점의 이전 3번과 최근 3번 식사를 비교해요.", "기록하지 않은 조리 상태·온도나 변화의 원인은 알 수 없어요."))
            }
            val recalled = survey.mapNotNull { point ->
                val item = point.item ?: return@mapNotNull null
                val points = listOf(Triple("이전", point.previousValue, point.previousSubmission), Triple("최근", point.value, point.submission)).mapNotNull { (name, value, submission) ->
                    val date = parseInstant(submission?.recordedAt)?.toEpochMilli()
                    if (value == null || submission == null || date == null) null else TasteChangePoint(name, date, date, value,
                        submission.responseLabel(item.id), emptyList(), emptyList(), 1)
                }
                TasteChangeSeries("survey:${point.axis}", point.axis, "기준 음식 회상", item.anchor.label, 4, points,
                    listOf(item.prompt) + item.anchor.conditions + listOf("회상 응답은 실제 식사 횟수에 포함하지 않아요."))
            }
            return (meals + recalled).filter { it.points.isNotEmpty() }
        }
        fun changeLabel(points: List<TasteChangePoint>): String {
            val previous = points.firstOrNull { it.id == "이전" } ?: return "비교 부족"
            val recent = points.firstOrNull { it.id == "최근" } ?: return "비교 부족"
            return if (recent.value == previous.value) "같은 강도" else if (recent.value > previous.value) "더 강하게" else "더 약하게"
        }
    }
}
