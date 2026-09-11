package com.tastebuddy.android.domain

import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test

class PreferenceIntakeEvidenceTest {
    private val fixture = AppJson.parseToJsonElement(javaClass.classLoader!!.getResource("fixtures/preference-intake.json")!!.readText()).jsonObject
    private val questions = AppJson.decodeFromJsonElement<PreferenceCatalog>(fixture).questions

    @Test fun sharedCasesAndDiningAnalysisRemainIndependent() {
        val contract = AppJson.decodeFromString<SensoryContract>(javaClass.classLoader!!.getResource("TBA/tba-sensory-contract.json")!!.readText())
        val analyzer = SensoryAnalyzer(contract, questions)
        assertEquals(15, fixture["evidenceCases"]!!.jsonArray.size)
        fixture["evidenceCases"]!!.jsonArray.forEach { value ->
            val example = value.jsonObject
            val label = example.string("id")
            val submissions = AppJson.decodeFromJsonElement<List<PreferenceSubmission>>(example["submissions"]!!)
            val cutoff = parseInstant(example["asOf"]?.jsonPrimitive?.contentOrNull)
            val baseline = analyzer.analyze(emptyList(), userID = "fixture-user", asOf = cutoff)
            val expected = example["expected"]!!.jsonObject
            val result = PreferenceIntakeEvidence.build(submissions, questions, "fixture-user", cutoff)
            assertEquals(label, expected["submissionID"]?.jsonPrimitive?.contentOrNull, result.submissionID)
            assertEquals(label, expected["answeredQuestionCount"]!!.jsonPrimitive.int, result.answeredQuestionCount)
            assertEquals(label, AppJson.decodeFromJsonElement<List<PreferenceExcludedSubmission>>(expected["excludedSubmissions"]!!), result.excludedSubmissions)
            val rows = buildJsonArray { result.records.forEach { row -> add(buildJsonObject {
                put("questionID", row.response.questionID); put("kind", row.kind); put("state", row.state); put("summary", row.summary)
                put("selectedIDs", JsonArray(row.response.selectedOptions.map { JsonPrimitive(it.id) }))
            }) } }
            assertEquals(label, expected["records"], rows)
            val snapshot = analyzer.analyze(emptyList(), "fixture-user", cutoff, preferenceSubmissions = submissions)
            assertEquals(label, result, snapshot.statedPreferences)
            assertEquals(label, baseline, snapshot.copy(statedPreferences = PreferenceEvidenceSnapshot()))
        }
    }

    @Test fun storedStateKeepsOriginalOptionsHistoryDraftAndLegacyCompatibility() {
        val source = AppJson.decodeFromJsonElement<PreferenceSubmission>(fixture["evidenceCases"]!!.jsonArray[1].jsonObject["submissions"]!!.jsonArray[0])
        val selections = source.responses.associate { it.questionID to it.selectedOptions.map { option -> option.id } }
        val first = PreferenceIntakeEvidence.create(questions, selections, id = "first", recordedAt = "2026-09-01T00:00:00.000Z")
        val editedSelections = selections + ("flavorIntensityPreference" to listOf("rich"))
        val second = PreferenceIntakeEvidence.create(questions, editedSelections, id = "second", recordedAt = "2026-09-02T00:00:00.000Z")
        val state = AppState(authEntryComplete = true, onboardingComplete = true, preferenceProfile = editedSelections,
            preferenceSubmissions = listOf(first, second), preferenceIntakeDraft = selections)
        val restored = AppJson.decodeFromString<AppState>(AppJson.encodeToString(state))
        assertEquals(state, restored)
        assertEquals("declared_none", PreferenceIntakeEvidence.build(restored.preferenceSubmissions, questions).records.first().state)
        assertEquals("second", PreferenceIntakeEvidence.build(restored.preferenceSubmissions, questions).submissionID)
        assertEquals("android", restored.preferenceSubmissions.first().source.platform)
        assertEquals(7, PreferenceIntakeEvidence.build(restored.preferenceSubmissions, questions).answeredQuestionCount)
        assertTrue(restored.entries.isEmpty())
        assertEquals(AppPhase.Calibration, restored.phase())
        val legacy = AppJson.decodeFromString<AppState>("""{"authEntryComplete":true,"onboardingComplete":true,"preferenceProfile":{"allergies":[]}}""")
        assertTrue(legacy.preferenceSubmissions.isEmpty())
        assertEquals(0, PreferenceIntakeEvidence.build(legacy.preferenceSubmissions, questions).answeredQuestionCount)
        assertEquals(AppPhase.Calibration, legacy.phase())
        assertEquals(AppPhase.PreferenceIntake, legacy.copy(preferenceProfile = emptyMap()).phase())
        val question = questions.first()
        assertEquals(listOf("shellfish"), PreferenceIntakeEvidence.nextSelection(question, listOf("allergies-none"), "shellfish"))
        assertFalse(PreferenceIntakeEvidence.isAnswered(question, listOf("allergies-none", "shellfish")))
    }
}
