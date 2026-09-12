package com.tastebuddy.android.domain

import kotlinx.serialization.json.JsonPrimitive

/** iOS SensoryNativeParser와 동일한 UTF-16 원문 위치 및 보류 규칙을 사용한다. */
class SensoryParser(private val contract: SensoryContract) {
    private val regexes = mutableMapOf<String, Regex>()

    private fun regex(pattern: String) = regexes.getOrPut(pattern) { Regex(pattern) }

    private fun matches(pattern: String, text: String) = regex(pattern).findAll(text).toList()

    private fun has(pattern: String, text: String) = regex(pattern).containsMatchIn(text)

    private fun pattern(name: String) = contract.patterns[name] ?: "(?!)"

    private data class Sense(
        val attribute: String,
        val phrase: String,
        val range: IntRange,
        val reference: String? = null,
    )

    private data class Scope(val target: String, val phase: String, val ambiguous: Boolean)

    private data class Clause(
        val text: String,
        val start: Int,
        val deferred: Boolean = false,
        val quoted: Boolean = false,
    )

    private fun senses(text: String): List<Sense> {
        val found = mutableListOf<Sense>()
        for (definition in contract.language.senses) for (match in
            matches(definition.pattern, text)) {
            val before =
                if (match.range.first > 0) text.substring(match.range.first - 1, match.range.first)
                else ""
            val after = text.substring(match.range.last + 1)
            if (has("[가-힣A-Za-z]", before)) continue
            if (
                has("^[가-힣A-Za-z]", after) &&
                    !has("^(?:은|는|이|가|을|를|도|만|의|에|으로|과|와|었|있|없|나|좋|싫|부담|강|약|적|많|덜)", after)
            )
                continue
            found += Sense(definition.attribute, match.value, match.range)
        }
        val metaphor =
            "(?:아몬드|땅콩|헤이즐넛|호두|레몬|오렌지|딸기|사과|복숭아|장미|자스민|버터|우유|바질|민트|버섯|가죽|나무|연기)(?: 같은|를 닮은|을 닮은|를 떠올리는|을 떠올리는) 향"
        matches(metaphor, text).forEach {
            found += Sense("aroma.reference", it.value, it.range, it.value)
        }
        return found
            .filter {
                it.attribute != "trigeminal.tingling" ||
                    found.none { other -> other.attribute == "trigeminal.fizzy" }
            }
            .sortedBy { it.range.first }
    }

    private fun scope(text: String, target: String?, phase: String?): Scope {
        val targets =
            contract.language.targets
                .filter { item ->
                    matches(item.pattern, text).any {
                        it.range.first == 0 ||
                            !has("[가-힣A-Za-z]", text.substring(it.range.first - 1, it.range.first))
                    }
                }
                .map { it.value }
        val phases = contract.language.phases.filter { has(it.pattern, text) }.map { it.value }
        return Scope(
            targets.firstOrNull() ?: target ?: "whole_dish",
            phases.firstOrNull() ?: phase ?: "unspecified",
            targets.size > 1 || phases.size > 1,
        )
    }

    private fun domain(text: String): String? =
        listOf(
                "aroma" to "향(?:은|이|을|의|에|도|만|과|과는|$)|냄새",
                "mouthfeel" to "입안|구강|혀에 남|기름진 느낌",
                "texture" to "식감|질감|씹|부서|겉은|속은",
                "temperature" to "온도|차갑|따뜻|뜨거|식으니",
                "trigeminal" to "자극|얼얼|알싸|따끔",
                "finish" to "여운|뒷맛",
                "taste" to "맛(?:은|이|을|의|에|도|만|과|$)",
            )
            .firstOrNull { has(it.second, text) }
            ?.first

    fun parseChoice(
        label: String,
        id: String? = null,
        target: String? = null,
        phase: String? = null,
    ): RuleResult {
        val entry =
            contract.lexicon.firstOrNull { it.label == label && (id == null || it.id == id) }
                ?: return parse(label, target, phase)
        val spans = listOf(SourceSpan(0, label.length, label))
        return RuleResult(
            entry.semanticAtoms.map {
                it.copy(
                    target = it.target ?: target ?: "whole_dish",
                    phase = it.phase ?: phase ?: "unspecified",
                    phrase = label,
                    sourceSpans = spans,
                )
            },
            if (entry.resolution == "resolved") emptyList()
            else listOf(RuleUnresolved(label, entry.reason, spans)),
        )
    }

    fun parse(text: String, target: String? = null, phase: String? = null): RuleResult {
        val observations = mutableListOf<RuleAtom>()
        val unresolved = mutableListOf<RuleUnresolved>()
        var needsAI = false
        val clauses = mutableListOf<Clause>()
        val unresolvedStructure = "(?:그 향|그 맛|그 식감|그것|이것)|(?:안 .*(?:아니|않))|(?:않은 건 아니|없지 않|지 않지)"
        for (sentence in matches("[^.!?\\n]+(?:[.!?\\n]|$)", text)) {
            val source = sentence.value
            if (has("[\"“”‘’「」]", source)) {
                clauses += Clause(source, sentence.range.first, quoted = true)
                continue
            }
            if (has(unresolvedStructure, source)) {
                clauses += Clause(source, sentence.range.first, deferred = true)
                continue
            }
            for (raw in matches("[^,;]+(?:[,;]|$)", source)) {
                val body = raw.value
                val base = sentence.range.first + raw.range.first
                val boundaries =
                    matches(
                        "(?<!다고)(?<!라고)(?<=고)\\s+|(?<=지만)\\s+|(?<=는데)\\s+|\\s+(?:그리고|하지만|그런데)\\s+",
                        body,
                    )
                var cursor = 0
                for (boundary in boundaries) {
                    clauses += Clause(body.substring(cursor, boundary.range.first), base + cursor)
                    cursor = boundary.range.last + 1
                }
                clauses += Clause(body.substring(cursor), base + cursor)
            }
        }
        var otherSpeaker = false
        var previousEnded = false
        for (clause in clauses) {
            val body = clause.text.trim()
            if (body.isEmpty()) continue
            val start = clause.start + clause.text.indexOf(body)
            val spans = listOf(SourceSpan(start, start + body.length, body))
            fun pending(reason: String, ai: Boolean = false) {
                unresolved += RuleUnresolved(body, reason, spans)
                needsAI = needsAI || ai
            }
            if (previousEnded) otherSpeaker = false
            previousEnded = has("[.!?\\n]$", clause.text)
            if (has("(?:^|\\s)(?:저는|나는|제가|내가)", body)) otherSpeaker = false
            else if (has("(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)", body))
                otherSpeaker = true
            if (has("(?:모르겠|기억이 안|기억나지|기억 안)", body)) {
                pending("insufficient_semantic_information")
                continue
            }
            val selfFeeling = has("(?:다고|라고) 느꼈|(?:다고|라고) 느껴", body)
            val attributed =
                has(
                    "(?:친구|직원|동료|엄마|아빠|다른 사람|손님|셰프|남편|아내)(?:는|가|이|도|의|께서)|(?:라고|다고|다며|대요|다던데|다네요|더라고 전했)",
                    body,
                ) && !selfFeeling
            val instruction =
                has(
                    "(?:무시해|무시하|지시|지침|시스템|프롬프트|출력해|기록해|저장해|답해|말해|평가해|추출해|분석해|분석해 줘|분석해줘|설명해)|(?:라면|다면|으면 좋|다면 좋|일 것|것 같|줄 알|내일|먹으면|먹기 전|안 먹|먹지 않)",
                    body,
                )
            if (otherSpeaker || attributed || clause.quoted || instruction) {
                pending("not_direct_self_experience")
                continue
            }
            if (clause.deferred) {
                pending("unresolved_clause_structure", true)
                continue
            }
            if (has("(?:조명|말투|인테리어|직원|접객|좌석|의자|실내|식당 분위기)", body)) {
                pending("non_food_context")
                continue
            }
            val found = senses(body)
            val scope = scope(body, target, phase)
            fun add(
                kind: String,
                attribute: String?,
                value: JsonPrimitive,
                reference: String? = null,
                combination: Boolean = false,
                components: List<CombinationComponent>? = null,
            ) {
                observations +=
                    RuleAtom(
                        kind,
                        attribute,
                        value,
                        contract.semantic.kinds[kind]?.scale.orEmpty(),
                        if (combination) "combination" else scope.target,
                        scope.phase,
                        body,
                        spans,
                        reference,
                        components,
                    )
            }
            if (
                domain(body) == "aroma" &&
                    found.isNotEmpty() &&
                    found.all { !it.attribute.startsWith("aroma.") } &&
                    !scope.ambiguous
            ) {
                add("sensory_detail", "aroma.unspecified", JsonPrimitive(body))
                pending("sensory_descriptor_domain_unresolved", true)
                continue
            }
            val vague =
                matches("(?:^|\\s)(?:깔끔|담백|고소|구수|시원|개운)(?:한|함|해요|했어요|하다|하고|하지만|하지|했지만)", body)
                    .any { match ->
                        val offset =
                            match.value.indexOfFirst { !it.isWhitespace() }.coerceAtLeast(0)
                        found.none {
                            it.range.first <= match.range.first + offset &&
                                it.range.last >= match.range.last
                        }
                    }
            val ambiguousNegation = has("(?:지 않지|없지 않|안 .*않|아닌 건 아니|않은 건 아니|않다고는|덜 .*않)", body)
            val combination = has("조합|함께 먹|같이 먹|어울", body)
            val positive = has(pattern("positiveEvaluation"), body)
            val negative = has(pattern("negativeEvaluation"), body)
            if (has(pattern("comparativeOrConditional"), body) && found.isNotEmpty()) {
                if (found.size == 1 && !scope.ambiguous && !has("때만", body))
                    add(
                        "sensory_detail",
                        found[0].attribute,
                        JsonPrimitive(body),
                        found[0].reference,
                    )
                pending("unresolved_condition_or_comparison", true)
                continue
            }
            val likingNegated = has("좋지(?:는|도)? 않|싫지(?:는|도)? 않|맛있지(?:는|도)? 않|나쁘지(?:는|도)? 않", body)
            if (has("싫지(?:는|도)? 않았|싫지(?:는|도)? 않", body) && found.size == 1 && !scope.ambiguous) {
                add("sensory_presence", found[0].attribute, JsonPrimitive(true))
                pending("insufficient_liking_information")
                continue
            }
            if (
                (scope.ambiguous && !combination) ||
                    ambiguousNegation ||
                    likingNegated ||
                    (positive && negative) ||
                    (found.size > 1 && has("(?:좋|싫|너무|강|약|적당|않|없|아니|안\\s)", body) && !combination)
            ) {
                pending("unresolved_clause_structure", found.isNotEmpty() || positive || negative)
                continue
            }
            if (combination) {
                if (found.size > 1 || scope.ambiguous) {
                    pending("unresolved_combination_scope", true)
                    continue
                }
                if (positive != negative)
                    add(
                        "combination_liking",
                        null,
                        JsonPrimitive(if (positive) "positive" else "negative"),
                        combination = true,
                        components =
                            found.map {
                                CombinationComponent(it.attribute, scope.target, it.reference)
                            },
                    )
                else pending("combination_relation_unresolved")
                continue
            }
            if (found.isEmpty()) {
                val domain = domain(body)
                if (domain != null && (!vague || domain == "aroma") && !scope.ambiguous) {
                    add("sensory_detail", "$domain.unspecified", JsonPrimitive(body))
                    pending(
                        if (positive != negative) "explicit_evaluation_scope_unresolved"
                        else "unclassified_sensory_description",
                        true,
                    )
                } else if (vague) pending("insufficient_semantic_information")
                else if (
                    positive != negative &&
                        !scope.ambiguous &&
                        scope.target == "whole_dish" &&
                        !has("(?:가격|서비스|주차|직원|분위기|의자|인테리어|거리)", body)
                )
                    add(
                        "overall_liking",
                        null,
                        JsonPrimitive(if (positive) "positive" else "negative"),
                    )
                else if (has("(?:맛|향|식감|단|쓴|짠|매운|바삭|소스|후반|첫입)", body))
                    pending("unresolved_clause_structure", true)
                else pending("unrelated_text")
                continue
            }
            // 강도의 부정만으로 감각의 부재나 반대 강도를 확정할 수 없다.
            if (has("(?:(?:강|약|진|연|은은|희미)하|세)(?:지(?:는|도)?|진)\\s*않|(?:^|\\s)안\\s+(?:강|약|진|연|은은|희미|세)|(?:강|약|진|연|은은|희미)하게\\s+(?:느껴지지|나지)\\s*않", body)) {
                if (found.size == 1)
                    add("sensory_detail", found[0].attribute, JsonPrimitive(body), found[0].reference)
                pending("unresolved_intensity_negation", true)
                continue
            }
            for (sense in found) {
                val absent =
                    has("(?:^|\\s)안\\s", body) ||
                        has("(?:지(?:는|도)?\\s?않|없(?:어|다|었|고)|느껴지지|나지 않)", body)
                if (has("아니", body) && !absent) {
                    pending("unresolved_negation", true)
                    continue
                }
                val fit =
                    when {
                        has("너무|지나치게|과하게|과했|과해|과한|과도", body) -> "above_preferred"
                        has("덜 .*좋|더 .*좋|부족|싱거", body) -> "below_preferred"
                        has("적당|딱 좋|알맞", body) -> "just_right"
                        else -> null
                    }
                val intensity =
                    when {
                        has("진한|진해|진했|강한|강해|강했|강하게|매우|아주|엄청", body) -> "strong"
                        has("은은|약한|약해|약했|살짝|희미", body) -> "weak"
                        else -> null
                    }
                add("sensory_presence", sense.attribute, JsonPrimitive(!absent), sense.reference)
                if (!absent && intensity != null)
                    add(
                        "sensory_intensity",
                        sense.attribute,
                        JsonPrimitive(intensity),
                        sense.reference,
                    )
                if (!absent && fit != null && (!(positive && !negative) || fit == "just_right"))
                    add("preference_fit", sense.attribute, JsonPrimitive(fit), sense.reference)
                if (positive != negative)
                    add(
                        "attribute_liking",
                        sense.attribute,
                        JsonPrimitive(if (positive) "positive" else "negative"),
                        sense.reference,
                    )
            }
            if (
                found.size == 1 &&
                    (has(pattern("temporalDetail"), body) || has("(?:했다|했습니다)[.!?,;]?$", body))
            )
                add("sensory_detail", found[0].attribute, JsonPrimitive(body), found[0].reference)
            if (!positive && !negative && has(pattern("evaluationCue"), body))
                pending("uninterpreted_evaluation", true)
            if (found.any { it.attribute == "trigeminal.tingling" })
                pending("tingling_cause_unspecified")
            if (found.any { it.attribute == "finish.duration" })
                pending("finish_attribute_duration_phase_unspecified")
            if (vague) pending("insufficient_semantic_information")
        }
        return RuleResult(observations, unresolved, needsAI)
    }
}
