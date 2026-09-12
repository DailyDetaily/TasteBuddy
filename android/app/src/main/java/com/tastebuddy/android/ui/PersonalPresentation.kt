package com.tastebuddy.android.ui

import com.tastebuddy.android.domain.*

/** iOS PersonalTasteCandidatePresentation와 같은 조건 묶음 및 사용자 문구. */
data class CandidatePresentation(
    val id: String,
    val title: String,
    val body: String,
    val eyebrow: String,
    val evidenceIDs: List<String>,
    val mealCount: Int,
)

object PersonalPresentation {
    fun groups(
        candidates: List<PersonalCandidate>,
        conditionLabel: (Condition) -> String = PersonalTasteModel::conditionLabel,
    ): List<CandidatePresentation> {
        val priorities =
            listOf(
                "repeated_direction",
                "mixed",
                "unstable",
                "first_signal",
                "insufficient_context",
            )
        val order =
            compareBy<PersonalCandidate> {
                    priorities.indexOf(it.status).let { index -> if (index < 0) 5 else index }
                }
                .thenBy { it.conditions.isEmpty() }
                .thenBy { it.conditions.size }
                .thenByDescending { it.distribution.mealCount }
                .thenBy { it.id }
        return candidates
            .filter { it.distribution.mealCount > 0 }
            .groupBy { "${it.attribute}|${it.reference.orEmpty()}" }
            .map { (id, values) ->
                val rows = values.sortedWith(order)
                val representative = rows.first()
                val label = representative.label
                val positive = rows.firstOrNull { it.direction == "positive" }
                val negative = rows.firstOrNull { it.direction == "negative" }
                val anchor = positive ?: negative
                fun conditionText(candidate: PersonalCandidate) =
                    if (candidate.conditions.isEmpty()) "기록한 식사"
                    else candidate.conditions.joinToString(" · ", transform = conditionLabel)
                fun sharesDimension(candidate: PersonalCandidate) =
                    anchor != null &&
                        candidate.conditions.any { condition ->
                            anchor.conditions.any {
                                it.dimension == condition.dimension && it.value != condition.value
                            }
                        }
                val mixed =
                    rows
                        .filter { it.status == "mixed" }
                        .sortedWith(
                            compareByDescending<PersonalCandidate> { sharesDimension(it) }
                                .then(order)
                        )
                        .firstOrNull()
                fun summary(candidate: PersonalCandidate): String {
                    val subject =
                        if (candidate.conditions.isEmpty()) label
                        else "${conditionText(candidate)} $label"
                    val count = candidate.distribution.mealCount
                    candidate.direction?.let { direction ->
                        val response =
                            mapOf("positive" to "호감", "neutral" to "보통", "negative" to "아쉬움")[
                                direction] ?: "같은 반응"
                        return "${subject}는 ${count}번의 식사에서 ${response}을 남겼어요."
                    }
                    val distribution = candidate.distribution
                    val responses = buildList {
                        if (distribution.positive > 0) add("호감")
                        if (distribution.neutral > 0) add("중립")
                        if (distribution.negative > 0) add("아쉬움")
                        if (distribution.mixed > 0) add("한 식사 안의 다른 평가")
                    }
                    if (responses.size > 1)
                        return "${subject}에는 ${responses.dropLast(1).joinToString(", ")}과 ${responses.last()}이 함께 있었어요."
                    return responses.firstOrNull()?.let {
                        "${subject}는 ${count}번의 식사에서 ${it}을 남겼고 더 확인하고 있어요."
                    } ?: "${subject}는 아직 방향을 정할 평가가 부족해요."
                }
                val title =
                    when {
                        positive != null && negative != null -> "$label, 조건에 따라 달랐던 반응"
                        rows.any { it.status == "mixed" } -> "$label, 상황에 따라 달랐던 기록"
                        representative.conditions.isEmpty() -> "${label}에 남긴 평가"
                        else -> "$label, ${conditionText(representative)}에서 남긴 평가"
                    }
                val body =
                    when {
                        positive != null && negative != null ->
                            "${summary(positive)} ${summary(negative)}"
                        anchor != null && mixed != null -> "${summary(anchor)} ${summary(mixed)}"
                        else -> summary(representative)
                    }
                val count =
                    rows.flatMap { it.evidence.map { evidence -> evidence.mealID } }.distinct().size
                val eyebrow =
                    if (rows.any { it.counterMealIDs.isNotEmpty() || it.status == "mixed" })
                        "${count}번의 식사 · 조건과 다른 기록 포함"
                    else if (count > 1) "${count}번의 식사에서 조건 비교" else "첫 단서 · 1번의 식사"
                CandidatePresentation(
                    id,
                    title,
                    body,
                    eyebrow,
                    rows.flatMap { it.evidenceIDs }.distinct().sorted(),
                    count,
                )
            }
            .sortedWith(
                compareByDescending<CandidatePresentation> { it.mealCount }.thenBy { it.id }
            )
    }
}
