package com.tastebuddy.android.domain

import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test

class LearningBoundaryTest {
    private val contract =
        AppJson.decodeFromString<SensoryContract>(
            checkNotNull(
                    javaClass.classLoader?.getResourceAsStream("tba/tba-sensory-contract.json")
                )
                .bufferedReader()
                .use { it.readText() }
        )
    private val engine = SensoryAnalyzer(contract)

    private fun entry(id: String, meal: String = id, status: String = "completed") =
        DiningEntry(
            id = id,
            mealID = meal,
            restaurant = "식당",
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
            feedbackStatus = status,
            savedAt = "2026-09-01T00:00:00.000Z",
            observedAt = "2026-09-01T00:00:00.000Z",
        )

    @Test
    fun capturedPhotoIsNotTasteEvidence() {
        val snapshot = engine.analyze(listOf(entry("a", status = "captured")))
        assertEquals(0, snapshot.completedExperienceCount)
        assertTrue(snapshot.observations.isEmpty())
        assertTrue(snapshot.personalModel!!.units.isEmpty())
    }

    @Test
    fun duplicateRecordsAndOneMealDoNotCreateRepeatedSupport() {
        val first = entry("a", "meal")
        val snapshot = engine.analyze(listOf(first, first, entry("b", "meal")))
        assertEquals(2, snapshot.completedExperienceCount)
        assertFalse(snapshot.mainWing.candidates.any { it.eligible })
        assertTrue(snapshot.personalModel!!.candidates.isNotEmpty())
        assertTrue(snapshot.personalModel!!.candidates.all { it.distribution.mealCount == 1 })
    }

    @Test
    fun editsAndDeletesRebuildWithoutOldEvidence() {
        val positive = entry("a")
        val edited =
            positive.copy(
                sensorySelections =
                    positive.sensorySelections!!.map { it.copy(liking = "disliked") }
            )
        assertTrue(
            engine.analyze(listOf(positive)).observations.any {
                it.value == JsonPrimitive("positive")
            }
        )
        assertTrue(
            engine.analyze(listOf(edited)).observations.none {
                it.value == JsonPrimitive("positive")
            }
        )
        assertTrue(engine.analyze(emptyList()).observations.isEmpty())
    }

    @Test
    fun overallRatingNeverBecomesIndividualLiking() {
        val captured =
            entry("a")
                .copy(
                    note = "",
                    sensorySelections = emptyList(),
                    overallEvaluation = OverallEvaluation("veryLiked"),
                )
        val snapshot = engine.analyze(listOf(captured))
        assertEquals(listOf("overall_liking"), snapshot.observations.map { it.kind })
        assertTrue(snapshot.personalModel!!.units.isEmpty())
    }

    @Test
    fun unknownSelectionIsPreservedWithoutInventingMeaning() {
        val raw = buildJsonObject {
            put("id", "future")
            put("type", "future-type")
            put("labelSnapshot", "새 표현")
            put("catalogVersion", "future/9")
            put("extra", 123)
        }
        val selection = SensorySelection.fromRaw(raw)
        val result = SelectionParser.parse(listOf(selection), contract.selectionCatalog)
        assertTrue(result.observations.isEmpty())
        assertEquals("unknown_selection_catalog_version", result.unresolved.single().reason)
        assertEquals(
            selection,
            AppJson.decodeFromString<SensorySelection>(
                AppJson.encodeToString(SensorySelection.serializer(), selection)
            ),
        )
    }

    @Test
    fun emptySelectionArrayDoesNotResurrectLegacyIDs() {
        val bubble = contract.selectionCatalog.entries.first { it.type == "bubble" }
        val e =
            entry("a")
                .copy(
                    note = "",
                    tasteExperienceIDs = listOf(bubble.id),
                    sensorySelections = emptyList(),
                )
        assertTrue(engine.analyze(listOf(e)).observations.isEmpty())
        assertTrue(
            engine.analyze(listOf(e.copy(sensorySelections = null))).observations.isNotEmpty()
        )
    }
}
