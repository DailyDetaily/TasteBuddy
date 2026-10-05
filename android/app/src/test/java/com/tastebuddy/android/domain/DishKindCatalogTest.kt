package com.tastebuddy.android.domain

import com.tastebuddy.android.data.DiningCatalog
import org.junit.Assert.*
import org.junit.Test

class DishKindCatalogTest {
    private fun catalog(): DiningCatalog {
        val text = javaClass.classLoader!!.getResourceAsStream("fixtures/dining-feedback-scenario.json")!!
            .bufferedReader().use { it.readText() }
        return AppJson.decodeFromString(text)
    }

    @Test fun activeKindsAndTraitsKeepLegacySelectionsReadable() {
        val catalog = catalog()
        assertEquals(32, catalog.dishKindOptions.size)
        assertEquals(30, catalog.dishKindOptions.count { it.group != "attribute" })
        assertEquals(setOf("spicy", "cold"), catalog.dishKindOptions.filter { it.group == "attribute" }.map { it.id }.toSet())
        assertEquals(6, catalog.legacyDishKindOptions.size)
        assertFalse(catalog.dishKindOptions.any { it.id == "raw_cured" })
        assertEquals("생/절임/큐어", catalog.legacyDishKindOptions.single { it.id == "raw_cured" }.label)
        assertTrue(catalog.dishKindOptions.map { it.id }.containsAll(listOf("raw", "pickled", "cured", "egg", "mushroom", "fruit", "nut_seed", "seaweed")))
    }

    @Test fun separatedKindsHaveDistinctCandidateRecommendations() {
        val recommendations = catalog().dishKindDetailRecommendations
        assertNotEquals(recommendations["raw"], recommendations["pickled"])
        assertNotEquals(recommendations["grilled"], recommendations["smoked"])
        assertTrue(recommendations["spice"].orEmpty().contains("aroma-spice"))
        assertFalse(recommendations["spicy"].orEmpty().contains("aroma-spice"))
    }
}
