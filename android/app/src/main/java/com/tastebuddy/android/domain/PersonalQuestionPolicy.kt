package com.tastebuddy.android.domain

import kotlinx.serialization.Serializable

@Serializable
data class QuestionContext(
    val selection: NextSelection,
    val sourceEntryID: String?,
    val sourceTarget: String = "unspecified",
    val sourcePhase: String = "unspecified",
    val sourceReference: String? = null,
    val entryIDsAtStart: Set<String> = emptySet(),
    val mealIDsAtStart: Set<String> = emptySet(),
)

object PersonalQuestionPolicy {
    fun canSave(entry: DiningEntry, context: QuestionContext, current: List<DiningEntry>): Boolean =
        when (context.selection.intent) {
            "clarification" ->
                context.sourceEntryID == entry.id && current.any { it.id == entry.id }
            "exploration" ->
                entry.id !in context.entryIDsAtStart &&
                    entry.mealID !in context.mealIDsAtStart &&
                    current.none { it.id == entry.id || it.mealID == entry.mealID }
            else -> false
        }

    fun isAnswered(entry: DiningEntry, context: QuestionContext, parsed: SensorySnapshot): Boolean {
        if (!entry.hasCompletedTasteFeedback) return false
        val question = context.selection
        if (question.intent == "exploration") {
            val proposed = question.proposedCondition ?: return false
            return parsed.personalModel?.units.orEmpty().any { unit ->
                unit.attribute == question.attribute &&
                    unit.reference == context.sourceReference &&
                    unit.liking in listOf("positive", "neutral", "negative") &&
                    when (proposed.dimension) {
                        "intensity" -> unit.intensity == proposed.value
                        "target" -> unit.target == proposed.value
                        "phase" -> unit.phase == proposed.value
                        "dishKind" -> proposed.value in unit.dishKindIDs
                        else -> false
                    }
            }
        }
        return parsed.observations.any { observation ->
            observation.attribute == question.attribute &&
                observation.reference == context.sourceReference &&
                (question.facet == "target" ||
                    context.sourceTarget == "unspecified" ||
                    observation.target == context.sourceTarget) &&
                (question.facet == "phase" ||
                    context.sourcePhase == "unspecified" ||
                    observation.phase == context.sourcePhase) &&
                when (question.facet) {
                    "liking" -> observation.kind == "attribute_liking"
                    "intensity" -> observation.kind == "sensory_intensity"
                    "target" -> observation.target != "unspecified"
                    "phase" -> observation.phase != "unspecified"
                    else -> false
                }
        }
    }
}
