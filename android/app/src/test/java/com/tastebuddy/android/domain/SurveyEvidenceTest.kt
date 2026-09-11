package com.tastebuddy.android.domain

import kotlinx.serialization.encodeToString
import org.junit.Assert.*
import org.junit.Test

class SurveyEvidenceTest {
    private val catalog = AppJson.decodeFromString<SurveyCatalog>(
        javaClass.classLoader!!.getResource("fixtures/taste-survey-golden.json")!!.readText()
    )
    @Test fun zeroUnknownMissingAndConditionsSurviveStorage() {
        val sweet = catalog.items.first { it.tasteId == TasteAxis.sweet }
        val fat = catalog.items.first { it.tasteId == TasteAxis.fat }
        val result = SurveyScoring.result(catalog.items, listOf(
            SurveyResponse(sweet.id, 0), SurveyResponse(fat.id, uncertain = true, uncertaintyReason = "cannot_isolate_taste")
        ), "2026-09-07T00:00:00.000Z", mapOf("smokingStatus" to "prefer_not_to_say"))
        val profile = SurveyScoring.profile(result)
        val state = AppState(profile = profile, profileHistory = listOf(profile), surveyInstrumentVersion = "2.0.0")
        val restored = AppJson.decodeFromString<AppState>(AppJson.encodeToString(state))
        assertEquals(state, restored)
        assertEquals(0, restored.profile!!.scores["sweet"])
        assertFalse(restored.profile.scores.containsKey("fat"))
        assertFalse(restored.profile.scores.containsKey("salty"))
        val evidence = restored.profile.surveySubmission!!
        assertEquals(1, evidence.answeredCount)
        assertEquals("전혀 느끼지 않음", evidence.responseLabel(sweet.id))
        assertEquals("지방맛을 구분하기 어려워요", evidence.responseLabel(fat.id))
        assertEquals(catalog.items, evidence.items)
        assertTrue(restored.entries.isEmpty())
        assertTrue(restored.profile.topAxes.isEmpty())
    }
    @Test fun legacyAndLaterInvalidAnswersCannotBecomeNewEvidence() {
        val item = catalog.items.first()
        val responses = listOf(SurveyResponse("sweet-salience", 4), SurveyResponse(item.id, 4), SurveyResponse(item.id, 7))
        assertTrue(SurveyScoring.normalizeResponses(catalog.items, responses).isEmpty())
        assertTrue(SurveyScoring.profile(SurveyScoring.result(catalog.items, responses, "2026-09-07T00:00:00.000Z")).scores.isEmpty())
        assertEquals(0.0, SurveyScoring.scores(catalog.items, listOf(SurveyResponse(item.id, 4))).getValue(item.tasteId).confidence, 0.0)
    }
    @Test fun oldStoredProfileRemainsReadableWithoutSurveySubmission() {
        val old = """{"createdAt":"2026-09-01T00:00:00Z","scores":{"sweet":50},"confidence":"Starter","summary":"기존","topAxes":[],"cautionAxis":"fat"}"""
        val profile = AppJson.decodeFromString<TasteProfile>(old)
        assertNull(profile.surveySubmission)
        assertEquals(50, profile.scores["sweet"])
    }
}
