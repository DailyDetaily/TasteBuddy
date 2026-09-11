package com.tastebuddy.android.data

import android.content.Context
import com.tastebuddy.android.domain.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable data class DetailTag(val id: String, val label: String)

@Serializable
data class DetailCategory(val id: String, val label: String, val tags: List<DetailTag>)

@Serializable data class DishKind(val id: String, val label: String, val keywords: List<String>)

@Serializable
data class TasteWord(
    val angleOffset: Double,
    val intensity: Int,
    val key: String,
    val label: String,
    val description: String,
    val radiusOffset: Double? = null,
)

@Serializable
data class TasteWordAxis(
    val id: TasteAxis,
    val label: String,
    val angle: Double,
    val words: List<TasteWord>,
)

@Serializable
data class DiningCatalog(
    val detailTagCategories: List<DetailCategory>,
    val dishKindOptions: List<DishKind>,
    val tasteExperienceAxes: List<TasteWordAxis>,
)

@Serializable
data class NativeFeedItem(
    val id: String,
    val authorName: String,
    val restaurantName: String,
    val dishTitle: String,
    val commentCount: Int = 0,
    val liked: Boolean = false,
)

@Serializable
data class NativePerson(
    val reviewerID: String,
    val reviewerName: String,
    val reviewerHandle: String,
    val axis: TasteAxis,
)

class Catalogs(private val context: Context) {
    private fun raw(path: String) = context.assets.open(path).bufferedReader().use { it.readText() }

    val sensory: SensoryContract = AppJson.decodeFromString(raw("tba/tba-sensory-contract.json"))
    val selection: SelectionCatalog =
        AppJson.decodeFromString(raw("tba/dining-sensory-selection-catalog.json"))
    val survey: SurveyCatalog = AppJson.decodeFromString(raw("fixtures/taste-survey-golden.json"))
    val dining: DiningCatalog =
        AppJson.decodeFromString(raw("fixtures/dining-feedback-scenario.json"))
    val preferences: JsonObject =
        AppJson.parseToJsonElement(raw("fixtures/preference-intake.json")).jsonObject
    val preferenceQuestions: List<PreferenceQuestion> = AppJson.decodeFromJsonElement<PreferenceCatalog>(preferences).questions
    private val native = AppJson.parseToJsonElement(raw("catalog/native-content.json")).jsonObject
    val restaurants: List<Restaurant> =
        AppJson.decodeFromJsonElement(native.getValue("restaurants"))
    val following: List<NativeFeedItem> =
        AppJson.decodeFromJsonElement(native.getValue("followingDishFeedbackItems"))
    val people: List<NativePerson> =
        AppJson.decodeFromJsonElement(native.getValue("tasteMatchFeed"))
    val bubbles =
        dining.tasteExperienceAxes.flatMap { axis ->
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
    val mapPositions =
        TasteMapLayout.base(
            bubbles,
            AppJson.decodeFromString<List<TasteMapCoordinate>>(raw("catalog/taste-map-layout.json")),
        )
    val seededComments: Map<String, List<DishComment>> =
        native.obj("seededDishFeedbackComments").mapValues { (_, value) ->
            value.jsonArray.map {
                val r = it.jsonObject
                val seconds =
                    r.obj("createdAt")["timeIntervalSince1970"]?.jsonPrimitive?.longOrNull ?: 0L
                DishComment(
                    r.string("id"),
                    r.string("authorName"),
                    r.string("message"),
                    timestamp(java.time.Instant.ofEpochSecond(seconds)),
                    false,
                )
            }
        }

    fun restaurant(id: String): Restaurant? = restaurants.firstOrNull { it.id == id }

    fun selection(id: String, type: String): SensorySelection? =
        selection.entries
            .firstOrNull { it.id == id && it.type == type }
            ?.let { SensorySelection(it.id, it.type, it.catalogVersion, it.label) }

    fun label(id: String) =
        selection.entries.firstOrNull { it.id == id }?.label
            ?: dining.dishKindOptions.firstOrNull { it.id == id }?.label
            ?: id
}
