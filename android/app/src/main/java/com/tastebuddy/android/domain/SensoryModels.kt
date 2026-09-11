package com.tastebuddy.android.domain

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable data class SourceSpan(val start: Int, val end: Int, val quote: String)

@Serializable
data class SelectionEvidence(
    val selectionID: String,
    val type: String,
    val catalogVersion: String,
    val labelSnapshot: String,
    val facet: String,
    val labelValue: String,
    val responseValue: String? = null,
    val relatedBubbleID: String? = null,
    val relatedBubbleLabel: String? = null,
    val resolution: String,
)

@Serializable
data class CombinationComponent(
    val attribute: String,
    val target: String,
    val reference: String? = null,
)

@Serializable
data class RuleAtom(
    val kind: String,
    val attribute: String? = null,
    val value: JsonPrimitive,
    val scale: String,
    val target: String? = null,
    val phase: String? = null,
    val phrase: String? = null,
    val sourceSpans: List<SourceSpan>? = null,
    val reference: String? = null,
    val combinationComponents: List<CombinationComponent>? = null,
    val selectionEvidence: SelectionEvidence? = null,
)

@Serializable
data class RuleUnresolved(
    val phrase: String,
    val reason: String,
    val sourceSpans: List<SourceSpan>,
    val selectionEvidence: SelectionEvidence? = null,
)

@Serializable
data class RuleResult(
    val observations: List<RuleAtom> = emptyList(),
    val unresolved: List<RuleUnresolved> = emptyList(),
    val needsAI: Boolean = false,
)

@Serializable
data class SensorySelection(
    val id: String,
    val type: String,
    val catalogVersion: String = CATALOG_VERSION,
    val labelSnapshot: String,
    val liking: String? = null,
    val intensity: String? = null,
    val preferenceFit: String? = null,
    val target: String = "unspecified",
    val phase: String = "unspecified",
    val relatedBubbleID: String? = null,
    val unparsedPayload: JsonElement? = null,
) {
    companion object {
        const val CATALOG_VERSION = "dining-sensory-selection/1"

        fun fromRaw(raw: JsonElement): SensorySelection = runCatching {
            val obj = raw.jsonObject
            require(
                listOf("id", "type", "catalogVersion", "labelSnapshot").all {
                    obj[it] is JsonPrimitive && obj[it]!!.jsonPrimitive.isString
                }
            )
            AppJson.decodeFromJsonElement<SensorySelection>(raw)
        }
            .getOrElse {
                val obj = raw as? JsonObject ?: JsonObject(emptyMap())
                SensorySelection(
                    obj.string("id", "unreadable-selection"),
                    obj.string("type", "unknown"),
                    obj.string("catalogVersion", "unknown"),
                    obj.string("labelSnapshot", "읽을 수 없는 선택"),
                    unparsedPayload = raw,
                )
            }
    }
}

@Serializable
data class SelectionCatalogEntry(
    val id: String,
    val type: String,
    val label: String,
    val catalogVersion: String,
    val attribute: String,
    val reference: Boolean? = null,
    val contextRole: String? = null,
    val intrinsicIntensity: String? = null,
    val intrinsicFit: String? = null,
    val intrinsicTarget: String? = null,
    val intrinsicPhase: String? = null,
    val resolution: String,
)

@Serializable
data class SelectionCatalog(
    val version: String,
    val entries: List<SelectionCatalogEntry>,
    val values: Map<String, Map<String, String>>,
    val labels: Map<String, Map<String, String>>,
) {
    fun label(field: String, value: String) =
        labels[field]?.get(value) ?: SelectionLabels.fields[field]?.get(value) ?: value
}

object SelectionLabels {
    val targets =
        linkedMapOf(
            "unspecified" to "따로 정하지 않음",
            "whole_dish" to "음식 전체",
            "sauce" to "소스",
            "surface" to "겉",
            "inside" to "속",
            "coating" to "튀김옷",
            "skin" to "껍질",
            "broth" to "국물",
            "noodles" to "면",
            "meat" to "고기",
            "filling" to "소",
            "flesh" to "속살",
            "cream" to "크림",
        )
    val phases =
        linkedMapOf(
            "unspecified" to "따로 정하지 않음",
            "first_bite" to "첫입",
            "early_meal" to "초반",
            "during_meal" to "먹는 동안",
            "late_meal" to "나중",
            "after_swallow" to "삼킨 뒤",
            "after_meal" to "식사 후",
        )
    val liking = linkedMapOf("liked" to "좋았어요", "neutral" to "보통이에요", "disliked" to "아쉬웠어요")
    val intensity = linkedMapOf("light" to "약하게", "medium" to "중간 정도", "strong" to "강하게")
    val fit = linkedMapOf("tooWeak" to "조금 부족했어요", "justRight" to "알맞았어요", "tooStrong" to "조금 과했어요")
    val fields =
        mapOf(
            "target" to targets,
            "phase" to phases,
            "liking" to liking,
            "intensity" to intensity,
            "preferenceFit" to fit,
        )
}

@Serializable
data class OverallEvaluation(
    val responseValue: String,
    val questionID: String = "overall_liking",
    val questionVersion: String = VERSION,
    val questionLabelSnapshot: String = QUESTION,
    val responseLabelSnapshot: String = labels[responseValue] ?: "알 수 없는 응답",
    val target: String = "whole_dish",
    val phase: String = "unspecified",
    val unparsedPayload: JsonElement? = null,
) {
    fun parse(): RuleResult {
        val evidence =
            SelectionEvidence(
                questionID,
                "overallEvaluation",
                questionVersion,
                questionLabelSnapshot,
                "liking",
                responseLabelSnapshot,
                responseValue,
                resolution = "resolved",
            )
        val spans = listOf(SourceSpan(0, responseLabelSnapshot.length, responseLabelSnapshot))
        val reason =
            when {
                unparsedPayload != null -> "unreadable_overall_evaluation_payload"
                questionID != "overall_liking" || questionVersion != VERSION ->
                    "unknown_overall_evaluation_version"
                questionLabelSnapshot != QUESTION ||
                    responseLabelSnapshot != (labels[responseValue] ?: "알 수 없는 응답") ->
                    "overall_evaluation_label_mismatch"
                values[responseValue] == null -> "unknown_overall_evaluation_response"
                target != "whole_dish" || phase != "unspecified" ->
                    "invalid_overall_evaluation_scope"
                else -> null
            }
        return if (reason != null)
            RuleResult(
                unresolved =
                    listOf(
                        RuleUnresolved(
                            responseLabelSnapshot,
                            reason,
                            spans,
                            evidence.copy(resolution = "unresolved"),
                        )
                    )
            )
        else
            RuleResult(
                observations =
                    listOf(
                        RuleAtom(
                            "overall_liking",
                            value = JsonPrimitive(values.getValue(responseValue)),
                            scale = "overall-five-category-v1",
                            target = target,
                            phase = phase,
                            phrase = responseLabelSnapshot,
                            sourceSpans = spans,
                            selectionEvidence = evidence,
                        )
                    )
            )
    }

    companion object {
        const val VERSION = "dining-overall-liking/1"
        const val QUESTION = "이 음식은 전체적으로 어땠나요?"
        val labels =
            linkedMapOf(
                "veryLiked" to "정말 좋았어요",
                "liked" to "좋았어요",
                "neutral" to "보통이었어요",
                "disliked" to "아쉬웠어요",
                "veryDisliked" to "많이 아쉬웠어요",
            )
        val values =
            mapOf(
                "veryLiked" to "very_positive",
                "liked" to "positive",
                "neutral" to "neutral",
                "disliked" to "negative",
                "veryDisliked" to "very_negative",
            )

        fun fromRaw(raw: JsonElement): OverallEvaluation = runCatching {
            val obj = raw.jsonObject
            require(
                listOf(
                        "responseValue",
                        "questionID",
                        "questionVersion",
                        "questionLabelSnapshot",
                        "responseLabelSnapshot",
                        "target",
                        "phase",
                    )
                    .all { obj[it] is JsonPrimitive && obj[it]!!.jsonPrimitive.isString }
            )
            AppJson.decodeFromJsonElement<OverallEvaluation>(raw)
        }
            .getOrElse {
                val obj = raw as? JsonObject ?: JsonObject(emptyMap())
                OverallEvaluation(
                    obj.string("responseValue", "unknown"),
                    obj.string("questionID", "unknown"),
                    obj.string("questionVersion", "unknown"),
                    obj.string("questionLabelSnapshot", "읽을 수 없는 전체평가"),
                    obj.string("responseLabelSnapshot", "읽을 수 없는 응답"),
                    unparsedPayload = raw,
                )
            }
    }
}

@Serializable data class LanguageSense(val attribute: String, val pattern: String)

@Serializable data class LanguageScope(val value: String, val pattern: String)

@Serializable
data class SensoryLanguage(
    val senses: List<LanguageSense>,
    val targets: List<LanguageScope>,
    val phases: List<LanguageScope>,
)

@Serializable
data class SemanticAttribute(val id: String, val meaning: String, val label: String? = null)

@Serializable data class SemanticKind(val scale: String)

@Serializable
data class SemanticContract(
    val attributes: List<SemanticAttribute>,
    val kinds: Map<String, SemanticKind>,
)

@Serializable
data class LexiconEntry(
    val id: String,
    val label: String,
    val resolution: String,
    val reason: String,
    val semanticAtoms: List<RuleAtom>,
)

@Serializable
data class SensoryStyle(
    val id: String,
    val name: String,
    val label: String,
    val attributes: List<String>,
)

@Serializable
data class SensoryContract(
    val ruleVersion: String,
    val lexiconVersion: String,
    val semantic: SemanticContract,
    val language: SensoryLanguage,
    val patterns: Map<String, String>,
    val lexicon: List<LexiconEntry>,
    val styles: List<SensoryStyle>,
    val selectionCatalog: SelectionCatalog,
)

@Serializable
data class SensoryObservation(
    val id: String,
    val experienceID: String,
    val foodName: String,
    val recordedAt: String,
    val sourceField: String,
    val kind: String,
    val attribute: String?,
    val attributeLabel: String,
    val value: JsonPrimitive,
    val scale: String,
    val target: String,
    val phase: String,
    val phrase: String,
    val sourceSpans: List<SourceSpan>,
    val reference: String?,
    val combinationComponents: List<CombinationComponent> = emptyList(),
    val selectionEvidence: SelectionEvidence? = null,
    val mealID: String = experienceID,
    val observedAt: String? = null,
    val knownAt: String? = null,
    val dishKindIDs: List<String> = emptyList(),
    val restaurantID: String? = null,
    val menuItemID: String? = null,
    val restaurantName: String? = null,
) {
    val domain
        get() = attribute?.substringBefore('.')

    val scopeKey
        get() =
            listOf(experienceID, attribute.orEmpty(), reference.orEmpty(), target, phase)
                .joinToString("|")

    val evidenceText
        get() =
            selectionEvidence?.let { "선택 ‘${it.labelSnapshot}’ · 응답 ‘${it.labelValue}’" }
                ?: "“$phrase”"
}

@Serializable
data class SensoryUnresolved(
    val id: String,
    val experienceID: String,
    val foodName: String,
    val recordedAt: String,
    val sourceField: String,
    val phrase: String,
    val reason: String,
    val sourceSpans: List<SourceSpan>,
    val needsMeaningReview: Boolean,
    val selectionEvidence: SelectionEvidence? = null,
    val observedAt: String? = null,
    val knownAt: String? = null,
)

@Serializable
data class SensoryInsight(
    val id: String,
    val kind: String,
    val attribute: String?,
    val title: String,
    val body: String,
    val evidenceIDs: List<String>,
    val experienceIDs: List<String>,
)

@Serializable
data class StyleCandidate(
    val id: String,
    val name: String,
    val label: String,
    val status: String,
    val supportEvidenceIDs: List<String>,
    val counterEvidenceIDs: List<String>,
    val supportExperienceCount: Int,
    val counterExperienceCount: Int,
    val eligible: Boolean,
)

@Serializable
data class MainWing(
    val status: String = "learning",
    val main: StyleCandidate? = null,
    val wing: StyleCandidate? = null,
    val candidates: List<StyleCandidate> = emptyList(),
    val label: String = "입맛을 알아가는 중이에요",
)

@Serializable
data class SensorySnapshot(
    val engineVersion: String = "tba-native-sensory/2",
    val observations: List<SensoryObservation> = emptyList(),
    val unresolved: List<SensoryUnresolved> = emptyList(),
    val insights: List<SensoryInsight> = emptyList(),
    val mainWing: MainWing = MainWing(),
    val completedExperienceCount: Int = 0,
    val sourceExperienceCount: Int = 0,
    val actualApiCalls: Int = 0,
    val needsMeaningReview: Boolean = false,
    val limits: List<String> = listOf("기록한 감각과 직접 평가만 해석해요."),
    val personalModel: PersonalSnapshot? = null,
    val perception: PerceptionSnapshot = PerceptionSnapshot(),
    val statedPreferences: PreferenceEvidenceSnapshot = PreferenceEvidenceSnapshot(),
)
