import Foundation

extension HomeDiscoveryEngine {
    /// The existing policy remains the sole decision maker for preference/condition findings.
    /// New relations below share its candidate, identity, evidence and read/snooze contracts.
    static func gastronomyCards(input: TDNativeInput, state: TDState, calendar: Calendar) -> [HomeDiscoveryCard] {
        let allSources = HomeArchiveSources(validated: input, state: state)
        let periodSources = HomeArchiveSources(validated: input, state: state, selectedOnly: true)
        let comparison = state.window.isAll ? TDWindow.recent(90, now: state.now, calendar: calendar) : state.window
        let comparisonScope = TDDiscoveryScope.comparison(comparison.previous(calendar: calendar), comparison)
        let scoped: TDDiscoveryScope = state.window.isAll && state.sourceFilter == .all ? .wholeArchive : .selectedPeriod(state.window)
        var candidates: [HomeDiscoveryCard] = []
        let temporal: Set<HomeDiscoveryCard.Kind> = [.timeGap, .lastYear, .patternException, .familiarTasteInNewMenu, .revisitComparison, .periodChange]
        let legacy = cards(sources: allSources, referenceDate: state.now, calendar: calendar, comparisonWindow: state.window.isAll ? nil : comparison)
        for var card in legacy where temporal.contains(card.kind) || (state.window.isAll && state.sourceFilter == .all) {
            if card.kind == .periodChange {
                let ratings = state.observations.filter { card.evidenceIDs.contains($0.id) && $0.facet == .liking }
                let index = TDDataEngine.intensityIndex(state.observations)
                guard !ratings.isEmpty, ratings.allSatisfy({ $0.target != "unspecified" && $0.phase != "unspecified"
                    && !TDDataEngine.linkedIntensity($0, index: index, issues: state.issues).isEmpty }) else { continue }
                card.dataScope = comparisonScope
                card.evidenceBundle?.period = comparison
                card.evidenceBundle?.comparisonPeriod = comparison.previous(calendar: calendar)
            } else { card.dataScope = .wholeArchive }
            if card.kind == .revisitComparison {
                let relatedMenus = Set(state.records.filter { record in card.entryIDs.contains { $0.uuidString == record.id } }.compactMap { $0.menu?.id })
                if state.records.contains(where: { $0.menu.map { relatedMenus.contains($0.id) } == true && $0.date == nil }) {
                    card.limitations.append("식사일 미확인 기록이 있어 확인된 두 기록의 비교로 한정해요.")
                }
            }
            candidates.append(card)
        }
        if !state.window.isAll || state.sourceFilter != .all {
            let local = cards(sources: periodSources, referenceDate: state.now, calendar: calendar)
            for var card in local where !temporal.contains(card.kind) {
                card.dataScope = scoped
                card = card.scopedCopy(scoped, source: state.sourceFilter)
                candidates.append(card)
            }
        }
        var builder = TDDiscoveryBuilder(state: state, input: input, calendar: calendar)
        builder.experienceRelations()
        builder.sensoryRelations()
        builder.periodRelations()
        candidates += builder.cards
        // A plain frequency milestone is already a persistent measurement.
        candidates.removeAll { $0.kind == .repeatedMenu }
        for index in candidates.indices where !candidates[index].evidenceIDs.isEmpty {
            if !candidates[index].limitations.contains(TDNativeAdapter.sensoryEvidenceScopeDescription) {
                candidates[index].limitations.append(TDNativeAdapter.sensoryEvidenceScopeDescription)
            }
        }
        var seen = Set<String>()
        return HomeDiscoveryPresentationPolicy.ranked(candidates.filter { seen.insert($0.id).inserted }, referenceDate: state.now)
    }
}

extension HomeDiscoveryCard {
    func scopedCopy(_ scope: TDDiscoveryScope, source: TDSourceFilter) -> Self {
        let scopeKey = TDDataEngine.key([scope.key, source.rawValue])
        let candidateID = Self.digest(TDDataEngine.key([id, scopeKey]))
        var proof = evidenceBundle
        proof?.sourceFilter = source
        if case .selectedPeriod(let period) = scope { proof?.period = period }
        if case .comparison(let before, let after) = scope { proof?.period = after; proof?.comparisonPeriod = before }
        return .init(id: candidateID, revisionKey: Self.digest(revisionKey + scopeKey), kind: kind, subjectID: subjectID,
                     title: title, detail: detail, explanation: explanation, entryIDs: entryIDs, evidenceIDs: evidenceIDs,
                     sourceRevisions: sourceRevisions, photoFilename: photoFilename, sortDate: sortDate,
                     meaningKey: Self.digest(semanticKey + scopeKey), relevance: relevance, evidenceSummary: evidenceSummary,
                     limitations: limitations, dataScope: scope, evidenceBundle: proof, accountGeneration: accountGeneration)
    }
}

private struct TDDiscoveryBuilder {
    let state: TDState
    let input: TDNativeInput
    let calendar: Calendar
    var cards: [HomeDiscoveryCard] = []
    var scope: TDDiscoveryScope { state.window.isAll && state.sourceFilter == .all ? .wholeArchive : .selectedPeriod(state.window) }
    func proof(numerator: [TDRecord], denominator: [TDRecord], observations: [TDObservation] = []) -> TDEvidenceBundle {
        var bundle = TDDataEngine.bundle(state)
        let numeratorIDs = TDDataEngine.ids(numerator)
        bundle.add(.numerator, TDDataEngine.evidence(numerator, observations.filter { numeratorIDs.contains($0.entryID) }))
        bundle.add(.denominator, TDDataEngine.evidence(denominator, observations))
        return bundle
    }
    // Preserve legacy revision signatures and read/snooze history across copy-only changes.
    mutating func add(_ kind: HomeDiscoveryCard.Kind, subject: String, title: String, detail: String,
                      displayTitle: String? = nil, displayDetail: String? = nil,
                      meaning: String, proof: TDEvidenceBundle, scope explicitScope: TDDiscoveryScope? = nil, strength: Int = 55) {
        guard !Task.isCancelled, !proof.all.entryIDs.isEmpty else { return }
        let scope = explicitScope ?? self.scope
        let candidateID = HomeDiscoveryCard.digest(TDDataEngine.key(["gastronomy-relations/2", kind.rawValue, subject, scope.key, state.sourceFilter.rawValue]))
        let originals = input.entries.filter { proof.all.entryIDs.contains($0.id.uuidString) }
        let revisionValues = state.records.filter { proof.all.entryIDs.contains($0.id) }.map { TDDataEngine.key([$0.id, String($0.revision), $0.fingerprint]) }.sorted()
        let revision = HomeDiscoveryCard.digest(TDDataEngine.key([candidateID, title, detail] + revisionValues + proof.all.observationIDs.sorted()))
        let originalIDs = Set(originals.map(\.id))
        let originalByID = Dictionary(uniqueKeysWithValues: originals.map { ($0.id, $0.memoryRevisionNumber) })
        let numerator = proof.roles[.numerator] ?? .empty, denominator = proof.roles[.denominator] ?? .empty
        cards.append(.init(id: candidateID, revisionKey: revision, kind: kind, subjectID: subject,
                           title: displayTitle ?? title, detail: displayDetail ?? detail,
                           explanation: scope.label(calendar: calendar) + " · " + state.sourceFilter.rawValue,
                           entryIDs: originalIDs, evidenceIDs: proof.all.observationIDs, sourceRevisions: originalByID,
                           photoFilename: originals.sorted { $0.id.uuidString < $1.id.uuidString }.compactMap(\.reflectionPhotoFilename).first,
                           sortDate: originals.compactMap(\.confirmedMealDate).max() ?? .distantPast,
                           meaningKey: HomeDiscoveryCard.digest(TDDataEngine.key([kind.rawValue, subject, scope.key, state.sourceFilter.rawValue, meaning])),
                           relevance: strength,
                           evidenceSummary: "해당 근거: 식사 \(numerator.mealIDs.count)번 · 기준 표본: 식사 \(denominator.mealIDs.count)번",
                           limitations: ["현재 유효한 기록의 관계이며 실제 모든 식사나 인과 관계를 뜻하지 않아요.", "미응답과 정체성·날짜 미확인을 임의로 채우지 않아요."],
                           dataScope: scope, evidenceBundle: proof))
    }
    mutating func experienceRelations() {
        var pairs: [String: (TDIdentity, TDIdentity, Set<String>)] = [:]
        for (meal, rows) in Dictionary(grouping: state.selected, by: \.mealID) {
            if Task.isCancelled { return }
            let menus = TDDataEngine.entityGroups(rows, .menu).map(\.0)
            guard menus.count > 1 else { continue }
            for i in 0..<(menus.count - 1) { for j in (i + 1)..<menus.count {
                let id = TDDataEngine.key([menus[i].id, menus[j].id])
                var pair = pairs[id] ?? (menus[i], menus[j], [])
                pair.2.insert(meal); pairs[id] = pair
            }}
        }
        for id in pairs.keys.sorted() {
            let (a, b, meals) = pairs[id]!
            guard meals.count >= 3 else { continue }
            let aRows = state.selected.filter { $0.menu?.id == a.id }, bRows = state.selected.filter { $0.menu?.id == b.id }
            let together = (aRows + bRows).filter { meals.contains($0.mealID) }
            var bundle = proof(numerator: together, denominator: aRows)
            let aOnly = aRows.filter { !meals.contains($0.mealID) }, bOnly = bRows.filter { !meals.contains($0.mealID) }
            bundle.add(.counter, TDDataEngine.evidence(aOnly))
            bundle.groups[a.label + "만 기록한 식사"] = TDDataEngine.evidence(aOnly)
            bundle.groups[b.label + "만 기록한 식사"] = TDDataEngine.evidence(bOnly)
            bundle.conditions = ["menuA": a.id, "menuB": b.id, "denominator": "menuA"]
            let counter = Set(aRows.map(\.mealID)).subtracting(meals).sorted()
            add(.menuCooccurrence, subject: "menu-pair:" + id, title: "함께 기록한 메뉴",
                detail: "\(a.label)을 기록한 \(TDDataEngine.meals(aRows))번 중 \(meals.count)번에 \(b.label)도 함께 남겼어요.",
                displayTitle: "\(a.label) + \(b.label)",
                displayDetail: "\(a.label) 기록 식사 \(TDDataEngine.meals(aRows))회 중 함께 \(meals.count)회",
                meaning: TDDataEngine.key(["cooccurrence"] + counter), proof: bundle)
        }
        for (kind, rows) in TDDataEngine.entityGroups(state.selected, .foodKind) {
            let restaurants = TDDataEngine.entityGroups(rows, .restaurant)
            guard restaurants.count >= 3 else { continue }
            let connected = rows.filter { $0.restaurant != nil }
            var bundle = proof(numerator: connected, denominator: rows)
            bundle.conditions["foodKind"] = kind.id
            add(.foodKindAcrossRestaurants, subject: "foodKind:" + kind.id, title: "여러 식당에서 만난 음식 종류",
                detail: "\(kind.label) 분류를 서로 다른 식당 \(restaurants.count)곳에서 기록했어요.",
                displayTitle: "\(kind.label) · 식당 \(restaurants.count)곳",
                displayDetail: "서로 다른 식당에서 기록",
                meaning: "across-restaurants", proof: bundle)
        }
        let events = TDDataEngine.events(state, dimension: .menu).filter(\.isFirst)
        for event in events {
            guard let date = event.firstDate, let menuRecord = state.records.first(where: { $0.menu?.id == event.identity.id }),
                  let restaurant = menuRecord.restaurant else { continue }
            let prior = state.records.filter { $0.restaurant?.id == restaurant.id && $0.date.map { $0 < date } == true }
            guard !prior.isEmpty else { continue }
            let current = state.selected.filter { $0.menu?.id == event.identity.id && $0.date == date }
            var bundle = proof(numerator: current, denominator: current)
            bundle.add(.contextOnly, TDDataEngine.evidence(prior))
            bundle.conditions = ["restaurant": restaurant.id, "newMenu": event.identity.id]
            add(.newMenuAtKnownRestaurant, subject: "menu:" + event.identity.id,
                title: "익숙한 식당의 새로운 메뉴", detail: "이전에 기록한 \(restaurant.label)에서 \(menuRecord.menu?.label ?? "새 메뉴")를 처음 확인했어요.",
                displayTitle: "\(menuRecord.menu?.label ?? "새 메뉴") 첫 기록",
                displayDetail: "이전에 기록한 식당 · \(restaurant.label)",
                meaning: "first:" + date.ISO8601Format(), proof: bundle)
        }
    }
    mutating func sensoryRelations() {
        let selectedIDs = TDDataEngine.ids(state.selected)
        let observations = state.observations.filter { $0.facet == .presence && selectedIDs.contains($0.entryID) }
        var pairs: [String: (String, Set<String>, Set<String>)] = [:]
        for (entry, rows) in Dictionary(grouping: observations, by: \.entryID) {
            if Task.isCancelled { return }
            let senses = Dictionary(grouping: rows, by: \.senseKey), keys = senses.keys.sorted()
            guard keys.count > 1 else { continue }
            for i in 0..<(keys.count - 1) { for j in (i + 1)..<keys.count {
                let a = senses[keys[i]]!, b = senses[keys[j]]!, id = TDDataEngine.key([keys[i], keys[j]])
                var pair = pairs[id] ?? (a[0].label + " + " + b[0].label, [], [])
                pair.1.insert(entry); pair.2.formUnion((a + b).map(\.id)); pairs[id] = pair
            }}
        }
        for id in pairs.keys.sorted() {
            let pair = pairs[id]!, rows = state.selected.filter { pair.1.contains($0.id) }, n = TDDataEngine.meals(rows)
            guard n >= 3 else { continue }
            let bundle = proof(numerator: rows, denominator: rows, observations: observations.filter { pair.2.contains($0.id) })
            add(.sensoryCooccurrence, subject: "sensory-pair:" + id, title: "함께 느낀 감각",
                detail: "\(pair.0)을 같은 요리에서 함께 남긴 식사가 \(n)번 있어요.",
                displayTitle: pair.0, displayDetail: "같은 요리에 함께 기록 · 식사 \(n)회",
                meaning: "together", proof: bundle)
        }
    }
    mutating func periodRelations() {
        let recent = state.window.isAll ? TDWindow.recent(90, now: state.now, calendar: calendar) : state.window
        let previous = recent.previous(calendar: calendar)
        let scope = TDDiscoveryScope.comparison(previous, recent)
        let result = TDDataEngine.change(state, calendar: calendar)
        for row in result.cards.first(where: { $0.id == "change-presence" })?.rows ?? [] {
            guard row.state == .ready, let comparison = row.comparison,
                  let before = comparison.before, let after = comparison.after,
                  let nB = comparison.beforeDenominator, let nA = comparison.afterDenominator, nB >= 5, nA >= 5,
                  let delta = comparison.percentagePointDifference, abs(delta) >= 20 - 0.0000001 else { continue }
            let b = Double(before) / Double(nB) * 100, a = Double(after) / Double(nA) * 100
            add(.sensoryPeriodChange, subject: "sense:" + row.id, title: "감각 기록 비중의 차이",
                detail: "\(row.title)을 남긴 식사 비중: \(before)/\(nB)번 → \(after)/\(nA)번 · " + String(format: "%.1f%% → %.1f%% (%+.1f%%p)", b, a, delta),
                displayTitle: "\(row.title) 기록 비율 \(percentText(b))% → \(percentText(a))%",
                displayDetail: "이전 \(before)/\(nB)회 → 최근 \(after)/\(nA)회\n\(percentText(abs(delta)))%p \(delta > 0 ? "증가" : "감소") · 감각 기록 식사 기준",
                meaning: delta > 0 ? "presence-increase" : "presence-decrease", proof: row.evidence, scope: scope, strength: 65)
        }
        let rows = result.cards.first { $0.id == "change-fit" }?.rows ?? []
        let grouped = Dictionary(grouping: rows) { row in
            TDDataEngine.key([row.evidence.conditions["menu"] ?? "", row.evidence.attribute ?? "", row.evidence.reference ?? "",
                              row.evidence.scale ?? "", row.evidence.conditions["target"] ?? "", row.evidence.conditions["phase"] ?? "", row.evidence.conditions["intensity"] ?? ""])
        }
        for (id, rows) in grouped.sorted(by: { $0.key < $1.key }) {
            guard let before = rows.first(where: { $0.evidence.period == previous }), let after = rows.first(where: { $0.evidence.period == recent }),
                  before.evidence.conditions["conditionsConfirmed"] == "true", after.evidence.conditions["conditionsConfirmed"] == "true",
                  before.evidence.roles[.unresolved]?.entryIDs.isEmpty != false, after.evidence.roles[.unresolved]?.entryIDs.isEmpty != false,
                  let nB = before.count, let nA = after.count, nB >= 5, nA >= 5 else { continue }
            let datesB = Set(state.records.filter { before.entryIDs.contains($0.id) }.compactMap(\.date))
            let datesA = Set(state.records.filter { after.entryIDs.contains($0.id) }.compactMap(\.date))
            guard datesB.count >= 2, datesA.count >= 2 else { continue }
            let b = before.segments.first { $0.key == "just_right" }?.count ?? 0
            let a = after.segments.first { $0.key == "just_right" }?.count ?? 0
            let delta = Double(a) / Double(nA) - Double(b) / Double(nB)
            guard abs(delta) >= 0.4 - 0.0000001 else { continue }
            let stableBefore = before.segments.filter { $0.count > 0 }.allSatisfy {
                (Double(a) / Double(nA) - Double(b - ($0.key == "just_right" ? 1 : 0)) / Double(nB - 1)) * delta > 0
            }
            let stableAfter = after.segments.filter { $0.count > 0 }.allSatisfy {
                (Double(a - ($0.key == "just_right" ? 1 : 0)) / Double(nA - 1) - Double(b) / Double(nB)) * delta > 0
            }
            guard stableBefore && stableAfter else { continue }
            var bundle = after.evidence; bundle.comparisonPeriod = previous
            bundle.add(.beforeNumerator, before.evidence.roles[.numerator] ?? .empty)
            bundle.add(.beforeDenominator, before.evidence.roles[.denominator] ?? .empty)
            add(.fitPeriodChange, subject: "fit-scope:" + id, title: "같은 범위에서 달라진 알맞음",
                detail: "\(state.observations.first { $0.attribute == after.evidence.attribute && $0.reference == after.evidence.reference }?.label ?? "감각") · 알맞음 응답 \(b)/\(nB)번 → \(a)/\(nA)번",
                displayTitle: "\(state.observations.first { $0.attribute == after.evidence.attribute && $0.reference == after.evidence.reference }?.label ?? "감각") · 알맞음 비율 차이",
                displayDetail: "이전 \(b)/\(nB)회 → 최근 \(a)/\(nA)회\n같은 메뉴·기록 조건 기준",
                meaning: delta > 0 ? "just-right-increase" : "just-right-decrease", proof: bundle, scope: scope, strength: 78)
        }
    }

    /// Keep the existing one-decimal precision, omitting only a redundant trailing zero.
    private func percentText(_ value: Double) -> String {
        let text = String(format: "%.1f", value)
        return text.hasSuffix(".0") ? String(text.dropLast(2)) : text
    }
}

extension HomeDiscoveryPresentationPolicy {
    /// Reading a finding only removes it from the home queue; categories remain revisitable.
    static func categoryCards(_ candidates: [HomeDiscoveryCard], category: TDCategory,
                              hiddenUntil: [String: Date], referenceDate: Date, read: Bool? = nil) -> [HomeDiscoveryCard] {
        ranked(candidates, referenceDate: referenceDate).filter { card in
            guard card.kind.dataCategory == category,
                  (hiddenUntil["snooze:" + card.id] ?? .distantPast) <= referenceDate else { return false }
            let wasRead = (hiddenUntil["read:" + card.semanticKey] ?? .distantPast) > referenceDate
            return read == nil || read == wasRead
        }
    }
}
