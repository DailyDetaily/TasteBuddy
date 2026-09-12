package com.tastebuddy.android.domain

import kotlin.math.roundToInt
import kotlinx.serialization.Serializable

@Serializable
data class SurveyTasteScore(
    val baseVectorScore: Double?,
    val confidence: Double,
    val constructConfidence: Map<String, Double>,
    val constructScores: Map<String, Double>,
    val excludedItemCount: Int,
    val respondedItemCount: Int,
    val tasteId: TasteAxis,
    val totalItemCount: Int,
)

@Serializable
data class SurveySnapshot(
    val measuredAt: String,
    val results: Map<String, Double?>,
    val source: String = "recalled-intensity",
    val surveySubmission: SurveySubmission? = null,
)

@Serializable
data class StarterContext(
    val baselineReference: String = "popular-k-fnb",
    val calibrationMode: String = "digital-anchoring",
)

@Serializable
data class StarterGuidance(
    val cautionAxis: TasteAxis,
    val cautionLabel: String,
    val confidence: String,
    val context: StarterContext = StarterContext(),
    val evidence: List<String>,
    val goalPhrase: String,
    val summaryLine: String,
    val surfaceLabel: String = "설문 기반 스타터 가이드",
    val topAxes: List<TasteAxis>,
    val topLabels: List<String>,
)

@Serializable
data class SurveyResult(val snapshot: SurveySnapshot, val starterGuidance: StarterGuidance)

object SurveyScoring {
    val uncertaintyLabels = linkedMapOf(
        "never_tried" to "먹어본 적 없어요",
        "cannot_recall" to "기억나지 않아요",
        "cannot_isolate_taste" to "지방맛을 구분하기 어려워요",
    )
    val intensityScale = SurveyScale(0, 4, 2, "기억나지 않아요", mapOf(
        "0" to "전혀 느끼지 않음", "1" to "약하게 느껴짐", "2" to "중간 정도로 느껴짐",
        "3" to "강하게 느껴짐", "4" to "매우 강하게 느껴짐",
    ))

    fun normalizeResponses(items: List<SurveyItem>, responses: List<SurveyResponse>): List<SurveyResponse> {
        val itemsById = items.associateBy { it.id }
        val normalized = mutableMapOf<String, SurveyResponse>()
        responses.forEach { response ->
            val item = itemsById[response.itemId] ?: return@forEach
            normalized.remove(item.id)
            if (response.uncertain) {
                val reason = response.uncertaintyReason?.takeIf {
                    it in uncertaintyLabels && (it != "cannot_isolate_taste" || item.tasteId == TasteAxis.fat)
                } ?: "cannot_recall"
                normalized[item.id] = SurveyResponse(item.id, uncertain = true, uncertaintyReason = reason)
            } else if (response.selectedValue in 0..4 && response.uncertaintyReason == null) {
                normalized[item.id] = response
            }
        }
        return items.mapNotNull { normalized[it.id] }
    }

    fun responseLabel(response: SurveyResponse?, scale: SurveyScale = intensityScale): String = when {
        response == null -> "미응답"
        response.uncertain -> uncertaintyLabels[response.uncertaintyReason] ?: "기억나지 않아요"
        else -> scale.labels[response.selectedValue?.toString()] ?: "미응답"
    }

    fun scores(items: List<SurveyItem>, responses: List<SurveyResponse>): Map<TasteAxis, SurveyTasteScore> {
        val byItem = normalizeResponses(items, responses).associateBy { it.itemId }
        return TasteAxis.entries.associateWith { axis ->
            val axisItems = items.filter { it.tasteId == axis }
            val answered = axisItems.mapNotNull { byItem[it.id]?.takeIf { r -> !r.uncertain }?.selectedValue }
            val score = answered.firstOrNull()?.div(4.0)
            SurveyTasteScore(score, 0.0, mapOf("recalled_intensity" to 0.0),
                score?.let { mapOf("recalled_intensity" to it) } ?: emptyMap(),
                axisItems.size - answered.size, answered.size, axis, axisItems.size)
        }
    }

    fun result(
        items: List<SurveyItem>, responses: List<SurveyResponse>, measuredAt: String,
        respondentContext: Map<String, String> = emptyMap(),
        instrument: SurveyInstrument = SurveyInstrument.current,
        scale: SurveyScale = intensityScale,
    ): SurveyResult {
        val normalized = normalizeResponses(items, responses)
        val submission = SurveySubmission(recordedAt = measuredAt, instrument = instrument,
            scale = scale, items = items, responses = normalized, respondentContext = respondentContext.toMap())
        val scores = scores(items, normalized)
        val results = TasteAxis.entries.associate { it.name to scores[it]?.baseVectorScore?.times(10) }
        val evidence = items.mapNotNull { item ->
            normalized.firstOrNull { it.itemId == item.id && !it.uncertain }?.let {
                "${item.anchor.label}의 ${item.tasteId.label}: ${submission.responseLabel(item.id)}."
            }
        } + "흰 우유의 지방맛 응답은 예비 단서이며 질감·향·느끼함과 구분해 살펴봐요."
        return SurveyResult(
            SurveySnapshot(measuredAt, results, surveySubmission = submission),
            StarterGuidance(TasteAxis.fat, "추가 확인", "Starter",
                context = StarterContext("reference-food-recall-v2", "recalled-intensity"),
                evidence = evidence, goalPhrase = "기준 음식에서 기억한 맛의 강도",
                summaryLine = submission.summary, surfaceLabel = "기준 음식 회상 기록",
                topAxes = emptyList(), topLabels = emptyList()),
        )
    }

    fun profile(result: SurveyResult) = TasteProfile(
        createdAt = result.snapshot.measuredAt,
        scores = result.snapshot.results.mapNotNull { (axis, value) -> value?.let { axis to (it * 10).roundToInt() } }.toMap(),
        confidence = result.starterGuidance.confidence, summary = result.starterGuidance.summaryLine,
        topAxes = emptyList(), cautionAxis = TasteAxis.fat, surveySubmission = result.snapshot.surveySubmission,
    )
}
