import Foundation
import CoreGraphics

struct DiningFeedbackFixtureContract: Codable, Equatable {
    let schemaVersion: Int
    let sourceFiles: [String]
    let scenario: DiningFeedbackScenarioContract
    let detailTagCategories: [DiningFeedbackTagCategoryContract]
    let dishKindOptions: [DiningFeedbackDishKindContract]
    var legacyDishKindOptions: [DiningFeedbackDishKindContract]? = nil
    var dishKindAliases: [String: String]? = nil
    var dishKindTaxonomyVersion: String? = nil
    var dishKindDetailRecommendations: [String: [String]]? = nil

    var allDishKindOptions: [DiningFeedbackDishKindContract] { dishKindOptions + (legacyDishKindOptions ?? []) }
    let tasteExperienceAxes: [TasteExperienceAxisContract]
}

struct DiningFeedbackScenarioContract: Codable, Equatable {
    let completedAt: String
    let courseName: String
    let postDiningPrompt: String
    let reservationId: Int
    let restaurant: String
    let dishes: [DiningFeedbackDishContract]
}

struct DiningFeedbackDishContract: Codable, Equatable, Identifiable {
    let chefIntent: String
    let courseLabel: String
    let feedbackChoices: [DiningFeedbackChoiceContract]
    let flavorNotes: [String]
    let id: String
    let ingredients: [String]
    let subtitle: String
    let techniques: [String]
    let title: String
}

struct DiningFeedbackChoiceContract: Codable, Equatable, Identifiable {
    let affectedTastes: [String]
    let id: String
    let ingredientPairing: String
    let label: String
    let recommendation: String
    let reason: String
}

struct DiningFeedbackTagCategoryContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let tags: [DiningFeedbackTagContract]
}

struct DiningFeedbackTagContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
}

enum DiningDishKindGroup: String, CaseIterable, Identifiable {
    case ingredient, form, method, attribute, legacy
    var id: String { rawValue }
    var label: String {
        switch self {
        case .ingredient: return "주요 재료"
        case .form: return "요리 형태"
        case .method: return "조리·처리"
        case .attribute: return "특성"
        case .legacy: return "이전에 선택한 분류"
        }
    }
}

struct DiningFeedbackDishKindContract: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let keywords: [String]
    var group: String? = nil
}


struct TasteExperienceAxisContract: Codable, Equatable, Identifiable {
    let id: TasteAxis
    let label: String
    let angle: Double
    let words: [TasteExperienceWordContract]
}

struct TasteExperienceWordContract: Codable, Equatable {
    let angleOffset: Double
    let intensity: Int?
    let key: String
    let label: String
    let description: String
    let radiusOffset: Double?
    var id: String? = nil
}

struct TasteExperience: Identifiable, Equatable {
    let id: String
    let axis: TasteAxis
    let intensity: Int?
    let key: String
    let label: String
    let description: String
    let angleOffset: Double
    let radiusOffset: Double?
}

struct TasteExperienceBubblePosition: Identifiable, Equatable {
    let experience: TasteExperience
    var size: CGFloat
    var x: CGFloat
    var y: CGFloat

    var id: String { experience.id }
    var point: CGPoint { CGPoint(x: x, y: y) }
}

extension DiningFeedbackFixtureContract {
    var tasteExperiences: [TasteExperience] {
        tasteExperienceAxes.flatMap { axis in
            axis.words.map { word in
                TasteExperience(
                    id: word.id ?? "\(axis.id.rawValue)-\(word.key)",
                    axis: axis.id,
                    intensity: word.intensity,
                    key: word.key,
                    label: word.label,
                    description: word.description,
                    angleOffset: word.angleOffset,
                    radiusOffset: word.radiusOffset
                )
            }
        }
    }
}

enum TasteExperienceMapEngine {
    static let mapSize: CGFloat = CGFloat(DiningSensoryV2Catalog.shared?.layout.mapSize ?? 1_680)
    static let mapCenter: CGFloat = mapSize / 2
    static let bubbleSize: CGFloat = 126
    static let selectedBubbleSize: CGFloat = 164
    static let gridSpacing: CGFloat = 136
    static let neutralBubbleSize: CGFloat = 56
    static let entryZoom: CGFloat = 0.86
    static let selectedZoom: CGFloat = 1
    static let minimumZoom: CGFloat = 0.72
    static let maximumZoom: CGFloat = 1.42
    static let zoomTransitionDuration = TasteBloomMotion.duration(.sheet, reduceMotion: false)
    static let pinchSnapSuppressionDuration: TimeInterval = 0.36

    private static let gridSearchRange = 12
    private static let relaxationIterations = 12
    private static let surfaceGap = gridSpacing - bubbleSize

    private struct HexPoint {
        let angle: Double
        let axis: TasteAxis
        let distance: CGFloat
        let x: CGFloat
        let y: CGFloat
    }

    static func basePositions(
        axes: [TasteExperienceAxisContract]
    ) -> [TasteExperienceBubblePosition] {
        let experiences = axes.flatMap { axis in
            axis.words.map { word in
                TasteExperience(
                    id: word.id ?? "\(axis.id.rawValue)-\(word.key)",
                    axis: axis.id,
                    intensity: word.intensity,
                    key: word.key,
                    label: word.label,
                    description: word.description,
                    angleOffset: word.angleOffset,
                    radiusOffset: word.radiusOffset
                )
            }
        }
        if experiences.allSatisfy({ $0.id.hasPrefix("v2.bubble.") }), let layout = DiningSensoryV2Catalog.shared?.layout {
            var offsets = [String: Int]()
            let positions: [TasteExperienceBubblePosition] = experiences.compactMap { experience in
                let axis = experience.axis.rawValue
                let index = offsets[axis, default: 0]
                offsets[axis] = index + 1
                guard let slot = layout.slots.first(where: { $0.axis == axis && $0.index == index }) else { return nil }
                return .init(experience: experience, size: bubbleSize, x: mapCenter + slot.x, y: mapCenter + slot.y)
            }
            guard positions.count == experiences.count else {
                assertionFailure("Sensory v2 catalog and map slots must match")
                return []
            }
            return positions
        }
        let points = hexGridPoints(pointCount: experiences.count, axes: axes)
        var pointsByAxis: [TasteAxis: [HexPoint]] = [:]
        for axis in axes {
            pointsByAxis[axis.id] = points
                .filter { $0.axis == axis.id }
                .sorted {
                    if $0.distance != $1.distance {
                        return $0.distance < $1.distance
                    }

                    return angleDistance($0.angle, axis.angle)
                        < angleDistance($1.angle, axis.angle)
                }
        }
        var axisOffsets: [TasteAxis: Int] = [:]

        let positions = experiences.map { experience in
            let offset = axisOffsets[experience.axis, default: 0]
            axisOffsets[experience.axis] = offset + 1
            let point = pointsByAxis[experience.axis]?[safe: offset]

            return TasteExperienceBubblePosition(
                experience: experience,
                size: bubbleSize,
                x: mapCenter + (point?.x ?? 0),
                y: mapCenter + (point?.y ?? 0)
            )
        }
        return positions
    }

    static func renderPositions(
        basePositions: [TasteExperienceBubblePosition],
        enlargedExperienceIDs: [String]
    ) -> [TasteExperienceBubblePosition] {
        let enlargedIDSet = Set(enlargedExperienceIDs)
        let selectedPositions = basePositions.filter { enlargedIDSet.contains($0.id) }

        guard let primarySelectedPosition = selectedPositions.first else {
            return basePositions
        }

        let selectedRadiusDelta = (selectedBubbleSize - bubbleSize) / 2
        var relaxedPositions = basePositions.map { position -> TasteExperienceBubblePosition in
            if enlargedIDSet.contains(position.id) {
                var selected = position
                selected.size = selectedBubbleSize
                return selected
            }

            let nearestSelectedPosition = selectedPositions.min { left, right in
                distance(position.point, left.point) < distance(position.point, right.point)
            } ?? primarySelectedPosition
            let deltaX = position.x - nearestSelectedPosition.x
            let deltaY = position.y - nearestSelectedPosition.y
            let selectedDistance = max(hypot(deltaX, deltaY), 0.001)
            var expanded = position
            expanded.x += (deltaX / selectedDistance) * selectedRadiusDelta
            expanded.y += (deltaY / selectedDistance) * selectedRadiusDelta
            return expanded
        }

        for _ in 0..<relaxationIterations {
            for leftIndex in relaxedPositions.indices {
                for rightIndex in relaxedPositions.indices where rightIndex > leftIndex {
                    var left = relaxedPositions[leftIndex]
                    var right = relaxedPositions[rightIndex]
                    let deltaX = right.x - left.x
                    let deltaY = right.y - left.y
                    let currentDistance = max(hypot(deltaX, deltaY), 0.001)
                    let minimumDistance = (left.size + right.size) / 2 + surfaceGap
                    let overlap = minimumDistance - currentDistance

                    guard overlap > 0 else { continue }

                    let offsetX = (deltaX / currentDistance) * overlap
                    let offsetY = (deltaY / currentDistance) * overlap
                    left.x -= offsetX / 2
                    left.y -= offsetY / 2
                    right.x += offsetX / 2
                    right.y += offsetY / 2
                    relaxedPositions[leftIndex] = left
                    relaxedPositions[rightIndex] = right
                }
            }
        }

        return relaxedPositions
    }

    static func toggleSelection(
        _ experienceID: String,
        in selectedExperienceIDs: [String]
    ) -> [String] {
        if selectedExperienceIDs.contains(experienceID) {
            return selectedExperienceIDs.filter { $0 != experienceID }
        }

        guard selectedExperienceIDs.count < 3 else {
            return selectedExperienceIDs
        }

        return selectedExperienceIDs + [experienceID]
    }

    static func nextUnselectedExperienceID(
        from currentExperienceID: String,
        selectedExperienceIDs: [String],
        positions: [TasteExperienceBubblePosition]
    ) -> String? {
        guard let currentPosition = positions.first(where: { $0.id == currentExperienceID }) else {
            return nil
        }

        let centerPoint = CGPoint(x: mapCenter, y: mapCenter)
        let currentCenterDistance = distance(currentPosition.point, centerPoint)
        let centerDeltaX = centerPoint.x - currentPosition.x
        let centerDeltaY = centerPoint.y - currentPosition.y
        let centerDistance = max(hypot(centerDeltaX, centerDeltaY), 1)
        let targetPoint = CGPoint(
            x: currentPosition.x + (centerDeltaX / centerDistance) * gridSpacing,
            y: currentPosition.y + (centerDeltaY / centerDistance) * gridSpacing
        )
        let selectedIDSet = Set(selectedExperienceIDs)

        return positions
            .filter { !selectedIDSet.contains($0.id) }
            .min { left, right in
                candidateScore(
                    left,
                    currentPosition: currentPosition,
                    targetPoint: targetPoint,
                    currentCenterDistance: currentCenterDistance
                ) < candidateScore(
                    right,
                    currentPosition: currentPosition,
                    targetPoint: targetPoint,
                    currentCenterDistance: currentCenterDistance
                )
            }?
            .id
    }

    static func introDelays(
        axes: [TasteExperienceAxisContract],
        positions: [TasteExperienceBubblePosition]
    ) -> [String: TimeInterval] {
        let primaryIDs = axes.compactMap { axis in
            axis.words.first.map { $0.id ?? "\(axis.id.rawValue)-\($0.key)" }
        }
        let primaryIDSet = Set(primaryIDs)
        let outerPositions = positions
            .filter { !primaryIDSet.contains($0.id) }
            .sorted { left, right in
                let leftDeltaX = left.x - mapCenter
                let leftDeltaY = left.y - mapCenter
                let rightDeltaX = right.x - mapCenter
                let rightDeltaY = right.y - mapCenter
                let leftDistance = hypot(leftDeltaX, leftDeltaY)
                let rightDistance = hypot(rightDeltaX, rightDeltaY)

                if leftDistance != rightDistance {
                    return leftDistance < rightDistance
                }

                return atan2(leftDeltaY, leftDeltaX) < atan2(rightDeltaY, rightDeltaX)
            }
        var delays = Dictionary(uniqueKeysWithValues: primaryIDs.enumerated().map { index, id in
            (id, TasteBloomMotion.Role.feedback.duration + Double(index) * TasteBloomMotion.stagger)
        })

        for (index, position) in outerPositions.enumerated() {
            let progress = outerPositions.count <= 1
                ? 1
                : Double(index) / Double(outerPositions.count - 1)
            delays[position.id] = TasteBloomMotion.Role.sheet.duration
                + progress * TasteBloomMotion.Role.content.duration
        }

        return delays
    }

    static func mappedRating(for experience: TasteExperience) -> Int {
        guard let intensity = experience.intensity else { return 0 }
        if intensity >= 4 {
            return 2
        }

        return intensity == 3 ? 3 : 4
    }

    private static func hexGridPoints(
        pointCount: Int,
        axes: [TasteExperienceAxisContract]
    ) -> [HexPoint] {
        let rowHeight = gridSpacing * sqrt(3) / 2
        var points: [HexPoint] = []

        for row in -gridSearchRange...gridSearchRange {
            for column in -gridSearchRange...gridSearchRange {
                let rawX = (CGFloat(column) + (abs(row) % 2 == 1 ? 0.5 : 0)) * gridSpacing
                let rawY = CGFloat(row) * rowHeight
                let pointDistance = hypot(rawX, rawY)

                guard pointDistance >= 1 else { continue }

                let angle = atan2(Double(rawY), Double(rawX)) * 180 / .pi
                let nearestAxis = axes.min {
                    angleDistance(angle, $0.angle) < angleDistance(angle, $1.angle)
                }?.id ?? .sweet
                points.append(
                    HexPoint(
                        angle: angle,
                        axis: nearestAxis,
                        distance: pointDistance,
                        x: rawX,
                        y: rawY
                    )
                )
            }
        }

        return Array(
            points.sorted {
                $0.distance == $1.distance
                    ? $0.angle < $1.angle
                    : $0.distance < $1.distance
            }
            .prefix(pointCount)
        )
    }

    private static func candidateScore(
        _ position: TasteExperienceBubblePosition,
        currentPosition: TasteExperienceBubblePosition,
        targetPoint: CGPoint,
        currentCenterDistance: CGFloat
    ) -> CGFloat {
        let distanceFromTarget = distance(position.point, targetPoint)
        let distanceFromCurrent = distance(position.point, currentPosition.point)
        let nextCenterDistance = distance(
            position.point,
            CGPoint(x: mapCenter, y: mapCenter)
        )

        return distanceFromTarget
            + abs(distanceFromCurrent - gridSpacing) * 0.35
            + (nextCenterDistance > currentCenterDistance ? gridSpacing * 2 : 0)
    }

    private static func normalizeAngle(_ angle: Double) -> Double {
        let normalized = angle.truncatingRemainder(dividingBy: 360)
        return normalized >= 0 ? normalized : normalized + 360
    }

    private static func angleDistance(_ left: Double, _ right: Double) -> Double {
        let difference = abs(normalizeAngle(left) - normalizeAngle(right))
        return difference > 180 ? 360 - difference : difference
    }

    private static func distance(_ left: CGPoint, _ right: CGPoint) -> CGFloat {
        hypot(left.x - right.x, left.y - right.y)
    }
}

enum DiningFeedbackFixtureLoader {
    static func load(bundle: Bundle = .main) throws -> DiningFeedbackFixtureContract {
        guard let url =
            bundle.url(
                forResource: "dining-feedback-scenario",
                withExtension: "json",
                subdirectory: "Fixtures"
            )
            ?? bundle.url(forResource: "dining-feedback-scenario", withExtension: "json")
        else {
            throw CocoaError(.fileNoSuchFile)
        }

        return try JSONDecoder().decode(
            DiningFeedbackFixtureContract.self,
            from: Data(contentsOf: url)
        )
    }
}

enum TasteExperienceCatalog {
    static let legacyAxes: [TasteExperienceAxisContract] =
        (try? DiningFeedbackFixtureLoader.load().tasteExperienceAxes) ?? []
    static let axes = DiningSensoryV2Catalog.shared?.axes ?? legacyAxes
    static let experiences: [TasteExperience] = (legacyAxes + (DiningSensoryV2Catalog.shared?.axes ?? [])).flatMap { axis in
        axis.words.map { word in
            TasteExperience(
                id: word.id ?? "\(axis.id.rawValue)-\(word.key)",
                axis: axis.id,
                intensity: word.intensity,
                key: word.key,
                label: word.label,
                description: word.description,
                angleOffset: word.angleOffset,
                radiusOffset: word.radiusOffset
            )
        }
    }
    static let experienceByID = Dictionary(
        uniqueKeysWithValues: experiences.map { ($0.id, $0) }
    )
}

struct DiningDetailTagMetadata: Identifiable, Equatable {
    let id: String
    let label: String
    let categoryID: String
    let categoryLabel: String
}

enum DiningDetailTagCatalog {
    static let categories: [DiningFeedbackTagCategoryContract] =
        (try? DiningFeedbackFixtureLoader.load().detailTagCategories) ?? []

    private static let recommendedByAxis: [TasteAxis: [String]] = [
        .bitter: ["aroma-roasted", "aroma-smoky", "composition-fire-clear", "flow-long-lasting"],
        .fat: ["texture-coating", "texture-silky", "composition-fat-supports", "balance-finish-heavy"],
        .salty: ["balance-clear-seasoning", "balance-center-clear", "composition-sauce-leads"],
        .sour: ["balance-acid-cleans", "flow-clean-finish", "flow-opens-next", "composition-acid-structure"],
        .sweet: ["balance-sweet-support", "aroma-fruity", "flow-finish-quiet", "balance-aftertaste-light"],
        .umami: ["balance-umami-depth", "flow-deepens-late", "aroma-broth", "composition-connected"],
    ]

    private static let recommendedByDishKind: [String: [String]] =
        (try? DiningFeedbackFixtureLoader.load().dishKindDetailRecommendations) ?? [:]

    static func metadata(for id: String) -> DiningDetailTagMetadata? {
        if let catalog = DiningSensoryV2Catalog.shared, let node = catalog.entry(id), let familyID = node.familyId {
            return .init(id: id, label: node.label, categoryID: familyID, categoryLabel: catalog.families.first { $0.id == familyID }?.label ?? familyID)
        }
        if id.hasPrefix("custom:") {
            let components = id.split(separator: ":", maxSplits: 2).map(String.init)
            guard components.count == 3,
                  let category = categories.first(where: { $0.id == components[1] }),
                  !components[2].trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            else {
                return nil
            }

            return DiningDetailTagMetadata(
                id: id,
                label: components[2],
                categoryID: category.id,
                categoryLabel: category.label
            )
        }

        for category in categories {
            if let tag = category.tags.first(where: { $0.id == id }) {
                return DiningDetailTagMetadata(
                    id: tag.id,
                    label: tag.label,
                    categoryID: category.id,
                    categoryLabel: category.label
                )
            }
        }

        return nil
    }

    static func recommendedIDs(
        experiences: [TasteExperience],
        dishKindIDs: Set<String>
    ) -> [String] {
        let candidates =
            experiences.flatMap { recommendedByAxis[$0.axis] ?? [] }
            + dishKindIDs.sorted().flatMap { recommendedByDishKind[$0] ?? [] }
        var seen: Set<String> = []
        return candidates.filter { seen.insert($0).inserted }
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
