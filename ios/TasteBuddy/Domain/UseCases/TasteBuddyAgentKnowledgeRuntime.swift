import Foundation

enum TasteBuddyAgentKnowledgeRuntime {
    struct DiningCandidate {
        let categoryLabel: String
        let colorTaste: String?
        let confidence: Double
        let dishKindScore: Double
        let entry: TasteBuddyAgentCoreLexiconEntry
        let foodKnowledgeScore: Double
        let foodOnScore: Double
        let isDetailTag: Bool
        let isTasteBubble: Bool
        let profileScore: Double
        let score: Double
        let textScore: Double
    }

    struct DiningMapping {
        let candidates: [DiningCandidate]
        let confidence: Double
        let foodKnowledgeMatches: [TasteBuddyAgentFoodKnowledgeMatch]
        let foodOnMatches: [TasteBuddyAgentFoodOnMatch]
        let perceptualVector: [String: Double]
        let tbaSignalIds: [String]
        let tasteVector: [String: Double]
    }

    private static let canonicalDishKindAliases: [String: String] = [
        "beef": "meat", "beverage": "beverage_pairing", "braised": "steamed_braised",
        "bread": "grain_noodle", "broth": "broth", "chocolate": "dessert",
        "crustacean": "seafood", "cured": "raw_cured", "dairy": "dairy_cheese",
        "dessert": "dessert", "dumpling": "dumpling_batter", "fermented": "fermented_jang",
        "fish": "seafood", "foam": "dessert", "fried": "fried_crispy",
        "fruit": "dessert", "garnish": "vegetable_herb", "grain": "grain_noodle",
        "grilled": "grilled_smoked", "herb": "vegetable_herb", "leafyGreen": "vegetable_herb",
        "meat": "meat", "mushroom": "vegetable_herb", "noodle": "grain_noodle",
        "nut": "dessert", "pickled": "raw_cured", "pork": "meat",
        "poultry": "meat", "powder": "dessert", "roasted": "grilled_smoked",
        "rootVegetable": "vegetable_herb", "salad": "vegetable_herb", "sauce": "sauce_glaze",
        "scallop": "seafood", "seafood": "seafood", "seaweed": "seafood",
        "shellfish": "seafood", "smoked": "grilled_smoked", "soy": "legume_tofu",
        "spice": "spice_heat", "steamed": "steamed_braised",
        "tea": "beverage_pairing", "tofu": "legume_tofu",
        "vegetable": "vegetable_herb", "wine": "beverage_pairing",
        "cold": "cold", "dairy_cheese": "dairy_cheese", "dumpling_batter": "dumpling_batter",
        "fermented_jang": "fermented_jang", "fried_crispy": "fried_crispy",
        "grain_noodle": "grain_noodle", "grilled_smoked": "grilled_smoked",
        "legume_tofu": "legume_tofu", "raw_cured": "raw_cured",
        "sauce_glaze": "sauce_glaze", "spice_heat": "spice_heat",
        "steamed_braised": "steamed_braised", "stir_fried_wok": "stir_fried_wok",
        "vegetable_herb": "vegetable_herb", "beverage_pairing": "beverage_pairing",
    ]

    private static let surfaceThresholds: [TasteBuddyAgentKnowledgeSurface: Double] = [
        .tasteBubble: 0.45,
        .detailTag: 0.45,
        .diningNote: 0.5,
        .recommendation: 0.72,
        .chefGuide: 0.78,
        .tcs: 0.5,
    ]

    static let bundle: TasteBuddyAgentKnowledgeBundle = {
        do {
            let url = try resourceURL(named: "tba-native-runtime")
            return try JSONDecoder().decode(
                TasteBuddyAgentKnowledgeBundle.self,
                from: Data(contentsOf: url)
            )
        } catch {
            assertionFailure("Unable to load TBA native runtime: \(error)")
            return TasteBuddyAgentKnowledgeBundle(
                agent: .init(alias: "TBA", capabilities: [], displayName: "TasteBuddyAgent"),
                coreTasteLexicon: .init(entries: [], minActiveConfidence: 0.42, version: "0.1"),
                foodKnowledgeRuntime: .init(
                    entries: [],
                    sourceCount: 0,
                    sourcePath: "",
                    version: "0.1"
                ),
                foodOnBridge: .init(
                    entries: [],
                    referenceLicense: "CC BY 4.0",
                    referencePath: "",
                    version: "0.1"
                ),
                schemaVersion: 1,
                signalTaxonomy: []
            )
        }
    }()

    static let fullFoodKnowledgeEntries: [TasteBuddyAgentFoodKnowledgeEntry] = {
        do {
            let url = try resourceURL(named: "tba-food-knowledge-full")
            return try JSONDecoder().decode(
                TasteBuddyAgentFullFoodKnowledgeBundle.self,
                from: Data(contentsOf: url)
            ).items
        } catch {
            assertionFailure("Unable to load full TBA food knowledge: \(error)")
            return bundle.foodKnowledgeRuntime.entries
        }
    }()

    static var coreTasteLexicon: [TasteBuddyAgentCoreLexiconEntry] {
        bundle.coreTasteLexicon.entries
    }

    static var signalTaxonomy: [TasteBuddyAgentSignalDefinition] {
        bundle.signalTaxonomy
    }

    static var foodOnBridgeEntries: [TasteBuddyAgentFoodOnEntry] {
        bundle.foodOnBridge.entries
    }

    static var runtimeFoodKnowledgeEntries: [TasteBuddyAgentFoodKnowledgeEntry] {
        bundle.foodKnowledgeRuntime.entries
    }

    static func signal(byId id: String) -> TasteBuddyAgentSignalDefinition? {
        signalTaxonomy.first { $0.id == id }
    }

    static func foodOnEntry(byId id: String) -> TasteBuddyAgentFoodOnEntry? {
        foodOnBridgeEntries.first { $0.id == id }
    }

    static func foodKnowledgeEntry(
        byId id: String,
        useFullCatalog: Bool = false
    ) -> TasteBuddyAgentFoodKnowledgeEntry? {
        let entries = useFullCatalog ? fullFoodKnowledgeEntries : runtimeFoodKnowledgeEntries
        return entries.first { $0.id == id }
    }

    static func findSignals(
        text: String,
        domains: Set<String> = [],
        includeRetired: Bool = false,
        limit: Int = 8,
        minScore: Double = 0.5
    ) -> [TasteBuddyAgentSignalMatch] {
        signalTaxonomy
            .filter { includeRetired || $0.status != "retired" }
            .filter { domains.isEmpty || domains.contains($0.domain) }
            .compactMap { definition -> TasteBuddyAgentSignalMatch? in
                guard let match = textMatch(
                    value: text,
                    labels: [
                        definition.id,
                        definition.id.split(separator: ":").last.map(String.init) ?? definition.id,
                        definition.label,
                    ] + definition.aliases + (definition.lexiconIds ?? []),
                    searchableText: [
                        definition.id,
                        definition.label,
                        definition.description,
                    ].joined(separator: " ") + " " + definition.aliases.joined(separator: " ")
                ), match.score >= minScore else {
                    return nil
                }

                return TasteBuddyAgentSignalMatch(
                    definition: definition,
                    matchedAlias: match.label,
                    score: match.score
                )
            }
            .sorted {
                $0.score != $1.score
                    ? $0.score > $1.score
                    : $0.definition.confidence != $1.definition.confidence
                        ? $0.definition.confidence > $1.definition.confidence
                        : $0.definition.label.localizedCompare($1.definition.label) == .orderedAscending
            }
            .prefix(limit)
            .map(\.self)
    }

    static func mapTagsToSignals(
        _ tags: [String],
        domains: Set<String> = [],
        limitPerTag: Int = 1,
        source: String = "manual"
    ) -> TasteBuddyAgentSignalMappingResult {
        var mapped: [TasteBuddyAgentMappedSignal] = []
        var unmapped: [TasteBuddyAgentUnmappedTag] = []

        for tag in tags.map(trimmed).filter({ !$0.isEmpty }) {
            let matches = findSignals(
                text: tag,
                domains: domains,
                limit: limitPerTag
            )
            guard !matches.isEmpty else {
                unmapped.append(.init(source: source, value: tag))
                continue
            }

            for match in matches {
                upsertMappedSignal(
                    .init(
                        definition: match.definition,
                        matchedAlias: match.matchedAlias,
                        score: match.score,
                        source: source,
                        sourceLabel: tag
                    ),
                    into: &mapped
                )
            }
        }

        return signalMappingResult(mapped: mapped, unmapped: unmapped)
    }

    static func mapFeedbackInputToSignals(
        detailTags: [String] = [],
        dishKindTags: [String] = [],
        lexiconIds: [String] = [],
        tasteTags: [String] = []
    ) -> TasteBuddyAgentSignalMappingResult {
        var mapped: [TasteBuddyAgentMappedSignal] = []
        var unmapped: [TasteBuddyAgentUnmappedTag] = []

        for kindId in dishKindTags.map(trimmed).filter({ !$0.isEmpty }) {
            guard let definition = signal(byId: "dish-kind:\(kindId)"),
                  definition.status != "retired" else {
                unmapped.append(.init(source: "dish-kind-tag", value: dishKindLabel(kindId)))
                continue
            }
            upsertMappedSignal(
                .init(
                    definition: definition,
                    matchedAlias: kindId,
                    score: 1,
                    source: "dish-kind-tag",
                    sourceLabel: dishKindLabel(kindId)
                ),
                into: &mapped
            )
        }

        let taste = mapTagsToSignals(
            tasteTags,
            domains: ["taste-bubble", "intensity", "sentiment"],
            limitPerTag: 2,
            source: "taste-tag"
        )
        let detail = mapTagsToSignals(
            detailTags,
            domains: [
                "perceptual-detail", "ingredient-kind", "cooking-process",
                "intensity", "sentiment",
            ],
            limitPerTag: 2,
            source: "detail-tag"
        )
        (taste.mappedSignals + detail.mappedSignals).forEach {
            upsertMappedSignal($0, into: &mapped)
        }
        unmapped += taste.unmappedTags + detail.unmappedTags

        for lexiconId in lexiconIds {
            guard let definition = signal(byId: "lexicon:\(lexiconId)"),
                  definition.status != "retired" else {
                continue
            }
            upsertMappedSignal(
                .init(
                    definition: definition,
                    matchedAlias: lexiconId,
                    score: 1,
                    source: "core-lexicon",
                    sourceLabel: lexiconId
                ),
                into: &mapped
            )
        }

        mapped.sort {
            $0.score != $1.score
                ? $0.score > $1.score
                : $0.definition.confidence != $1.definition.confidence
                    ? $0.definition.confidence > $1.definition.confidence
                    : $0.definition.label.localizedCompare($1.definition.label) == .orderedAscending
        }
        return signalMappingResult(mapped: mapped, unmapped: unmapped)
    }

    static func findFoodOnEntries(
        text: String,
        limit: Int = 8,
        minScore: Double = 0.5
    ) -> [TasteBuddyAgentFoodOnMatch] {
        foodOnBridgeEntries
            .compactMap { entry -> TasteBuddyAgentFoodOnMatch? in
                let labels = [
                    entry.id,
                    entry.koName,
                    entry.canonicalName,
                    entry.familyId ?? "",
                ] + entry.aliases
                guard let match = textMatch(
                    value: text,
                    labels: labels,
                    searchableText: [
                        entry.koName,
                        entry.canonicalName,
                        entry.description,
                        entry.familyId ?? "",
                    ].joined(separator: " ") + " " + entry.aliases.joined(separator: " ")
                ), match.score >= minScore else {
                    return nil
                }
                return .init(entry: entry, matchedAlias: match.label, score: match.score)
            }
            .sorted {
                $0.score != $1.score
                    ? $0.score > $1.score
                    : $0.entry.koName.localizedCompare($1.entry.koName) == .orderedAscending
            }
            .prefix(limit)
            .map(\.self)
    }

    static func mapFoodOnInput(
        dishKindTags: [String] = [],
        ingredients: [String] = [],
        menuText: String = "",
        techniques: [String] = []
    ) -> TasteBuddyAgentFoodOnMappingResult {
        let terms = ([menuText] + ingredients + techniques + dishKindTags.map(dishKindLabel))
            .map(trimmed)
            .filter { !$0.isEmpty }
        var matches: [TasteBuddyAgentFoodOnMatch] = []
        var unmapped: [String] = []

        for term in terms {
            let termMatches = findFoodOnEntries(text: term, limit: 4)
            if termMatches.isEmpty {
                unmapped.append(term)
            }
            for match in termMatches {
                if let index = matches.firstIndex(where: { $0.entry.id == match.entry.id }) {
                    if match.score > matches[index].score {
                        matches[index] = match
                    }
                } else {
                    matches.append(match)
                }
            }
        }

        matches.sort {
            $0.score != $1.score
                ? $0.score > $1.score
                : $0.entry.koName.localizedCompare($1.entry.koName) == .orderedAscending
        }
        let signalIds = unique(
            matches.flatMap(\.entry.tbaSignalIds).filter { signal(byId: $0) != nil }
        )
        return .init(matches: matches, tbaSignalIds: signalIds, unmappedTerms: unmapped)
    }

    static func rankFoodKnowledge(
        query: String,
        entries: [TasteBuddyAgentFoodKnowledgeEntry]? = nil,
        surface: TasteBuddyAgentKnowledgeSurface = .diningNote,
        limit: Int? = nil
    ) -> [TasteBuddyAgentFoodKnowledgeMatch] {
        let source = entries ?? runtimeFoodKnowledgeEntries
        var matches = source.compactMap { entry -> TasteBuddyAgentFoodKnowledgeMatch? in
            let textScore = foodKnowledgeTextScore(entry: entry, query: query)
            let usable = canUseFoodKnowledge(entry, surface: surface)
            guard usable, textScore > 0 else { return nil }
            return .init(
                entry: entry,
                score: rounded(entry.confidence * 0.58 + textScore * 0.42),
                textScore: textScore,
                usable: true
            )
        }
        matches.sort {
            $0.score != $1.score
                ? $0.score > $1.score
                : $0.entry.confidence != $1.entry.confidence
                    ? $0.entry.confidence > $1.entry.confidence
                    : $0.entry.koName.localizedCompare($1.entry.koName) == .orderedAscending
        }
        return limit.map { Array(matches.prefix($0)) } ?? matches
    }

    static func inferMenuContext(
        menuName: String,
        useFullCatalog: Bool = false
    ) -> TasteBuddyAgentMenuContext {
        let name = trimmed(menuName)
        guard !name.isEmpty else {
            return .init(
                confidence: 0,
                dishKindIds: [],
                foodKnowledgeMatchIds: [],
                ingredients: [],
                techniques: []
            )
        }

        let entries = useFullCatalog ? fullFoodKnowledgeEntries : runtimeFoodKnowledgeEntries
        let foodMatches = entries
            .compactMap { entry -> (entry: TasteBuddyAgentFoodKnowledgeEntry, score: Double)? in
                let score = menuNameScore(entry: entry, menuName: name)
                return score >= 0.86 && entry.status != "retired" ? (entry, score) : nil
            }
            .sorted {
                $0.score != $1.score
                    ? $0.score > $1.score
                    : $0.entry.confidence > $1.entry.confidence
            }
            .prefix(4)
        let ingredientMatches = strongestSignalMatches(name, domain: "ingredient-kind")
        let processMatches = strongestSignalMatches(name, domain: "cooking-process")
        let ingredients = unique(
            Array(foodMatches).flatMap(\.entry.ingredientSignalIds)
                .map { signal(byId: $0)?.label ?? "" }
                + ingredientMatches.map(\.definition.label),
            limit: 5
        )
        let directTechniques = unique(
            Array(foodMatches).flatMap(\.entry.processSignalIds)
                .map { signal(byId: $0)?.label ?? "" }
                + processMatches.map(\.definition.label),
            limit: 5
        )
        let inferredKinds = TasteBuddyAgent.inferDishKindIds(
            title: name,
            ingredients: ingredients,
            techniques: directTechniques
        )
        let dishKinds = unique(
            inferredKinds
                + Array(foodMatches).flatMap(\.entry.dishKindIds)
                + ingredientMatches.compactMap(\.definition.canonicalDishKindId)
                + processMatches.compactMap(\.definition.canonicalDishKindId),
            limit: 4
        )
        let techniques = unique(
            directTechniques + (dishKinds.contains("cold") ? ["차갑게"] : []),
            limit: 5
        )
        let evidence = Array(foodMatches).map { $0.entry.confidence * $0.score }
            + ingredientMatches.map { $0.definition.confidence * $0.score }
            + processMatches.map { $0.definition.confidence * $0.score }
            + (inferredKinds.isEmpty ? [] : [0.62])

        return .init(
            confidence: evidence.isEmpty ? 0 : rounded(evidence.reduce(0, +) / Double(evidence.count)),
            dishKindIds: dishKinds,
            foodKnowledgeMatchIds: Array(foodMatches).map(\.entry.id),
            ingredients: ingredients,
            techniques: techniques
        )
    }

    static func mapDiningNote(
        _ input: TasteBuddyAgentDiningAnalysisInput
    ) -> DiningMapping {
        let foodOn = mapFoodOnInput(
            dishKindTags: input.dishKindTags,
            ingredients: input.ingredients,
            menuText: ([input.subject] + input.tasteTags + input.detailTags)
                .filter { !$0.isEmpty }
                .joined(separator: " "),
            techniques: input.techniques
        )
        let baseTexts = [input.subject] + input.tasteTags + input.detailTags
            + input.ingredients + input.techniques
        let foodMatches = rankFoodKnowledge(
            query: baseTexts.joined(separator: " "),
            surface: .diningNote,
            limit: 10
        )
        let resolvedKinds = unique(
            input.dishKindTags
                + foodOn.matches.flatMap(\.entry.dishKindIds)
                + foodMatches.flatMap(\.entry.dishKindIds)
        )
        let sourceTexts = baseTexts
            + foodOn.matches.flatMap {
                [$0.matchedAlias ?? "", $0.entry.koName, $0.entry.canonicalName]
                    + $0.entry.tbaSignalIds
                    .filter { $0.hasPrefix("lexicon:") }
                    .map { $0.replacingOccurrences(of: "lexicon:", with: "").replacingOccurrences(of: "-", with: " ") }
            }
            + foodMatches.flatMap {
                [$0.entry.koName, $0.entry.canonicalName, $0.entry.foodGroup]
                    + $0.entry.aliases
                    + $0.entry.lexiconIds.map {
                        $0.replacingOccurrences(of: "lexicon:", with: "")
                            .replacingOccurrences(of: "-", with: " ")
                    }
            }
        var candidates = coreTasteLexicon.compactMap { entry -> DiningCandidate? in
            guard entry.status != "retired",
                  canUseLexicon(entry, surface: .diningNote, dishKindIds: resolvedKinds) else {
                return nil
            }
            let dishScore = lexiconDishKindScore(entry, dishKindIds: resolvedKinds)
            let textScore = lexiconTextScore(entry, sourceTexts: sourceTexts)
            let signalId = "lexicon:\(entry.id)"
            let foodOnScore = foodOn.matches.reduce(0) {
                $1.entry.tbaSignalIds.contains(signalId) ? max($0, $1.score) : $0
            }
            let foodKnowledgeScore = foodMatches.reduce(0) {
                $1.entry.lexiconIds.contains(entry.id) || $1.entry.lexiconIds.contains(signalId)
                    ? max($0, $1.score)
                    : $0
            }
            let profileScore = reviewerProfileScore(entry, profile: input.reviewerProfile)
            let baseConfidence = lexiconConfidence(entry, dishKindIds: resolvedKinds)
            let confidence = clamp(
                baseConfidence + textScore * 0.2 + foodOnScore * 0.12
                    + foodKnowledgeScore * 0.1 + profileScore * 0.06
            )
            let score = clamp(
                dishScore * 0.3 + textScore * 0.38 + foodOnScore * 0.18
                    + foodKnowledgeScore * 0.18 + confidence * 0.1 + profileScore * 0.06
            )
            guard dishScore > 0 || textScore > 0 || foodOnScore > 0 || foodKnowledgeScore > 0 else {
                return nil
            }
            let isTaste = ["taste", "ingredient", "composition"].contains(entry.category)
            let isDetail = ["finish", "texture", "aroma", "process", "composition"].contains(entry.category)
            return .init(
                categoryLabel: categoryLabel(entry.category),
                colorTaste: dominantTasteLabel(entry.tasteVector),
                confidence: confidence,
                dishKindScore: dishScore,
                entry: entry,
                foodKnowledgeScore: foodKnowledgeScore,
                foodOnScore: foodOnScore,
                isDetailTag: isDetail,
                isTasteBubble: isTaste,
                profileScore: profileScore,
                score: score,
                textScore: textScore
            )
        }
        candidates.sort {
            $0.score != $1.score
                ? $0.score > $1.score
                : $0.textScore != $1.textScore
                    ? $0.textScore > $1.textScore
                    : $0.entry.label.localizedCompare($1.entry.label) == .orderedAscending
        }
        candidates = Array(candidates.prefix(8))

        let feedback = mapFeedbackInputToSignals(
            detailTags: input.detailTags,
            dishKindTags: resolvedKinds,
            lexiconIds: candidates.map(\.entry.id),
            tasteTags: input.tasteTags
        )
        let tbaSignalIds = unique(
            foodOn.tbaSignalIds
                + foodMatches.flatMap {
                    $0.entry.ingredientSignalIds
                        + $0.entry.processSignalIds
                        + $0.entry.lexiconIds.map {
                            $0.hasPrefix("lexicon:") ? $0 : "lexicon:\($0)"
                        }
                        + $0.entry.dishKindIds.map { "dish-kind:\($0)" }
                }
                + feedback.mappedSignals.map(\.definition.id)
        )

        return .init(
            candidates: candidates,
            confidence: candidates.isEmpty
                ? 0
                : rounded(candidates.map(\.confidence).reduce(0, +) / Double(candidates.count)),
            foodKnowledgeMatches: foodMatches,
            foodOnMatches: foodOn.matches,
            perceptualVector: weightedVector(
                keys: TasteBuddyAgentPerceptualAxis.allCases.map(\.rawValue),
                candidates: candidates,
                vector: \.entry.perceptualVector
            ),
            tbaSignalIds: tbaSignalIds,
            tasteVector: weightedVector(
                keys: TasteAxis.allCases.map(\.rawValue),
                candidates: candidates,
                vector: \.entry.tasteVector
            )
        )
    }

    static func normalizedDishKindAffinity(
        _ entry: TasteBuddyAgentCoreLexiconEntry
    ) -> [String: Double] {
        entry.dishKindAffinity.reduce(into: [:]) { result, pair in
            guard let canonical = canonicalDishKindAliases[pair.key] else { return }
            result[canonical] = max(result[canonical] ?? 0, clamp(pair.value))
        }
    }

    static func lexiconDishKindScore(
        _ entry: TasteBuddyAgentCoreLexiconEntry,
        dishKindIds: [String]
    ) -> Double {
        let affinity = normalizedDishKindAffinity(entry)
        return dishKindIds.reduce(0) {
            guard let canonical = canonicalDishKindAliases[$1] else { return $0 }
            return max($0, affinity[canonical] ?? 0)
        }
    }

    static func lexiconConfidence(
        _ entry: TasteBuddyAgentCoreLexiconEntry,
        dishKindIds: [String] = [],
        foodMappingConfidence: Double? = nil,
        humanReviewConfidence: Double? = nil,
        appFeedbackConfidence: Double = 0
    ) -> Double {
        guard entry.status != "retired" else { return 0 }
        let dishScore = lexiconDishKindScore(entry, dishKindIds: dishKindIds)
        let human = humanReviewConfidence
            ?? (entry.status == "active" ? 1 : entry.status == "human-reviewed" ? 0.86 : 0)
        return clamp(
            entry.initialConfidence + dishScore * 0.16
                + (foodMappingConfidence ?? dishScore) * 0.12
                + human * 0.12 + appFeedbackConfidence * 0.18
        )
    }

    static func canUseLexicon(
        _ entry: TasteBuddyAgentCoreLexiconEntry,
        surface: TasteBuddyAgentKnowledgeSurface,
        dishKindIds: [String] = [],
        appFeedbackConfidence: Double = 0
    ) -> Bool {
        guard entry.status != "retired" else { return false }
        let dishScore = lexiconDishKindScore(entry, dishKindIds: dishKindIds)
        let confidence = lexiconConfidence(
            entry,
            dishKindIds: dishKindIds,
            appFeedbackConfidence: appFeedbackConfidence
        )
        switch surface {
        case .tasteBubble:
            return entry.initialConfidence >= 0.42
        case .detailTag:
            return entry.initialConfidence >= 0.5
                || entry.initialConfidence + dishScore * 0.16 >= 0.5
        case .diningNote:
            return entry.initialConfidence >= 0.42
        case .recommendation:
            return confidence >= 0.72
        case .chefGuide:
            return ["human-reviewed", "active"].contains(entry.status) && confidence >= 0.78
        case .tcs:
            return false
        }
    }

    private static func resourceURL(named name: String) throws -> URL {
        let candidates = [
            Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "TBA"),
            Bundle.main.url(forResource: name, withExtension: "json"),
        ]
        if let url = candidates.compactMap({ $0 }).first {
            return url
        }
        throw CocoaError(.fileNoSuchFile)
    }

    private static func strongestSignalMatches(
        _ text: String,
        domain: String
    ) -> [TasteBuddyAgentSignalMatch] {
        var byAlias: [String: TasteBuddyAgentSignalMatch] = [:]
        for match in findSignals(
            text: text,
            domains: [domain],
            limit: 8,
            minScore: 0.82
        ) {
            let key = normalized(match.matchedAlias ?? match.definition.label)
            if let current = byAlias[key],
               current.score > match.score
                || (current.score == match.score
                    && current.definition.confidence >= match.definition.confidence) {
                continue
            }
            byAlias[key] = match
        }
        return byAlias.values.sorted {
            $0.score != $1.score
                ? $0.score > $1.score
                : $0.definition.confidence > $1.definition.confidence
        }.prefix(4).map(\.self)
    }

    private static func signalMappingResult(
        mapped: [TasteBuddyAgentMappedSignal],
        unmapped: [TasteBuddyAgentUnmappedTag]
    ) -> TasteBuddyAgentSignalMappingResult {
        let byDomain = Dictionary(grouping: mapped, by: \.definition.domain)
        return .init(byDomain: byDomain, mappedSignals: mapped, unmappedTags: unmapped)
    }

    private static func upsertMappedSignal(
        _ signal: TasteBuddyAgentMappedSignal,
        into mapped: inout [TasteBuddyAgentMappedSignal]
    ) {
        if let index = mapped.firstIndex(where: { $0.definition.id == signal.definition.id }) {
            if signal.score > mapped[index].score {
                mapped[index] = signal
            }
        } else {
            mapped.append(signal)
        }
    }

    private static func textMatch(
        value: String,
        labels: [String],
        searchableText: String
    ) -> (label: String?, score: Double)? {
        let normalizedValue = normalized(value)
        let compactValue = compact(value)
        guard !normalizedValue.isEmpty else { return nil }
        let candidates = labels.map { ($0, normalized($0), compact($0)) }
            .filter { !$0.1.isEmpty }

        if let exact = candidates.first(where: {
            $0.1 == normalizedValue || $0.2 == compactValue
        }) {
            return (exact.0, 1)
        }
        if let contained = candidates.first(where: {
            normalizedValue.contains($0.1) || $0.1.contains(normalizedValue)
                || compactValue.contains($0.2) || $0.2.contains(compactValue)
        }) {
            return (contained.0, 0.86)
        }
        let tokens = tokenized(value)
        guard !tokens.isEmpty else { return nil }
        let haystack = normalized(searchableText)
        let count = tokens.filter(haystack.contains).count
        guard count > 0 else { return nil }
        return (nil, min(0.64, Double(count) / Double(max(4, tokens.count))))
    }

    private static func lexiconTextScore(
        _ entry: TasteBuddyAgentCoreLexiconEntry,
        sourceTexts: [String]
    ) -> Double {
        let candidates = [(entry.label, 1.0)]
            + entry.aliases.map { ($0, 0.9) }
            + [(entry.id.replacingOccurrences(of: "-", with: " "), 0.64)]
        let normalizedSources = sourceTexts.map(normalized).filter { !$0.isEmpty }
        let compactSources = sourceTexts.map(compact).filter { !$0.isEmpty }
        return candidates.reduce(0) { best, candidate in
            let label = normalized(candidate.0)
            let compactLabel = compact(candidate.0)
            let matches = normalizedSources.contains {
                $0 == label || $0.contains(label) || label.contains($0)
            } || compactSources.contains {
                $0 == compactLabel || $0.contains(compactLabel) || compactLabel.contains($0)
            }
            return matches ? max(best, candidate.1) : best
        }
    }

    private static func reviewerProfileScore(
        _ entry: TasteBuddyAgentCoreLexiconEntry,
        profile: TasteBuddyAgentTasteProfileSnapshot?
    ) -> Double {
        guard let profile else { return 0 }
        var sum = 0.0
        var weightSum = 0.0
        for (axis, weight) in entry.tasteVector where weight > 0 {
            sum += (profile.tasteVector[axis] ?? 0.5) * weight
            weightSum += weight
        }
        for (axis, weight) in entry.perceptualVector where weight > 0 {
            sum += (profile.perceptualVector[axis] ?? 0.5) * weight
            weightSum += weight
        }
        return weightSum > 0 ? clamp(sum / weightSum) : 0
    }

    private static func weightedVector(
        keys: [String],
        candidates: [DiningCandidate],
        vector: KeyPath<DiningCandidate, [String: Double]>
    ) -> [String: Double] {
        let weightSum = candidates.map(\.score).reduce(0, +)
        guard weightSum > 0 else { return [:] }
        return keys.reduce(into: [:]) { result, key in
            let value = candidates.reduce(0) {
                $0 + ($1[keyPath: vector][key] ?? 0) * $1.score
            } / weightSum
            if abs(value) > 0.001 {
                result[key] = rounded(clamp(value, minimum: -1, maximum: 1))
            }
        }
    }

    private static func dominantTasteLabel(_ vector: [String: Double]) -> String? {
        guard let axis = TasteAxis.allCases.max(by: {
            abs(vector[$0.rawValue] ?? 0) < abs(vector[$1.rawValue] ?? 0)
        }), abs(vector[axis.rawValue] ?? 0) > 0.05 else {
            return nil
        }
        return axis.label
    }

    private static func categoryLabel(_ category: String) -> String {
        switch category {
        case "taste", "ingredient": "미각 신호"
        case "composition": "구성 신호"
        case "finish": "피니시 신호"
        case "texture": "질감 신호"
        case "aroma": "향 신호"
        case "process": "조리 신호"
        default: "TBA Core Taste Lexicon"
        }
    }

    private static func canUseFoodKnowledge(
        _ entry: TasteBuddyAgentFoodKnowledgeEntry,
        surface: TasteBuddyAgentKnowledgeSurface
    ) -> Bool {
        guard entry.status != "retired",
              entry.confidence >= (surfaceThresholds[surface] ?? 0.5) else {
            return false
        }
        if surface == .chefGuide {
            return ["active", "human-reviewed"].contains(entry.status)
        }
        return true
    }

    private static func foodKnowledgeTextScore(
        entry: TasteBuddyAgentFoodKnowledgeEntry,
        query: String
    ) -> Double {
        let normalizedQuery = normalized(query)
        guard !normalizedQuery.isEmpty else { return 0 }
        let labels = [
            entry.koName, entry.canonicalName, entry.foodGroup,
        ] + entry.aliases + entry.dishKindIds
            + entry.ingredientSignalIds + entry.processSignalIds
        return labels.map(normalized).filter { !$0.isEmpty }.reduce(0) { best, label in
            if normalizedQuery == label
                || normalizedQuery.contains(label)
                || label.contains(normalizedQuery) {
                return max(best, 1)
            }
            let tokens = label.split(separator: " ").filter { $0.count >= 3 }
            let count = tokens.filter { normalizedQuery.contains($0) }.count
            return max(
                best,
                count > 0 ? min(0.68, Double(count) / Double(max(4, tokens.count))) : 0
            )
        }
    }

    private static func menuNameScore(
        entry: TasteBuddyAgentFoodKnowledgeEntry,
        menuName: String
    ) -> Double {
        let name = normalized(menuName)
        let compactName = compact(menuName)
        return ([entry.koName, entry.canonicalName] + entry.aliases)
            .map { (normalized($0), compact($0)) }
            .reduce(0) { best, label in
                if label.0 == name || label.1 == compactName {
                    return max(best, 1)
                }
                if name.contains(label.0) || label.0.contains(name)
                    || compactName.contains(label.1) || label.1.contains(compactName) {
                    return max(best, 0.86)
                }
                return best
            }
    }

    private static func dishKindLabel(_ id: String) -> String {
        signal(byId: "dish-kind:\(id)")?.label ?? id
    }

    private static func normalized(_ value: String) -> String {
        let separators = CharacterSet(charactersIn: "·,./|()[]{}'\"`~!?+<>")
        return value
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .components(separatedBy: separators)
            .joined(separator: " ")
            .split(whereSeparator: \.isWhitespace)
            .joined(separator: " ")
    }

    private static func compact(_ value: String) -> String {
        normalized(value).replacingOccurrences(of: " ", with: "")
    }

    private static func tokenized(_ value: String) -> [String] {
        normalized(value).split(separator: " ")
            .map(String.init)
            .filter { $0.count >= 2 }
    }

    private static func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func unique(_ values: [String], limit: Int = .max) -> [String] {
        var seen: Set<String> = []
        return values.map(trimmed).filter { !$0.isEmpty }.filter {
            let key = normalized($0)
            guard !seen.contains(key) else { return false }
            seen.insert(key)
            return true
        }.prefix(limit).map(\.self)
    }

    private static func clamp(
        _ value: Double,
        minimum: Double = 0,
        maximum: Double = 1
    ) -> Double {
        min(maximum, max(minimum, value))
    }

    private static func rounded(_ value: Double) -> Double {
        Double(String(format: "%.3f", value)) ?? value
    }
}
