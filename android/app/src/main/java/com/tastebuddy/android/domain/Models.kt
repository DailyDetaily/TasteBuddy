package com.tastebuddy.android.domain

import java.time.Instant
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
enum class TasteAxis(
    val label: String,
    val main: Long,
    val tint: Long,
    val text: Long,
    val light: Long,
) {
    sweet("단맛", 0xFFFF9900, 0xFFFFEBCC, 0xFF6F4609, 0xFFFFCC80),
    sour("신맛", 0xFFFBC02D, 0xFFFFF7CC, 0xFF6F5F09, 0xFFFDD835),
    bitter("쓴맛", 0xFF95C900, 0xFFEAF4CC, 0xFF505B24, 0xFFE6EE9C),
    salty("짠맛", 0xFF7299FF, 0xFFE3EBFF, 0xFF36466F, 0xFF90CAF9),
    umami("감칠맛", 0xFFB372B4, 0xFFF0E3F0, 0xFF513751, 0xFFCE93D8),
    fat("지방맛", 0xFF95867A, 0xFFEAE7E4, 0xFF453F3A, 0xFFBCAAA4);

    companion object {
        fun from(value: String?): TasteAxis? = entries.firstOrNull {
            it.name == value?.lowercase() || it.label == value
        }

        fun forAttribute(attribute: String?): TasteAxis? =
            when (attribute) {
                "mouthfeel.fatty",
                "mouthfeel.creamy",
                "taste.fat" -> fat
                else -> from(attribute?.substringAfter("taste.", ""))
            }
    }
}

@Serializable
data class TasteProfile(
    val createdAt: String = timestamp(Instant.now()),
    val scores: Map<String, Int>,
    val confidence: String,
    val summary: String,
    val topAxes: List<TasteAxis>,
    val cautionAxis: TasteAxis,
    val surveySubmission: SurveySubmission? = null,
) {
    fun score(axis: TasteAxis) = scores[axis.name] ?: 50
}

@Serializable
data class ProfileIdentity(
    val name: String = "신준호",
    val nickname: String = "머리아깨무봄발",
    val introduction: String = "",
    val birthDate: String? = null,
    val sexContext: String? = null,
    val smokingStatus: String? = null,
    val dietaryRestrictions: List<String> = emptyList(),
) {
    val displayName
        get() = name.ifBlank { "나의 프로필" }

    val displayNickname
        get() = nickname.takeIf { it.isNotBlank() }?.let { "@$it" } ?: ""
}

@Serializable
data class DiningEntry(
    val id: String = UUID.randomUUID().toString().uppercase(),
    val mealID: String = id,
    val restaurant: String = "",
    val restaurantID: String? = null,
    val menu: String = "",
    val menuItemID: String? = null,
    val date: String = timestamp(Instant.now()),
    val observedAt: String = date,
    val savedAt: String? = null,
    val updatedAt: String? = null,
    val rating: Int = 0,
    val note: String = "",
    val tasteExperienceIDs: List<String> = emptyList(),
    val detailTagIDs: List<String> = emptyList(),
    val sensorySelections: List<SensorySelection>? = emptyList(),
    val overallEvaluation: OverallEvaluation? = null,
    val dishKindIDs: List<String> = emptyList(),
    val reflectionPhotoFilename: String? = null,
    val feedbackStatus: String = "captured",
    val photoPalette: PhotoPalette? = null,
    val tbaAnalysisSnapshot: JsonElement? = null,
) {
    val hasCompletedTasteFeedback
        get() = feedbackStatus == "completed"

    val title
        get() = menu.ifBlank { restaurant }

    fun additionalMenuDraft(): DiningEntry =
        DiningEntry(
            mealID = mealID,
            restaurant = restaurant,
            restaurantID = restaurantID,
            date = date,
            observedAt = observedAt,
        )
}

@Serializable
data class PhotoPalette(
    val colors: List<String>,
    val source: String = "photo",
    val representativeColorCount: Int,
    val colorProportions: List<Double> = listOf(1.0 / 3, 1.0 / 3, 1.0 / 3),
) {
    val isFallback
        get() = source == "neutralFallback"

    companion object {
        val neutral = PhotoPalette(listOf("#929292", "#B3B3B3", "#D2D2D2"), "neutralFallback", 0)
    }
}

@Serializable
data class DiningDraft(
    val entry: DiningEntry = DiningEntry(),
    val stage: String = "camera",
    val editing: Boolean = false,
    val returnStage: String? = null,
    val questionID: String? = null,
    val questionIntent: String? = null,
    val mode: String = "quickCapture",
    val questionContext: QuestionContext? = null,
)

@Serializable
data class BookmarkList(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val createdAt: String = timestamp(Instant.now()),
    val description: String = "",
    val isPrivate: Boolean = false,
    val coverIconID: String = "utensils",
    val coverTasteID: TasteAxis = TasteAxis.sweet,
)

@Serializable
data class RestaurantBookmark(
    val restaurant: Restaurant,
    val listIDs: List<String> = emptyList(),
    val note: String = "",
    val savedAt: String = timestamp(Instant.now()),
)

@Serializable
data class DishComment(
    val id: String = UUID.randomUUID().toString(),
    val author: String,
    val body: String,
    val date: String = timestamp(Instant.now()),
    val own: Boolean = true,
)

@Serializable
data class QuestionProgress(
    val id: String,
    val status: String,
    val firstExposedAt: String,
    val statusChangedAt: String,
)

@Serializable
data class AppState(
    val schemaVersion: Int = 1,
    val authEntryComplete: Boolean = false,
    val onboardingComplete: Boolean = false,
    val profile: TasteProfile? = null,
    val profileHistory: List<TasteProfile> = emptyList(),
    val identity: ProfileIdentity = ProfileIdentity(),
    val avatarFilename: String? = null,
    val surveyResponses: List<SurveyResponse> = emptyList(),
    val surveyInstrumentVersion: String? = null,
    val respondentContext: Map<String, String> = emptyMap(),
    val preferenceProfile: Map<String, List<String>> = emptyMap(),
    val preferenceIntakeDraft: Map<String, List<String>>? = null,
    val preferenceSubmissions: List<PreferenceSubmission> = emptyList(),
    val entries: List<DiningEntry> = emptyList(),
    val draft: DiningDraft? = null,
    val bookmarkLists: List<BookmarkList> = emptyList(),
    val bookmarks: List<RestaurantBookmark> = emptyList(),
    val comments: Map<String, List<DishComment>> = emptyMap(),
    val likedFeedIDs: Set<String> = emptySet(),
    val rememberedMenus: Map<String, List<String>> = emptyMap(),
    val questionProgress: Map<String, QuestionProgress> = emptyMap(),
    val selectedTab: String = "home",
    val recentSearches: List<String> = emptyList(),
    val followedProfileIDs: Set<String> = emptySet(),
)

enum class AppPhase {
    Auth,
    Onboarding,
    PreferenceIntake,
    Calibration,
    Main,
}

fun AppState.phase() =
    when {
        !authEntryComplete -> AppPhase.Auth
        !onboardingComplete -> AppPhase.Onboarding
        profile == null && preferenceProfile.isEmpty() -> AppPhase.PreferenceIntake
        profile == null -> AppPhase.Calibration
        else -> AppPhase.Main
    }

@Serializable
data class Restaurant(
    val id: String,
    val name: String,
    val chefName: String = "",
    val category: String = "",
    val locationLabel: String = "",
    val imageName: String? = null,
    val axis: TasteAxis = TasteAxis.umami,
    val matchRate: Int? = null,
    val summary: String = "",
    val tags: List<String> = emptyList(),
    val memorableDishes: List<RestaurantDish> = emptyList(),
    val infoRows: List<RestaurantInfo> = emptyList(),
    val address: String = "",
    val phone: String = "",
    val website: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val source: String = "catalog",
    val photoURL: String? = null,
    val photoAttribution: String? = null,
    val hours: List<String> = emptyList(),
    val googleRating: Double? = null,
    val googleRatingCount: Int? = null,
    val googleMapsURL: String? = null,
)

@Serializable
data class RestaurantDish(
    val id: String,
    val title: String,
    val summary: String = "",
    val axis: TasteAxis = TasteAxis.umami,
    val tags: List<String> = emptyList(),
    val price: String = "",
)

@Serializable
data class RestaurantInfo(
    val id: String,
    val label: String,
    val value: String,
    val symbol: String = "",
)

@Serializable
data class SurveyResponse(
    val itemId: String,
    val selectedValue: Int? = null,
    val uncertain: Boolean = false,
    val uncertaintyReason: String? = null,
)

@Serializable
data class SurveyAnchor(
    val label: String, val description: String, val stability: String,
    val id: String, val version: String, val conditions: List<String>,
)

@Serializable
data class SurveyItem(
    val id: String,
    val tasteId: TasteAxis,
    val prompt: String,
    val construct: String,
    val anchor: SurveyAnchor,
    val helper: String,
    val exploratoryMetadata: SurveyExploratoryMetadata? = null,
    val recallWindow: String = "",
    val reverseKeyed: Boolean = false,
)

@Serializable
data class SurveyScale(
    val min: Int,
    val max: Int,
    val midpointValue: Int,
    val uncertainLabel: String,
    val labels: Map<String, String>,
)

@Serializable data class ContextOption(val value: String, val label: String)

@Serializable
data class ContextStep(
    val id: String,
    val badgeLabel: String,
    val title: String,
    val description: String,
    val options: List<ContextOption>,
)

@Serializable
data class SurveyCatalog(
    val schemaVersion: Int,
    val instrument: SurveyInstrument,
    val items: List<SurveyItem>,
    val likertScale: SurveyScale,
    val contextSteps: List<ContextStep>,
)

@Serializable
data class SurveyInstrument(val id: String, val title: String, val version: String) {
    companion object {
        val current = SurveyInstrument("taste-buddy-initial-six-taste-survey", "Taste Buddy Reference Food Recall Survey", "2.0.0")
    }
}

@Serializable
data class SurveyExploratoryMetadata(
    val appliesToTasteIds: List<TasteAxis>, val interpretationCaution: String, val rationale: String,
)

@Serializable
data class SurveySubmission(
    val schemaVersion: Int = 2,
    val source: String = "reference-food-recall",
    val recordedAt: String,
    val instrument: SurveyInstrument,
    val recallWindow: String = "recent-3-months",
    val scale: SurveyScale,
    val items: List<SurveyItem>,
    val responses: List<SurveyResponse>,
    val respondentContext: Map<String, String> = emptyMap(),
) {
    val normalizedResponses get() = SurveyScoring.normalizeResponses(items, responses)
    val answeredCount get() = normalizedResponses.count { !it.uncertain && it.selectedValue != null }
    val summary get() = if (answeredCount > 0)
        "${answeredCount}가지 기준 음식에서 기억한 맛의 강도를 남겼어요. 음식마다 기준이 달라 맛 사이의 민감도 순위나 좋아하는 정도로 해석하지 않아요."
        else "아직 강도를 답한 기준 음식이 없어요. 먹어본 적 없거나 기억나지 않는 응답은 점수로 채우지 않고 남겨요."
    fun responseLabel(itemId: String) = SurveyScoring.responseLabel(normalizedResponses.firstOrNull { it.itemId == itemId }, scale)
}
