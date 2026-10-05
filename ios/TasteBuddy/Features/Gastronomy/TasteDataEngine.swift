import Foundation

/// Evolved from the feature branch's production TDDataEngine. Pure, read-only measurements.
/// Discovery decisions are integrated by HomeDiscoveryEngine, not inferred by SwiftUI views.
enum TDDataEngine {
    static let version = "gastronomy-data/2"
    static func key(_ values: [String]) -> String { values.map { "\($0.utf8.count):\($0)" }.joined() }
    static func ids(_ records: [TDRecord]) -> Set<String> { Set(records.map(\.id)) }
    static func meals(_ records: [TDRecord]) -> Int { Set(records.map(\.mealID)).count }
    static func prepare(records: [TDRecord], observations: [TDObservation], window: TDWindow,
                        now: Date, calendar: Calendar, issues: [TDEvidenceIssue] = [], sourceFilter: TDSourceFilter = .all) -> TDState {
        var conflicts = Set<String>(), pending = issues
        let grouped = Dictionary(grouping: records, by: \.id)
        var unique = grouped.keys.sorted().compactMap { id -> TDRecord? in
            guard let rows = grouped[id], let first = rows.first, !id.isEmpty, !first.mealID.isEmpty,
                  rows.allSatisfy({ $0 == first }) else { conflicts.insert(id); return nil }
            return first
        }
        let conflictMeals = Set(records.filter { conflicts.contains($0.id) }.map(\.mealID))
        unique = unique.filter { row in
            if conflictMeals.contains(row.mealID) { conflicts.insert(row.id); return false }; return true
        }
        var unknown = Set<String>(), future = Set<String>(), valid: [TDRecord] = []
        let today = calendar.startOfDay(for: now)
        for (_, rows) in Dictionary(grouping: unique, by: \.mealID).sorted(by: { $0.key < $1.key }) {
            if Task.isCancelled { break }
            if rows.contains(where: { $0.date.map { calendar.startOfDay(for: $0) > today } ?? false }) {
                future.formUnion(ids(rows)); continue
            }
            let dates = Set(rows.compactMap(\.date).map { calendar.startOfDay(for: $0) })
            let date = rows.allSatisfy({ $0.date != nil }) && dates.count == 1 ? dates.first : nil
            if date == nil { unknown.formUnion(ids(rows)) }
            valid += rows.map {
                .init(id: $0.id, mealID: $0.mealID, date: date, menu: $0.menu, restaurant: $0.restaurant,
                      foodKinds: $0.foodKinds, source: $0.source, revision: $0.revision, fingerprint: $0.fingerprint,
                      classificationUnresolved: $0.classificationUnresolved)
            }
        }
        let validIDs = ids(valid)
        var obs: [TDObservation] = []
        for (id, rows) in Dictionary(grouping: observations, by: \.id).sorted(by: { $0.key < $1.key }) {
            guard let first = rows.first, validIDs.contains(first.entryID) else { continue }
            let reason: String?
            if id.isEmpty || rows.contains(where: { $0 != first }) { reason = "동일 관찰 식별자 충돌" }
            else if !first.facet.values.contains(first.value) || (!first.scale.isEmpty && first.scale != first.facet.scale) { reason = "응답 값·척도 확인 필요" }
            else { reason = nil }
            if let reason {
                pending += rows.map { .init(id: $0.id, entryID: $0.entryID, facet: $0.facet, attribute: $0.attribute,
                                            reference: $0.reference, reason: reason, selection: $0.selection) }
            } else { obs.append(first) }
        }
        // Distinct choices can legitimately differ. Conflicts within one exact choice are pending.
        let choices = Dictionary(grouping: obs.filter { $0.linkageKey != nil }) { key([$0.linkageKey!, $0.facet.rawValue, $0.scale]) }
        var invalidIDs = Set<String>()
        for rows in choices.values where Set(rows.map(\.value)).count > 1 {
            invalidIDs.formUnion(rows.map(\.id))
            pending += rows.map { .init(id: $0.id, entryID: $0.entryID, facet: $0.facet, attribute: $0.attribute,
                                        reference: $0.reference, reason: "같은 선택의 상충 응답", selection: $0.selection) }
        }
        obs.removeAll { invalidIDs.contains($0.id) }
        let selected = valid.filter { window.contains($0.date) && (sourceFilter == .all || $0.source == sourceFilter) }
        return .init(records: valid, observations: obs, selected: selected, window: window, now: now,
                     unknownDateIDs: unknown, futureIDs: future, conflictingIDs: conflicts,
                     issues: pending.filter { validIDs.contains($0.entryID) }, sourceFilter: sourceFilter, originalCount: grouped.count,
                     timeZoneIdentifier: calendar.timeZone.identifier)
    }
    static func entityGroups(_ records: [TDRecord], _ dimension: TDDimension) -> [(TDIdentity, [TDRecord])] {
        var names: [String: TDIdentity] = [:], groups: [String: [TDRecord]] = [:]
        for record in records {
            if Task.isCancelled { break }
            var seen = Set<String>()
            for identity in record.identities(dimension) where !identity.id.isEmpty && seen.insert(identity.id).inserted {
                if names[identity.id] == nil || identity.label < names[identity.id]!.label { names[identity.id] = identity }
                groups[identity.id, default: []].append(record)
            }
        }
        return groups.keys.sorted().map { (names[$0]!, groups[$0]!) }
    }
    static func evidence(_ records: [TDRecord], _ observations: [TDObservation] = []) -> TDEvidenceIDs {
        .init(entryIDs: ids(records), mealIDs: Set(records.map(\.mealID)), observationIDs: Set(observations.map(\.id)))
    }
    static func bundle(_ state: TDState, unit: TDSampleUnit = .meal) -> TDEvidenceBundle {
        .init(unit: unit, period: state.window, timeZone: state.timeZoneIdentifier, sourceFilter: state.sourceFilter,
              sourceRevisions: Dictionary(uniqueKeysWithValues: state.records.map { ($0.id, $0.revision) }))
    }
    static func rows(for observationIDs: Set<String>, in records: [TDRecord]) -> [TDRecord] {
        records.filter { observationIDs.contains($0.id) }
    }
    static func events(_ state: TDState, dimension: TDDimension) -> [TDEvent] {
        let selectedIDs = ids(state.selected)
        return entityGroups(state.records, dimension).compactMap { identity, records in
            let selected = records.filter { selectedIDs.contains($0.id) }
            guard !selected.isEmpty else { return nil }
            let mealRows = Dictionary(grouping: records, by: \.mealID)
            let dates = mealRows.values.compactMap { $0.first?.date }.sorted()
            let uncertain = records.contains { $0.date == nil }
            let first = dates.first
            var repeats = 0
            if state.window.isAll { repeats = max(0, meals(selected) - 1) }
            else if let first {
                let selectedMeals = Set(selected.map(\.mealID))
                repeats = mealRows.filter { selectedMeals.contains($0.key) && ($0.value.first?.date.map { $0 > first } ?? false) }.count
                if state.window.contains(first) {
                    repeats += max(0, mealRows.filter { selectedMeals.contains($0.key) && $0.value.first?.date == first }.count - 1)
                }
            }
            return .init(identity: identity, entryIDs: ids(records), periodEntries: ids(selected), meals: meals(selected),
                         firstDate: uncertain ? nil : first, isFirst: !uncertain && first != nil && state.window.contains(first),
                         repeats: repeats, uncertain: uncertain)
        }
    }
    static func eventCard(_ state: TDState, dimension: TDDimension, first: Bool, calendar: Calendar) -> TDCard {
        let all = events(state, dimension: dimension)
        let values = all.filter { first ? $0.isFirst : $0.repeats > 0 }.sorted {
            if first, $0.firstDate != $1.firstDate { return ($0.firstDate ?? .distantPast) > ($1.firstDate ?? .distantPast) }
            if !first, $0.repeats != $1.repeats { return $0.repeats > $1.repeats }
            return $0.identity.id < $1.identity.id
        }
        let formatter = DateFormatter(); formatter.calendar = calendar; formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "ko_KR"); formatter.dateFormat = "yyyy.M.d"
        let output = values.map { event -> TDRow in
            var proof = bundle(state)
            proof.add(.numerator, evidence(state.records.filter { event.periodEntries.contains($0.id) }))
            proof.add(.denominator, evidence(state.selected.filter { event.periodEntries.contains($0.id) }))
            proof.add(.contextOnly, evidence(state.records.filter { event.entryIDs.subtracting(event.periodEntries).contains($0.id) }))
            return .init(id: event.identity.id, title: event.identity.label,
                         value: first ? event.firstDate.map { formatter.string(from: $0) } ?? "식사일 미확인" : "다시 \(event.repeats)번",
                         detail: "기간 식사 \(event.meals)번 · 누적 \(meals(state.records.filter { event.entryIDs.contains($0.id) }))번"
                            + (event.uncertain ? " · 확인된 반복의 최소 횟수" : ""),
                         amount: first ? nil : Double(event.repeats), entryIDs: event.entryIDs, evidence: proof,
                         count: first ? 1 : event.repeats)
        }
        var proof = bundle(state)
        for row in output { proof.merge(row.evidence) }
        let unresolved = all.filter(\.uncertain)
        proof.add(.unresolved, evidence(state.records.filter { Set(unresolved.flatMap(\.entryIDs)).contains($0.id) }))
        let unlinked = state.selected.filter { $0.identities(dimension).isEmpty }
        proof.add(.unresolved, evidence(unlinked))
        let uncertainCount = unresolved.count + unlinked.count
        return .init(id: first ? "first" : "repeat", title: first ? "처음 기록한 경험" : "다시 기록한 경험",
                     meaning: output.isEmpty && uncertainCount > 0 ? "\(dimension.rawValue) 확인 필요" : "확인된 \(dimension.rawValue) \(output.count)\(dimension.unit)", rows: output,
                     note: (first ? "전체 아카이브의 첫 확인 식사일 기준. 같은 첫 날짜의 순서는 정하지 않아요." : "첫 식사 이후의 반복 횟수예요. 같은 기간에 처음·다시 모두 포함될 수 있어요.")
                        + " · 최초 순서 미확인 \(unresolved.count)항목 · 연결 미확인 요리 \(unlinked.count)개",
                     state: output.isEmpty ? (uncertainCount > 0 ? .insufficientComparison : .zeroOccurrences) : .ready,
                     evidence: proof)
    }
    static func vote(_ observations: [TDObservation], records: [TDRecord], facet: TDFacet,
                     includeMissing: Set<String> = [], issues: [TDEvidenceIssue] = []) -> [TDSegment] {
        let recordMap = Dictionary(uniqueKeysWithValues: records.map { ($0.id, $0) })
        func sample(_ id: String) -> String? { facet == .overall ? (recordMap[id] == nil ? nil : id) : recordMap[id]?.mealID }
        let eligible = observations.filter { $0.facet == facet && recordMap[$0.entryID] != nil }
        let grouped = Dictionary(grouping: eligible) { sample($0.entryID)! }
        let unresolvedSamples = Set(issues.compactMap { sample($0.entryID) })
        var samples: [String: Set<String>] = [:]
        for (id, rows) in grouped where !unresolvedSamples.contains(id) {
            let values = Set(rows.map(\.value)); samples[values.count == 1 ? values.first! : "mixed", default: []].insert(id)
        }
        samples["unresolved"] = unresolvedSamples
        samples["missing"] = includeMissing.subtracting(Set(grouped.keys)).subtracting(unresolvedSamples)
        return (facet.values + ["mixed", "missing", "unresolved"]).map { value in
            let ids = samples[value] ?? []
            let members = records.filter { sample($0.id).map(ids.contains) ?? false }
            let refs = observations.filter { sample($0.entryID).map(ids.contains) ?? false }
            var proof = evidence(members, refs)
            if value == "unresolved" { proof.observationIDs.formUnion(issues.map(\.id)) }
            return .init(key: value, label: value == "unresolved" ? "해석 보류" : facet.label(value), count: ids.count, evidence: proof)
        }
    }
    static func summary(_ segments: [TDSegment]) -> String {
        let present = segments.filter { $0.count > 0 }
        return present.isEmpty ? "응답 자료 없음" : present.map { "\($0.label) \($0.count)" }.joined(separator: " · ")
    }
    static func distributionBundle(_ state: TDState, rows: [TDObservation], records: [TDRecord], facet: TDFacet,
                                   segments: [TDSegment], base: TDEvidenceIDs) -> TDEvidenceBundle {
        var proof = bundle(state, unit: facet == .overall ? .dish : .meal)
        proof.attribute = rows.first?.attribute; proof.reference = rows.first?.reference; proof.scale = facet.scale
        proof.add(.denominator, base)
        for segment in segments where segment.count > 0 {
            let role: TDEvidenceRole
            switch segment.key {
            case "positive", "very_positive", "just_right": role = .supporting
            case "negative", "very_negative", "below_preferred", "above_preferred": role = .counter
            case "neutral": role = .neutral
            case "mixed": role = .mixed
            case "missing": role = .missing
            case "unresolved": role = .unresolved
            default: role = .numerator
            }
            proof.add(role, segment.evidence)
            if !["missing", "unresolved"].contains(segment.key) { proof.add(.numerator, segment.evidence) }
        }
        return proof
    }
    static func distributionRows(_ state: TDState, facet: TDFacet, domain: String? = nil) -> [TDRow] {
        let selectedIDs = ids(state.selected)
        let observations = state.observations.filter { selectedIDs.contains($0.entryID) && (domain == nil || $0.domain == domain) }
        let groups = Dictionary(grouping: observations.filter { $0.facet == facet || $0.facet == .presence }, by: \.senseKey)
        let issueGroups = Dictionary(grouping: state.issues.filter { selectedIDs.contains($0.entryID)
            && ($0.facet == nil || $0.facet == facet) && (domain == nil || $0.domain == nil || $0.domain == domain) }) { $0.senseKey ?? "unclassified" }
        let keys = Set(groups.keys).union(issueGroups.keys)
        return keys.sorted().map { sense -> TDRow in
            let rows = groups[sense] ?? []
            let issues = (issueGroups[sense] ?? []) + (issueGroups["unclassified"] ?? []).filter { issue in rows.contains { $0.entryID == issue.entryID } }
            let entryIDs = Set(rows.map(\.entryID)).union(issues.map(\.entryID))
            let records = state.selected.filter { entryIDs.contains($0.id) }
            let base = Set(records.map(\.mealID))
            let segments = vote(rows, records: records, facet: facet, includeMissing: base, issues: issues)
            let n = segments.filter { !["missing", "unresolved"].contains($0.key) }.reduce(0) { $0 + $1.count }
            let proof = distributionBundle(state, rows: rows, records: records, facet: facet, segments: segments, base: evidence(records, rows))
            return .init(id: sense, title: rows.map(\.label).sorted().first ?? issues.first?.attribute ?? "감각 확인 필요",
                         value: "\(n)번의 식사에서 응답", detail: "대상 식사 \(base.count)번 · " + summary(segments), amount: Double(n),
                         segments: segments, entryIDs: entryIDs, evidence: proof,
                         state: segments.contains { $0.key == "unresolved" && $0.count > 0 } ? .invalidEvidence : n == 0 ? .missingResponse : .ready,
                         count: n, denominator: base.count)
        }.sorted { $0.amount == $1.amount ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
    }
    static func presenceRows(_ state: TDState, domain: String? = nil) -> [TDRow] {
        let selectedIDs = ids(state.selected)
        let all = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == .presence }
        let presenceEntryIDs = Set(all.map(\.entryID))
        let baseRecords = state.selected.filter { presenceEntryIDs.contains($0.id) }
        let base = meals(baseRecords)
        return Dictionary(grouping: all.filter { domain == nil || $0.domain == domain }, by: \.senseKey).map { sense, rows in
            let rowEntryIDs = Set(rows.map(\.entryID))
            let members = state.selected.filter { rowEntryIDs.contains($0.id) }
            let count = meals(members)
            var proof = bundle(state); proof.attribute = rows[0].attribute; proof.reference = rows[0].reference; proof.scale = TDFacet.presence.scale
            proof.add(.numerator, evidence(members, rows)); proof.add(.denominator, evidence(baseRecords, all))
            return .init(id: sense, title: rows.map(\.label).sorted()[0], value: "\(count)/\(base)번의 식사",
                         detail: "유효한 감각을 남긴 전체 식사 기준 · 여러 감각 공존 가능", amount: Double(count),
                         entryIDs: ids(members), evidence: proof, count: count, denominator: base)
        }.sorted { $0.amount == $1.amount ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
    }
    static func experience(_ state: TDState, calendar: Calendar = .current) -> TDResult {
        var proof = bundle(state)
        proof.add(.numerator, evidence(state.selected)); proof.add(.denominator, evidence(state.selected))
        let count = meals(state.selected)
        let countUnresolved = count == 0 && (!state.conflictingIDs.isEmpty || (!state.window.isAll && !state.unknownDateIDs.isEmpty))
        var cards = [TDCard(id: "meals", title: "기록한 식사", meaning: "식사와 요리 기록을 구분해요",
                            rows: [.init(id: "meals", title: "식사", value: countUnresolved ? "식사 수 확인 필요" : "\(count)번", detail: "확인된 범위의 요리 기록 \(state.selected.count)개",
                                         amount: countUnresolved ? nil : Double(count), entryIDs: ids(state.selected), evidence: proof,
                                         state: countUnresolved ? .invalidEvidence : .ready, count: countUnresolved ? nil : count)],
                            note: "같은 식사의 여러 요리와 수정 기록은 식사 횟수를 늘리지 않아요.",
                            state: countUnresolved ? .invalidEvidence : count == 0 ? .zeroOccurrences : .ready, evidence: proof)]
        for dimension in TDDimension.allCases {
            if Task.isCancelled { break }
            let groups = entityGroups(state.selected, dimension)
            let missing = state.selected.filter { $0.identities(dimension).isEmpty || (dimension == .foodKind && $0.classificationUnresolved) }
            var rows: [TDRow] = []
            for (identity, members) in groups {
                var itemProof = bundle(state); itemProof.add(.numerator, evidence(members)); itemProof.add(.denominator, evidence(members))
                let all = state.records.filter { $0.identities(dimension).contains { $0.id == identity.id } }
                itemProof.add(.contextOnly, evidence(all.filter { !ids(members).contains($0.id) }))
                let n = meals(members)
                var detail = "누적 식사 \(meals(all))번"
                if dimension == .foodKind {
                    detail += " · 메뉴 \(entityGroups(members, .menu).count)개 · 식당 \(entityGroups(members, .restaurant).count)곳"
                }
                rows.append(.init(id: identity.id, title: identity.label, value: "\(n)번의 식사", detail: detail,
                                  amount: Double(n), entryIDs: ids(members), evidence: itemProof, count: n))
            }
            rows.sort { $0.amount == $1.amount ? $0.id < $1.id : ($0.amount ?? 0) > ($1.amount ?? 0) }
            var cardProof = bundle(state)
            for row in rows { cardProof.merge(row.evidence) }
            cardProof.add(.unresolved, evidence(missing))
            let note = dimension == .menu ? "식당별 개별 메뉴예요. 메뉴 ID가 없으면 확인된 같은 식당 안에서 동일 표기만 임시로 묶어요. 직접 요리는 확인한 요리 ID로 구분해요." : dimension == .restaurant ? "확인된 식당·지점 기준이며 방문 횟수나 선호가 아니에요." : "저장한 분류 기준이며 복수 분류가 겹칠 수 있어요. 메뉴명으로 더 세밀한 분류를 만들지 않아요."
            cards.append(.init(id: "measure-" + dimension.id, title: "기록한 " + dimension.id,
                               meaning: rows.isEmpty && !missing.isEmpty ? "연결·분류 확인 필요" : (dimension == .foodKind ? "저장한 분류 " : "") + "\(rows.count)\(dimension.unit)", rows: rows,
                               note: note + " · 미연결 또는 해당 없음 \(missing.count)개 요리 기록",
                               state: rows.isEmpty ? (missing.isEmpty ? .zeroOccurrences : .unresolvedIdentity) : .ready, evidence: cardProof))
        }
        let hero = cards.first { $0.id == "measure-메뉴" }?.rows ?? []
        cards.append(eventCard(state, dimension: .menu, first: true, calendar: calendar))
        cards.append(eventCard(state, dimension: .menu, first: false, calendar: calendar))
        return .init(hero: hero, cards: cards, discoveries: [])
    }
    static func sensation(_ state: TDState, domain: String, attribute: String? = nil) -> TDResult {
        let presence = presenceRows(state, domain: domain)
        let distributions = distributionRows(state, facet: .intensity, domain: domain)
        let chosen = attribute ?? presence.first?.id ?? distributions.first?.id
        let intensity = distributions.filter { $0.id == chosen }
        var cards = [TDCard(id: "presence", title: "기록한 맛·향·식감", meaning: domain, rows: presence,
                            note: "같은 식사·감각은 한 번씩 세며, 다른 감각 영역으로 전환해도 기준 식사 분모를 유지해요."),
                     TDCard(id: "intensity", title: "어느 정도로 느꼈나요", meaning: intensity.first?.title ?? "느낀 강도", rows: intensity,
                            note: "강도·호감·알맞음은 별도 응답이에요. 미응답과 해석 보류를 구분해요.")]
        completeCards(&cards, state: state)
        return .init(hero: presence, cards: cards, discoveries: [])
    }
    static func preference(_ state: TDState, facet: TDFacet = .liking, attribute: String? = nil) -> TDResult {
        let selectedIDs = ids(state.selected)
        let overall = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == .overall }
        let issues = state.issues.filter { selectedIDs.contains($0.entryID) && ($0.facet == .overall || $0.attribute == "overall") }
        let segments = vote(overall, records: state.selected, facet: .overall, includeMissing: selectedIDs, issues: issues)
        let n = segments.filter { !["missing", "unresolved"].contains($0.key) }.reduce(0) { $0 + $1.count }
        let proof = distributionBundle(state, rows: overall, records: state.selected, facet: .overall,
                                       segments: segments, base: evidence(state.selected, overall))
        let overallRow = TDRow(id: "overall", title: "음식 전체", value: "요리 \(n)개 평가", detail: summary(segments),
                              amount: Double(n), segments: segments, entryIDs: selectedIDs, evidence: proof,
                              state: n > 0 ? .ready : issues.isEmpty ? .missingResponse : .invalidEvidence, count: n, denominator: state.selected.count)
        let liking = distributionRows(state, facet: .liking), fit = distributionRows(state, facet: .fit)
        var cards = [TDCard(id: "overall", title: "음식 전체는 어땠나요", meaning: "음식 전체 · 요리별 5단계 평가", rows: [overallRow],
                            note: "감각 강도로 만든 과거 별점은 사용하지 않아요.", evidence: proof),
                     TDCard(id: "liking", title: "감각별 호감", meaning: "좋음·보통·아쉬움", rows: liking,
                            note: "한 식사에서 다른 유효 응답은 ‘응답 나뉨’으로 보존해요."),
                     TDCard(id: "fit", title: "나에게 맞는 정도", meaning: "부족·알맞음·과함", rows: fit,
                            note: "알맞음은 호감이나 감각 강도로 대신 채우지 않아요.")]
        completeCards(&cards, state: state)
        let candidates = facet == .overall ? [overallRow] : facet == .fit ? fit : liking
        let hero = attribute == nil || facet == .overall ? candidates : candidates.filter { $0.id == attribute }
        return .init(hero: hero, cards: cards, discoveries: [])
    }
    static func completeCards(_ cards: inout [TDCard], state: TDState) {
        for i in cards.indices {
            cards[i].evidence.period = state.window
            for row in cards[i].rows { cards[i].evidence.merge(row.evidence) }
            if cards[i].rows.isEmpty { cards[i].state = .missingResponse }
            else if cards[i].rows.contains(where: { $0.state == .invalidEvidence }) { cards[i].state = .invalidEvidence }
        }
    }
    static func intensityIndex(_ observations: [TDObservation]) -> [String: [TDObservation]] {
        var result: [String: [TDObservation]] = [:]
        for row in observations where row.facet == .intensity {
            guard let link = row.linkageKey else { continue }
            result[link, default: []].append(row)
            if let parent = row.parentLinkageKey { result["child-of:" + parent, default: []].append(row) }
        }
        return result
    }
    static func linkedIntensity(_ row: TDObservation, index: [String: [TDObservation]], issues: [TDEvidenceIssue]) -> [TDObservation] {
        guard let link = row.linkageKey else { return [] }
        var values = (index[link] ?? []) + (index["child-of:" + link] ?? [])
        if let parent = row.parentLinkageKey { values += index[parent] ?? [] }
        var seen = Set<String>()
        values = values.filter { seen.insert($0.id).inserted }
        let relatedSelections = Set(values.map(\.selection)).union([row.selection]).union(row.parentSelection.map { [$0] } ?? [])
        if issues.contains(where: { $0.entryID == row.entryID && ($0.facet == nil || $0.facet == .intensity)
            && ($0.senseKey == nil || $0.senseKey == row.senseKey) && ($0.selection.isEmpty || relatedSelections.contains($0.selection)) }) { return [] }
        return Set(values.map(\.value)).count == 1 ? values : []
    }
    static func context(_ state: TDState, attribute: String?, facet: TDFacet, dimension chosenDimension: String = "foodKind") -> TDResult {
        let selectedIDs = ids(state.selected), recordMap = state.recordMap
        let observations = state.observations.filter { selectedIDs.contains($0.entryID) && $0.facet == facet }
        let chosen = attribute ?? observations.map(\.senseKey).sorted().first
        let selected = observations.filter { $0.senseKey == chosen }
        let intensities = intensityIndex(state.observations)
        var cards: [TDCard] = []
        for dimension in ["foodKind", "target", "phase", "intensity"] {
            var groups: [String: [TDObservation]] = [:], names: [String: String] = [:], missing: [TDObservation] = []
            for row in selected {
                let conditions: [TDIdentity]
                switch dimension {
                case "foodKind": conditions = recordMap[row.entryID]?.foodKinds ?? []
                case "target": conditions = row.target.isEmpty || row.target == "unspecified" ? [] : [.init(id: row.target, label: conditionLabel(row.target))]
                case "phase": conditions = row.phase.isEmpty || row.phase == "unspecified" ? [] : [.init(id: row.phase, label: conditionLabel(row.phase))]
                default:
                    let values = linkedIntensity(row, index: intensities, issues: state.issues)
                    conditions = values.first.map { [.init(id: $0.value, label: TDFacet.intensity.label($0.value))] } ?? []
                }
                if conditions.isEmpty { missing.append(row) }
                for condition in conditions { groups[condition.id, default: []].append(row); names[condition.id] = condition.label }
            }
            let mealGroups = groups.mapValues { Set($0.compactMap { recordMap[$0.entryID]?.mealID }) }
            var seen = Set<String>(), overlapping = Set<String>()
            for ids in mealGroups.values { overlapping.formUnion(seen.intersection(ids)); seen.formUnion(ids) }
            let rows = groups.keys.sorted(by: { conditionOrder($0, dimension: dimension) < conditionOrder($1, dimension: dimension) }).map { condition -> TDRow in
                let values = groups[condition]!, entryIDs = Set(values.map(\.entryID)), records = state.selected.filter { entryIDs.contains($0.id) }
                let issues = state.issues.filter { entryIDs.contains($0.entryID) && ($0.facet == nil || $0.facet == facet) && ($0.senseKey == nil || $0.senseKey == chosen) }
                let segments = vote(values, records: records, facet: facet, issues: issues)
                let n = segments.filter { !["unresolved", "missing"].contains($0.key) }.reduce(0) { $0 + $1.count }
                var proof = distributionBundle(state, rows: values, records: records, facet: facet, segments: segments, base: evidence(records, values))
                proof.conditions[dimension] = condition; proof.overlappingMealIDs = overlapping
                if dimension == "intensity" {
                    for value in values { proof.add(.numerator, evidence(records.filter { $0.id == value.entryID }, linkedIntensity(value, index: intensities, issues: state.issues))) }
                }
                return .init(id: key([dimension, condition, chosen ?? "", facet.rawValue]), title: names[condition]!, value: "평가한 식사 \(n)번",
                             detail: summary(segments), amount: Double(n), segments: segments, entryIDs: entryIDs, evidence: proof,
                             state: n == 0 ? .invalidEvidence : .ready, count: n)
            }
            let title = ["foodKind":"음식 종류별 반응", "target":"느낀 부위별 반응", "phase":"먹는 시점별 반응", "intensity":"느낀 강도별 반응"][dimension]!
            var proof = bundle(state)
            for row in rows { proof.merge(row.evidence) }
            proof.add(dimension == "intensity" ? .unresolved : .missing, evidence(state.selected.filter { Set(missing.map(\.entryID)).contains($0.id) }, missing))
            cards.append(.init(id: "context-" + dimension, title: title, meaning: (selected.first?.label ?? "감각 응답 없음") + " · " + facet.title,
                               rows: rows, note: "미통제 관찰 집계 · 두 조건 이상에 속한 식사 \(overlapping.count)번 · 조건 또는 연결 미확인 응답 \(missing.count)개",
                               state: rows.isEmpty ? .insufficientComparison : .ready, evidence: proof))
        }
        return .init(hero: Array((cards.first { $0.id == "context-" + chosenDimension }?.rows ?? []).prefix(2)), cards: cards, discoveries: [])
    }
    static func conditionOrder(_ value: String, dimension: String) -> String {
        let order = dimension == "phase" ? ["first_bite", "early_meal", "during_meal", "late_meal", "after_swallow", "after_meal"] : dimension == "intensity" ? ["weak", "medium", "strong"] : []
        return String(format: "%02d", order.firstIndex(of: value) ?? 99) + value
    }
    static func conditionLabel(_ value: String) -> String {
        ["whole_dish":"음식 전체", "sauce":"소스", "broth":"국물", "surface":"겉", "inside":"속", "coating":"튀김옷", "skin":"껍질",
         "noodles":"면", "meat":"고기", "filling":"소", "flesh":"속살", "cream":"크림",
         "first_bite":"첫입", "early_meal":"초반", "during_meal":"먹는 중", "late_meal":"후반",
         "after_swallow":"삼킨 뒤", "after_meal":"식사 후", "unspecified":"조건 미확인"][value] ?? value
    }
    static func change(_ state: TDState, calendar: Calendar, heroDimension: TDDimension? = .menu) -> TDResult {
        let recent = state.window.isAll ? TDWindow.recent(90, now: state.now, calendar: calendar) : state.window
        let previous = recent.previous(calendar: calendar)
        let before = state.records(in: previous), after = state.records(in: recent)
        let range = "이전 " + previous.range(calendar: calendar) + " / 최근 " + recent.range(calendar: calendar)
        var proof = bundle(state); proof.period = recent; proof.comparisonPeriod = previous
        proof.add(.numerator, evidence(after)); proof.add(.denominator, evidence(before))
        let mealRow = TDRow(id: "meal", title: "기록한 식사", value: "\(meals(before)) → \(meals(after))번",
                            detail: "이전 → 최근", entryIDs: ids(before + after), evidence: proof,
                            comparison: .init(before: meals(before), after: meals(after)))
        var rows = [mealRow]
        for dimension in TDDimension.allCases {
            let b = entityGroups(before, dimension).count, a = entityGroups(after, dimension).count
            let unknownB = b == 0 && !before.isEmpty, unknownA = a == 0 && !after.isEmpty
            let left = unknownB ? "미확인" : "\(b)", right = unknownA ? "미확인" : "\(a)"
            rows.append(.init(id: dimension.id, title: dimension.id, value: left + " → " + right + dimension.unit,
                              detail: "이전 → 최근 · 연결된 정체성만 집계", entryIDs: ids(before + after), evidence: proof,
                              state: unknownB || unknownA ? .unresolvedIdentity : .ready,
                              comparison: .init(before: unknownB ? nil : b, after: unknownA ? nil : a,
                                                beforeState: unknownB ? .unresolvedIdentity : .ready, afterState: unknownA ? .unresolvedIdentity : .ready)))
        }
        var cards = [TDCard(id: "change-experience", title: "경험 범위의 변화", meaning: range, rows: rows,
                            note: "확인된 식사일의 같은 길이 구간 · 날짜 미확인 요리 \(state.unknownDateIDs.count)개는 별도예요.", evidence: proof)]
        let beforeIDs = ids(before), afterIDs = ids(after), relevantIDs = beforeIDs.union(afterIDs)
        let presence = state.observations.filter { $0.facet == .presence && relevantIDs.contains($0.entryID) }
        let baseBefore = presence.filter { beforeIDs.contains($0.entryID) }, baseAfter = presence.filter { afterIDs.contains($0.entryID) }
        let baseBeforeIDs = Set(baseBefore.map(\.entryID)), baseAfterIDs = Set(baseAfter.map(\.entryID))
        let baseB = before.filter { baseBeforeIDs.contains($0.id) }, baseA = after.filter { baseAfterIDs.contains($0.id) }
        let nB = meals(baseB), nA = meals(baseA)
        let compatible = compatibleCatalogs(baseBefore, baseAfter)
        let sensoryRows = Dictionary(grouping: presence, by: \.senseKey).sorted { $0.key < $1.key }.map { sense, observations -> TDRow in
            let bObs = observations.filter { beforeIDs.contains($0.entryID) }, aObs = observations.filter { afterIDs.contains($0.entryID) }
            let bIDs = Set(bObs.map(\.entryID)), aIDs = Set(aObs.map(\.entryID))
            let bRecords = before.filter { bIDs.contains($0.id) }, aRecords = after.filter { aIDs.contains($0.id) }
            let b = meals(bRecords), a = meals(aRecords)
            let comparison = TDComparison(before: nB == 0 ? nil : b, after: nA == 0 ? nil : a, beforeDenominator: nB, afterDenominator: nA)
            let left = nB > 0 ? "\(b)/\(nB)번 (\(Int((Double(b)/Double(nB)*100).rounded()))%)" : "자료 없음"
            let right = nA > 0 ? "\(a)/\(nA)번 (\(Int((Double(a)/Double(nA)*100).rounded()))%)" : "자료 없음"
            var proof = bundle(state); proof.period = recent; proof.comparisonPeriod = previous
            proof.attribute = observations[0].attribute; proof.reference = observations[0].reference; proof.scale = TDFacet.presence.scale
            proof.conditions["catalogComparable"] = compatible ? "true" : "false"
            proof.add(.numerator, evidence(aRecords, aObs)); proof.add(.denominator, evidence(baseA, baseAfter))
            // Earlier numerator and denominator remain distinct nested rows in the evidence UI.
            proof.add(.beforeNumerator, evidence(bRecords, bObs)); proof.add(.beforeDenominator, evidence(baseB, baseBefore))
            var detail = "이전 → 최근 · 각 기간에 유효한 감각을 남긴 식사가 분모"
            if let delta = comparison.percentagePointDifference, compatible { detail += String(format: " · %+.1f%%p", delta) }
            if !compatible { detail += " · 카탈로그 비교 범위 확인 필요" }
            return .init(id: sense, title: observations[0].label, value: left + " → " + right, detail: detail,
                         entryIDs: ids(baseB + baseA), evidence: proof,
                         state: nB == 0 || nA == 0 || !compatible ? .insufficientComparison : .ready, comparison: comparison)
        }
        cards.append(.init(id: "change-presence", title: "감각 기록의 변화", meaning: range, rows: sensoryRows,
                           note: "감각 기록의 비중이며 호감의 변화가 아니에요. 미선택을 감각 부재로 해석하지 않아요."))
        cards.append(evaluationChange(state, before: before, after: after, facet: .liking, range: range, previous: previous, recent: recent))
        cards.append(evaluationChange(state, before: before, after: after, facet: .fit, range: range, previous: previous, recent: recent))
        completeCards(&cards, state: state)
        var hero: [TDRow] = []
        if let start = recent.start, let end = recent.end {
            let days = max(1, calendar.dateComponents([.day], from: start, to: end).day ?? 1)
            let width = max(1, Int(ceil(Double(days) / 6)))
            var cursor = start
            while cursor < end {
                guard let step = calendar.date(byAdding: .day, value: width, to: cursor), step > cursor else { break }
                let next = min(end, step), window = TDWindow(label: "시간 구간", start: cursor, end: next)
                let members = state.records(in: window)
                let count = heroDimension.map { entityGroups(members, $0).count } ?? meals(members)
                let unknown = heroDimension != nil && count == 0 && !members.isEmpty
                var proof = bundle(state); proof.period = window; proof.comparisonPeriod = previous
                proof.add(.numerator, evidence(members)); proof.add(.denominator, evidence(members))
                let span = calendar.dateComponents([.day], from: cursor, to: next).day ?? 0
                hero.append(.init(id: cursor.ISO8601Format(), title: window.range(calendar: calendar),
                                  value: unknown ? "연결 미확인" : "\(heroDimension?.rawValue ?? "식사") \(count)\(heroDimension?.unit ?? "번")",
                                  detail: "\(span)일 구간 · 확인된 식사일 기준", amount: unknown ? nil : Double(count),
                                  entryIDs: ids(members), evidence: proof, state: unknown ? .unresolvedIdentity : .ready,
                                  count: unknown ? nil : count))
                cursor = next
            }
        }
        return .init(hero: hero, cards: cards, discoveries: [])
    }
    static func compatibleCatalogs(_ before: [TDObservation], _ after: [TDObservation]) -> Bool {
        let a = Set(before.map(\.catalogVersion)), b = Set(after.map(\.catalogVersion))
        return !a.isEmpty && !b.isEmpty && a == b && a.count == 1 && !a.contains("")
    }
    static func evaluationChange(_ state: TDState, before: [TDRecord], after: [TDRecord], facet: TDFacet,
                                 range: String, previous: TDWindow, recent: TDWindow) -> TDCard {
        let selected = before + after, selectedIDs = ids(selected), records = state.recordMap
        let responses = state.observations.filter { $0.facet == facet && selectedIDs.contains($0.entryID) && records[$0.entryID]?.menu != nil }
        let intensities = intensityIndex(state.observations)
        func intensity(_ row: TDObservation) -> [TDObservation] { linkedIntensity(row, index: intensities, issues: state.issues) }
        func scope(_ row: TDObservation) -> String {
            key([records[row.entryID]!.menu!.id, row.senseKey, row.scale, row.target, row.phase, intensity(row).first?.value ?? "unconfirmed"])
        }
        let groups = Dictionary(grouping: responses, by: scope)
        var rows: [TDRow] = []
        for id in groups.keys.sorted() {
            if Task.isCancelled { break }
            let values = groups[id]!, row = values[0], strength = intensity(row)
            let known = !row.target.isEmpty && row.target != "unspecified" && !row.phase.isEmpty && row.phase != "unspecified" && !strength.isEmpty
            let title = records[row.entryID]!.menu!.label + " · " + row.label
            for (side, members, window) in [("before", before, previous), ("after", after, recent)] {
                let memberIDs = ids(members), values = values.filter { memberIDs.contains($0.entryID) }
                let entryIDs = Set(values.map(\.entryID)), subset = members.filter { entryIDs.contains($0.id) }
                let issues = state.issues.filter { entryIDs.contains($0.entryID) && ($0.facet == nil || $0.facet == facet) && ($0.senseKey == nil || $0.senseKey == row.senseKey) }
                let segments = vote(values, records: subset, facet: facet, issues: issues)
                let n = segments.filter { !["missing", "unresolved"].contains($0.key) }.reduce(0) { $0 + $1.count }
                var proof = distributionBundle(state, rows: values, records: subset, facet: facet, segments: segments, base: evidence(subset, values))
                proof.period = window; proof.comparisonPeriod = side == "before" ? recent : previous
                proof.conditions = ["menu": records[row.entryID]!.menu!.id, "target": row.target, "phase": row.phase,
                                    "intensity": strength.first?.value ?? "unconfirmed", "conditionsConfirmed": known ? "true" : "false"]
                for value in values { proof.add(.numerator, evidence(subset.filter { $0.id == value.entryID }, intensity(value))) }
                let conditions = conditionLabel(row.target) + " · " + conditionLabel(row.phase) + " · 강도 " + (strength.first.map { TDFacet.intensity.label($0.value) } ?? "연결 미확인")
                rows.append(.init(id: id + ":" + side, title: title + (side == "before" ? " · 이전" : " · 최근"),
                                  value: n == 0 ? "자료 없음" : "평가한 식사 \(n)번", detail: conditions + " · " + summary(segments), amount: Double(n),
                                  segments: segments, entryIDs: entryIDs, evidence: proof,
                                  state: known && n > 0 ? .ready : .insufficientComparison, count: n))
            }
        }
        return .init(id: "change-" + facet.rawValue, title: facet == .liking ? "호감 평가의 변화" : "알맞음 응답의 변화", meaning: range, rows: rows,
                     note: "동일 메뉴·감각·척도·부위·시점·연결 강도별 관찰이에요. 조건 미확인은 별도 묶음이며 실제 조리 상태까지 같다는 뜻은 아니에요.")
    }
    static func result(_ state: TDState, category: TDCategory, domain: String = "맛", attribute: String? = nil,
                       facet: TDFacet = .liking, calendar: Calendar, contextDimension: String = "foodKind",
                       heroDimension: TDDimension? = .menu) -> TDResult {
        switch category {
        case .experience: return experience(state, calendar: calendar)
        case .sensation: return sensation(state, domain: domain, attribute: attribute)
        case .preference: return preference(state, facet: facet, attribute: attribute)
        case .context: return context(state, attribute: attribute, facet: facet, dimension: contextDimension)
        case .change:
            let output = change(state, calendar: calendar, heroDimension: heroDimension)
            guard let attribute else { return output }
            let cards = output.cards.map { card -> TDCard in
                guard card.id != "change-experience" else { return card }
                var filtered = card
                filtered.rows = card.rows.filter { TDDataEngine.key([$0.evidence.attribute ?? "", $0.evidence.reference ?? ""]) == attribute }
                filtered.evidence = bundle(state)
                for row in filtered.rows { filtered.evidence.merge(row.evidence) }
                return filtered
            }
            return .init(hero: output.hero, cards: cards, discoveries: [])
        }
    }
}
