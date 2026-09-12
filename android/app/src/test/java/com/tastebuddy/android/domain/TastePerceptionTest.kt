package com.tastebuddy.android.domain

import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test

class TastePerceptionTest {
    @Test fun sharedEvidenceCases() {
        val fixture = AppJson.parseToJsonElement(javaClass.classLoader!!.getResource("TBA/taste-perception-fixtures.json")!!.readText()).jsonObject
        fixture["cases"]!!.jsonArray.forEach { value ->
            val example = value.jsonObject; val label = example.string("id")
            val expected = example["expected"]!!.jsonObject
            val records = example["records"]!!.jsonArray.map { it.jsonObject }.filter {
                it["feedbackCompleted"]!!.jsonPrimitive.boolean && it.string("userId") == "owner"
                    && it.string("confirmationStatus") in listOf("explicit_user_choice", "rule_extracted_statement")
            }.map { row ->
                SensoryObservation(row.string("observationId"), row.string("experienceId"), row.string("foodName"), row.string("observedAt"), "fixture",
                    row.string("kind"), row.string("attribute"), "짠맛", row["value"]!!.jsonPrimitive, row.string("scale"), row.string("target"), row.string("phase"), row.string("phrase"), emptyList(),
                    row["reference"]?.jsonPrimitive?.contentOrNull, mealID = row.string("mealId"), observedAt = row.string("observedAt"), knownAt = row.string("knownAt"),
                    dishKindIDs = row["dishKindIDs"]!!.jsonArray.map { it.jsonPrimitive.content }, restaurantID = row["restaurantID"]?.jsonPrimitive?.contentOrNull, menuItemID = row["menuItemID"]?.jsonPrimitive?.contentOrNull, restaurantName = row["restaurantName"]?.jsonPrimitive?.contentOrNull)
            }
            val cutoff = parseInstant(example["asOf"]?.jsonPrimitive?.contentOrNull)
            val result = TastePerception.build(records, cutoff)
            assertEquals(label, expected["meals"]!!.jsonPrimitive.int, result.evidenceCount)
            assertEquals(label, expected["patterns"]!!.jsonPrimitive.int, result.patterns.size)
            assertEquals(label, expected["changes"]!!.jsonPrimitive.int, result.changes.size)
            assertEquals(label, expected["contrasts"]!!.jsonPrimitive.int, result.contrasts.size)
            assertEquals(label, expected["levels"]!!.jsonArray.map { it.jsonPrimitive.intOrNull }, TasteAxis.entries.map { result.current(it)?.currentLevel })
            expected["recentCounts"]?.let { assertEquals(label, it.jsonArray.map { value -> value.jsonPrimitive.int }, result.current(TasteAxis.salty)?.counts) }
            assertEquals(label, result, TastePerception.build(records + records, cutoff))
            val series = TasteChangeSeries.build(result, emptyList())
            result.changes.forEach { pattern ->
                val row = series.first { it.id == pattern.id }
                assertEquals(listOf(pattern.previousLevel, pattern.currentLevel), row.points.map { it.value })
                assertEquals(listOf(3, 3), row.points.map { it.count })
                assertEquals(pattern.previous.evidenceIDs, row.points.first().evidenceIDs)
                assertEquals(pattern.recent.experienceIDs, row.points.last().experienceIDs)
            }
        }
    }

    @Test fun surveyZeroUnknownAndComparableHistory() {
        val catalog = AppJson.decodeFromString<SurveyCatalog>(javaClass.classLoader!!.getResource("fixtures/taste-survey-golden.json")!!.readText())
        val old = SurveyScoring.result(catalog.items, catalog.items.map { SurveyResponse(it.id, 2) }, "2026-08-01T00:00:00.000Z").snapshot.surveySubmission!!
        val current = SurveyScoring.result(catalog.items, listOf(SurveyResponse(catalog.items[0].id, 0), SurveyResponse(catalog.items[1].id, uncertain = true)), "2026-09-01T00:00:00.000Z").snapshot.surveySubmission!!
        assertTrue(SurveyPerception.points(listOf(current, old.copy(recordedAt = "2026-09-01T00:00:00Z"))).none { it.hasChange })
        val points = SurveyPerception.points(listOf(current, old, current))
        assertEquals(0, points.first { it.axis == catalog.items[0].tasteId }.value)
        assertEquals(1, points.count { it.value != null })
        assertEquals(1, points.count { it.hasChange })
        val row = TasteChangeSeries.build(PerceptionSnapshot(), points).first { it.axis == catalog.items[0].tasteId }
        assertEquals(listOf(2, 0), row.points.map { it.value })
        assertEquals("더 약하게", TasteChangeSeries.changeLabel(row.points))
        assertEquals("비교 부족", TasteChangeSeries.changeLabel(row.points.takeLast(1)))
        assertTrue(row.points.all { it.experienceIDs.isEmpty() })
        val incompatible = old.copy(items = old.items.mapIndexed { index, item -> if (index == 0) item.copy(anchor = item.anchor.copy(conditions = listOf("다른 조리 조건"))) else item })
        assertTrue(SurveyPerception.points(listOf(current, incompatible)).none { it.hasChange })
    }
}
