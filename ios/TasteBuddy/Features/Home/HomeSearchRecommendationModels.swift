import Foundation

/// A read model of source-backed menu descriptions. These are never personal taste observations.
struct HomeSearchRecommendationCatalog: Codable, Equatable {
    static let schema = "tba-search-menu-catalog/1"
    let schemaVersion: String
    let revision: String
    let topics: [HomeSearchRecommendationTopic]
    let menus: [HomeSearchRecommendationMenu]

    static let empty = Self(schemaVersion: schema, revision: "empty", topics: [], menus: [])
    static let bundled = load()

    static func load(bundle: Bundle = .main) -> Self {
        let url = bundle.url(forResource: "search-recommendation-catalog", withExtension: "json", subdirectory: "TBA")
            ?? bundle.url(forResource: "search-recommendation-catalog", withExtension: "json")
        guard let url, let data = try? Data(contentsOf: url),
              let catalog = try? JSONDecoder().decode(Self.self, from: data),
              catalog.schemaVersion == schema else { return .empty }
        return catalog
    }

    func availableMenus(at date: Date) -> [HomeSearchRecommendationMenu] {
        guard schemaVersion == Self.schema else { return [] }
        let groups = Dictionary(grouping: menus, by: \.id)
        // Ambiguous identity is not resolved by array order.
        return groups.values.compactMap { rows in
            guard rows.count == 1, let menu = rows.first, menu.isUsable(at: date) else { return nil }
            return menu
        }.sorted { $0.id < $1.id }
    }
}

struct HomeSearchRecommendationTopic: Codable, Equatable, Identifiable {
    let id: String
    let dishKindID: String
    let generalLabel: String
    let sensoryLabel: String
    let attribute: String
    let attributeLabel: String
}

struct HomeSearchRecommendationSource: Codable, Equatable {
    let id: String
    let kind: String
    let url: String
    let checkedAt: String
    let reviewAfter: String
    let excerpt: String

    var link: URL? {
        guard let value = URL(string: url), value.scheme == "https", value.host != nil else { return nil }
        return value
    }

    func isUsable(at date: Date) -> Bool {
        guard kind == "official_menu_description", link != nil, !id.isEmpty, !excerpt.isEmpty,
              let checked = PersonalTasteModelBuilder.date(checkedAt),
              let expiry = PersonalTasteModelBuilder.date(reviewAfter) else { return false }
        return checked <= date && date < expiry
    }
}

struct HomeSearchRecommendationFeature: Codable, Equatable, Hashable {
    let attribute: String
    let reference: String?
    let target: String
    let phase: String
    let intensity: String?
    let sourceExcerpt: String

    var query: PersonalTasteQuery {
        .init(attribute: attribute, reference: reference,
              target: target == "unspecified" ? nil : target,
              phase: phase == "unspecified" ? nil : phase, intensity: intensity)
    }

    /// A claim includes the complete observed scope, rather than only the sensory word.
    func satisfies(_ claim: Self) -> Bool {
        attribute == claim.attribute && reference == claim.reference
            && target == claim.target && phase == claim.phase && intensity == claim.intensity
    }
}

struct HomeSearchRecommendationMenu: Codable, Equatable, Identifiable {
    let id: String
    let revision: String
    let title: String
    let restaurantName: String
    let restaurantQuery: String
    let dishKindIDs: [String]
    let availability: String
    let source: HomeSearchRecommendationSource
    let features: [HomeSearchRecommendationFeature]

    func isUsable(at date: Date) -> Bool {
        !id.isEmpty && !revision.isEmpty && !title.isEmpty && !restaurantName.isEmpty
            && !restaurantQuery.isEmpty && !dishKindIDs.isEmpty
            && availability == "unconfirmed" && source.isUsable(at: date)
    }

    func verifiedFeatures(for attribute: String) -> [HomeSearchRecommendationFeature] {
        features.filter {
            $0.attribute == attribute && !$0.sourceExcerpt.isEmpty
                && source.excerpt.contains($0.sourceExcerpt)
                && [nil, "weak", "medium", "strong"].contains($0.intensity)
        }
    }
}

struct HomeSearchRecommendationSavedPlace: Equatable, Identifiable {
    let id: String
    let name: String
}

struct HomeSearchRecommendationContext: Equatable {
    let accountGeneration: UUID
    let evidenceGeneration: UUID
    let profileUserID: String
    let analysisReady: Bool
}

enum HomeSearchRecommendationBasis: String, Equatable {
    case taste, general, saved
}

struct HomeSearchRecommendationIntent: Equatable, Identifiable {
    enum Route: Equatable {
        case menus(dishKindID: String, requiredDishKindIDs: [String], claim: HomeSearchRecommendationFeature?)
        case savedPlaces
    }

    let id: String
    let label: String
    let basis: HomeSearchRecommendationBasis
    let reason: String
    let route: Route
    let evidenceIDs: [String]
    let selectionInstanceIDs: [String]
    let resultIDs: [String]
    let menuRevisions: [String: String]
    let context: HomeSearchRecommendationContext
    let policyVersion: String
    let catalogRevision: String
    let createdAt: Date
    let expiresAt: Date
}

struct HomeSearchRecommendationExecution: Equatable {
    enum Status: Equatable { case ready, reduced, empty, stale }
    let status: Status
    let menus: [HomeSearchRecommendationMenu]
    let savedPlaces: [HomeSearchRecommendationSavedPlace]

    static let stale = Self(status: .stale, menus: [], savedPlaces: [])

    /// Feed the existing search list without turning the display label into a text query.
    var searchSections: [HomeSearchResultSection] {
        guard status == .ready || status == .reduced else { return [] }
        var sections: [HomeSearchResultSection] = []
        if !menus.isEmpty {
            sections.append(.init(
                id: "menus", title: "메뉴", subtitle: "메뉴를 선택하면 식당을 찾을 수 있어요.",
                items: menus.map { menu in
                    HomeSearchResultItem(
                        id: "recommended-menu:\(menu.id)", kind: .menu, title: menu.title,
                        subtitle: menu.restaurantName, detail: "\(menu.restaurantName) 식당 검색",
                        symbol: "sparkles", axis: .umami
                    )
                }
            ))
        }
        if !savedPlaces.isEmpty {
            sections.append(.init(
                id: "restaurants", title: "레스토랑", subtitle: "저장한 식당을 다시 찾아보세요.",
                items: savedPlaces.map { place in
                    HomeSearchResultItem(
                        id: "recommended-place:\(place.id)", kind: .restaurant, title: place.name,
                        subtitle: "저장한 식당", detail: "\(place.name) 식당 검색",
                        symbol: "store", axis: .umami
                    )
                }
            ))
        }
        return sections
    }

    func restaurantQuery(forResultID id: String) -> String? {
        guard status == .ready || status == .reduced else { return nil }
        if let menu = menus.first(where: { "recommended-menu:\($0.id)" == id }) {
            return menu.restaurantQuery
        }
        return savedPlaces.first(where: { "recommended-place:\($0.id)" == id })?.name
    }
}

/// Reads the existing TBA model; it does not recalculate liking or change TBA's support policy.
enum HomeSearchRecommendationEngine {
    static let policyVersion = "tba-search-recommendation/1"
    static let maxSuggestions = 4
    static let intentLifetime: TimeInterval = 300

    private struct PersonalMatch {
        let direction: String
        let evidenceIDs: [String]
        let instanceIDs: [String]
        let supportingMeals: Int
        let requiredDishKindIDs: [String]
    }

    static func suggestions(
        catalog: HomeSearchRecommendationCatalog,
        profile: PersonalTasteModelSnapshot?,
        context: HomeSearchRecommendationContext,
        savedPlaces: [HomeSearchRecommendationSavedPlace] = [],
        now: Date = .now
    ) -> [HomeSearchRecommendationIntent] {
        let profile = currentProfile(profile, context: context)
        let menus = catalog.availableMenus(at: now)
        let topics = Dictionary(grouping: catalog.topics, by: \.id).values
            .compactMap { $0.count == 1 ? $0.first : nil }.sorted { $0.id < $1.id }
        var candidates: [HomeSearchRecommendationIntent] = []

        for topic in topics {
            let familyMenus = menus.filter { $0.dishKindIDs.contains(topic.dishKindID) }
            let eligible = familyMenus.filter { menu in
                // Explicit, applicable dislike prevents a proactive suggestion of the same feature.
                !menu.verifiedFeatures(for: topic.attribute).contains { feature in
                    personalMatch(profile, feature: feature, dishKindID: topic.dishKindID,
                                  menuDishKindIDs: menu.dishKindIDs)?.direction == "negative"
                }
            }
            guard !eligible.isEmpty else { continue }

            var personal: [HomeSearchRecommendationIntent] = []
            let featureGroups = Dictionary(grouping: eligible.flatMap { $0.verifiedFeatures(for: topic.attribute) }, by: featureKey)
            let features = featureGroups.keys.sorted().compactMap { key in
                featureGroups[key]?.sorted { $0.sourceExcerpt < $1.sourceExcerpt }.first
            }
            for feature in features {
                let matched = eligible.compactMap { menu -> (HomeSearchRecommendationMenu, PersonalMatch)? in
                    guard menu.verifiedFeatures(for: topic.attribute).contains(where: { $0.satisfies(feature) }),
                          let match = personalMatch(profile, feature: feature, dishKindID: topic.dishKindID,
                                                    menuDishKindIDs: menu.dishKindIDs),
                          match.direction == "positive" else { return nil }
                    return (menu, match)
                }
                guard let match = matched.first?.1 else { continue }
                let matches = matched.map(\.0)
                let label = matches.count == 1 ? matches[0].title : topic.sensoryLabel
                personal.append(makeIntent(
                    id: "taste:\(topic.id):\(featureKey(feature))", label: label, basis: .taste,
                    reason: "\(match.supportingMeals)번의 식사에서 \(topic.attributeLabel)를 좋게 기록한 근거를 참고했어요.",
                    route: .menus(dishKindID: topic.dishKindID, requiredDishKindIDs: match.requiredDishKindIDs, claim: feature),
                    resultIDs: matches.map(\.id), evidenceIDs: match.evidenceIDs,
                    instanceIDs: match.instanceIDs, catalog: catalog, context: context, now: now
                ))
            }

            candidates += personal
            candidates.append(makeIntent(
                id: "general:\(topic.id)",
                label: eligible.count == 1 ? eligible[0].title : topic.generalLabel,
                basis: .general, reason: "공식 메뉴에 소개된 음식을 둘러보세요.",
                route: .menus(dishKindID: topic.dishKindID, requiredDishKindIDs: [topic.dishKindID], claim: nil),
                resultIDs: eligible.map(\.id), catalog: catalog, context: context, now: now
            ))
        }

        let saved = uniqueSavedPlaces(savedPlaces)
        if !saved.isEmpty {
            candidates.append(makeIntent(
                id: "saved-places", label: saved.count == 1 ? saved[0].name : "저장한 식당",
                basis: .saved, reason: "저장해 둔 식당을 다시 살펴보세요.", route: .savedPlaces,
                resultIDs: saved.map(\.id), catalog: catalog, context: context, now: now
            ))
        }

        let sorted = candidates.sorted {
            let left = priority($0.basis), right = priority($1.basis)
            return left == right ? $0.id < $1.id : left < right
        }
        var selected: [HomeSearchRecommendationIntent] = []
        for candidate in sorted {
            let overlapping = selected.contains { previous in
                guard case .menus = previous.route, case .menus = candidate.route else { return false }
                let left = Set(previous.resultIDs), right = Set(candidate.resultIDs)
                let union = left.union(right)
                return !union.isEmpty && Double(left.intersection(right).count) / Double(union.count) >= 0.7
            }
            if !overlapping { selected.append(candidate) }
            if selected.count == maxSuggestions { break }
        }
        return selected
    }

    /// The selected predicates are rechecked against current source data. No text search fallback.
    static func execute(
        _ intent: HomeSearchRecommendationIntent,
        catalog: HomeSearchRecommendationCatalog,
        context: HomeSearchRecommendationContext,
        savedPlaces: [HomeSearchRecommendationSavedPlace] = [],
        now: Date = .now
    ) -> HomeSearchRecommendationExecution {
        guard intent.context == context, intent.policyVersion == policyVersion,
              intent.createdAt <= now, now < intent.expiresAt,
              catalog.schemaVersion == HomeSearchRecommendationCatalog.schema else { return .stale }

        switch intent.route {
        case .menus(let dishKindID, let requiredDishKindIDs, let claim):
            // Freeze the candidate identities for this short-lived intent, while revalidating every claim.
            let expected = Set(intent.resultIDs)
            let menus = catalog.availableMenus(at: now).filter { menu in
                guard expected.contains(menu.id), menu.dishKindIDs.contains(dishKindID),
                      intent.menuRevisions[menu.id] == menu.revision,
                      Set(requiredDishKindIDs).isSubset(of: Set(menu.dishKindIDs)) else { return false }
                guard let claim else { return true }
                return menu.verifiedFeatures(for: claim.attribute).contains { $0.satisfies(claim) }
            }
            return .init(status: resultStatus(count: menus.count, expected: expected.count), menus: menus, savedPlaces: [])
        case .savedPlaces:
            let expected = Set(intent.resultIDs)
            let places = uniqueSavedPlaces(savedPlaces).filter { expected.contains($0.id) }
            return .init(status: resultStatus(count: places.count, expected: expected.count), menus: [], savedPlaces: places)
        }
    }

    private static func currentProfile(_ profile: PersonalTasteModelSnapshot?, context: HomeSearchRecommendationContext) -> PersonalTasteModelSnapshot? {
        guard context.analysisReady, let profile, profile.userID == context.profileUserID else { return nil }
        return profile
    }

    private static func personalMatch(
        _ profile: PersonalTasteModelSnapshot?, feature: HomeSearchRecommendationFeature,
        dishKindID: String, menuDishKindIDs: [String]
    ) -> PersonalMatch? {
        guard let profile else { return nil }
        var query = feature.query
        query.dishKindIDs = [dishKindID]
        let prediction = PersonalTasteModelBuilder.predict(profile, query: query)
        guard prediction.status == "observed_condition_direction", let direction = prediction.direction,
              let candidateID = prediction.candidateID,
              let candidate = profile.candidates.first(where: { $0.id == candidateID }),
              candidate.status == "repeated_direction", candidate.direction == direction else { return nil }

        let evidenceIDs = Set(prediction.evidenceIDs)
        let units = profile.units.filter { !$0.evidenceIDs.isEmpty && !evidenceIDs.isDisjoint(with: $0.evidenceIDs) }
        guard !units.isEmpty else { return nil }
        let knownMenuKinds = Set(menuDishKindIDs)
        // A broad TBA candidate must not hide a known condition missing from the menu description.
        // In particular, "strong heat liked" cannot become an unqualified spicy-menu endorsement.
        guard units.allSatisfy({ unit in
            unit.attribute == feature.attribute && unit.reference == feature.reference
                && unit.dishKindIDs.contains(dishKindID)
                && Set(unit.dishKindIDs).isSubset(of: knownMenuKinds)
                && !unit.intensityConflict
                && (unit.target == "unspecified" || unit.target == feature.target)
                && (unit.phase == "unspecified" || unit.phase == feature.phase)
                && (unit.intensity == nil || unit.intensity == feature.intensity)
        }) else { return nil }
        let support = Set(units.filter { $0.liking == direction }.map(\.mealID))
        let instances = Set(units.flatMap(\.evidence).compactMap { $0.selectionEvidence?.selectionInstanceID })
        return .init(direction: direction, evidenceIDs: prediction.evidenceIDs.sorted(),
                     instanceIDs: instances.sorted(), supportingMeals: support.count,
                     requiredDishKindIDs: Set(units.flatMap(\.dishKindIDs)).sorted())
    }

    private static func makeIntent(
        id: String, label: String, basis: HomeSearchRecommendationBasis, reason: String,
        route: HomeSearchRecommendationIntent.Route, resultIDs: [String],
        evidenceIDs: [String] = [], instanceIDs: [String] = [],
        catalog: HomeSearchRecommendationCatalog, context: HomeSearchRecommendationContext, now: Date
    ) -> HomeSearchRecommendationIntent {
        let menuRevisions = catalog.menus.reduce(into: [String: String]()) { values, menu in
            if resultIDs.contains(menu.id) { values[menu.id] = menu.revision }
        }
        return .init(id: id, label: label, basis: basis, reason: reason, route: route,
              evidenceIDs: evidenceIDs, selectionInstanceIDs: instanceIDs, resultIDs: resultIDs.sorted(),
              menuRevisions: menuRevisions,
              context: context, policyVersion: policyVersion, catalogRevision: catalog.revision,
              createdAt: now, expiresAt: now.addingTimeInterval(intentLifetime))
    }

    private static func uniqueSavedPlaces(_ places: [HomeSearchRecommendationSavedPlace]) -> [HomeSearchRecommendationSavedPlace] {
        Dictionary(grouping: places.filter { !$0.id.isEmpty && !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }, by: \.id)
            .values.compactMap { rows in
                guard let first = rows.first, rows.allSatisfy({ $0.name == first.name }) else { return nil }
                return first
            }.sorted { $0.id < $1.id }
    }

    private static func featureKey(_ feature: HomeSearchRecommendationFeature) -> String {
        [feature.attribute, feature.reference ?? "", feature.target, feature.phase, feature.intensity ?? "unknown"].joined(separator: ":")
    }
    private static func priority(_ basis: HomeSearchRecommendationBasis) -> Int {
        switch basis { case .taste: 0; case .saved: 1; case .general: 2 }
    }
    private static func resultStatus(count: Int, expected: Int) -> HomeSearchRecommendationExecution.Status {
        count == 0 ? .empty : count < expected ? .reduced : .ready
    }
}
