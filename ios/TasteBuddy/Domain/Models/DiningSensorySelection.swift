import Foundation

/// 선택 당시 문구와 응답을 보존한다. 추천 노출이나 지도 위치는 선택 응답이 아니다.
struct DiningSensorySelection: Codable, Equatable, Identifiable, Sendable {
    static let catalogVersion = "dining-sensory-selection/1"
    struct Kind: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let bubble = Self(rawValue: "bubble")
        static let detailTag = Self(rawValue: "detailTag")
        static let allCases: [Self] = [.bubble, .detailTag]
        var label: String { ["bubble": "미각 버블", "detailTag": "디테일 태그"][rawValue] ?? "알 수 없는 선택" }
    }
    struct Liking: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let liked = Self(rawValue: "liked")
        static let neutral = Self(rawValue: "neutral")
        static let disliked = Self(rawValue: "disliked")
        static let allCases: [Self] = [.liked, .neutral, .disliked]
        var label: String { ["liked": "좋았어요", "neutral": "보통이에요", "disliked": "아쉬웠어요"][rawValue] ?? "알 수 없는 선택" }
    }
    struct Intensity: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let light = Self(rawValue: "light")
        static let medium = Self(rawValue: "medium")
        static let strong = Self(rawValue: "strong")
        static let allCases: [Self] = [.light, .medium, .strong]
        var label: String { ["light": "약하게", "medium": "중간 정도", "strong": "강하게"][rawValue] ?? "알 수 없는 선택" }
    }
    struct PreferenceFit: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let tooWeak = Self(rawValue: "tooWeak")
        static let justRight = Self(rawValue: "justRight")
        static let tooStrong = Self(rawValue: "tooStrong")
        static let allCases: [Self] = [.tooWeak, .justRight, .tooStrong]
        var label: String { ["tooWeak": "조금 부족했어요", "justRight": "알맞았어요", "tooStrong": "조금 과했어요"][rawValue] ?? "알 수 없는 선택" }
    }
    struct Target: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let unspecified = Self(rawValue: "unspecified")
        static let wholeDish = Self(rawValue: "whole_dish")
        static let sauce = Self(rawValue: "sauce")
        static let surface = Self(rawValue: "surface")
        static let inside = Self(rawValue: "inside")
        static let coating = Self(rawValue: "coating")
        static let skin = Self(rawValue: "skin")
        static let broth = Self(rawValue: "broth")
        static let noodles = Self(rawValue: "noodles")
        static let meat = Self(rawValue: "meat")
        static let filling = Self(rawValue: "filling")
        static let flesh = Self(rawValue: "flesh")
        static let cream = Self(rawValue: "cream")
        static let allCases: [Self] = [.unspecified, .wholeDish, .sauce, .surface, .inside, .coating, .skin, .broth, .noodles, .meat, .filling, .flesh, .cream]
        var label: String { ["unspecified": "따로 정하지 않음", "whole_dish": "음식 전체", "sauce": "소스", "surface": "겉", "inside": "속", "coating": "튀김옷", "skin": "껍질", "broth": "국물", "noodles": "면", "meat": "고기", "filling": "소", "flesh": "속살", "cream": "크림"][rawValue] ?? "알 수 없는 선택" }
    }
    struct Phase: DiningSelectionStringValue {
        let rawValue: String
        init(rawValue: String) { self.rawValue = rawValue }
        static let unspecified = Self(rawValue: "unspecified")
        static let firstBite = Self(rawValue: "first_bite")
        static let earlyMeal = Self(rawValue: "early_meal")
        static let duringMeal = Self(rawValue: "during_meal")
        static let lateMeal = Self(rawValue: "late_meal")
        static let afterSwallow = Self(rawValue: "after_swallow")
        static let afterMeal = Self(rawValue: "after_meal")
        static let allCases: [Self] = [.unspecified, .firstBite, .earlyMeal, .duringMeal, .lateMeal, .afterSwallow, .afterMeal]
        var label: String { ["unspecified": "따로 정하지 않음", "first_bite": "첫입", "early_meal": "초반", "during_meal": "먹는 동안", "late_meal": "나중", "after_swallow": "삼킨 뒤", "after_meal": "식사 후"][rawValue] ?? "알 수 없는 선택" }
    }
    var id: String
    var type: Kind
    var catalogVersion: String
    var labelSnapshot: String
    var liking: Liking?
    var intensity: Intensity?
    var preferenceFit: PreferenceFit?
    var target: Target
    var phase: Phase
    var relatedBubbleID: String?
    var unparsedPayload: DiningSelectionJSON? = nil

    init(id: String, type: Kind, catalogVersion: String = Self.catalogVersion, labelSnapshot: String, liking: Liking? = nil, intensity: Intensity? = nil, preferenceFit: PreferenceFit? = nil, target: Target = .unspecified, phase: Phase = .unspecified, relatedBubbleID: String? = nil) {
        self.id = id; self.type = type; self.catalogVersion = catalogVersion; self.labelSnapshot = labelSnapshot
        self.liking = liking; self.intensity = intensity; self.preferenceFit = preferenceFit
        self.target = target; self.phase = phase; self.relatedBubbleID = relatedBubbleID
    }

    private enum CodingKeys: String, CodingKey { case id, type, catalogVersion, labelSnapshot, liking, intensity, preferenceFit, target, phase, relatedBubbleID, unparsedPayload }
    init(from decoder: Decoder) throws {
        let raw = try DiningSelectionJSON(from: decoder)
        let c = try? decoder.container(keyedBy: CodingKeys.self)
        do {
            guard let c else { throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "선택 객체가 아님")) }
            self.init(id: try c.decode(String.self, forKey: .id), type: try c.decode(Kind.self, forKey: .type), catalogVersion: try c.decode(String.self, forKey: .catalogVersion), labelSnapshot: try c.decode(String.self, forKey: .labelSnapshot), liking: try c.decodeIfPresent(Liking.self, forKey: .liking), intensity: try c.decodeIfPresent(Intensity.self, forKey: .intensity), preferenceFit: try c.decodeIfPresent(PreferenceFit.self, forKey: .preferenceFit), target: try c.decodeIfPresent(Target.self, forKey: .target) ?? .unspecified, phase: try c.decodeIfPresent(Phase.self, forKey: .phase) ?? .unspecified, relatedBubbleID: try c.decodeIfPresent(String.self, forKey: .relatedBubbleID))
            unparsedPayload = try c.decodeIfPresent(DiningSelectionJSON.self, forKey: .unparsedPayload)
        } catch {
            self.init(id: (try? c?.decode(String.self, forKey: .id)) ?? "unreadable-selection", type: .init(rawValue: (try? c?.decode(String.self, forKey: .type)) ?? "unknown"), catalogVersion: (try? c?.decode(String.self, forKey: .catalogVersion)) ?? "unknown", labelSnapshot: (try? c?.decode(String.self, forKey: .labelSnapshot)) ?? "읽을 수 없는 선택")
            unparsedPayload = raw
        }
    }
}

indirect enum DiningSelectionJSON: Codable, Equatable, Sendable {
    case object([String: Self]), array([Self]), string(String), number(Double), bool(Bool), null
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode([String: Self].self) { self = .object(v) }
        else { self = .array(try c.decode([Self].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self { case .object(let v): try c.encode(v); case .array(let v): try c.encode(v); case .string(let v): try c.encode(v); case .number(let v): try c.encode(v); case .bool(let v): try c.encode(v); case .null: try c.encodeNil() }
    }
}

/// 미래 enum값도 원래 문자열로 읽고 저장한다. 알 수 없는 값은 정제 단계에서 보류한다.
protocol DiningSelectionStringValue: RawRepresentable, Codable, Equatable, Hashable, CaseIterable, Identifiable, Sendable where RawValue == String, AllCases == [Self] {
    init(rawValue: String)
}
extension DiningSelectionStringValue {
    var id: String { rawValue }
    init(from decoder: Decoder) throws { self.init(rawValue: try decoder.singleValueContainer().decode(String.self)) }
    func encode(to encoder: Encoder) throws { var container = encoder.singleValueContainer(); try container.encode(rawValue) }
}

struct DiningSensoryCatalogContract: Decodable, Sendable {
    struct Entry: Decodable, Sendable {
        let id: String
        let type: String
        let label: String
        let catalogVersion: String
        let attribute: String
        let reference: Bool?
        let contextRole: String?
        let intrinsicIntensity: String?
        let intrinsicFit: String?
        let intrinsicTarget: String?
        let intrinsicPhase: String?
        let resolution: String
    }
    struct Fixture: Decodable, Sendable {
        let id: String
        let selections: [DiningSensorySelection]
        let expected: SensoryRuleResult
    }
    let version: String
    let entries: [Entry]
    let values: [String: [String: String]]
    let labels: [String: [String: String]]
    let fixtures: [Fixture]
}
