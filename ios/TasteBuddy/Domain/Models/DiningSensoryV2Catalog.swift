import Foundation

struct DiningSensoryPresentation: Codable, Equatable {
    var catalogVersion: String
    var sourceVersion: String
    var layoutVersion: String
    var profileIds: [String]
    var profileSelection: [String]?
    var flagOverrides: [String: String]
    var contextFlags: [String: String]
    var contextSource: String
    var matchedRuleIds: [String]
    var suggestedProfileIds: [String]
    var ambiguous: Bool
    var orderedBubbleIDs: [String]
    var offeredDetailIDs: [String]
    var viewportVisibility = "unmeasured"
    var attention = "unknown"
}

struct DiningSensoryV2Catalog: Decodable {
    struct Entry: Decodable {
        let id: String
        let type: String
        let label: String
        let description: String
        let searchAliases: [String]?
        let catalogVersion: String
        let definitionVersion: String
        let attribute: String
        let bindingMode: String
        let axis: String?
        let familyId: String?
        let fixedAnchor: Bool?
        let intrinsicTarget: String?
        let intrinsicPhase: String?
        let intrinsicIntensity: String?
        let intrinsicFit: String?
        let referenceLabel: String?
        let semanticFacets: DiningSelectionJSON
        let resolution: String
    }
    struct Family: Decodable { let id: String; let label: String; let tags: [String] }
    struct Condition: Decodable {
        let id: String?
        let requiresContextFlag: String?
        let requiresProfileId: String?
        let requiresProfileKind: String?
        let categoryLabels: [String: String]?
        func matches(_ profile: Profile, flags: [String: String]) -> Bool {
            (requiresContextFlag.map { flags[$0] == "confirmed" } ?? true)
                && (requiresProfileId.map { $0 == profile.id } ?? true)
                && (requiresProfileKind.map { $0 == profile.detailProfileKind } ?? true)
        }
    }
    struct Profile: Decodable, Identifiable {
        let id: String
        let label: String
        let detailProfileKind: String
        let categoryOrder: [String]
        let categoryLabels: [String: String]
        let familyTagPools: [String: [String]]
        let conditionalTagAdditions: [Condition]
        let bubblePromoteIds: [String]
        let conditionalBubblePromotions: [Condition]
    }
    struct Overlay: Decodable {
        let id: String
        let requiresContextFlag: String
        let categoryLabels: [String: String]
        let addTagIds: [String]
        let promoteTagIds: [String]?
        let conditionalTagAdditions: [Condition]?
        let categoryLabelOverrides: [Condition]?
        let bubblePromoteIds: [String]
    }
    struct ContextFlag: Decodable, Identifiable { let id: String; let label: String }
    struct Derivation: Decodable { let ifConfirmed: String; let mayConfirm: String }
    struct Rule: Decodable {
        let id: String
        let profileId: String?
        let anyGroups: [[String]]
        let kindGroups: [[String]]
        let flags: [String]
        let excludes: [String]
        let priority: Int
        func matches(menu: String, kinds: [String]) -> Bool {
            anyGroups.allSatisfy { $0.contains { menu.contains($0.lowercased()) } }
                && kindGroups.allSatisfy { group in group.contains { kinds.contains($0) } }
                && !excludes.contains { menu.contains($0.lowercased()) }
        }
    }
    struct Layout: Decodable {
        struct Slot: Decodable { let id: String; let axis: String; let index: Int; let x: Double; let y: Double }
        let mapSize: Double
        let bubbleSize: Double
        let selectedBubbleSize: Double
        let gridSpacing: Double
        let slots: [Slot]
    }
    let version: String
    let sourceVersion: String
    let layoutVersion: String
    let axes: [TasteExperienceAxisContract]
    let entries: [Entry]
    let archivedEntries: [Entry]?
    let families: [Family]
    let profiles: [Profile]
    let overlays: [Overlay]
    let contextFlags: [ContextFlag]
    let contextDerivations: [Derivation]
    let contextRules: [Rule]
    let compatibleProfilePairs: [[String]]
    let layout: Layout

    static let shared: Self? = {
        guard let url = Bundle.main.url(forResource: "dining-sensory-v2", withExtension: "json", subdirectory: "TBA")
            ?? Bundle.main.url(forResource: "dining-sensory-v2", withExtension: "json") else { return nil }
        return try? load(from: url)
    }()
    static func load(from url: URL) throws -> Self { try JSONDecoder().decode(Self.self, from: Data(contentsOf: url)) }
    func entry(_ id: String) -> Entry? { entries.first { $0.id == id } }
    /// Resolve the recorded definition, not merely today's wording for the same ID.
    func definition(for selection: DiningSensorySelection) -> Entry? {
        guard selection.catalogVersion == version, let revision = selection.definitionVersion else { return nil }
        return (entries + (archivedEntries ?? [])).first {
            $0.id == selection.id && $0.type == selection.type.rawValue && $0.definitionVersion == revision
        }
    }
    func matchesQuery(_ query: String, id: String) -> Bool {
        guard let entry = entry(id) else { return false }
        let text = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return ([entry.label, entry.description] + (entry.searchAliases ?? [])).contains {
            $0.localizedCaseInsensitiveContains(text)
        }
    }
    private func unique(_ ids: [String]) -> [String] { var seen = Set<String>(); return ids.filter { seen.insert($0).inserted } }

    func presentation(menu: String, dishKindIDs: [String], profileSelection: [String]? = nil, flagOverrides: [String: String] = [:]) -> DiningSensoryPresentation {
        let matched = contextRules.filter { $0.matches(menu: menu.lowercased(), kinds: dishKindIDs) }.sorted {
            $0.priority == $1.priority ? $0.id < $1.id : $0.priority > $1.priority
        }
        let suggested = unique(matched.compactMap(\.profileId))
        var profileIds = profileSelection.map { unique($0.filter { id in profiles.contains { $0.id == id } }) } ?? suggested
        let compatible = profileIds.enumerated().allSatisfy { index, left in
            profileIds.dropFirst(index + 1).allSatisfy { right in compatibleProfilePairs.contains { $0.contains(left) && $0.contains(right) } }
        }
        let ambiguous = profileIds.count > 1 && !compatible
        if profileIds.isEmpty || ambiguous || profileIds.contains("generic") { profileIds = ["generic"] }
        var flags = Dictionary(uniqueKeysWithValues: unique(matched.flatMap(\.flags)).map { ($0, "confirmed") })
        flags.merge(flagOverrides) { _, new in new }
        for rule in contextDerivations where flags[rule.ifConfirmed] == "confirmed" {
            if ["explicitly_rejected", "conflicting"].contains(flags[rule.mayConfirm] ?? "") {
                flags[rule.ifConfirmed] = "conflicting"; flags[rule.mayConfirm] = "conflicting"
            } else if flags[rule.mayConfirm] == nil || flags[rule.mayConfirm] == "unknown" { flags[rule.mayConfirm] = "confirmed" }
        }
        var result = DiningSensoryPresentation(catalogVersion: version, sourceVersion: sourceVersion, layoutVersion: layoutVersion,
            profileIds: profileIds, profileSelection: profileSelection, flagOverrides: flagOverrides, contextFlags: flags,
            contextSource: profileSelection == nil ? "menu_and_kind_rules" : "user_selection", matchedRuleIds: matched.map(\.id),
            suggestedProfileIds: suggested, ambiguous: ambiguous, orderedBubbleIDs: [], offeredDetailIDs: [])
        result.orderedBubbleIDs = orderedBubbleIDs(result)
        result.offeredDetailIDs = categories(result).flatMap { $0.tags.map(\.id) }
        return result
    }

    func categories(_ context: DiningSensoryPresentation) -> [DiningFeedbackTagCategoryContract] {
        let selected = context.profileIds.compactMap { id in profiles.first { $0.id == id } }
        guard let primary = selected.first ?? profiles.first else { return [] }
        var labels = primary.categoryLabels
        var pools = Dictionary(uniqueKeysWithValues: families.map { ($0.id, [String]()) })
        func append(_ id: String?) {
            guard let id, let family = entry(id)?.familyId, pools[family]?.contains(id) == false else { return }
            pools[family, default: []].append(id)
        }
        for profile in selected {
            for ids in profile.familyTagPools.values { ids.forEach { append($0) } }
            for condition in profile.conditionalTagAdditions where condition.matches(profile, flags: context.contextFlags) { append(condition.id) }
        }
        for overlay in overlays where context.contextFlags[overlay.requiresContextFlag] == "confirmed" {
            labels.merge(overlay.categoryLabels) { _, new in new }
            overlay.addTagIds.forEach { append($0) }
            for condition in overlay.conditionalTagAdditions ?? [] where selected.contains(where: { condition.matches($0, flags: context.contextFlags) }) { append(condition.id) }
            for condition in overlay.categoryLabelOverrides ?? [] where condition.matches(primary, flags: context.contextFlags) {
                labels.merge(condition.categoryLabels ?? [:]) { _, new in new }
            }
        }
        let promoted = unique(overlays.filter { context.contextFlags[$0.requiresContextFlag] == "confirmed" }.flatMap { $0.promoteTagIds ?? [] })
        for id in promoted.reversed() {
            guard let family = entry(id)?.familyId, pools[family]?.contains(id) == true else { continue }
            pools[family] = [id] + (pools[family] ?? []).filter { $0 != id }
        }
        return primary.categoryOrder.map { id in
            .init(id: id, label: labels[id] ?? id, tags: (pools[id] ?? []).compactMap { entry($0).map { .init(id: $0.id, label: $0.label) } })
        }
    }

    func orderedBubbleIDs(_ context: DiningSensoryPresentation) -> [String] {
        var promotions = [String]()
        for id in context.profileIds {
            guard let profile = profiles.first(where: { $0.id == id }) else { continue }
            promotions += profile.bubblePromoteIds
            promotions += profile.conditionalBubblePromotions.filter { $0.matches(profile, flags: context.contextFlags) }.compactMap(\.id)
        }
        for overlay in overlays where context.contextFlags[overlay.requiresContextFlag] == "confirmed" { promotions += overlay.bubblePromoteIds }
        return axes.flatMap { axis -> [String] in
            var ids = axis.words.map { $0.id ?? "\(axis.id.rawValue)-\($0.key)" }
            let preferred = unique(promotions).filter { ids.contains($0) && entry($0)?.fixedAnchor != true }.prefix(2)
            for (index, id) in preferred.enumerated() {
                if let from = ids.firstIndex(of: id) { ids.swapAt(from, index + 1) }
            }
            return ids
        }
    }

    func isValid(_ presentation: DiningSensoryPresentation) -> Bool {
        guard presentation.catalogVersion == version, presentation.layoutVersion == layoutVersion,
              presentation.orderedBubbleIDs.count == 160, Set(presentation.orderedBubbleIDs).count == 160,
              !presentation.profileIds.isEmpty,
              presentation.profileIds.allSatisfy({ id in profiles.contains { $0.id == id } }) else { return false }
        var offset = 0
        for axis in axes {
            let slice = Array(presentation.orderedBubbleIDs.dropFirst(offset).prefix(axis.words.count))
            guard slice.first == axis.words.first?.id,
                  slice.allSatisfy({ entry($0)?.axis == axis.id.rawValue }) else { return false }
            offset += axis.words.count
        }
        return true
    }

    func displayAxes(_ presentation: DiningSensoryPresentation?, preserving selections: [DiningSensorySelection] = []) -> [TasteExperienceAxisContract] {
        let order = presentation.flatMap { isValid($0) ? $0.orderedBubbleIDs : nil }
        var preserved: [String: Entry] = [:]
        for selection in selections where selection.type == .bubble && selection.unparsedPayload == nil {
            if let old = definition(for: selection), old.label == selection.labelSnapshot { preserved[selection.id] = old }
        }
        return axes.map { axis in
            let orderedWords = order.map { ids in ids.compactMap { id in axis.words.first { $0.id == id } } } ?? axis.words
            let words = orderedWords.map { word -> TasteExperienceWordContract in
                guard let id = word.id, let old = preserved[id] else { return word }
                return .init(angleOffset: word.angleOffset, intensity: word.intensity, key: word.key,
                    label: old.label, description: old.description, radiusOffset: word.radiusOffset, id: id)
            }
            return .init(id: axis.id, label: axis.label, angle: axis.angle, words: words)
        }
    }

    func selection(_ id: String, relatedBubble: DiningSensorySelection? = nil, instanceID: String = UUID().uuidString) -> DiningSensorySelection? {
        guard let definition = entry(id) else { return nil }
        let linked = definition.bindingMode == "modifier" ? relatedBubble : nil
        var selection = DiningSensorySelection(id: id, type: .init(rawValue: definition.type), catalogVersion: version, labelSnapshot: definition.label,
            target: .init(rawValue: definition.intrinsicTarget ?? (linked == nil ? "whole_dish" : "unspecified")),
            phase: .init(rawValue: definition.intrinsicPhase ?? "unspecified"), relatedBubbleID: linked?.id)
        selection.selectionInstanceID = instanceID
        selection.definitionVersion = definition.definitionVersion
        selection.bindingMode = definition.bindingMode
        selection.scopeKind = linked != nil ? "bubble" : definition.bindingMode == "relation" ? "relation" : definition.intrinsicTarget != nil ? "component" : "whole_dish"
        selection.relatedBubbleLabelSnapshot = linked?.labelSnapshot
        return selection
    }
}

extension DiningSelectionJSON {
    var objectValue: [String: Self] { if case .object(let value) = self { return value }; return [:] }
    var stringValue: String? { if case .string(let value) = self { return value }; return nil }
    func decoded<T: Decodable>(_ type: T.Type) -> T? { guard let data = try? JSONEncoder().encode(self) else { return nil }; return try? JSONDecoder().decode(type, from: data) }
    static func encoded<T: Encodable>(_ value: T) -> Self? { guard let data = try? JSONEncoder().encode(value) else { return nil }; return try? JSONDecoder().decode(Self.self, from: data) }
}
