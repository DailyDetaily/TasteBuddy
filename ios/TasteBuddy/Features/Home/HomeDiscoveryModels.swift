import Foundation
import CryptoKit

/// 발견은 현재 원본의 관계를 설명하는 표시 자료다. 감각 관측/질문 응답으로 저장하지 않는다.
struct HomeDiscoveryCard: Identifiable, Equatable {
    enum Kind: String, CaseIterable {
        case timeGap, repeatedMenu, restaurantCollection, repeatedGoodEvaluation, lastYear
        case commonPreference, preferredIntensity, conditionalContrast, patternException
        case overallContrast, revisitComparison, periodChange, familiarTasteInNewMenu

        var label: String {
            switch self {
            case .commonPreference: "공통 취향"
            case .preferredIntensity: "강도와 알맞음"
            case .conditionalContrast: "조건별 차이"
            case .patternException: "다른 한 번의 경험"
            case .overallContrast: "전체와 부분의 차이"
            case .revisitComparison: "두 기록 비교"
            case .periodChange: "기간별 평가 차이"
            case .familiarTasteInNewMenu: "새 메뉴와 익숙한 취향"
            case .timeGap, .lastYear: "기억 연결"
            case .repeatedGoodEvaluation: "반복된 만족"
            case .restaurantCollection, .repeatedMenu: "기록의 이정표"
            }
        }

        var priority: Int {
            switch self {
            case .conditionalContrast, .patternException, .periodChange: 0
            case .overallContrast, .revisitComparison: 1
            case .commonPreference, .preferredIntensity, .familiarTasteInNewMenu: 2
            case .repeatedGoodEvaluation: 3
            case .timeGap, .lastYear: 4
            case .restaurantCollection, .repeatedMenu: 5
            }
        }
    }

    let id: String
    let revisionKey: String
    let kind: Kind
    let subjectID: String
    let title: String
    let detail: String
    let explanation: String
    let entryIDs: Set<UUID>
    let evidenceIDs: Set<String>
    let sourceRevisions: [UUID: Int]
    let photoFilename: String?
    let sortDate: Date
    /// 원본 갱신과 사용자에게 새로 알려줄 의미를 분리한다. 문구·사진·revision은 의미 키에 넣지 않는다.
    var meaningKey: String = ""
    var relevance: Int = 0
    var evidenceSummary: String = ""
    var limitations: [String] = []
    var semanticKey: String { meaningKey.isEmpty ? id : meaningKey }

    static func digest(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

enum HomeDiscoveryEngine {
    static let version = "home-discovery/2"

    static func cards(entries: [DiningEntry], snapshot: SensoryAnalysisSnapshot,
                      referenceDate: Date = .now, calendar: Calendar = .current) -> [HomeDiscoveryCard] {
        cards(sources: HomeArchiveSources(entries: entries, snapshot: snapshot, referenceDate: referenceDate),
              referenceDate: referenceDate, calendar: calendar)
    }

    static func cards(sources: HomeArchiveSources, referenceDate: Date,
                      calendar: Calendar = .current) -> [HomeDiscoveryCard] {
        let today = calendar.startOfDay(for: referenceDate)
        let allMeals = Dictionary(grouping: sources.entries, by: \.mealID)
        let futureMeals = Set(allMeals.filter { _, rows in
            rows.contains { $0.confirmedMealDate.map { calendar.startOfDay(for: $0) > today } ?? false }
        }.keys)
        // 미래의 확인된 식사일은 행동 발견에도 넣지 않는다. 날짜 미확인은 시간 외 규칙에만 허용한다.
        let entries = sources.entries.filter { !futureMeals.contains($0.mealID) }
        guard !entries.isEmpty else { return [] }
        let currentIDs = Set(entries.map(\.id))
        let menus = sources.menus.mapValues { $0.filter { currentIDs.contains($0.id) } }.filter { !$0.value.isEmpty }
        let restaurants = sources.restaurants.mapValues { $0.filter { currentIDs.contains($0.id) } }.filter { !$0.value.isEmpty }
        let meals = Dictionary(grouping: entries, by: \.mealID)
        let dates = allMeals.compactMapValues { rows -> Date? in
            let values = Set(rows.compactMap(\.confirmedMealDate).map { calendar.startOfDay(for: $0) })
            guard values.count == 1, let date = values.first, date <= today else { return nil }
            return date
        }
        let evaluation = HomeArchiveVisualizationEngine.overall(entries: entries, observations: sources.observations)
        let directResponses = Dictionary(uniqueKeysWithValues: entries.compactMap { entry -> (UUID, String)? in
            guard entry.hasCompletedTasteFeedback, let overall = entry.overallEvaluation,
                  !overall.parse().observations.isEmpty else { return nil }
            return (entry.id, overall.responseValue.rawValue)
        })
        var responses: [UUID: String] = [:]
        for segment in evaluation.segments {
            for id in segment.entryIDs where directResponses[id] == segment.id { responses[id] = segment.id }
        }
        let goodResponses: Set<String> = [DiningOverallEvaluation.Response.liked.rawValue,
                                         DiningOverallEvaluation.Response.veryLiked.rawValue]
        let dateFormatter = DateFormatter()
        dateFormatter.calendar = calendar
        dateFormatter.timeZone = calendar.timeZone
        dateFormatter.locale = Locale(identifier: "ko_KR")
        dateFormatter.dateFormat = "yyyy.M.d"
        var candidates: [HomeDiscoveryCard] = []

        func add(_ kind: HomeDiscoveryCard.Kind, subject: String, title: String, detail: String,
                 explanation: String, rows: [DiningEntry], evidenceIDs: Set<String> = [], meaning: String = "initial") {
            guard !rows.isEmpty else { return }
            let ordered = rows.sorted {
                $0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt
            }
            let id = HomeDiscoveryCard.digest("\(version)|\(kind.rawValue)|\(subject)")
            let revisions = ordered.map { "\($0.id.uuidString):\($0.memoryRevisionNumber)" }.sorted()
            let revisionKey = HomeDiscoveryCard.digest(([id, title, detail] + revisions + evidenceIDs.sorted()).joined(separator: "|"))
            candidates.append(.init(
                id: id, revisionKey: revisionKey, kind: kind, subjectID: subject,
                title: title, detail: detail, explanation: explanation,
                entryIDs: Set(ordered.map(\.id)), evidenceIDs: evidenceIDs,
                sourceRevisions: Dictionary(uniqueKeysWithValues: ordered.map { ($0.id, $0.memoryRevisionNumber) }),
                photoFilename: ordered.compactMap(\.reflectionPhotoFilename).first,
                sortDate: ordered[0].observedAt,
                meaningKey: HomeDiscoveryCard.digest(id + "|" + meaning),
                relevance: kind == .repeatedGoodEvaluation ? 35 : 10,
                limitations: ["기록한 식사의 범위이며 실제 모든 식사나 고정된 취향을 뜻하지 않아요."]
            ))
        }

        for (identity, rows) in menus {
            guard let first = rows.first, !first.menu.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { continue }
            let subject = "menu:" + identity
            let menuMeals = Dictionary(grouping: rows, by: \.mealID)
            if menuMeals.count >= 3 {
                add(.repeatedMenu, subject: subject,
                    title: "\(first.menu)\n서로 다른 식사에서 \(menuMeals.count)번 기록",
                    detail: first.restaurant,
                    explanation: "같은 식당의 같은 메뉴를 기록한 식사를 한 번씩 셌어요. 한 식사에 여러 번 저장한 기록은 반복 횟수를 늘리지 않아요.",
                    rows: rows, meaning: "milestone:\(HomeDiscoveryRelations.milestone(menuMeals.count))")
            }

            var datedMeals: [(id: UUID, date: Date)] = []
            for mealID in menuMeals.keys {
                guard let date = dates[mealID] else { continue }
                datedMeals.append((id: mealID, date: date))
            }
            datedMeals.sort { lhs, rhs in
                if lhs.date == rhs.date {
                    return lhs.id.uuidString < rhs.id.uuidString
                }
                return lhs.date < rhs.date
            }
            if datedMeals.count >= 2 {
                let previous = datedMeals[datedMeals.count - 2], latest = datedMeals[datedMeals.count - 1]
                let gap = calendar.dateComponents([.day], from: previous.date, to: latest.date).day ?? 0
                let age = calendar.dateComponents([.day], from: latest.date, to: today).day ?? 0
                if gap >= 60, age >= 0, age <= 90 {
                    add(.timeGap, subject: subject,
                        title: "\(first.menu)\n두 식사 기록 사이 \(gap)일",
                        detail: "\(dateFormatter.string(from: previous.date)) · \(dateFormatter.string(from: latest.date))",
                        explanation: "같은 메뉴의 확인된 식사일 두 개를 비교했어요. 그 사이에 이 음식을 먹지 않았다는 뜻은 아니에요.",
                        rows: rows.filter { $0.mealID == previous.id || $0.mealID == latest.id })
                }
            }

            let ratedMeals = menuMeals.values.compactMap { meal -> Set<String>? in
                let values = Set(meal.compactMap { responses[$0.id] })
                return values.isEmpty ? nil : values
            }
            // 같은 메뉴/식사에 상반된 직접 평가가 있으면 그 식사를 좋은 평가로 단정하지 않는다.
            let goodMealCount = ratedMeals.filter { $0.isSubset(of: goodResponses) }.count
            if goodMealCount >= 3, Double(goodMealCount) / Double(ratedMeals.count) >= 0.75 {
                let ids = Set(rows.map(\.id))
                let evidenceIDs = Set(sources.observations.filter {
                    ids.contains($0.experienceID) && responses[$0.experienceID] != nil
                        && $0.selectionEvidence?.type == "overallEvaluation"
                }.map(\.id))
                add(.repeatedGoodEvaluation, subject: subject,
                    title: "\(first.menu)\n좋은 평가를 남긴 식사 \(goodMealCount)번",
                    detail: "\(first.restaurant) · 직접 평가가 있는 식사 \(ratedMeals.count)번",
                    explanation: "‘정말 좋았어요’ 또는 ‘좋았어요’로 직접 평가한 서로 다른 식사만 셌어요. 미응답과 별점은 사용하지 않고, 다른 평가와 미응답 기록도 아래에 함께 보여줘요.",
                    rows: rows, evidenceIDs: evidenceIDs,
                    meaning: "positive|counter:\(rows.filter { responses[$0.id].map { !goodResponses.contains($0) } ?? false }.map { $0.mealID.uuidString }.sorted().joined(separator: ","))")
            }
        }

        for (identity, rows) in restaurants {
            let named = rows.filter { HomeArchiveIdentity.hasMenu($0) }
            let menuCount = Set(named.map(HomeArchiveIdentity.menu)).count
            let mealCount = Set(named.map(\.mealID)).count
            guard menuCount >= 3, mealCount >= 2, let first = named.first,
                  !first.restaurant.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { continue }
            add(.restaurantCollection, subject: "restaurant:" + identity,
                title: "\(first.restaurant)\n\(menuCount)가지 메뉴가 쌓였어요",
                detail: "\(mealCount)번의 식사에 남긴 메뉴 기록",
                explanation: "이 식당에 연결된 서로 다른 메뉴를 셌어요. 메뉴 ID가 없을 때는 식당과 정규화한 메뉴명을 함께 구분해요.",
                rows: named, meaning: "milestone:\(HomeDiscoveryRelations.milestone(menuCount))")
        }

        if let anniversary = calendar.date(byAdding: .year, value: -1, to: today) {
            for (mealID, rows) in meals {
                guard let date = dates[mealID],
                      abs(calendar.dateComponents([.day], from: anniversary, to: date).day ?? Int.max) <= 7,
                      let first = rows.first else { continue }
                add(.lastYear, subject: "meal:" + mealID.uuidString,
                    title: "지난해 이맘때의 식사 기록",
                    detail: [dateFormatter.string(from: date), first.restaurant,
                             rows.count == 1 ? first.menu : "메뉴 기록 \(rows.count)개"].filter { !$0.isEmpty }.joined(separator: " · "),
                    explanation: "지난해 오늘 전후 7일에 해당하는, 식사일이 확인된 기록이에요.", rows: rows)
            }
        }
        let relations = HomeDiscoveryRelations.cards(sources: sources, referenceDate: referenceDate, calendar: calendar)
        // 같은 두 식사의 평가 비교가 있으면 간격만 다시 말하는 카드는 만들지 않는다.
        let comparedSubjects = Set(relations.filter { $0.kind == .revisitComparison }.map(\.subjectID))
        candidates.removeAll { $0.kind == .timeGap && comparedSubjects.contains($0.subjectID) }
        return HomeDiscoveryPresentationPolicy.ranked(candidates + relations, referenceDate: referenceDate)
    }
}

enum HomeDiscoveryPresentationPolicy {
    static let suppressionInterval: TimeInterval = 7 * 24 * 60 * 60
    static let subjectInterval: TimeInterval = 24 * 60 * 60

    static func ranked(_ candidates: [HomeDiscoveryCard], referenceDate: Date) -> [HomeDiscoveryCard] {
        func score(_ card: HomeDiscoveryCard) -> Int {
            let age = max(0, referenceDate.timeIntervalSince(card.sortDate)) / 86400
            return card.relevance + (age <= 14 ? 20 : age <= 90 ? 10 : 0)
        }
        return candidates.sorted {
            if score($0) != score($1) { return score($0) > score($1) }
            if $0.sortDate != $1.sortDate { return $0.sortDate > $1.sortDate }
            return $0.id < $1.id
        }
    }

    /// 열람은 의미 단위로 기억한다. 별도 관점은 24시간 뒤에 후보로 남는다.
    static func recordingRead(_ card: HomeDiscoveryCard, in history: [String: Date], at date: Date) -> [String: Date] {
        var result = history.filter { $0.value > date }
        result["read:" + card.semanticKey] = .distantFuture
        result["subject:" + card.subjectID] = date.addingTimeInterval(subjectInterval)
        return result
    }

    /// 명시적 숨김은 의미나 revision이 바뀌어도 같은 발견 ID에 대해 유지한다.
    static func snoozing(_ card: HomeDiscoveryCard, in history: [String: Date], at date: Date) -> [String: Date] {
        var result = history.filter { $0.value > date }
        result["snooze:" + card.id] = date.addingTimeInterval(suppressionInterval)
        return result
    }

    static func visible(_ candidates: [HomeDiscoveryCard], hiddenUntil: [String: Date],
                        referenceDate: Date, limit: Int = 12) -> [HomeDiscoveryCard] {
        guard limit > 0 else { return [] }
        let eligible = ranked(candidates, referenceDate: referenceDate).filter { card in
            [card.revisionKey, "read:" + card.semanticKey, "snooze:" + card.id, "subject:" + card.subjectID]
                .allSatisfy { (hiddenUntil[$0] ?? .distantPast) <= referenceDate }
        }
        var result: [HomeDiscoveryCard] = []
        var subjects = Set<String>(), kinds = Set<HomeDiscoveryCard.Kind>(), meanings = Set<String>()
        // 다른 대상/관점을 앞에 배치하되 같은 대상의 다른 관점을 큐에서 영구 탈락시키지 않는다.
        for pass in 0..<3 {
            for card in eligible where result.count < limit && !meanings.contains(card.semanticKey) {
                if pass < 2 && subjects.contains(card.subjectID) { continue }
                if pass == 0 && kinds.contains(card.kind) { continue }
                result.append(card)
                subjects.insert(card.subjectID)
                kinds.insert(card.kind)
                meanings.insert(card.semanticKey)
            }
        }
        return result
    }
}

/// 현재 직접 응답만으로 만드는 표시 계층. 개인 모델/원본에는 이 결과를 다시 저장하지 않는다.
private enum HomeDiscoveryRelations {
    static func milestone(_ count: Int) -> Int {
        [3, 5, 10, 20, 50, 100].last { count >= $0 } ?? 0
    }

    static func key(_ parts: [String]) -> String { PersonalTasteModelBuilder.json(parts) }
    static func uuid(_ value: String) -> UUID? { UUID(uuidString: value) }
    static func recordID(_ value: UUID) -> String { value.uuidString.lowercased() }

    struct Votes {
        let values: [String: String]
        init(_ units: [PersonalTasteUnit]) {
            values = Dictionary(grouping: units, by: \.mealID).mapValues { rows in
                let values = Set(rows.map(\.liking))
                return values.count == 1 ? values.first! : "mixed"
            }
        }
        var total: Int { values.count }
        func count(_ value: String) -> Int { values.values.filter { $0 == value }.count }
        var positiveShare: Double { total == 0 ? 0 : Double(count("positive")) / Double(total) }
        var summary: String {
            "호감 \(count("positive")) · 보통 \(count("neutral")) · 아쉬움 \(count("negative")) · 한 식사 내 다른 응답 \(count("mixed"))"
        }
        func repeatedDirection(minimum: Int) -> String? {
            guard total >= minimum else { return nil }
            for direction in ["positive", "negative"] {
                let support = count(direction)
                guard Double(support) / Double(total) >= 0.75 else { continue }
                // 한 식사를 빼도 유일한 최다 방향인지 확인한다. 통계적 유의성/예측 확률이 아니다.
                let stable = values.values.allSatisfy { removed in
                    let remaining = support - (removed == direction ? 1 : 0)
                    return ["positive", "neutral", "negative", "mixed"].filter { $0 != direction }.allSatisfy {
                        remaining > count($0) - (removed == $0 ? 1 : 0)
                    }
                }
                if stable { return direction }
            }
            return nil
        }
        func counterKey(to direction: String) -> String {
            values.filter { $0.value != direction && $0.value != "neutral" }.keys.sorted().joined(separator: ",")
        }
    }

    struct Evidence {
        let entries: [DiningEntry]
        let byID: [String: DiningEntry]
        let menus: [String: [DiningEntry]]
        let dates: [String: Date]
        let records: [PersonalTasteModelRecord]
        let units: [PersonalTasteUnit]
        let overall: [String: PersonalTasteModelRecord]
        let referenceDate: Date
        let calendar: Calendar
        let today: Date

        init(sources: HomeArchiveSources, referenceDate: Date, calendar: Calendar) {
            self.referenceDate = referenceDate; self.calendar = calendar
            today = calendar.startOfDay(for: referenceDate)
            let today = calendar.startOfDay(for: referenceDate)
            let allMeals = Dictionary(grouping: sources.entries, by: \.mealID)
            let future = Set(allMeals.filter { _, rows in
                rows.contains { $0.confirmedMealDate.map { calendar.startOfDay(for: $0) > today } ?? false }
            }.keys)
            entries = sources.entries.filter { !future.contains($0.mealID) }
            let entriesByID = Dictionary(uniqueKeysWithValues: entries.map { (recordID($0.id), $0) })
            byID = entriesByID
            menus = Dictionary(grouping: entries.filter(HomeArchiveIdentity.hasMenu), by: HomeArchiveIdentity.menu)
            dates = Dictionary(uniqueKeysWithValues: allMeals.compactMap { meal, rows -> (String, Date)? in
                let dates = Set(rows.compactMap(\.confirmedMealDate).map { calendar.startOfDay(for: $0) })
                guard dates.count == 1, let date = dates.first, date <= today,
                      !rows.contains(where: { ($0.mealTime?.confirmedAt ?? .distantPast) > referenceDate }) else { return nil }
                return (recordID(meal), date)
            })

            // 같은 revision 안에서도 현재 응답과 다른 관측을 채택하지 않는다.
            var atomsByEntry: [String: [SensoryRuleAtom]] = [:]
            for entry in entries where entry.hasCompletedTasteFeedback {
                var atoms = entry.overallEvaluation?.parse().observations ?? []
                if let catalog = SensoryAnalysisEngine.contract?.selectionCatalog {
                    atoms += DiningSensorySelectionParser.parse(
                        SensoryAnalysisEngine.effectiveSelections(for: entry, catalog: catalog), catalog: catalog
                    ).observations
                }
                atomsByEntry[recordID(entry.id)] = atoms
            }
            let direct = sources.observations.filter { observation in
                let id = recordID(observation.experienceID)
                guard let entry = entriesByID[id], entry.mealID == observation.independentMealID,
                      observation.selectionEvidence != nil else { return false }
                return (atomsByEntry[id] ?? []).contains { atom in
                    atom.kind == observation.kind && atom.attribute == observation.attribute
                        && atom.reference == observation.reference && atom.scale == observation.scale
                        && atom.value == observation.value && (atom.target ?? "whole_dish") == observation.target
                        && (atom.phase ?? "unspecified") == observation.phase
                        && atom.selectionEvidence == observation.selectionEvidence
                }
            }
            let records: [PersonalTasteModelRecord] = direct.map { observation in
                let entry = entriesByID[recordID(observation.experienceID)]!
                return .init(observationId: observation.id, userId: "home-discovery-owner",
                    experienceId: recordID(entry.id), mealId: recordID(entry.mealID), kind: observation.kind,
                    attribute: observation.attribute, attributeLabel: observation.attributeLabel,
                    reference: observation.reference, value: observation.value, scale: observation.scale,
                    target: observation.target, phase: observation.phase,
                    observedAt: observation.observedAt.map(PersonalTasteModelBuilder.timestamp),
                    knownAt: observation.knownAt.map(PersonalTasteModelBuilder.timestamp),
                    dishKindIDs: entry.dishKindIDs, phrase: observation.phrase, sourceSpans: observation.sourceSpans,
                    confirmationStatus: "explicit_user_choice", selectionEvidence: observation.selectionEvidence)
            }.sorted { $0.observationId < $1.observationId }
            self.records = records
            // 기존 모델의 식사별 병합/부재 응답/척도 검증을 재사용하되 질문 영향 재계산은 하지 않는다.
            units = PersonalTasteModelBuilder.buildRecords(records: records, userID: "home-discovery-owner",
                assessQuestions: false).units
            overall = Dictionary(grouping: records.filter {
                $0.kind == "overall_liking" && $0.scale == "overall-five-category-v1"
                    && $0.selectionEvidence?.type == "overallEvaluation"
            }, by: \.experienceId).compactMapValues { rows in
                Set(rows.map { $0.value.text }).count == 1 ? rows.first : nil
            }
        }

        func context(_ unit: PersonalTasteUnit) -> String {
            key([unit.attribute, unit.reference ?? "", unit.target, unit.phase])
        }
        func context(_ record: PersonalTasteModelRecord) -> String {
            key([record.attribute ?? "", record.reference ?? "", record.target, record.phase])
        }
        func scopeLabel(_ unit: PersonalTasteUnit) -> String {
            scopeLabel(target: unit.target, phase: unit.phase)
        }
        func scopeLabel(target: String, phase: String) -> String {
            let targetLabel = target == "unspecified" ? "대상 미지정" : DiningSensorySelection.Target(rawValue: target).label
            let phaseLabel = phase == "unspecified" ? "시점 미지정" : DiningSensorySelection.Phase(rawValue: phase).label
            return targetLabel + " · " + phaseLabel
        }
        func menuKeys(_ unit: PersonalTasteUnit) -> Set<String> {
            Set(unit.experienceIDs.compactMap { byID[$0] }.filter(HomeArchiveIdentity.hasMenu).map(HomeArchiveIdentity.menu))
        }
        func namedMenu(_ identity: String) -> String {
            guard let entry = menus[identity]?.first else { return "메뉴" }
            return [entry.restaurant, entry.menu].filter { !$0.isEmpty }.joined(separator: " · ")
        }
        func rows(_ units: [PersonalTasteUnit]) -> [DiningEntry] {
            Set(units.flatMap(\.experienceIDs)).sorted().compactMap { byID[$0] }
        }
        func dateText(_ date: Date) -> String {
            let formatter = DateFormatter()
            formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
            formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "yyyy.M.d"
            return formatter.string(from: date)
        }
        func recently(_ date: Date) -> Bool {
            let age = calendar.dateComponents([.day], from: date, to: today).day ?? Int.max
            return (0...90).contains(age)
        }
    }

    struct Builder {
        let evidence: Evidence
        var candidates: [HomeDiscoveryCard] = []

        mutating func add(_ kind: HomeDiscoveryCard.Kind, subject: String, scope: String, title: String,
                          detail: String, explanation: String, rows: [DiningEntry], evidenceIDs: Set<String>,
                          meaning: String, strength: Int, summary: String, limits: [String] = []) {
            let unique = Dictionary(rows.map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
            let ordered = unique.values.sorted {
                if $0.observedAt != $1.observedAt { return $0.observedAt > $1.observedAt }
                return $0.id.uuidString < $1.id.uuidString
            }
            guard !ordered.isEmpty, !evidenceIDs.isEmpty else { return }
            let id = HomeDiscoveryCard.digest(key([HomeDiscoveryEngine.version, kind.rawValue, subject, scope]))
            let sourceKeys = ordered.map { "\($0.id):\($0.memoryRevisionNumber):\($0.reflectionPhotoFilename ?? "")" }.sorted()
            let revision = HomeDiscoveryCard.digest(key([id, title, detail, explanation, summary] + sourceKeys + evidenceIDs.sorted()))
            candidates.append(.init(id: id, revisionKey: revision, kind: kind, subjectID: subject,
                title: title, detail: detail, explanation: explanation, entryIDs: Set(ordered.map(\.id)),
                evidenceIDs: evidenceIDs,
                sourceRevisions: Dictionary(uniqueKeysWithValues: ordered.map { ($0.id, $0.memoryRevisionNumber) }),
                photoFilename: ordered.compactMap(\.reflectionPhotoFilename).first,
                sortDate: ordered.map { evidence.dates[recordID($0.mealID)] ?? $0.observedAt }.max()!,
                meaningKey: HomeDiscoveryCard.digest(key([id, meaning])), relevance: strength,
                evidenceSummary: summary,
                limitations: limits + ["기록하고 직접 평가한 범위만 설명해요. 미응답은 호감·중립·불호로 바꾸지 않아요.",
                    "식사별 반복을 센 초기 표시 정책이며 통계적 유의성이나 미래 예측 확률이 아니에요."]))
        }

        mutating func sensoryRelations() {
            let groups = Dictionary(grouping: evidence.units, by: evidence.context)
            for scope in groups.keys.sorted() {
                guard !Task.isCancelled else { return }
                let units = groups[scope]!, first = units[0], votes = Votes(units)
                let subject = "sense:" + key([first.attribute, first.reference ?? ""])
                let menuKeys = units.reduce(into: Set<String>()) { $0.formUnion(evidence.menuKeys($1)) }
                let positiveUnits = units.filter { votes.values[$0.mealID] == "positive" }
                let positiveMenus = positiveUnits.reduce(into: Set<String>()) { $0.formUnion(evidence.menuKeys($1)) }
                if votes.total >= 3, votes.count("positive") >= 3, votes.positiveShare >= 0.75, positiveMenus.count >= 2 {
                    let rows = menuKeys.sorted().flatMap { evidence.menus[$0] ?? [] }
                    add(.commonPreference, subject: subject, scope: scope,
                        title: "메뉴는 달라도\n\(first.label)에 호감을 남겼어요",
                        detail: "직접 평가한 식사 \(votes.total)번 중 호감 \(votes.count("positive"))번 · 호감 메뉴 \(positiveMenus.count)가지",
                        explanation: "\(evidence.scopeLabel(first)) 범위에서 감각 자체에 남긴 직접 호감을 식사별로 묶었어요. 감각 태그의 등장이나 음식 전체 평가로 호감을 추정하지 않아요.",
                        rows: rows, evidenceIDs: Set(units.flatMap(\.evidenceIDs)),
                        meaning: "positive|counter:" + votes.counterKey(to: "positive"),
                        strength: 55 + min(votes.count("positive"), 10), summary: votes.summary)
                }
                conditionalContrast(units, scope: scope, subject: subject)
                exception(units, scope: scope, subject: subject)
                familiarMenu(units, scope: scope)
            }
        }

        mutating func conditionalContrast(_ units: [PersonalTasteUnit], scope: String, subject: String) {
            var byMenu: [String: [PersonalTasteUnit]] = [:]
            for unit in units {
                for menu in evidence.menuKeys(unit) { byMenu[menu, default: []].append(unit) }
            }
            let keys = byMenu.keys.filter { Votes(byMenu[$0]!).total >= 3 }.sorted()
            guard keys.count >= 2 else { return }
            for i in keys.indices {
                for j in keys.indices where j > i {
                    let a = byMenu[keys[i]]!, b = byMenu[keys[j]]!
                    let shared = Set(a.map(\.mealID)).intersection(b.map(\.mealID))
                    let left = a.filter { !shared.contains($0.mealID) }, right = b.filter { !shared.contains($0.mealID) }
                    let x = Votes(left), y = Votes(right)
                    guard let dx = x.repeatedDirection(minimum: 3), let dy = y.repeatedDirection(minimum: 3), dx != dy else { continue }
                    let first = units[0]
                    add(.conditionalContrast, subject: subject, scope: key([scope, keys[i], keys[j]]),
                        title: "같은 \(first.label)에도\n메뉴별로 다른 평가를 남겼어요",
                        detail: "\(evidence.namedMenu(keys[i])): \(directionLabel(dx)) \(x.count(dx))/\(x.total)번\n\(evidence.namedMenu(keys[j])): \(directionLabel(dy)) \(y.count(dy))/\(y.total)번",
                        explanation: "\(evidence.scopeLabel(first))에서 서로 다른 메뉴의 직접 평가를 비교했어요. 각 메뉴에 식사 3번 이상, 같은 방향 75% 이상이며 식사 하나를 제외해도 방향이 유지되는 후보예요.",
                        rows: evidence.rows(a + b), evidenceIDs: Set((a + b).flatMap(\.evidenceIDs)),
                        meaning: key([dx, dy, x.counterKey(to: dx), y.counterKey(to: dy)]),
                        strength: 68 + min(x.total + y.total, 12), summary: "왼쪽: \(x.summary)\n오른쪽: \(y.summary)",
                        limits: ["양쪽 메뉴를 함께 기록한 식사 \(shared.count)번은 독립 집단 비교에서 제외했어요.",
                            "강도·조리 상태 등 다른 조건도 달랐을 수 있어요. 메뉴가 평가 차이의 원인이라는 뜻은 아니에요."])
                }
            }
        }

        mutating func exception(_ units: [PersonalTasteUnit], scope: String, subject: String) {
            let dated = units.filter { evidence.dates[$0.mealID] != nil }
            guard let latestDate = dated.compactMap({ evidence.dates[$0.mealID] }).max(), evidence.recently(latestDate) else { return }
            let latest = dated.filter { evidence.dates[$0.mealID] == latestDate }
            let current = Votes(latest)
            guard current.total == 1, let currentDirection = current.values.values.first,
                  ["positive", "negative"].contains(currentDirection) else { return }
            let previous = dated.filter { evidence.dates[$0.mealID]! < latestDate }, baseline = Votes(previous)
            guard let direction = baseline.repeatedDirection(minimum: 4), direction != currentDirection else { return }
            let first = latest[0]
            add(.patternException, subject: subject, scope: scope,
                title: "최근 식사의 \(first.label),\n앞선 기록과 다른 반응이었어요",
                detail: "앞선 \(baseline.total)번 중 \(directionLabel(direction)) \(baseline.count(direction))번 · 최근 식사: \(directionLabel(currentDirection))",
                explanation: "\(evidence.scopeLabel(first))에서 확인된 식사일을 기준으로 이전 기록과 가장 최근 한 식사를 분리했어요. 최근 식사는 이전 경향 계산에 넣지 않았어요.",
                rows: evidence.rows(units), evidenceIDs: Set(dated.flatMap(\.evidenceIDs)),
                meaning: key([direction, currentDirection] + current.values.keys.sorted()),
                strength: 75, summary: "이전: \(baseline.summary)\n최근: \(current.summary)",
                limits: ["한 번의 다른 경험이며 취향 변화나 새로운 반복 취향의 확정이 아니에요.",
                    "현재 유효한 원본으로 과거 식사를 비교했어요. 당시 알고 있던 모델 상태를 복원한 것은 아니에요.",
                    "식사일 미확인 근거는 선후 비교에서 제외했어요. 음식·강도 등 다른 조건도 달랐을 수 있어요."])
        }

        mutating func familiarMenu(_ units: [PersonalTasteUnit], scope: String) {
            let allVotes = Votes(units)
            // 호감만 먼저 고르면 과거 반례가 분모에서 사라진다. 이전의 모든 유효 응답을 남긴다.
            let dated = units.filter { evidence.dates[$0.mealID] != nil }
            guard let latestDate = dated.compactMap({ evidence.dates[$0.mealID] }).max(), evidence.recently(latestDate) else { return }
            let latest = dated.filter { evidence.dates[$0.mealID] == latestDate && allVotes.values[$0.mealID] == "positive" }
            var seenMenus = Set<String>()
            for unit in latest {
                for entry in evidence.rows([unit]) where HomeArchiveIdentity.hasMenu(entry) {
                    let menu = HomeArchiveIdentity.menu(entry), meal = recordID(entry.mealID)
                    guard seenMenus.insert(menu).inserted, let overall = evidence.overall[recordID(entry.id)],
                          ["positive", "very_positive"].contains(overall.value.text),
                          let menuRows = evidence.menus[menu],
                          menuRows.allSatisfy({ evidence.dates[recordID($0.mealID)] != nil }),
                          menuRows.compactMap({ evidence.dates[recordID($0.mealID)] }).min() == latestDate,
                          Set(menuRows.filter { evidence.dates[recordID($0.mealID)] == latestDate }.map(\.mealID)) == [entry.mealID]
                    else { continue }
                    let prior = dated.filter { evidence.dates[$0.mealID]! < latestDate && !evidence.menuKeys($0).contains(menu) }
                    let priorVotes = Votes(prior)
                    guard priorVotes.count("positive") >= 3, priorVotes.positiveShare >= 0.75 else { continue }
                    let rows = evidence.rows(prior) + [entry]
                    add(.familiarTasteInNewMenu, subject: "menu:" + menu, scope: scope,
                        title: "\(entry.menu)에서도\n익숙한 \(unit.label) 취향을 만났어요",
                        detail: "처음 기록한 메뉴 · 이전 다른 메뉴의 평가 \(priorVotes.total)번 중 호감 \(priorVotes.count("positive"))번",
                        explanation: "이번 메뉴의 전체 평가와 \(unit.label) 자체의 평가가 모두 긍정이에요. 이전 다른 메뉴의 같은 대상·시점 범위에서도 감각 자체에 호감을 남겼어요.",
                        rows: rows, evidenceIDs: Set((prior + [unit]).flatMap(\.evidenceIDs) + [overall.observationId]),
                        meaning: key([meal, priorVotes.counterKey(to: "positive")]), strength: 65,
                        summary: "\(evidence.scopeLabel(unit))\n이전: \(priorVotes.summary)\n이번: 직접 호감 1번",
                        limits: ["아카이브에서 확인 가능한 첫 기록이며 처음 먹은 음식이라는 뜻은 아니에요.",
                            "이 감각 때문에 음식 전체가 좋았다는 인과 해석은 하지 않아요."])
                }
            }
        }

        mutating func fitRelations() {
            let sensory = evidence.records.filter { $0.attribute != nil }
            let groups = Dictionary(grouping: sensory) { record in
                key([evidence.context(record), evidence.byID[record.experienceId].map(HomeArchiveIdentity.menu) ?? ""])
            }
            for scope in groups.keys.sorted() {
                let records = groups[scope]!
                guard let first = records.first(where: { $0.kind == "preference_fit" }),
                      let entry = evidence.byID[first.experienceId], HomeArchiveIdentity.hasMenu(entry) else { continue }
                let patterns = PersonalTasteModelBuilder.buildFitPatterns(records, userID: "home-discovery-owner", policy: .init())
                    .filter { $0.conditions.count == 1 && $0.conditions[0].dimension == "intensity" && $0.status == "repeated_fit" }
                    .sorted { $0.conditions[0].value < $1.conditions[0].value }
                guard !patterns.isEmpty else { continue }
                let preferred = patterns.first { $0.repeatedValue == "just_right" } ?? patterns[0]
                let comparison = patterns.first { other in
                    other.id != preferred.id && other.repeatedValue != preferred.repeatedValue
                        && Set(other.mealIDs).isDisjoint(with: preferred.mealIDs)
                }
                // 과함/부족함만 반복된 경우도 그대로 표시하며 알맞았다고 바꿔 말하지 않는다.
                let selected = [preferred] + [comparison].compactMap { $0 }
                let detail = selected.map { "\(intensityLabel($0.conditions[0].value)): \(fitLabel($0.repeatedValue ?? "")) \($0.distribution.mealCount)번" }.joined(separator: "\n")
                let directIDs = Set(records.map(\.observationId))
                let rows = Set(records.map(\.experienceId)).sorted().compactMap { evidence.byID[$0] }
                add(.preferredIntensity, subject: "sense:" + key([first.attribute!, first.reference ?? ""]), scope: scope,
                    title: "\(entry.menu)의 \(PersonalTasteModelBuilder.label(first))\n" + (preferred.repeatedValue == "just_right"
                        ? "알맞았던 강도가 보여요" : "이 강도는 ‘\(fitLabel(preferred.repeatedValue ?? ""))’으로 남겼어요"),
                    detail: detail,
                    explanation: "\(evidence.scopeLabel(target: first.target, phase: first.phase))에서 같은 선택의 강도와 알맞음만 연결했어요. 선택한 각 강도에서 같은 응답이 서로 다른 식사 3번 이상 반복됐어요.",
                    rows: rows, evidenceIDs: directIDs,
                    meaning: key(selected.map { $0.conditions[0].value + ":" + ($0.repeatedValue ?? "") }),
                    strength: comparison == nil ? 50 : 68, summary: detail,
                    limits: ["알맞음·과함·부족함은 호감과 별개예요. 물리적인 최적 강도나 음식 자체의 호불호로 해석하지 않아요.",
                        "비교 강도는 겹치지 않는 식사로 구성했으며, 응답이 다른 다른 강도의 기록도 아래 원본에 남겨요."])
            }
        }

        mutating func overallRelations() {
            let groups = Dictionary(grouping: evidence.records.filter { $0.kind == "attribute_liking" }, by: evidence.context)
            for scope in groups.keys.sorted() {
                let individual = groups[scope]!, first = individual[0]
                let experienceIDs = Set(individual.map(\.experienceId))
                let linked = evidence.records.filter {
                    experienceIDs.contains($0.experienceId) && $0.kind == "overall_liking"
                }
                // 기존 교차 모델이 동일 experience + meal을 연결하고 한 식사 내 다른 쌍은 mixed로 남긴다.
                let patterns = PersonalTasteModelBuilder.buildOverallPatterns(individual + linked, userID: "home-discovery-owner")
                guard let pattern = patterns.first(where: { $0.conditions.isEmpty }) else { continue }
                let interesting = pattern.cells.filter {
                    (["positive", "very_positive"].contains($0.overallValue) && $0.attributeValue == "negative")
                        || (["negative", "very_negative"].contains($0.overallValue) && $0.attributeValue == "positive")
                }.sorted {
                    if $0.mealIDs.count != $1.mealIDs.count { return $0.mealIDs.count > $1.mealIDs.count }
                    return key([$0.overallValue, $0.attributeValue]) < key([$1.overallValue, $1.attributeValue])
                }
                guard let cell = interesting.first else { continue }
                let count = cell.mealIDs.count
                add(.overallContrast, subject: "sense:" + key([first.attribute ?? "", first.reference ?? ""]), scope: scope,
                    title: "\(PersonalTasteModelBuilder.label(first))에는 ‘\(directionLabel(cell.attributeValue))’\n음식 전체에는 ‘\(overallLabel(cell.overallValue))’",
                    detail: "두 평가가 있는 식사 \(pattern.mealIDs.count)번 중 이 조합 \(count)번 · \(count >= 3 ? "반복 관찰" : "개별 경험")",
                    explanation: "\(evidence.scopeLabel(target: first.target, phase: first.phase))의 감각 평가와 같은 음식 경험의 전체 평가만 짝지었어요. 다른 메뉴의 평가를 서로 붙이지 않아요.",
                    rows: experienceIDs.sorted().compactMap { evidence.byID[$0] }, evidenceIDs: Set(pattern.evidenceIDs),
                    meaning: key([cell.overallValue, cell.attributeValue, count >= 3 ? "repeated" : "example"]),
                    strength: count >= 3 ? 73 : 42,
                    summary: "\(pattern.cells.map { "전체 \(overallLabel($0.overallValue)) / 감각 \(directionLabel($0.attributeValue)): \($0.mealIDs.count)번" }.joined(separator: "\n"))\n한 식사 내 서로 다른 평가 쌍: \(pattern.mixedMealIDs.count)번",
                    limits: ["두 평가가 함께 있었다는 뜻이며 다른 감각이 아쉬움을 보완했다는 원인 해석은 아니에요.",
                        "3회 미만은 반복 취향이 아니라 개별 경험으로 표시해요."])
            }
        }

        mutating func revisitRelations() {
            for identity in evidence.menus.keys.sorted() {
                let rows = evidence.menus[identity]!
                let meals = Dictionary(grouping: rows, by: { recordID($0.mealID) })
                let dated = meals.keys.compactMap { id -> (String, Date)? in evidence.dates[id].map { (id, $0) } }
                    .sorted { $0.1 == $1.1 ? $0.0 < $1.0 : $0.1 < $1.1 }
                guard dated.count >= 2 else { continue }
                let previous = dated[dated.count - 2], latest = dated[dated.count - 1]
                guard previous.1 < latest.1, evidence.recently(latest.1) else { continue }
                func response(_ id: String) -> String? {
                    let values = Set((meals[id] ?? []).compactMap { evidence.overall[recordID($0.id)]?.value.text })
                    return values.count == 1 ? values.first : nil
                }
                guard let a = response(previous.0), let b = response(latest.0), a != b else { continue }
                let selected = (meals[previous.0] ?? []) + (meals[latest.0] ?? [])
                let ids = Set(selected.compactMap { evidence.overall[recordID($0.id)]?.observationId })
                add(.revisitComparison, subject: "menu:" + identity, scope: "overall",
                    title: "\(rows[0].menu)\n두 식사의 평가는 달랐어요",
                    detail: "\(evidence.dateText(previous.1)): \(overallLabel(a))\n\(evidence.dateText(latest.1)): \(overallLabel(b))",
                    explanation: "같은 식당의 같은 메뉴에 남긴 최근 두 식사의 직접 전체 평가를 비교했어요. 두 기록은 확인된 서로 다른 식사일에 해당해요.",
                    rows: selected, evidenceIDs: ids, meaning: key([previous.0, latest.0, a, b]),
                    strength: 63, summary: "직접 전체 평가가 있는 식사 2번",
                    limits: ["두 기록의 차이이며 메뉴 품질이나 입맛이 변했다는 확정이 아니에요."])
            }
        }

        mutating func periodRelations() {
            guard let recentStart = evidence.calendar.date(byAdding: .day, value: -89, to: evidence.today),
                  let previousStart = evidence.calendar.date(byAdding: .day, value: -90, to: recentStart) else { return }
            var groups: [String: [PersonalTasteUnit]] = [:]
            var menus: [String: String] = [:]
            for unit in evidence.units where !unit.intensityConflict {
                for menu in evidence.menuKeys(unit) {
                    let scope = key([menu, evidence.context(unit), unit.intensity ?? "unspecified"])
                    groups[scope, default: []].append(unit); menus[scope] = menu
                }
            }
            for scope in groups.keys.sorted() {
                let units = groups[scope]!, first = units[0]
                let previous = units.filter { evidence.dates[$0.mealID].map { $0 >= previousStart && $0 < recentStart } ?? false }
                let recent = units.filter { evidence.dates[$0.mealID].map { $0 >= recentStart && $0 <= evidence.today } ?? false }
                let a = Votes(previous), b = Votes(recent)
                guard a.total >= 5, b.total >= 5,
                      Set(previous.compactMap { evidence.dates[$0.mealID] }).count >= 2,
                      Set(recent.compactMap { evidence.dates[$0.mealID] }).count >= 2 else { continue }
                let delta = b.positiveShare - a.positiveShare
                guard abs(delta) >= 0.4 - 0.000001 else { continue }
                let stableA = a.values.values.allSatisfy { removed in
                    let share = Double(a.count("positive") - (removed == "positive" ? 1 : 0)) / Double(a.total - 1)
                    return (b.positiveShare - share) * delta > 0
                }
                let stableB = b.values.values.allSatisfy { removed in
                    let share = Double(b.count("positive") - (removed == "positive" ? 1 : 0)) / Double(b.total - 1)
                    return (share - a.positiveShare) * delta > 0
                }
                guard stableA && stableB, let menu = menus[scope] else { continue }
                let selected = previous + recent
                add(.periodChange, subject: "menu:" + menu, scope: scope,
                    title: "\(evidence.menus[menu]?.first?.menu ?? "같은 메뉴")의 \(first.label)\n두 기간의 긍정 평가가 달랐어요",
                    detail: "이전 90일: 호감 \(a.count("positive"))/\(a.total)번\n최근 90일: 호감 \(b.count("positive"))/\(b.total)번",
                    explanation: "같은 식당·메뉴·감각·대상·시점·기록된 강도 범위에서 비교했어요. 이전 기간은 \(evidence.dateText(previousStart))부터 최근 기간 시작 전까지, 최근 기간은 \(evidence.dateText(recentStart))부터 \(evidence.dateText(evidence.today))까지예요. 각 5회 이상, 40퍼센트포인트 이상 차이가 있고 식사 하나를 제외해도 차이의 방향이 유지돼요.",
                    rows: evidence.rows(units), evidenceIDs: Set(selected.flatMap(\.evidenceIDs)),
                    meaning: delta > 0 ? "positive-increase" : "positive-decrease", strength: 78,
                    summary: "\(evidence.scopeLabel(first)) · 강도 \(intensityLabel(first.intensity ?? "unspecified"))\n이전: \(a.summary)\n최근: \(b.summary)",
                    limits: ["확인된 식사일만 사용했어요. 날짜 미확인·기간 밖 기록은 분모에서 제외하고 원본에는 남겨요.",
                        "서로 다른 메뉴 구성을 합쳐 전체 입맛의 변화로 해석하지 않아요. 알려지지 않은 조리 상태 등은 다를 수 있어요.",
                        "현재 수정본의 비교이며 당시 알고 있던 응답 상태의 완전한 재현은 아니에요."])
            }
        }

        private func directionLabel(_ value: String) -> String {
            ["positive": "좋았어요", "negative": "아쉬웠어요", "neutral": "보통이에요"][value] ?? "다른 응답"
        }
        private func overallLabel(_ value: String) -> String {
            ["very_positive": "정말 좋았어요", "positive": "좋았어요", "neutral": "보통이에요",
             "negative": "아쉬웠어요", "very_negative": "많이 아쉬웠어요"][value] ?? "응답 미확인"
        }
        private func intensityLabel(_ value: String) -> String {
            ["weak": "약한 강도", "medium": "중간 강도", "strong": "강한 강도"][value] ?? "미지정"
        }
        private func fitLabel(_ value: String) -> String {
            ["below_preferred": "부족함", "just_right": "알맞음", "above_preferred": "과함"][value] ?? "미확인"
        }
    }

    static func cards(sources: HomeArchiveSources, referenceDate: Date, calendar: Calendar) -> [HomeDiscoveryCard] {
        var builder = Builder(evidence: Evidence(sources: sources, referenceDate: referenceDate, calendar: calendar))
        builder.sensoryRelations()
        builder.fitRelations()
        builder.overallRelations()
        builder.revisitRelations()
        builder.periodRelations()
        return builder.candidates
    }
}

enum HomeJournalStackItem: Identifiable {
    case question(PersonalTasteNextSelection)
    case discovery(HomeDiscoveryCard)

    var id: String {
        switch self {
        case .question(let question): "question:" + question.id
        case .discovery(let card): "discovery:" + card.revisionKey
        }
    }

    /// 새 발견이 앞면, 다음은 답할 질문. 한 종류가 없으면 다른 종류만 유지한다.
    static func merged(questions: [PersonalTasteNextSelection], discoveries: [HomeDiscoveryCard]) -> [Self] {
        var result: [Self] = []
        for index in 0..<max(questions.count, discoveries.count) {
            if index < discoveries.count { result.append(.discovery(discoveries[index])) }
            if index < questions.count { result.append(.question(questions[index])) }
        }
        return result
    }

    /// 홈의 작은 묶음에는 같은 대상을 한 번만. 다른 관점은 전체보기와 다음 방문에 남긴다.
    static func preview(_ items: [Self], limit: Int) -> [Self] {
        guard limit > 0 else { return [] }
        var subjects = Set<String>(), result: [Self] = []
        for item in items {
            if case .discovery(let card) = item, !subjects.insert(card.subjectID).inserted { continue }
            result.append(item)
            if result.count == limit { break }
        }
        return result
    }
}
