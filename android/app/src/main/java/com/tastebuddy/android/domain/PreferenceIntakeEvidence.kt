package com.tastebuddy.android.domain

import java.time.Instant
import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
data class PreferenceOption(val id: String, val label: String, val description: String)

@Serializable
data class PreferenceQuestion(
    val id: String, val title: String, val description: String, val selectionMode: String,
    val options: List<PreferenceOption>, val noneOptionId: String? = null,
    val minSelections: Int? = null, val maxSelections: Int? = null,
)

@Serializable
data class PreferenceCatalog(val questions: List<PreferenceQuestion>)

@Serializable
data class PreferenceResponse(
    val questionID: String, val questionText: String, val questionDescription: String,
    val state: String, val selectedOptions: List<PreferenceOption>,
)

@Serializable
data class PreferenceSource(val kind: String = "preference_intake", val platform: String = "android")

@Serializable
data class PreferenceSubmission(
    val schemaVersion: String = "tba-preference-intake/1", val instrumentVersion: String = "1.0.0",
    val id: String, val userID: String, val recordedAt: String, val knownAt: String,
    val source: PreferenceSource = PreferenceSource(), val responses: List<PreferenceResponse>,
)

@Serializable
data class PreferenceEvidenceRecord(
    val id: String, val sourceSubmissionID: String, val kind: String, val label: String, val state: String,
    val recordedAt: String, val knownAt: String, val response: PreferenceResponse,
) {
    val summary: String get() = if (state == "unanswered") "아직 답하지 않았어요" else response.selectedOptions.joinToString(" · ") { it.label }
}

@Serializable
data class PreferenceExcludedSubmission(val id: String, val reason: String)

@Serializable
data class PreferenceEvidenceSnapshot(
    val version: String = "tba-preference-intake/1", val source: String = "self_report",
    val submissionID: String? = null, val recordedAt: String? = null, val answeredQuestionCount: Int = 0,
    val records: List<PreferenceEvidenceRecord> = emptyList(), val excludedSubmissions: List<PreferenceExcludedSubmission> = emptyList(),
    val limits: List<String> = listOf("직접 알려준 선호이며 실제 식사에서 확인한 반응과 구분해요.",
        "풍미 강도 선호를 개별 맛의 감각 강도나 민감도로 바꾸지 않아요.",
        "피해야 할 재료에 대한 자기 보고이며 의학적 진단을 뜻하지 않아요.",
        "공유 선호를 기록해도 정보가 전송되거나 공유 권한이 생기지 않아요."),
)

object PreferenceIntakeEvidence {
    val meanings = mapOf(
        "allergies" to ("self_reported_food_restriction" to "피해야 할 재료"),
        "dietaryRestrictions" to ("dietary_practice" to "식사 원칙"),
        "preferredCuisineTypes" to ("cuisine_preference" to "편안하게 즐기는 요리"),
        "avoidedSignals" to ("stated_avoidance" to "자주 피하는 요소"),
        "flavorIntensityPreference" to ("preferred_flavor_intensity" to "편안한 풍미 강도"),
        "explorationStyle" to ("exploration_preference" to "새로운 음식에 대한 선호"),
        "sharePreferenceWithRestaurant" to ("sharing_preference" to "정보 공유에 대한 선호"),
    )

    private fun validSelection(ids: List<String>, question: PreferenceQuestion): Boolean =
        ids.all { id -> question.options.any { it.id == id } } && ids.distinct().size == ids.size &&
            (question.selectionMode != "single" || ids.size <= 1) && ids.size <= (question.maxSelections ?: question.options.size) &&
            (question.noneOptionId == null || question.noneOptionId !in ids || ids.size == 1)

    fun isAnswered(question: PreferenceQuestion, ids: List<String>) = validSelection(ids, question) && ids.size >= (question.minSelections ?: 1)

    fun nextSelection(question: PreferenceQuestion, ids: List<String>, optionID: String): List<String> {
        if (question.options.none { it.id == optionID }) return ids
        if (question.selectionMode == "single") return listOf(optionID)
        if (optionID in ids) return ids - optionID
        if (optionID == question.noneOptionId) return listOf(optionID)
        val next = ids.filter { it != question.noneOptionId } + optionID
        return if (validSelection(next, question)) next else ids
    }

    fun isValid(submission: PreferenceSubmission, questions: List<PreferenceQuestion>): Boolean {
        fun nonempty(value: String) = value.isNotBlank() && value.length <= 2000
        val recordedAt = parseInstant(submission.recordedAt) ?: return false
        val knownAt = parseInstant(submission.knownAt) ?: return false
        if (submission.schemaVersion != "tba-preference-intake/1" || submission.instrumentVersion != "1.0.0" ||
            !nonempty(submission.id) || !nonempty(submission.userID) || knownAt < recordedAt ||
            timestamp(recordedAt) != submission.recordedAt || timestamp(knownAt) != submission.knownAt ||
            submission.source.kind != "preference_intake" || submission.source.platform !in listOf("web", "ios", "android") ||
            questions.size != meanings.size || submission.responses.size != questions.size ||
            submission.responses.map { it.questionID }.distinct().size != questions.size) return false
        return submission.responses.all { response ->
            val question = questions.firstOrNull { it.id == response.questionID } ?: return@all false
            response.questionText == question.title && response.questionDescription == question.description && response.selectedOptions.all { it in question.options } &&
                validSelection(response.selectedOptions.map { it.id }, question) &&
                response.state == (if (response.selectedOptions.isEmpty()) "unanswered" else "answered")
        }
    }

    fun create(questions: List<PreferenceQuestion>, answers: Map<String, List<String>>, userID: String = "local-owner",
               id: String = UUID.randomUUID().toString(), recordedAt: String = timestamp(Instant.now())): PreferenceSubmission {
        val responses = questions.map { question ->
            val ids = answers[question.id].orEmpty()
            require(validSelection(ids, question)) { "선택한 응답을 다시 확인해 주세요." }
            PreferenceResponse(question.id, question.title, question.description, if (ids.isEmpty()) "unanswered" else "answered",
                ids.map { id -> question.options.first { it.id == id } })
        }
        val submission = PreferenceSubmission(id = id, userID = userID, recordedAt = recordedAt, knownAt = recordedAt, responses = responses)
        require(isValid(submission, questions)) { "응답의 출처와 저장 시점을 확인하지 못했어요." }
        return submission
    }

    fun build(submissions: List<PreferenceSubmission>, questions: List<PreferenceQuestion>, userID: String = "local-owner",
              asOf: Instant? = null): PreferenceEvidenceSnapshot {
        if (userID.isBlank()) return PreferenceEvidenceSnapshot()
        val excluded = mutableListOf<PreferenceExcludedSubmission>()
        val valid = submissions.groupBy { it.id }.toSortedMap().mapNotNull { (id, copies) ->
            val submission = copies.first()
            val reason = when {
                copies.any { it != submission } -> "conflicting_submission_identity"
                !isValid(submission, questions) -> "invalid_submission"
                submission.userID != userID -> "different_user"
                asOf != null && (parseInstant(submission.recordedAt)!! > asOf || parseInstant(submission.knownAt)!! > asOf) -> "after_cutoff"
                else -> null
            }
            if (reason != null) { excluded += PreferenceExcludedSubmission(id, reason); null } else submission
        }
        val latest = valid.sortedWith(compareBy<PreferenceSubmission> { parseInstant(it.recordedAt) }.thenBy { parseInstant(it.knownAt) }.thenBy { it.id }).lastOrNull()
            ?: return PreferenceEvidenceSnapshot(excludedSubmissions = excluded)
        val records = questions.map { question ->
            val response = latest.responses.first { it.questionID == question.id }
            val (kind, label) = meanings.getValue(question.id)
            val state = when { response.state == "unanswered" -> "unanswered"
                response.selectedOptions.any { it.id == question.noneOptionId } -> "declared_none"; else -> "answered" }
            PreferenceEvidenceRecord("${latest.id}:${question.id}", latest.id, kind, label, state, latest.recordedAt, latest.knownAt, response)
        }
        return PreferenceEvidenceSnapshot(submissionID = latest.id, recordedAt = latest.recordedAt,
            answeredQuestionCount = records.count { it.state != "unanswered" }, records = records, excludedSubmissions = excluded)
    }
}
