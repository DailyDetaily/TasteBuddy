package com.tastebuddy.android.domain

import com.tastebuddy.android.data.DiningCatalog
import kotlinx.serialization.json.*
import org.junit.Assert.*
import org.junit.Test

class TasteMapLayoutTest {
    @Test
    fun geometryMatchesTheExecutedIosEngine() {
        fun raw(name: String) =
            javaClass.classLoader!!.getResourceAsStream(name)!!.bufferedReader().use {
                it.readText()
            }
        val catalog =
            AppJson.decodeFromString<DiningCatalog>(raw("fixtures/dining-feedback-scenario.json"))
        val bubbles =
            catalog.tasteExperienceAxes.flatMap { axis ->
                axis.words.map {
                    Bubble(
                        "${axis.id.name}-${it.key}",
                        axis.id,
                        it.label,
                        it.description,
                        it.intensity,
                        axis.angle + it.angleOffset,
                        it.radiusOffset ?: 0.0,
                    )
                }
            }
        val base =
            TasteMapLayout.base(
                bubbles,
                AppJson.decodeFromString<List<TasteMapCoordinate>>(
                    raw("catalog/taste-map-layout.json")
                ),
            )
        val cases = AppJson.parseToJsonElement(raw("ios-map-golden.json")).jsonArray
        cases.forEach { value ->
            val scenario = value.jsonObject
            val selected = scenario.array("selected").map { it.jsonPrimitive.content }.toSet()
            val actual = TasteMapLayout.render(base, selected).associateBy { it.bubble.id }
            scenario.array("positions").forEach { item ->
                val expected = item.jsonObject
                val id = expected.string("id")
                val point = actual.getValue(id)
                assertEquals(
                    "$selected $id x",
                    expected.getValue("x").jsonPrimitive.double,
                    point.x,
                    .000001,
                )
                assertEquals(
                    "$selected $id y",
                    expected.getValue("y").jsonPrimitive.double,
                    point.y,
                    .000001,
                )
                assertEquals(
                    "$selected $id size",
                    expected.getValue("size").jsonPrimitive.double,
                    point.size,
                    .000001,
                )
            }
        }
        assertEquals(bubbles.size, base.map { it.x to it.y }.distinct().size)
    }
}
