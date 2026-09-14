import Foundation

enum FoodMemoryFilter: String, CaseIterable, Identifiable {
    case all = "모든 기록", wholePositive = "음식 전체가 좋았던", partialPositive = "일부가 좋았던", uncertain = "미확인·불확실"
    var id: Self { self }
}

struct FoodMemoryDocument: Identifiable {
    let entry: DiningEntry
    let observations: [SensoryObservation]
    let unresolved: [SensoryUnresolved]
    let searchableFields: [String]
    let isGeneratedNote: Bool
    var id: UUID { entry.id }
    var wholeValues: Set<String> {
        let direct = entry.overallEvaluation?.parse().observations.map { $0.value.text } ?? []
        return Set(observations.filter { $0.kind == "overall_liking" }.map { $0.value.text } + direct)
    }
    var hasWholePositive: Bool { !wholeValues.isDisjoint(with: ["positive", "very_positive"]) }
    var hasPartialPositive: Bool { observations.contains { ["attribute_liking", "part_liking", "combination_liking"].contains($0.kind) && ["positive", "very_positive"].contains($0.value.text) } }
    var isUncertain: Bool {
        !isGeneratedNote && entry.note.range(of: "것 같|던 것|기억나지|기억이 안|모르겠|날짜.*기억", options: .regularExpression) != nil
    }
    var evaluationLabel: String {
        var labels: [String] = []
        if hasWholePositive { labels.append("음식 전체 긍정") }
        if !wholeValues.isDisjoint(with: ["negative", "very_negative"]) { labels.append("음식 전체 아쉬움") }
        if wholeValues.contains("neutral") { labels.append("음식 전체 중립") }
        if hasPartialPositive { labels.append("부분 긍정") }
        if observations.contains(where: { ["attribute_liking", "part_liking"].contains($0.kind) && $0.value == .text("negative") }) { labels.append("부분 아쉬움") }
        if observations.contains(where: { $0.kind == "attribute_liking" && $0.value == .text("neutral") }) { labels.append("부분 중립") }
        if isUncertain { labels.append("불확실한 회고") }
        if labels.isEmpty { labels.append("호감 미확인") }
        if !entry.hasCompletedTasteFeedback { labels.append("가볍게 저장 · 장기 분석 제외") }
        return labels.joined(separator: " · ")
    }
    func matches(_ filter: FoodMemoryFilter) -> Bool {
        switch filter {
        case .all: true
        case .wholePositive: hasWholePositive
        case .partialPositive: hasPartialPositive
        case .uncertain: isUncertain || (wholeValues.isEmpty && !hasPartialPositive)
        }
    }
    var excerpt: String {
        if !entry.note.isEmpty { return entry.note }
        if let overall = entry.overallEvaluation { return overall.questionLabelSnapshot + " → " + overall.responseLabelSnapshot }
        return entry.sensorySelections?.map { selection in
            [selection.labelSnapshot, selection.liking?.label, selection.intensity?.label, selection.preferenceFit?.label].compactMap { $0 }.joined(separator: " · ")
        }.joined(separator: " / ") ?? "작성한 회고·직접 응답이 없어요."
    }
    var recordedConditions: [String] {
        var seen = Set<String>()
        return observations.filter { ["sensory_intensity", "attribute_liking", "part_liking", "preference_fit"].contains($0.kind) }.compactMap { row in
            let value = ["positive": "좋았음", "negative": "아쉬움", "neutral": "중립", "strong": "강함", "medium": "중간", "weak": "약함", "just_right": "알맞음", "above_preferred": "과함", "below_preferred": "부족함"][row.value.text] ?? row.value.text
            let label = "\(row.attributeLabel) · \(value) · \(TastePerceptionEngine.targetLabel(row.target)) · \(TastePerceptionEngine.phaseLabel(row.phase))"
            return seen.insert(label).inserted ? label : nil
        }
    }
}

/// 현재 원본과 기존 분석에서 한 번 만든 읽기 전용 인덱스. 네트워크·영구 가설·원문 로그 없음.
struct FoodMemoryIndex {
    let generation: UUID
    let documents: [FoodMemoryDocument]
    let analysisReady: Bool
    static let empty = Self(generation: UUID(), documents: [], analysisReady: false)

    static func build(entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot, generation: UUID, analysisReady: Bool) -> Self {
        let observations = Dictionary(grouping: snapshot.observations, by: \.experienceID)
        let unresolved = Dictionary(grouping: snapshot.unresolved, by: \.experienceID)
        var seen: Set<UUID> = []
        var docs: [FoodMemoryDocument] = []
        for entry in entries where seen.insert(entry.id).inserted {
            let rows: [SensoryObservation] = observations[entry.id] ?? []
            let pending: [SensoryUnresolved] = unresolved[entry.id] ?? []
            var raw: [String] = [entry.restaurant, entry.menu, entry.restaurantID ?? "", entry.menuItemID ?? "", entry.note]
            if let choices = entry.sensorySelections {
                for choice in choices {
                    raw.append(contentsOf: [choice.labelSnapshot, choice.id, choice.liking?.label ?? "", choice.intensity?.label ?? "", choice.preferenceFit?.label ?? "", choice.target.label, choice.phase.label])
                }
            } else {
                raw.append(contentsOf: entry.tasteExperienceIDs.map { TasteExperienceCatalog.experienceByID[$0]?.label ?? $0 })
                raw.append(contentsOf: entry.detailTagIDs.map { DiningDetailTagCatalog.metadata(for: $0)?.label ?? $0 })
            }
            if let direct = entry.overallEvaluation { raw.append(contentsOf: [direct.questionLabelSnapshot, direct.responseLabelSnapshot]) }
            raw.append(contentsOf: rows.map(\.phrase))
            raw.append(contentsOf: pending.map(\.phrase))
            let generated = entry.note.hasPrefix("메인 미각 ") && entry.note.hasSuffix("으로 기억에 남은 식후 피드백입니다.")
            docs.append(FoodMemoryDocument(entry: entry, observations: rows, unresolved: pending, searchableFields: raw.map(normalize), isGeneratedNote: generated))
        }
        docs.sort { $0.entry.date == $1.entry.date ? $0.id.uuidString < $1.id.uuidString : $0.entry.date > $1.entry.date }
        return .init(generation: generation, documents: docs, analysisReady: analysisReady)
    }

    struct Result {
        let generation: UUID
        let searchedCount: Int
        let candidates: [FoodMemoryDocument]
        let matches: [FoodMemoryDocument]
        let appliedQuery: String
        let appliedFilter: FoodMemoryFilter
        let interpretation: String
    }
    /// 제한된 회상 문형만 해석한다. 다른 문장은 전체를 원문 검색으로 다룬다.
    func search(_ query: String, filter: FoodMemoryFilter = .all) -> Result {
        var term = query.trimmingCharacters(in: .whitespacesAndNewlines), applied = filter
        var interpretation = "메뉴·식당·회고·선택 문구에서 검색해요. 문장을 이해하지 못하면 음식 이름이나 원문 일부로 좁혀주세요."
        if let range = term.range(of: "^(?:전에 )?(?:좋았던|좋아했던|좋았다고 기록한)\\s+(.+?)(?:는 무엇이었고.*|은 무엇이었고.*|[은는]?$)", options: .regularExpression) {
            let phrase = String(term[range])
            if let regex = try? NSRegularExpression(pattern: "^(?:전에 )?(?:좋았던|좋아했던|좋았다고 기록한)\\s+(.+?)(?:는 무엇이었고.*|은 무엇이었고.*|[은는]?$)"),
               let match = regex.firstMatch(in: phrase, range: NSRange(phrase.startIndex..., in: phrase)),
               let foodRange = Range(match.range(at: 1), in: phrase) {
                term = String(phrase[foodRange]); applied = .wholePositive
                interpretation = "‘\(term)’의 음식 전체 긍정 기록을 먼저 보여요. 비교에서는 같은 검색 범위의 다른 반응도 함께 확인해요."
            }
        }
        let terms = Self.normalize(term).split(separator: " ").map { QueryToken(String($0)) }
        let candidates = documents.filter { doc in
            !Task.isCancelled && terms.allSatisfy { token in doc.searchableFields.contains { token.matches($0) } }
        }
        return .init(generation: generation, searchedCount: documents.count, candidates: candidates, matches: candidates.filter { $0.matches(applied) }, appliedQuery: term, appliedFilter: applied, interpretation: interpretation)
    }
    private static let whitespaceExpression = try? NSRegularExpression(pattern: "\\s+")
    static func normalize(_ text: String) -> String {
        guard !text.isEmpty else { return "" }
        let normalized = HomeSearchEngine.normalize(text)
        return whitespaceExpression?.stringByReplacingMatches(in: normalized, range: NSRange(normalized.startIndex..., in: normalized), withTemplate: " ") ?? normalized
    }
    private struct QueryToken {
        let variants: [String]
        let longestVariantBytes: Int
        let expression: NSRegularExpression?
        init(_ token: String) {
            let particles = ["으로는", "에서는", "에는", "으로", "에서", "까지", "부터", "처럼", "은", "는", "이", "가", "을", "를", "와", "과", "에", "도", "만"]
            var variants = [token]
            if let suffix = particles.first(where: { token.hasSuffix($0) && token.count - $0.count >= 2 }) {
                variants.append(String(token.dropLast(suffix.count)))
            }
            self.variants = variants
            longestVariantBytes = variants.map { $0.utf8.count }.max() ?? 0
            let choices = variants.map(NSRegularExpression.escapedPattern).joined(separator: "|")
            let suffixes = particles.joined(separator: "|")
            // 조사가 끝나는 경계도 확인한다. '파스타이탈리아'를 '파스타+이'로 자르지 않는다.
            expression = try? NSRegularExpression(pattern: "(?:^|[^가-힣a-z0-9])(?:" + choices + ")(?:" + suffixes + ")?(?=$|[^가-힣a-z0-9])")
        }
        func matches(_ field: String) -> Bool {
            if variants.contains(where: field.contains), expression?.firstMatch(in: field, range: NSRange(field.startIndex..., in: field)) != nil { return true }
            // 정규화된 공백은 한 칸이다. 토큰과 같아질 수 없는 긴 회고는
            // 띄어쓰기 없는 이름 비교를 위해 매 입력마다 복제하지 않는다.
            guard field.utf8.count <= longestVariantBytes * 2 else { return false }
            let compact = field.replacingOccurrences(of: " ", with: "")
            return variants.contains { compact == $0.replacingOccurrences(of: " ", with: "") }
        }
    }
    func related(to entryID: UUID) -> [UUID] {
        guard let source = documents.first(where: { $0.id == entryID }) else { return [] }
        let sourceSelections = Set(source.entry.sensorySelections?.map(\.id) ?? source.entry.tasteExperienceIDs + source.entry.detailTagIDs)
        return documents.filter { doc in
            doc.id == entryID || (source.entry.menuItemID != nil && source.entry.menuItemID == doc.entry.menuItemID)
                || Self.normalize(source.entry.menu) == Self.normalize(doc.entry.menu)
                || !sourceSelections.isDisjoint(with: doc.entry.sensorySelections?.map(\.id) ?? doc.entry.tasteExperienceIDs + doc.entry.detailTagIDs)
        }.map(\.id)
    }
}

struct FoodMemoryComparison {
    let documents: [FoodMemoryDocument]
    let mealCount: Int
    let unconfirmedCount: Int
    let unknownTimeCount: Int
    let sharedSelections: [String]
    let sharedAttributes: [String]
    let opposedAttributes: [String]
    let wholePositiveCount: Int
    let positiveSharedAttributes: [String]
    init(documents: [FoodMemoryDocument]) {
        self.documents = documents
        mealCount = Set(documents.map { $0.entry.mealID }).count
        unconfirmedCount = documents.filter { $0.wholeValues.isEmpty }.count
        unknownTimeCount = documents.filter { $0.entry.confirmedMealDate == nil }.count
        sharedSelections = Self.commonSelections(documents)
        sharedAttributes = Self.commonAttributes(documents)
        opposedAttributes = Self.opposedAttributes(documents)
        let positive = documents.filter(\.hasWholePositive)
        wholePositiveCount = positive.count
        positiveSharedAttributes = Self.commonAttributes(positive)
    }
    private static func commonSelections(_ documents: [FoodMemoryDocument]) -> [String] {
        let sets = documents.map { Set($0.entry.sensorySelections?.map(\.labelSnapshot) ?? ($0.entry.tasteExperienceIDs.map { TasteExperienceCatalog.experienceByID[$0]?.label ?? $0 } + $0.entry.detailTagIDs.map { DiningDetailTagCatalog.metadata(for: $0)?.label ?? $0 })) }
        guard let first = sets.first, sets.count > 1 else { return [] }
        return sets.dropFirst().reduce(first) { $0.intersection($1) }.sorted()
    }
    private static func commonAttributes(_ documents: [FoodMemoryDocument]) -> [String] {
        let sets = documents.map { Set($0.observations.filter { $0.kind == "sensory_presence" && $0.value == .flag(true) }.map(\.attributeLabel)) }
        guard let first = sets.first, sets.count > 1 else { return [] }
        return sets.dropFirst().reduce(first) { $0.intersection($1) }.sorted()
    }
    private static func opposedAttributes(_ documents: [FoodMemoryDocument]) -> [String] {
        Dictionary(grouping: documents.flatMap(\.observations).filter { $0.kind == "attribute_liking" }, by: \.attributeLabel).filter { _, rows in
            let values = Set(rows.map { $0.value.text }); return values.contains("positive") && values.contains("negative")
        }.keys.sorted()
    }
    var limits: [String] { [
        "공통으로 기록된 감각은 좋아한 원인이나 미래 선호 확률을 뜻하지 않아요.",
        "같은 이름도 같은 레시피인지는 알 수 없어요. 음식 분류는 저장된 분류이며 확인 출처가 없을 수 있어요.",
        "포만감·동행·기대는 회고 원문에서 비교해요. 검증된 조건 변수나 일반 법칙으로 바꾸지 않아요.",
        "확인한 식사일이 없는 \(unknownTimeCount)개는 실제 식사 시점의 변화 판정을 보류해요. 수정일은 새로운 식사일이 아니에요."
    ] }
}

enum FoodMemoryPrivacy {
    static func isPersonalQuery(_ query: String) -> Bool {
        query.range(of: "내가|내 기록|내 입맛|먹었던|먹었|좋았|좋아했던|싫었던|기록한|기록했|남겼|회고|그때|예전과|요즘", options: .regularExpression) != nil
    }
}
