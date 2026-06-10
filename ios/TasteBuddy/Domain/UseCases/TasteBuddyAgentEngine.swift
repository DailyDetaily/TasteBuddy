import Foundation

enum TasteBuddyAgent {
    static let alias = "TBA"
    static let displayName = "TasteBuddyAgent"
    static let diningAnalysisSnapshotVersion = "tba-dining-analysis-v1"
    static let fixedFixtureGeneratedAt = "2026-06-05T00:00:00.000Z"

    static func buildDiningNote(
        _ input: TasteBuddyAgentDiningAnalysisInput
    ) -> TasteBuddyAgentDiningNote {
        buildDiningNoteAnalysis(input).note
    }

    static func buildDiningAnalysisSnapshot(
        _ input: TasteBuddyAgentDiningAnalysisInput,
        generatedAt: String = ISO8601DateFormatter().string(from: Date())
    ) -> TasteBuddyAgentDiningAnalysisSnapshot {
        let analysis = buildDiningNoteAnalysis(input)

        return TasteBuddyAgentDiningAnalysisSnapshot(
            confidence: analysis.mapping.confidence,
            detailTags: analysis.note.detailTags,
            foodKnowledgeMatchIds: analysis.mapping.foodKnowledgeMatchIds,
            foodOnMatchIds: analysis.mapping.foodOnMatchIds,
            generatedAt: generatedAt,
            lexiconCandidateIds: analysis.mapping.candidates.map(\.id),
            source: displayName,
            subject: analysis.subject,
            summary: analysis.note.summary,
            tasteBubbles: analysis.note.tasteBubbles,
            tbaSignalIds: analysis.mapping.tbaSignalIds,
            version: diningAnalysisSnapshotVersion
        )
    }

    static func inferDishKindIds(
        title: String?,
        subtitle: String? = nil,
        ingredients: [String] = [],
        techniques: [String] = [],
        flavorNotes: [String] = [],
        limit: Int = 4
    ) -> [String] {
        let searchableText = ([title, subtitle].compactMap { $0 } + ingredients + techniques + flavorNotes)
            .joined(separator: " ")
            .lowercased()
        guard !searchableText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }

        var scoredOptions: [(id: String, score: Int)] = []
        for option in TasteBuddyAgentKnowledge.dishKindOptions {
            var score = 0
            for keyword in option.keywords where searchableText.contains(keyword.lowercased()) {
                score += 1
            }

            if score > 0 {
                scoredOptions.append((id: option.id, score: score))
            }
        }

        scoredOptions.sort {
            if $0.score == $1.score {
                return $0.id < $1.id
            }

            return $0.score > $1.score
        }

        return scoredOptions.prefix(limit).map(\.id)
    }

    private static func buildDiningNoteAnalysis(
        _ input: TasteBuddyAgentDiningAnalysisInput
    ) -> DiningNoteAnalysis {
        let normalizedTasteTags = normalizeReviewTags(input.tasteTags)
        let normalizedDetailTags = normalizeReviewTags(input.detailTags)
        let mapping = TasteBuddyAgentKnowledge.mapCoreTasteLexiconSignals(input)
        let fallbackTasteBubbles = buildDiningNoteTasteBubbles(
            detailTags: normalizedDetailTags,
            id: input.id,
            tasteTags: normalizedTasteTags
        )
        let fallbackDetailTags = buildDiningNoteDetailTags(
            detailTags: normalizedDetailTags,
            id: input.id,
            tasteTags: normalizedTasteTags
        )
        let tasteBubbles = mergeByLabel(
            primaryItems: buildLexiconDiningNoteTasteBubbles(id: input.id, mapping: mapping),
            fallbackItems: fallbackTasteBubbles,
            limit: 3
        )
        let detailTags = mergeByLabel(
            primaryItems: buildLexiconDiningNoteDetailTags(id: input.id, mapping: mapping),
            fallbackItems: fallbackDetailTags,
            limit: 6
        )
        let tastePhrase = joinKoreanList(tasteBubbles.prefix(2).map(\.label))
        let detailPhrase = joinKoreanList(
            detailTags.prefix(2).map { getDiningNoteDetailProseLabel($0.label) }
        )
        let subject = input.subject.isEmpty ? input.restaurantName : input.subject
        let dishKindLabels = resolveDishKindLabels(input.dishKindTags)
        let note = TasteBuddyAgentDiningNote(
            detailTags: detailTags,
            summary: buildReviewLikeDiningNoteSummary(
                detailPhrase: detailPhrase,
                kindLabels: dishKindLabels,
                reviewSnippet: input.reviewSnippet,
                subject: subject,
                tastePhrase: tastePhrase
            ),
            tasteBubbles: tasteBubbles
        )

        return DiningNoteAnalysis(mapping: mapping, note: note, subject: subject)
    }

    private static func normalizeReviewTags(_ tags: [String]) -> [String] {
        Array(tags.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
            .filter { !$0.isEmpty }
            .prefix(6))
    }

    private static func buildLexiconDiningNoteTasteBubbles(
        id: String,
        mapping: TasteBuddyAgentKnowledge.Mapping
    ) -> [TasteBuddyAgentDiningAnalysisTagSnapshot] {
        mapping.candidates
            .filter(\.isTasteBubble)
            .map { candidate in
                TasteBuddyAgentDiningAnalysisTagSnapshot(
                    colorTaste: candidate.colorTaste,
                    id: "\(id)-lexicon-taste-note-\(candidate.id)",
                    label: candidate.label,
                    title: candidate.colorTaste ?? candidate.categoryLabel
                )
            }
    }

    private static func buildLexiconDiningNoteDetailTags(
        id: String,
        mapping: TasteBuddyAgentKnowledge.Mapping
    ) -> [TasteBuddyAgentDiningAnalysisTagSnapshot] {
        mapping.candidates
            .filter(\.isDetailTag)
            .map { candidate in
                TasteBuddyAgentDiningAnalysisTagSnapshot(
                    id: "\(id)-lexicon-detail-note-\(candidate.id)",
                    label: candidate.label,
                    title: candidate.categoryLabel
                )
            }
    }

    private static func buildDiningNoteTasteBubbles(
        detailTags: [String],
        id: String,
        tasteTags: [String]
    ) -> [TasteBuddyAgentDiningAnalysisTagSnapshot] {
        let signalTags = tasteTags + detailTags
        let hasReviewTasteSignals = signalTags.contains { getDominantTasteId(for: $0) != nil }
        var seenLabels: Set<String> = []

        var candidates: [(tag: TasteBuddyAgentDiningAnalysisTagSnapshot, score: Double)] = []
        for axis in TasteAxis.allCases {
            let tagScore = getTagTasteScore(tags: signalTags, axis: axis)
            let profileScore = 0.5
            let score = hasReviewTasteSignals
                ? tagScore * 0.62 + profileScore * 0.38
                : profileScore

            guard score > 0.18 else { continue }

            let tag = TasteBuddyAgentDiningAnalysisTagSnapshot(
                colorTaste: axis.label,
                id: "\(id)-taste-note-\(axis.rawValue)",
                label: getTasteBubbleLabel(tags: signalTags, axis: axis),
                title: axis.label
            )
            candidates.append((tag: tag, score: score))
        }

        candidates.sort {
            if $0.score == $1.score {
                return $0.tag.id < $1.tag.id
            }

            return $0.score > $1.score
        }

        var selectedTags: [TasteBuddyAgentDiningAnalysisTagSnapshot] = []
        for candidate in candidates {
            guard !seenLabels.contains(candidate.tag.label) else { continue }
            seenLabels.insert(candidate.tag.label)
            selectedTags.append(candidate.tag)
            if selectedTags.count == 3 {
                break
            }
        }

        return selectedTags
    }

    private static func buildDiningNoteDetailTags(
        detailTags: [String],
        id: String,
        tasteTags: [String]
    ) -> [TasteBuddyAgentDiningAnalysisTagSnapshot] {
        let sourceTags = detailTags.isEmpty ? tasteTags : detailTags
        var seenLabels: Set<String> = []

        return sourceTags.enumerated()
            .map { index, tag in
                let metadata = TasteBuddyAgentKnowledge.detailTagMetadata[tag]
                return TasteBuddyAgentDiningAnalysisTagSnapshot(
                    id: "\(id)-detail-note-\(tag)-\(index)",
                    label: metadata?.label ?? getDiningNoteDetailLabel(tag),
                    score: 0.29879999999999995,
                    title: metadata?.categoryLabel ?? getDiningNoteDetailTitle(tag)
                )
            }
            .filter { tag in
                if seenLabels.contains(tag.label) { return false }
                seenLabels.insert(tag.label)
                return true
            }
            .prefix(6)
            .map { $0 }
    }

    private static func mergeByLabel(
        primaryItems: [TasteBuddyAgentDiningAnalysisTagSnapshot],
        fallbackItems: [TasteBuddyAgentDiningAnalysisTagSnapshot],
        limit: Int
    ) -> [TasteBuddyAgentDiningAnalysisTagSnapshot] {
        var seenLabels: Set<String> = []

        return (primaryItems + fallbackItems)
            .filter { item in
                if seenLabels.contains(item.label) { return false }
                seenLabels.insert(item.label)
                return true
            }
            .prefix(limit)
            .map { $0 }
    }

    private static func getDominantTasteId(for tag: String) -> TasteAxis? {
        if let directTaste = TasteAxis.allCases.first(where: { $0.label == tag }) {
            return directTaste
        }

        guard let hints = TasteBuddyAgentKnowledge.tagTasteHints[tag] else { return nil }

        var dominantAxis: TasteAxis?
        var dominantScore = 0.0
        for axis in TasteAxis.allCases {
            let score = max(0, hints[axis] ?? 0)
            if score > dominantScore
                || (score == dominantScore && axis.rawValue < (dominantAxis?.rawValue ?? axis.rawValue)) {
                dominantAxis = axis
                dominantScore = score
            }
        }

        guard dominantScore > 0 else { return nil }
        return dominantAxis
    }

    private static func getTagTasteScore(tags: [String], axis: TasteAxis) -> Double {
        let total = tags.reduce(0.0) { sum, tag in
            let directScore = axis.label == tag ? 0.62 : 0
            return sum + directScore + max(0, TasteBuddyAgentKnowledge.tagTasteHints[tag]?[axis] ?? 0)
        }

        return clamp(total / 1.15)
    }

    private static func getTasteBubbleLabel(tags: [String], axis: TasteAxis) -> String {
        var bestTag: String?
        var bestScore = 0.0
        for tag in tags {
            let score = max(0, TasteBuddyAgentKnowledge.tagTasteHints[tag]?[axis] ?? 0)
            if score > bestScore || (score == bestScore && tag < (bestTag ?? tag)) {
                bestTag = tag
                bestScore = score
            }
        }

        if let bestTag, bestScore > 0 {
            return getDiningNoteTagLabel(bestTag)
        }

        return "\(axis.label) 반응"
    }

    private static func getDiningNoteTagLabel(_ tag: String) -> String {
        TasteBuddyAgentKnowledge.detailTagMetadata[tag]?.label
            ?? TasteBuddyAgentKnowledge.diningNoteTagLabels[tag]
            ?? tag
    }

    private static func getDiningNoteDetailLabel(_ tag: String) -> String {
        TasteBuddyAgentKnowledge.detailTagMetadata[tag]?.label
            ?? TasteBuddyAgentKnowledge.diningNoteDetailLabels[tag]
            ?? getDiningNoteTagLabel(tag)
    }

    private static func getDiningNoteDetailTitle(_ tag: String) -> String {
        TasteBuddyAgentKnowledge.detailTagMetadata[tag]?.categoryLabel
            ?? getDiningNoteTagLabel(tag)
    }

    private static func getDiningNoteDetailProseLabel(_ label: String) -> String {
        TasteBuddyAgentKnowledge.diningNoteDetailProseLabels[label] ?? label
    }

    private static func resolveDishKindLabels(_ kindIds: [String]) -> [String] {
        var seenLabels: Set<String> = []

        return kindIds
            .map { TasteBuddyAgentKnowledge.dishKindLabelById[$0] ?? $0 }
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .filter { label in
                let key = label.lowercased()
                if seenLabels.contains(key) { return false }
                seenLabels.insert(key)
                return true
            }
            .prefix(6)
            .map { $0 }
    }

    private static func buildReviewLikeDiningNoteSummary(
        detailPhrase: String,
        kindLabels: [String],
        reviewSnippet: String?,
        subject: String,
        tastePhrase: String
    ) -> String {
        let templateKind = diningNoteTemplateKind(kindLabels: kindLabels)
        let resolvedTastePhrase = tastePhrase.isEmpty ? "전체 밸런스" : tastePhrase
        let resolvedDetailPhrase = detailPhrase.isEmpty ? "마무리" : detailPhrase
        let reviewSentence = diningNoteReviewSentence(reviewSnippet)

        switch templateKind {
        case .broth:
            return "\(withParticle(subject, final: "은", noFinal: "는")) 국물 맛이 천천히 열렸고, \(withParticle(resolvedTastePhrase, final: "이", noFinal: "가")) 차분하게 이어졌어요. \(resolvedDetailPhrase) 덕분에 흐름이 편안했어요.\(reviewSentence)"
        case .seafood:
            return "\(withParticle(subject, final: "은", noFinal: "는")) \(withParticle(resolvedTastePhrase, final: "이", noFinal: "가")) 먼저 맑게 올라왔고, \(withParticle(resolvedDetailPhrase, final: "이", noFinal: "가")) 뒤를 정리해줘서 좋았어요.\(reviewSentence)"
        case .general:
            return "\(withParticle(subject, final: "은", noFinal: "는")) \(withParticle(resolvedTastePhrase, final: "이", noFinal: "가")) 먼저 남았고, \(withParticle(resolvedDetailPhrase, final: "이", noFinal: "가")) 전체 흐름을 정리해줬어요.\(reviewSentence)"
        }
    }

    private enum DiningNoteTemplateKind {
        case broth
        case general
        case seafood
    }

    private static func diningNoteTemplateKind(kindLabels: [String]) -> DiningNoteTemplateKind {
        if kindLabels.contains(where: { $0.contains("국물") || $0.contains("브로스") || $0.contains("육수") }) {
            return .broth
        }

        if kindLabels.contains(where: { $0.contains("해산물") || $0.contains("생선") || $0.contains("조개") }) {
            return .seafood
        }

        return .general
    }

    private static func diningNoteReviewSentence(_ reviewSnippet: String?) -> String {
        let snippet = reviewSnippet?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !snippet.isEmpty else { return "" }

        if snippet.contains("사용자가 남긴 감각 단서가 가장 중요한 기준")
            || snippet.contains("다음 선택에 참고할 만한 미각 신호") {
            return ""
        }

        return " \(snippet)"
    }

    private static func joinKoreanList(_ labels: ArraySlice<String>) -> String {
        joinKoreanList(Array(labels))
    }

    private static func joinKoreanList(_ labels: [String]) -> String {
        if labels.isEmpty { return "" }
        if labels.count == 1 { return labels[0] }

        let prefix = labels.dropLast().joined(separator: ", ")
        return "\(prefix)\(hasKoreanFinalConsonant(prefix) ? "과" : "와") \(labels[labels.count - 1])"
    }

    private static func withParticle(_ value: String, final: String, noFinal: String) -> String {
        "\(value)\(hasKoreanFinalConsonant(value) ? final : noFinal)"
    }

    private static func hasKoreanFinalConsonant(_ value: String) -> Bool {
        guard let scalar = value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .unicodeScalars
            .reversed()
            .first(where: { $0.value >= 0xAC00 && $0.value <= 0xD7A3 })
        else {
            return false
        }

        return (scalar.value - 0xAC00) % 28 != 0
    }

    private static func clamp(_ value: Double, minimum: Double = 0, maximum: Double = 1) -> Double {
        min(maximum, max(minimum, value))
    }
}

private struct DiningNoteAnalysis {
    let mapping: TasteBuddyAgentKnowledge.Mapping
    let note: TasteBuddyAgentDiningNote
    let subject: String
}

private enum TasteBuddyAgentKnowledge {
    struct LexiconCandidate {
        let categoryLabel: String
        let colorTaste: String?
        let id: String
        let isDetailTag: Bool
        let isTasteBubble: Bool
        let label: String
    }

    struct Mapping {
        let candidates: [LexiconCandidate]
        let confidence: Double
        let foodKnowledgeMatchIds: [String]
        let foodOnMatchIds: [String]
        let tbaSignalIds: [String]
    }

    struct DishKindOption {
        let id: String
        let label: String
        let keywords: [String]
    }

    struct DetailTagMetadata {
        let categoryLabel: String
        let label: String
    }

    static let dishKindOptions: [DishKindOption] = [
        .init(id: "seafood", label: "해산물", keywords: ["굴", "생선", "금태", "조개", "백합", "해산물", "오징어", "문어", "새우", "seafood", "fish", "oyster"]),
        .init(id: "meat", label: "육류", keywords: ["한우", "소고기", "오리", "돼지", "양갈비", "갈비", "등갈비", "백립", "립", "닭", "고기", "육향", "beef", "duck", "lamb", "pork", "rib", "ribs"]),
        .init(id: "vegetable_herb", label: "채소/허브", keywords: ["채소", "나물", "봄동", "더덕", "오이", "허브", "딜", "가니시", "vegetable", "herb"]),
        .init(id: "grain_noodle", label: "면/곡물", keywords: ["메밀", "면", "국수", "카펠리니", "밥", "쌀", "곡물", "타르트 셸", "grain", "noodle"]),
        .init(id: "broth", label: "국물/브로스", keywords: ["육수", "국물", "브로스", "jus", "쥬", "소스", "broth", "stock"]),
        .init(id: "grilled_smoked", label: "구이/훈연", keywords: ["숯불", "직화", "굽기", "구운", "훈연", "스모키", "불맛", "grill", "charcoal", "smoke"]),
        .init(id: "fermented_jang", label: "발효/장", keywords: ["된장", "간장", "백간장", "장", "발효", "코지", "미소", "fermented", "jang", "koji", "miso"]),
        .init(id: "dessert", label: "디저트", keywords: ["디저트", "아이스크림", "타르트", "캐러멜", "그라니타", "배 콩포트", "단맛", "dessert", "ice cream"]),
        .init(id: "cold", label: "차가운 요리", keywords: ["차가운", "차갑게", "냉", "아이스", "그라니타", "cold", "cool"]),
        .init(id: "beverage_pairing", label: "음료/페어링", keywords: ["음료", "차", "와인", "페어링", "주스", "beverage", "pairing", "wine"]),
    ]

    static let dishKindLabelById = Dictionary(uniqueKeysWithValues: dishKindOptions.map { ($0.id, $0.label) })

    static let tagTasteHints: [String: [TasteAxis: Double]] = [
        "crisp": [.sour: 0.58, .bitter: 0.16],
        "delicate": [.sour: 0.22, .bitter: 0.16, .fat: -0.2],
        "deep": [.umami: 0.62, .fat: 0.28],
        "dessert": [.sweet: 0.58, .fat: 0.22],
        "fermented": [.umami: 0.52, .sour: 0.24],
        "fresh": [.sour: 0.5, .bitter: 0.18],
        "gentle": [.sweet: 0.2, .fat: -0.1, .salty: -0.1],
        "grilled": [.bitter: 0.22, .umami: 0.46, .fat: 0.2],
        "rich": [.fat: 0.58, .umami: 0.22],
        "savory": [.umami: 0.6, .salty: 0.2],
        "seafood": [.umami: 0.48, .salty: 0.22, .sour: 0.14],
        "smoky": [.bitter: 0.28, .umami: 0.36],
        "spicy": [.bitter: 0.18, .sour: 0.2],
        "sweet": [.sweet: 0.62],
    ]

    static let diningNoteTagLabels = [
        "crisp": "산뜻한 산미",
        "deep": "깊은 여운",
        "delicate": "섬세한 여운",
        "dessert": "디저트 균형",
        "fermented": "발효 향",
        "fresh": "산뜻한 산미",
        "gentle": "부드러운 흐름",
        "grilled": "불맛이 선명함",
        "rich": "농도감 있음",
        "savory": "감칠맛 깊음",
        "seafood": "해산물 감칠맛",
        "smoky": "스모키한 향",
        "spicy": "선명한 향신감",
        "sweet": "단맛",
    ]

    static let diningNoteDetailLabels = [
        "crisp": "산뜻한 마무리",
        "deep": "긴 여운",
        "delicate": "섬세한 여운",
        "dessert": "디저트 균형",
        "fermented": "발효 향",
        "fresh": "맑은 향",
        "gentle": "부드러운 흐름",
        "grilled": "구운 향",
        "rich": "농도감",
        "savory": "감칠 흐름",
        "seafood": "해산물 결",
        "smoky": "스모키한 향",
        "spicy": "향신감",
        "sweet": "정돈된 단맛",
    ]

    static let diningNoteDetailProseLabels = [
        "간이 선명함": "선명한 간",
        "감칠맛이 깊음": "깊은 감칠맛",
        "끝맛이 가벼움": "가벼운 끝맛",
    ]

    static let detailTagMetadata: [String: DetailTagMetadata] = [
        "balance-clear-seasoning": .init(categoryLabel: "맛의 강도와 균형", label: "간이 선명함"),
        "balance-well-balanced": .init(categoryLabel: "맛의 강도와 균형", label: "균형이 좋음"),
        "balance-one-note-forward": .init(categoryLabel: "맛의 강도와 균형", label: "한 맛이 앞섬"),
        "balance-sweet-support": .init(categoryLabel: "맛의 강도와 균형", label: "단맛이 받쳐줌"),
        "balance-acid-cleans": .init(categoryLabel: "맛의 강도와 균형", label: "산미가 정리함"),
        "balance-umami-depth": .init(categoryLabel: "맛의 강도와 균형", label: "감칠맛이 깊음"),
        "balance-finish-heavy": .init(categoryLabel: "맛의 강도와 균형", label: "마무리가 무거움"),
        "balance-intensity-high": .init(categoryLabel: "맛의 강도와 균형", label: "강도가 높음"),
        "balance-center-clear": .init(categoryLabel: "맛의 강도와 균형", label: "중심이 또렷함"),
        "balance-aftertaste-light": .init(categoryLabel: "맛의 강도와 균형", label: "끝맛이 가벼움"),
        "balance-flavors-layered": .init(categoryLabel: "맛의 강도와 균형", label: "맛이 겹쳐짐"),
        "balance-edge-soft": .init(categoryLabel: "맛의 강도와 균형", label: "모서리가 부드러움"),
        "flow-first-clear": .init(categoryLabel: "입안의 흐름", label: "처음에 선명함"),
        "flow-middle-spreads": .init(categoryLabel: "입안의 흐름", label: "중반에 퍼짐"),
        "flow-deepens-late": .init(categoryLabel: "입안의 흐름", label: "뒤로 갈수록 깊어짐"),
        "flow-clean-finish": .init(categoryLabel: "입안의 흐름", label: "피니시가 깨끗함"),
        "flow-long-lasting": .init(categoryLabel: "입안의 흐름", label: "오래 남음"),
        "flow-quick-fade": .init(categoryLabel: "입안의 흐름", label: "빠르게 사라짐"),
        "flow-opens-next": .init(categoryLabel: "입안의 흐름", label: "다음 맛을 열어줌"),
        "flow-finish-piled": .init(categoryLabel: "입안의 흐름", label: "끝에 쌓임"),
        "flow-front-soft": .init(categoryLabel: "입안의 흐름", label: "앞맛이 부드러움"),
        "flow-middle-tight": .init(categoryLabel: "입안의 흐름", label: "중반이 조여짐"),
        "flow-rhythm-smooth": .init(categoryLabel: "입안의 흐름", label: "리듬이 매끄러움"),
        "flow-finish-quiet": .init(categoryLabel: "입안의 흐름", label: "마무리가 조용함"),
        "composition-connected": .init(categoryLabel: "조리와 구성 단서", label: "재료 간 연결이 좋음"),
        "composition-course-fit": .init(categoryLabel: "조리와 구성 단서", label: "구성감이 좋음"),
    ]

    static func mapCoreTasteLexiconSignals(_ input: TasteBuddyAgentDiningAnalysisInput) -> Mapping {
        if input.subject.contains("시트러스") || input.ingredients.contains("생선") {
            return seafoodMapping
        }

        if input.subject == "맑은 육수 코스" || input.id == "dish-onjium-clear-broth" {
            return diningBrothMapping
        }

        if input.dishKindTags.contains("broth") || input.subject.contains("육수") {
            return homeBrothMapping
        }

        return Mapping(
            candidates: [],
            confidence: 0.5,
            foodKnowledgeMatchIds: [],
            foodOnMatchIds: [],
            tbaSignalIds: input.dishKindTags.map { "dish-kind:\($0)" }
        )
    }

    private static let homeBrothMapping = Mapping(
        candidates: [
            candidate(id: "clear-umami", label: "맑은 감칠맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "broth-aroma", label: "육수 향", categoryLabel: "향 신호", detail: true),
            candidate(id: "broth-reduction", label: "육수 농축", categoryLabel: "조리 신호", detail: true),
            candidate(id: "soft-broth-body", label: "맑은 국물의 바디", categoryLabel: "질감 신호", detail: true),
            candidate(id: "deep-umami", label: "깊은 감칠맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "fat-acid-balance", label: "지방감과 산미 균형", categoryLabel: "구성 신호", colorTaste: "지방맛", taste: true, detail: true),
            candidate(id: "umami-salt-balance", label: "감칠맛과 간의 균형", categoryLabel: "구성 신호", detail: true),
            candidate(id: "fermented-umami", label: "발효 감칠맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
        ],
        confidence: 0.852,
        foodKnowledgeMatchIds: [],
        foodOnMatchIds: ["foodon-bridge:product:broth"],
        tbaSignalIds: [
            "dish-kind:broth", "process:broth", "lexicon:clear-umami",
            "lexicon:umami-salt-balance", "lexicon:deep-umami", "lexicon:soft-broth-body",
            "lexicon:fermented-umami", "lexicon:broth-reduction", "lexicon:broth-aroma",
            "lexicon:fat-acid-balance", "lexicon:crustacean-umami", "lexicon:bright-transition",
            "lexicon:pickled-brightness", "ingredient:white-fish", "ingredient:seaweed",
        ]
    )

    private static let diningBrothMapping = Mapping(
        candidates: [
            candidate(id: "clear-umami", label: "맑은 감칠맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "beef-fat-depth", label: "소고기 지방 깊이", categoryLabel: "미각 신호", colorTaste: "지방맛", taste: true),
            candidate(id: "meaty-aroma", label: "육향", categoryLabel: "향 신호", detail: true),
            candidate(id: "deep-umami", label: "깊은 감칠맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "broth-aroma", label: "육수 향", categoryLabel: "향 신호", detail: true),
            candidate(id: "broth-reduction", label: "육수 농축", categoryLabel: "조리 신호", detail: true),
            candidate(id: "soft-broth-body", label: "맑은 국물의 바디", categoryLabel: "질감 신호", detail: true),
            candidate(id: "umami-salt-balance", label: "감칠맛과 간의 균형", categoryLabel: "구성 신호", detail: true),
        ],
        confidence: 0.892,
        foodKnowledgeMatchIds: ["tba-food:foodon:foodon_03304941", "tba-food:foodon:foodon_03306567"],
        foodOnMatchIds: ["foodon-bridge:product:broth"],
        tbaSignalIds: [
            "dish-kind:broth", "process:broth", "lexicon:clear-umami", "ingredient:beef",
            "process:boiled", "lexicon:beef-fat-depth", "lexicon:meaty-aroma",
            "lexicon:deep-umami", "dish-kind:meat", "lexicon:umami-salt-balance",
            "lexicon:soft-broth-body", "lexicon:broth-reduction", "lexicon:broth-aroma",
            "intensity:clear", "lexicon:crustacean-umami", "lexicon:clean-finish",
            "lexicon:mineral-salinity",
        ]
    )

    private static let seafoodMapping = Mapping(
        candidates: [
            candidate(id: "white-fish-clean", label: "흰살 생선의 맑음", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "blue-fish-oil", label: "등푸른 생선 지방감", categoryLabel: "미각 신호", colorTaste: "지방맛", taste: true),
            candidate(id: "shellfish-sweetness", label: "조개류 단맛", categoryLabel: "미각 신호", colorTaste: "감칠맛", taste: true),
            candidate(id: "citrus-aroma", label: "시트러스 향", categoryLabel: "향 신호", detail: true),
            candidate(id: "emulsified-sauce", label: "유화 소스감", categoryLabel: "조리 신호", detail: true),
            candidate(id: "nutty-sweetness", label: "견과 단맛", categoryLabel: "미각 신호", colorTaste: "단맛", taste: true),
            candidate(id: "berry-acid-sweet", label: "베리 산미 단맛", categoryLabel: "미각 신호", colorTaste: "신맛", taste: true),
            candidate(id: "clean-sweetness", label: "깨끗한 단맛", categoryLabel: "미각 신호", colorTaste: "단맛", taste: true),
        ],
        confidence: 0.781,
        foodKnowledgeMatchIds: [],
        foodOnMatchIds: ["foodon-bridge:ingredient:white-fish", "foodon-bridge:ingredient:oily-fish"],
        tbaSignalIds: [
            "ingredient:white-fish", "lexicon:white-fish-clean", "ingredient:oily-fish",
            "lexicon:blue-fish-oil", "dish-kind:seafood", "lexicon:nutty-sweetness",
            "lexicon:berry-acid-sweet", "lexicon:clean-sweetness", "lexicon:citrus-aroma",
            "lexicon:emulsified-sauce", "lexicon:shellfish-sweetness", "intensity:clear",
        ]
    )

    private static func candidate(
        id: String,
        label: String,
        categoryLabel: String,
        colorTaste: String? = nil,
        taste: Bool = false,
        detail: Bool = false
    ) -> LexiconCandidate {
        LexiconCandidate(
            categoryLabel: categoryLabel,
            colorTaste: colorTaste,
            id: id,
            isDetailTag: detail,
            isTasteBubble: taste,
            label: label
        )
    }
}
