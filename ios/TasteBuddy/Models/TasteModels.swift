import SwiftUI

enum TasteAxis: String, CaseIterable, Codable, Identifiable {
    case sweet
    case sour
    case bitter
    case salty
    case umami
    case fat

    var id: String { rawValue }

    static func fromTasteName(_ name: String?) -> TasteAxis? {
        guard let name else { return nil }
        let normalizedName = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        return allCases.first { axis in
            axis.rawValue == normalizedName || axis.label == name
        }
    }

    var label: String {
        switch self {
        case .sweet: "단맛"
        case .sour: "신맛"
        case .bitter: "쓴맛"
        case .salty: "짠맛"
        case .umami: "감칠맛"
        case .fat: "지방맛"
        }
    }

    var symbol: String {
        switch self {
        case .sweet: "drop.fill"
        case .sour: "sun.max.fill"
        case .bitter: "leaf.fill"
        case .salty: "water.waves"
        case .umami: "sparkles"
        case .fat: "circle.grid.2x2.fill"
        }
    }

    var mainColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFF9900)
        case .sour: Color(hex: 0xFBC02D)
        case .bitter: Color(hex: 0x95C900)
        case .salty: Color(hex: 0x7299FF)
        case .umami: Color(hex: 0xB372B4)
        case .fat: Color(hex: 0x95867A)
        }
    }

    var tintColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFFEBCC)
        case .sour: Color(hex: 0xFFF7CC)
        case .bitter: Color(hex: 0xEAF4CC)
        case .salty: Color(hex: 0xE3EBFF)
        case .umami: Color(hex: 0xF0E3F0)
        case .fat: Color(hex: 0xEAE7E4)
        }
    }

    var tintTextColor: Color {
        switch self {
        case .sweet: Color(hex: 0x6F4609)
        case .sour: Color(hex: 0x6F5F09)
        case .bitter: Color(hex: 0x505B24)
        case .salty: Color(hex: 0x36466F)
        case .umami: Color(hex: 0x513751)
        case .fat: Color(hex: 0x453F3A)
        }
    }

    var tintSubTextColor: Color {
        switch self {
        case .sweet: Color(hex: 0x896735)
        case .sour: Color(hex: 0x897C35)
        case .bitter: Color(hex: 0x70794B)
        case .salty: Color(hex: 0x5A6789)
        case .umami: Color(hex: 0x705B70)
        case .fat: Color(hex: 0x66625D)
        }
    }

    var radarLineStartColor: Color {
        switch self {
        case .sweet: Color(hex: 0xFFB342)
        case .sour: Color(hex: 0xFCD369)
        case .bitter: Color(hex: 0xB5D94A)
        case .salty: Color(hex: 0x9BB6FF)
        case .umami: Color(hex: 0xC69AC7)
        case .fat: Color(hex: 0xB1A69E)
        }
    }
}

struct TasteProfile: Codable, Equatable {
    let createdAt: Date
    let scores: [String: Int]
    let confidence: String
    let summary: String
    let topAxes: [TasteAxis]
    let cautionAxis: TasteAxis

    func score(for axis: TasteAxis) -> Int {
        scores[axis.rawValue] ?? 50
    }

    static let sample = CalibrationEngine.makeProfile(
        responses: [
            .sweet: 1,
            .sour: 2,
            .bitter: -1,
            .salty: -2,
            .umami: 2,
            .fat: 0
        ]
    )
}

struct DiningEntry: Identifiable, Codable, Equatable {
    let id: UUID
    let restaurant: String
    let menu: String
    let date: Date
    let rating: Int
    let note: String
    let tasteExperienceIDs: [String]
    let detailTagIDs: [String]
    let reflectionPhotoFilename: String?

    init(
        id: UUID = UUID(),
        restaurant: String,
        menu: String,
        date: Date = .now,
        rating: Int,
        note: String,
        tasteExperienceIDs: [String] = [],
        detailTagIDs: [String] = [],
        reflectionPhotoFilename: String? = nil
    ) {
        self.id = id
        self.restaurant = restaurant
        self.menu = menu
        self.date = date
        self.rating = rating
        self.note = note
        self.tasteExperienceIDs = Array(tasteExperienceIDs.prefix(3))
        self.detailTagIDs = detailTagIDs
        self.reflectionPhotoFilename = reflectionPhotoFilename
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case restaurant
        case menu
        case date
        case rating
        case note
        case tasteExperienceIDs
        case detailTagIDs
        case reflectionPhotoFilename
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        restaurant = try container.decode(String.self, forKey: .restaurant)
        menu = try container.decode(String.self, forKey: .menu)
        date = try container.decode(Date.self, forKey: .date)
        rating = try container.decode(Int.self, forKey: .rating)
        note = try container.decode(String.self, forKey: .note)
        tasteExperienceIDs = Array(
            try container.decodeIfPresent([String].self, forKey: .tasteExperienceIDs) ?? []
        ).prefix(3).map(\.self)
        detailTagIDs = try container.decodeIfPresent([String].self, forKey: .detailTagIDs) ?? []
        reflectionPhotoFilename = try container.decodeIfPresent(
            String.self,
            forKey: .reflectionPhotoFilename
        )
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(restaurant, forKey: .restaurant)
        try container.encode(menu, forKey: .menu)
        try container.encode(date, forKey: .date)
        try container.encode(rating, forKey: .rating)
        try container.encode(note, forKey: .note)
        try container.encode(tasteExperienceIDs, forKey: .tasteExperienceIDs)
        try container.encode(detailTagIDs, forKey: .detailTagIDs)
        try container.encodeIfPresent(
            reflectionPhotoFilename,
            forKey: .reflectionPhotoFilename
        )
    }

    static let sample = DiningEntry(
        restaurant: "온지음",
        menu: "저녁 코스",
        rating: 5,
        note: "산미가 밝게 이어졌고 후반부 간은 조금 더 가벼워도 좋겠어요."
    )
}

enum DiningReflectionPhotoStore {
    private static let directoryName = "DiningFeedbackPhotos"

    static func normalizedJPEGData(_ data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let maximumDimension: CGFloat = 1_600
        let longestDimension = max(image.size.width, image.size.height)
        let scale = min(1, maximumDimension / max(longestDimension, 1))
        let targetSize = CGSize(
            width: max(1, image.size.width * scale),
            height: max(1, image.size.height * scale)
        )
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let normalizedImage = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return normalizedImage.jpegData(compressionQuality: 0.84)
    }

    static func save(_ data: Data, entryID: UUID) throws -> String {
        let filename = "\(entryID.uuidString.lowercased()).jpg"
        try FileManager.default.createDirectory(
            at: directoryURL,
            withIntermediateDirectories: true
        )
        try data.write(to: directoryURL.appendingPathComponent(filename), options: .atomic)
        return filename
    }

    static func data(for filename: String?) -> Data? {
        guard let filename else { return nil }
        return try? Data(contentsOf: directoryURL.appendingPathComponent(filename))
    }

    static func remove(filename: String?) {
        guard let filename else { return }
        try? FileManager.default.removeItem(
            at: directoryURL.appendingPathComponent(filename)
        )
    }

    private static var directoryURL: URL {
        let baseURL =
            FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        return baseURL
            .appendingPathComponent("TasteBuddy", isDirectory: true)
            .appendingPathComponent(directoryName, isDirectory: true)
    }
}

struct TasteAxisAnalysis: Identifiable, Equatable {
    let axis: TasteAxis
    let score: Int
    let delta: Int

    var id: TasteAxis.ID { axis.id }

    var deltaSummary: String {
        if abs(delta) <= 4 {
            return "평균과 유사한 반응"
        }

        return delta > 0 ? "더 또렷하게 감지" : "더 부드럽게 필요"
    }

    var detail: String {
        "현재 반응 \(score)점"
    }

    var directionSymbol: String {
        if delta > 4 {
            return "arrow.up.right"
        }

        if delta < -4 {
            return "arrow.down.right"
        }

        return "minus"
    }
}

struct TasteMatchSharedSignal: Equatable {
    let axis: TasteAxis
    let confidence: Double
}

struct TasteMatchFeedItem: Identifiable, Equatable {
    let id: String
    let reviewerID: String
    let reviewerName: String
    let reviewerHandle: String
    let reviewerTasteScores: [String: Int]
    let reviewerConfidenceScores: [String: Int]
    let relationLabel: String
    let restaurantID: String
    let restaurantName: String
    let dishTitle: String
    let reason: String
    let supportingSignals: [String]
    let tasteTags: [String]
    let experienceTags: [String]
    let sharedSignals: [TasteMatchSharedSignal]
    let learnedConfidenceScore: Double
    let matchRate: Int
    let axis: TasteAxis

    init(
        id: String,
        reviewerID: String,
        reviewerName: String,
        reviewerHandle: String,
        reviewerTasteScores: [String: Int],
        reviewerConfidenceScores: [String: Int] = [:],
        relationLabel: String = "Similar Palate",
        restaurantID: String,
        restaurantName: String,
        dishTitle: String,
        reason: String,
        supportingSignals: [String],
        tasteTags: [String],
        experienceTags: [String] = [],
        sharedSignals: [TasteMatchSharedSignal] = [],
        learnedConfidenceScore: Double = 0,
        matchRate: Int,
        axis: TasteAxis
    ) {
        self.id = id
        self.reviewerID = reviewerID
        self.reviewerName = reviewerName
        self.reviewerHandle = reviewerHandle
        self.reviewerTasteScores = reviewerTasteScores
        self.reviewerConfidenceScores = reviewerConfidenceScores
        self.relationLabel = relationLabel
        self.restaurantID = restaurantID
        self.restaurantName = restaurantName
        self.dishTitle = dishTitle
        self.reason = reason
        self.supportingSignals = supportingSignals
        self.tasteTags = tasteTags
        self.experienceTags = experienceTags
        self.sharedSignals = sharedSignals
        self.learnedConfidenceScore = learnedConfidenceScore
        self.matchRate = matchRate
        self.axis = axis
    }
}

struct DishFeedbackTasteBubble: Identifiable, Equatable {
    let id: String
    let label: String
    let title: String?
    let colorTaste: String?
    let axis: TasteAxis?

    init(
        id: String,
        label: String,
        title: String? = nil,
        colorTaste: String? = nil,
        axis: TasteAxis? = nil
    ) {
        self.id = id
        self.label = label
        self.title = title
        self.colorTaste = colorTaste
        self.axis = axis
    }

    static func fromAxis(
        _ axis: TasteAxis,
        id: String? = nil,
        label: String? = nil,
        title: String? = nil
    ) -> DishFeedbackTasteBubble {
        DishFeedbackTasteBubble(
            id: id ?? axis.id,
            label: label ?? axis.label,
            title: title ?? axis.label,
            colorTaste: axis.label,
            axis: axis
        )
    }

    static let sweet = DishFeedbackTasteBubble.fromAxis(.sweet)
    static let sour = DishFeedbackTasteBubble.fromAxis(.sour)
    static let bitter = DishFeedbackTasteBubble.fromAxis(.bitter)
    static let salty = DishFeedbackTasteBubble.fromAxis(.salty)
    static let umami = DishFeedbackTasteBubble.fromAxis(.umami)
    static let fat = DishFeedbackTasteBubble.fromAxis(.fat)

    var resolvedAxis: TasteAxis? {
        axis ?? TasteAxis.fromTasteName(colorTaste)
    }

    static func fromTBA(_ tag: TasteBuddyAgentDiningAnalysisTagSnapshot) -> DishFeedbackTasteBubble {
        DishFeedbackTasteBubble(
            id: tag.id,
            label: tag.label,
            title: tag.title ?? tag.colorTaste,
            colorTaste: tag.colorTaste,
            axis: TasteAxis.fromTasteName(tag.colorTaste)
        )
    }
}

struct DishFeedbackCardTag: Identifiable, Equatable, ExpressibleByStringLiteral {
    let id: String
    let label: String
    let title: String?

    init(id: String, label: String, title: String? = nil) {
        self.id = id
        self.label = label
        self.title = title
    }

    init(stringLiteral value: String) {
        self.init(id: value, label: value)
    }

    static func tag(
        _ label: String,
        id: String,
        title: String? = nil
    ) -> DishFeedbackCardTag {
        DishFeedbackCardTag(id: id, label: label, title: title)
    }

    static func fromTBA(_ tag: TasteBuddyAgentDiningAnalysisTagSnapshot) -> DishFeedbackCardTag {
        DishFeedbackCardTag(id: tag.id, label: tag.label, title: tag.title)
    }
}

struct DiningDishFeedbackItem: Identifiable, Equatable {
    struct Image: Identifiable, Equatable {
        let id: String
        let alt: String
        let imageName: String?
        let imageURLString: String?
        let imageData: Data?

        init(
            id: String,
            alt: String,
            imageName: String? = nil,
            imageURLString: String? = nil,
            imageData: Data? = nil
        ) {
            self.id = id
            self.alt = alt
            self.imageName = imageName
            self.imageURLString = imageURLString
            self.imageData = imageData
        }

        var imageURL: URL? {
            guard let imageURLString else { return nil }
            return URL(string: imageURLString)
        }

        var isUserFeedbackMedia: Bool {
            imageData != nil || imageURL != nil || imageName?.hasPrefix("Feedback") == true
        }
    }

    let id: String
    let authorName: String
    let restaurantName: String
    let dishTitle: String
    let summary: String
    let reactionLabel: String
    var images: [Image] = []
    let detailTags: [DishFeedbackCardTag]
    let tasteBubbles: [DishFeedbackTasteBubble]
    var commentCount: Int
    let liked: Bool
    let tbaAnalysisSnapshot: TasteBuddyAgentDiningAnalysisSnapshot?

    init(
        id: String,
        authorName: String,
        restaurantName: String,
        dishTitle: String,
        summary: String,
        reactionLabel: String,
        images: [Image] = [],
        detailTags: [DishFeedbackCardTag],
        tasteBubbles: [DishFeedbackTasteBubble],
        commentCount: Int,
        liked: Bool,
        tbaAnalysisSnapshot: TasteBuddyAgentDiningAnalysisSnapshot? = nil
    ) {
        self.id = id
        self.authorName = authorName
        self.restaurantName = restaurantName
        self.dishTitle = dishTitle
        self.summary = summary
        self.reactionLabel = reactionLabel
        self.images = images
        self.detailTags = detailTags
        self.tasteBubbles = tasteBubbles
        self.commentCount = commentCount
        self.liked = liked
        self.tbaAnalysisSnapshot = tbaAnalysisSnapshot
    }

    var primaryTasteAxis: TasteAxis {
        tasteBubbles.compactMap(\.resolvedAxis).first ?? .umami
    }

    static func fromTasteMatchFeedItem(
        _ item: TasteMatchFeedItem,
        commentCount: Int = 0,
        liked: Bool = false,
        images: [Image]? = nil
    ) -> DiningDishFeedbackItem {
        let dishKindTags = TasteBuddyAgent.inferDishKindIds(
            title: item.dishTitle,
            subtitle: item.restaurantName,
            flavorNotes: item.tasteTags + item.supportingSignals
        )
        let input = TasteBuddyAgentDiningAnalysisInput(
            detailTags: item.supportingSignals,
            dishKindTags: dishKindTags,
            id: item.id,
            ingredients: [],
            restaurantName: item.restaurantName,
            reviewSnippet: item.reason,
            subject: item.dishTitle,
            tasteTags: item.tasteTags,
            techniques: []
        )
        let snapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot(
            input,
            generatedAt: TasteBuddyAgent.fixedFixtureGeneratedAt
        )

        return DiningDishFeedbackItem(
            id: item.id,
            authorName: item.reviewerName,
            restaurantName: item.restaurantName,
            dishTitle: item.dishTitle,
            summary: snapshot.summary,
            reactionLabel: snapshot.tasteBubbles.first?.label ?? "미각 기록",
            images: images ?? [
                DiningDishFeedbackItem.Image(
                    id: "\(item.id)-menu-photo",
                    alt: "\(item.dishTitle) 메뉴 사진"
                )
            ],
            detailTags: snapshot.detailTags.map(DishFeedbackCardTag.fromTBA),
            tasteBubbles: snapshot.tasteBubbles.map(DishFeedbackTasteBubble.fromTBA),
            commentCount: commentCount,
            liked: liked,
            tbaAnalysisSnapshot: snapshot
        )
    }
}

enum DishFeedbackFeedPhase: Equatable {
    case loading
    case populated([DiningDishFeedbackItem])
    case empty
    case failed(String)

    var items: [DiningDishFeedbackItem] {
        if case .populated(let items) = self {
            return items
        }

        return []
    }
}

protocol DishFeedbackFeedRepository {
    func followingFeed() async throws -> DishFeedbackFeedPhase
}

struct FixtureDishFeedbackFeedRepository: DishFeedbackFeedRepository {
    func followingFeed() async throws -> DishFeedbackFeedPhase {
        let items = TasteBuddyNativeContent.tasteMatchFeed.map {
            DiningDishFeedbackItem.fromTasteMatchFeedItem($0)
        }

        return items.isEmpty ? .empty : .populated(items)
    }
}

enum FeedbackReflectionMediaLifecycleAction: String, CaseIterable, Codable, Equatable {
    case upload
    case read
    case replace
    case delete
    case accountCleanup
}

enum FeedbackReflectionMediaLifecycleStatus: String, Codable, Equatable {
    case pending
    case signedURLRequested
    case completed
    case failed
}

struct FeedbackReflectionMediaLifecycleOperation: Identifiable, Codable, Equatable {
    let id: String
    let feedbackID: String
    let imageID: String?
    let objectKey: String
    let action: FeedbackReflectionMediaLifecycleAction
    let status: FeedbackReflectionMediaLifecycleStatus

    init(
        id: String = UUID().uuidString,
        feedbackID: String,
        imageID: String? = nil,
        objectKey: String,
        action: FeedbackReflectionMediaLifecycleAction,
        status: FeedbackReflectionMediaLifecycleStatus = .pending
    ) {
        self.id = id
        self.feedbackID = feedbackID
        self.imageID = imageID
        self.objectKey = objectKey
        self.action = action
        self.status = status
    }
}

enum FeedbackReflectionMediaPolicy {
    static let privateObjectKeyPrefix = "feedback-reflections"
    static let maxUploadBytes = 6 * 1024 * 1024
    static let recommendedMaxPixelLength = 1600
    static let supportedContentTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    static func privateObjectKey(
        userID: String,
        date: Date,
        assetID: String,
        fileExtension: String = "jpg"
    ) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        return [
            privateObjectKeyPrefix,
            userID,
            formatter.string(from: date),
            "\(assetID).\(fileExtension)"
        ].joined(separator: "/")
    }
}

struct DishFeedbackComment: Identifiable, Codable, Equatable {
    let id: String
    let authorName: String
    let message: String
    let axis: TasteAxis
    let createdAt: Date

    init(
        id: String = UUID().uuidString,
        authorName: String,
        message: String,
        axis: TasteAxis,
        createdAt: Date = .now
    ) {
        self.id = id
        self.authorName = authorName
        self.message = message
        self.axis = axis
        self.createdAt = createdAt
    }
}

struct ProfileActivityMetric: Identifiable, Equatable {
    let id: String
    let label: String
    let value: String
    let symbol: String
    let color: Color
}

struct NativeInsight: Identifiable, Equatable {
    let id: String
    let eyebrow: String
    let title: String
    let description: String
    let supportingText: String
    let axis: TasteAxis
}

extension TasteProfile {
    var radarEntries: [RadarTasteEntry] {
        TasteAxis.allCases.map {
            RadarTasteEntry(axis: $0, score: score(for: $0))
        }
    }

    var measurementDisplayAgeLabel: String {
        let elapsedDays = max(0, Calendar.current.dateComponents(
            [.day],
            from: createdAt,
            to: .now
        ).day ?? 0)

        return switch elapsedDays {
        case 0: "오늘 측정"
        case 1: "어제 측정"
        default: "\(elapsedDays)일 전 측정"
        }
    }

    var isMeasurementStale: Bool {
        let elapsedDays = Calendar.current.dateComponents(
            [.day],
            from: createdAt,
            to: .now
        ).day ?? 0
        return elapsedDays >= 30
    }

    var formattedMeasurementDate: String {
        createdAt.formatted(
            .dateTime
                .locale(Locale(identifier: "ko_KR"))
                .year()
                .month(.twoDigits)
                .day(.twoDigits)
                .hour()
                .minute()
        )
    }

    var measurementAgeLabel: String {
        let elapsedDays = max(0, Calendar.current.dateComponents(
            [.day],
            from: createdAt,
            to: .now
        ).day ?? 0)

        return switch elapsedDays {
        case 0: "오늘"
        case 1: "1일 전"
        default: "\(elapsedDays)일 전"
        }
    }

    var analysisEntries: [TasteAxisAnalysis] {
        TasteAxis.allCases.map { axis in
            let score = score(for: axis)
            return TasteAxisAnalysis(axis: axis, score: score, delta: score - 50)
        }
    }

    var strongestAxis: TasteAxis {
        analysisEntries.max { left, right in
            left.score < right.score
        }?.axis ?? .umami
    }

    var weakestAxis: TasteAxis {
        analysisEntries.min { left, right in
            left.score < right.score
        }?.axis ?? .bitter
    }

    var totalSensitivityLabel: String {
        let average = analysisEntries.map(\.score).reduce(0, +) / max(analysisEntries.count, 1)

        if average >= 58 {
            return "민감"
        }

        if average <= 42 {
            return "부드러움"
        }

        return "평균"
    }

    var chefTranslationCopy: String {
        let first = topAxes.first ?? strongestAxis
        let second = topAxes.dropFirst().first ?? weakestAxis
        return "\(first.label)과 \(second.label)이 현재 더 빠르게 반응하는 포인트입니다. 코스 구성 시 두 신호가 너무 밀도 있게 겹치지 않도록 조절하면 전반적 밸런스가 한층 여유롭게 맞춰집니다."
    }

    var specialNote: String {
        "\(strongestAxis.label)의 존재감은 살리고 \(weakestAxis.label)은 더 천천히 올라오도록 안내하면 다음 다이닝에서 프로필을 더 정확히 다듬을 수 있어요."
    }

    var profileStageDescription: String {
        "빠른 보정으로 만든 시작 프로필입니다. 식사 기록이 늘어날수록 Building, Refined 단계로 해석의 확신도가 올라갑니다."
    }
}

enum TasteBuddyNativeContent {
    private static func makeDishFeedbackItem(
        id: String,
        authorName: String,
        restaurantName: String,
        dishTitle: String,
        images: [DiningDishFeedbackItem.Image],
        tbaInput: TasteBuddyAgentDiningAnalysisInput,
        commentCount: Int,
        liked: Bool
    ) -> DiningDishFeedbackItem {
        let snapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot(
            tbaInput,
            generatedAt: TasteBuddyAgent.fixedFixtureGeneratedAt
        )

        return DiningDishFeedbackItem(
            id: id,
            authorName: authorName,
            restaurantName: restaurantName,
            dishTitle: dishTitle,
            summary: snapshot.summary,
            reactionLabel: snapshot.tasteBubbles.first?.label ?? "미각 기록",
            images: images,
            detailTags: snapshot.detailTags.map(DishFeedbackCardTag.fromTBA),
            tasteBubbles: snapshot.tasteBubbles.map(DishFeedbackTasteBubble.fromTBA),
            commentCount: commentCount,
            liked: liked,
            tbaAnalysisSnapshot: snapshot
        )
    }

    static let tasteMatchFeed: [TasteMatchFeedItem] = [
        TasteMatchFeedItem(
            id: "match-onjium-broth",
            reviewerID: "mina",
            reviewerName: "김민아",
            reviewerHandle: "@맑은끝민아",
            reviewerTasteScores: [
                "sweet": 52, "sour": 70, "bitter": 42,
                "salty": 48, "umami": 86, "fat": 44,
            ],
            reviewerConfidenceScores: [
                "sweet": 62, "sour": 76, "bitter": 58,
                "salty": 60, "umami": 88, "fat": 56,
            ],
            relationLabel: "Taste Twin",
            restaurantID: "onjium",
            restaurantName: "온지음",
            dishTitle: "맑은 육수와 산뜻한 여운",
            reason: "감칠맛의 깊이는 살리면서 후반부 무게를 가볍게 읽기 좋은 기록이에요.",
            supportingSignals: ["맑은 감칠맛", "가벼운 피니시"],
            tasteTags: ["감칠맛", "산미"],
            experienceTags: ["deep", "fresh", "gentle"],
            sharedSignals: [
                TasteMatchSharedSignal(axis: .umami, confidence: 0.92),
                TasteMatchSharedSignal(axis: .sour, confidence: 0.74),
            ],
            learnedConfidenceScore: 0.82,
            matchRate: 92,
            axis: .umami
        ),
        TasteMatchFeedItem(
            id: "match-jungsik-acidity",
            reviewerID: "jae",
            reviewerName: "정서윤",
            reviewerHandle: "@산미탐험서윤",
            reviewerTasteScores: [
                "sweet": 66, "sour": 88, "bitter": 46,
                "salty": 42, "umami": 58, "fat": 38,
            ],
            reviewerConfidenceScores: [
                "sweet": 72, "sour": 90, "bitter": 54,
                "salty": 52, "umami": 66, "fat": 50,
            ],
            relationLabel: "Similar Palate",
            restaurantID: "jungsik",
            restaurantName: "정식당",
            dishTitle: "밝은 산미가 만드는 리듬",
            reason: "산미의 작은 차이를 실제 식사 맥락에서 확인해 프로필을 다듬기 좋아요.",
            supportingSignals: ["밝은 산미", "절제된 단맛"],
            tasteTags: ["신맛", "단맛"],
            experienceTags: ["crisp", "fresh", "delicate"],
            sharedSignals: [
                TasteMatchSharedSignal(axis: .sour, confidence: 0.91),
                TasteMatchSharedSignal(axis: .sweet, confidence: 0.67),
            ],
            learnedConfidenceScore: 0.76,
            matchRate: 88,
            axis: .sour
        ),
        TasteMatchFeedItem(
            id: "match-mosu-bitter",
            reviewerID: "hyeon",
            reviewerName: "최도윤",
            reviewerHandle: "@불향도윤",
            reviewerTasteScores: [
                "sweet": 38, "sour": 44, "bitter": 84,
                "salty": 54, "umami": 72, "fat": 76,
            ],
            reviewerConfidenceScores: [
                "sweet": 50, "sour": 56, "bitter": 86,
                "salty": 62, "umami": 78, "fat": 80,
            ],
            relationLabel: "Worth Exploring",
            restaurantID: "mosu",
            restaurantName: "모수",
            dishTitle: "쌉싸름한 여운이 정리하는 코스",
            reason: "쓴맛이 장식처럼 쓰이는 메뉴라 부담보다 정돈감으로 읽히는지 보기 좋습니다.",
            supportingSignals: ["긴 여운", "정돈된 쓴맛"],
            tasteTags: ["쓴맛", "지방맛"],
            experienceTags: ["smoky", "grilled", "rich"],
            sharedSignals: [
                TasteMatchSharedSignal(axis: .bitter, confidence: 0.86),
                TasteMatchSharedSignal(axis: .fat, confidence: 0.72),
            ],
            learnedConfidenceScore: 0.71,
            matchRate: 84,
            axis: .bitter
        )
    ]

    static let fallbackDishFeedbackItems: [DiningDishFeedbackItem] = [
        makeDishFeedbackItem(
            id: "dish-onjium-clear-broth",
            authorName: "나",
            restaurantName: "온지음",
            dishTitle: "맑은 육수 코스",
            images: [
                DiningDishFeedbackItem.Image(
                    id: "onjium-course",
                    alt: "맑은 육수 코스 메뉴 사진"
                )
            ],
            tbaInput: TasteBuddyAgentDiningAnalysisInput(
                detailTags: ["balance-umami-depth", "balance-clear-seasoning", "flow-clean-finish"],
                dishKindTags: ["broth"],
                id: "dish-onjium-clear-broth",
                ingredients: ["육수"],
                restaurantName: "온지음",
                reviewSnippet: "감칠맛은 선명했지만 후반부의 무게가 가볍게 정리되어 편안하게 이어졌어요.",
                subject: "맑은 육수 코스",
                tasteTags: ["감칠맛", "짠맛", "신맛"],
                techniques: []
            ),
            commentCount: 2,
            liked: true
        ),
        makeDishFeedbackItem(
            id: "dish-bistro-acidity",
            authorName: "나",
            restaurantName: "비스트로 샘플",
            dishTitle: "시트러스 소스 생선 요리",
            images: [
                DiningDishFeedbackItem.Image(
                    id: "citrus-fish",
                    alt: "시트러스 소스 생선 요리 메뉴 사진"
                )
            ],
            tbaInput: TasteBuddyAgentDiningAnalysisInput(
                detailTags: ["flow-first-clear", "balance-sweet-support", "balance-aftertaste-light"],
                dishKindTags: ["seafood"],
                id: "dish-bistro-acidity",
                ingredients: ["생선", "시트러스"],
                restaurantName: "비스트로 샘플",
                reviewSnippet: "밝은 산미가 초반 리듬을 잘 만들었고, 단맛은 조금만 더 낮아도 좋겠다는 기록을 남겼어요.",
                subject: "시트러스 소스 생선 요리",
                tasteTags: ["신맛", "단맛"],
                techniques: ["소스"]
            ),
            commentCount: 0,
            liked: false
        )
    ]

    static let followingDishFeedbackItems: [DiningDishFeedbackItem] = [
        makeDishFeedbackItem(
            id: "following-mina-broth",
            authorName: "김민아",
            restaurantName: "온지음",
            dishTitle: "맑은 육수와 산뜻한 여운",
            images: [
                DiningDishFeedbackItem.Image(
                    id: "following-onjium-course",
                    alt: "맑은 육수와 산뜻한 여운 메뉴 사진"
                )
            ],
            tbaInput: TasteBuddyAgentDiningAnalysisInput(
                detailTags: ["맑은 감칠맛", "가벼운 피니시", "산미"],
                dishKindTags: ["broth"],
                id: "following-mina-broth",
                ingredients: ["육수"],
                restaurantName: "온지음",
                reviewSnippet: "감칠맛의 깊이는 살리면서 후반부 무게를 가볍게 읽기 좋은 기록이에요.",
                subject: "맑은 육수와 산뜻한 여운",
                tasteTags: ["감칠맛", "신맛"],
                techniques: []
            ),
            commentCount: 2,
            liked: false
        ),
        makeDishFeedbackItem(
            id: "following-jae-acidity",
            authorName: "정서윤",
            restaurantName: "정식당",
            dishTitle: "밝은 산미가 만드는 리듬",
            images: [
                DiningDishFeedbackItem.Image(
                    id: "following-jungsik-acidity",
                    alt: "밝은 산미가 만드는 리듬 메뉴 사진"
                )
            ],
            tbaInput: TasteBuddyAgentDiningAnalysisInput(
                detailTags: ["flow-first-clear", "balance-sweet-support", "balance-aftertaste-light"],
                dishKindTags: [],
                id: "following-jae-acidity",
                ingredients: ["산미", "단맛"],
                restaurantName: "정식당",
                reviewSnippet: "산미의 작은 차이를 실제 식사 맥락에서 확인해 프로필을 다듬기 좋아요.",
                subject: "밝은 산미가 만드는 리듬",
                tasteTags: ["신맛", "단맛"],
                techniques: []
            ),
            commentCount: 0,
            liked: true
        )
    ]

    static let seededDishFeedbackComments: [String: [DishFeedbackComment]] = [
        "following-mina-broth": [
            DishFeedbackComment(
                id: "following-mina-broth-comment-1",
                authorName: "신준호",
                message: "후반부 간이 가벼웠다는 기록이 좋아요. 감칠맛은 살리고 피니시를 짧게 가져간 느낌이네요.",
                axis: .umami,
                createdAt: Date(timeIntervalSince1970: 1_720_000_000)
            ),
            DishFeedbackComment(
                id: "following-mina-broth-comment-2",
                authorName: "김민아",
                message: "다음에는 산미가 먼저 올라오는 메뉴와 비교해보면 프로필 차이가 더 잘 보일 것 같아요.",
                axis: .sour,
                createdAt: Date(timeIntervalSince1970: 1_720_003_600)
            ),
        ],
        "dish-onjium-clear-broth": [
            DishFeedbackComment(
                id: "dish-onjium-clear-broth-comment-1",
                authorName: "김민아",
                message: "맑은 감칠맛이 유지되는 지점이 잘 보이는 기록이에요.",
                axis: .umami,
                createdAt: Date(timeIntervalSince1970: 1_720_007_200)
            ),
            DishFeedbackComment(
                id: "dish-onjium-clear-broth-comment-2",
                authorName: "정서윤",
                message: "가벼운 피니시 쪽으로 다음 코스를 비교해보면 좋겠어요.",
                axis: .sour,
                createdAt: Date(timeIntervalSince1970: 1_720_010_800)
            ),
        ],
    ]

    static let insights: [NativeInsight] = [
        NativeInsight(
            id: "chef-translation",
            eyebrow: "Chef translation",
            title: "셰프에게는 조절점으로 전달됩니다",
            description: "강한 취향 요청이 아니라, 손님이 경험을 더 잘 받아들일 수 있는 시작 단서로 번역합니다.",
            supportingText: "현재는 Starter Profile이라 확신보다 맥락 설명을 함께 전달합니다.",
            axis: .umami
        ),
        NativeInsight(
            id: "refinement-loop",
            eyebrow: "Profile refinement",
            title: "다음 식사 피드백이 프로필을 다듬습니다",
            description: "좋았던 균형과 아쉬웠던 여운을 한 번만 남겨도 다음 추천의 기준이 더 구체화됩니다.",
            supportingText: "피드백은 행정 입력이 아니라 다음 다이닝을 더 잘 맞추는 투자입니다.",
            axis: .sour
        )
    ]
}
