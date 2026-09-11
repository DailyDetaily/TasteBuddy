package com.tastebuddy.android.domain

import org.junit.Assert.*
import org.junit.Test

class PersonalQuestionPolicyTest {
    private val engine =
        SensoryAnalyzer(
            AppJson.decodeFromString<SensoryContract>(
                javaClass.classLoader!!
                    .getResourceAsStream("tba/tba-sensory-contract.json")!!
                    .bufferedReader()
                    .use { it.readText() }
            )
        )
    private val question =
        NextSelection(
            "question",
            "texture.crisp",
            "바삭함",
            "liking",
            "바삭함이 좋았나요?",
            "직접 평가가 필요해요",
            emptyList(),
            emptyList(),
        )
    private val entry =
        DiningEntry(
            id = "source",
            mealID = "original-meal",
            menu = "음식",
            sensorySelections =
                listOf(
                    SensorySelection(
                        "texture-crisp",
                        "detailTag",
                        labelSnapshot = "바삭함",
                        liking = "liked",
                    )
                ),
            feedbackStatus = "completed",
        )

    @Test
    fun savingUnrelatedFeedbackDoesNotResolveTheQuestion() {
        val context = QuestionContext(question, entry.id)
        assertTrue(PersonalQuestionPolicy.isAnswered(entry, context, engine.analyze(listOf(entry))))
        val unrelated = entry.copy(note = "감칠맛이 좋았어요", sensorySelections = emptyList())
        assertFalse(
            PersonalQuestionPolicy.isAnswered(unrelated, context, engine.analyze(listOf(unrelated)))
        )
        val captured = entry.copy(feedbackStatus = "captured")
        assertFalse(
            PersonalQuestionPolicy.isAnswered(captured, context, engine.analyze(listOf(captured)))
        )
    }

    @Test
    fun clarificationCannotRecreateADeletedSource() {
        val context = QuestionContext(question, entry.id)
        assertTrue(PersonalQuestionPolicy.canSave(entry, context, listOf(entry)))
        assertFalse(PersonalQuestionPolicy.canSave(entry, context, emptyList()))
        assertFalse(
            PersonalQuestionPolicy.canSave(entry.copy(id = "other"), context, listOf(entry))
        )
    }

    @Test
    fun explorationRequiresANewMealAndTheProposedCondition() {
        val context =
            QuestionContext(
                question.copy(
                    intent = "exploration",
                    proposedCondition = Condition("dishKind", "fried"),
                ),
                null,
                entryIDsAtStart = setOf(entry.id),
                mealIDsAtStart = setOf(entry.mealID),
            )
        assertFalse(PersonalQuestionPolicy.canSave(entry, context, emptyList()))
        assertFalse(PersonalQuestionPolicy.canSave(entry.copy(id = "new"), context, emptyList()))
        val fresh = entry.copy(id = "new", mealID = "new-meal", dishKindIDs = listOf("fried"))
        assertTrue(PersonalQuestionPolicy.canSave(fresh, context, listOf(entry)))
        assertTrue(PersonalQuestionPolicy.isAnswered(fresh, context, engine.analyze(listOf(fresh))))
        val different = fresh.copy(dishKindIDs = listOf("broth"))
        assertFalse(
            PersonalQuestionPolicy.isAnswered(different, context, engine.analyze(listOf(different)))
        )
    }
}
