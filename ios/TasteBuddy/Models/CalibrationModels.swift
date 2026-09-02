import Foundation

struct CalibrationQuestion: Identifiable {
    let axis: TasteAxis
    let eyebrow: String
    let title: String
    let description: String
    let anchor: String
    let anchorDetail: String
    let leftLabel: String
    let centerLabel: String
    let rightLabel: String
    let responseLabels: [String]

    var id: TasteAxis { axis }

    func responseLabel(for value: Int) -> String {
        responseLabels[max(0, min(value + 3, responseLabels.count - 1))]
    }
}

enum CalibrationContent {
    static let questions: [CalibrationQuestion] = [
        CalibrationQuestion(
            axis: .sweet,
            eyebrow: "01 단맛",
            title: "바나나맛우유의 단맛은\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "정확한 숫자보다 익숙한 단맛 기준이 내 입에서 어떻게 읽히는지 골라주세요.",
            anchor: "빙그레 바나나맛우유",
            anchorDetail: "한 모금 마셨을 때 느껴지는 기본 단맛",
            leftLabel: "너무 달다",
            centerLabel: "기분 좋다",
            rightLabel: "아쉽다",
            responseLabels: ["훨씬 달다", "꽤 달다", "조금 달다", "딱 좋다", "조금 아쉽다", "더 달아도 좋다", "훨씬 더 달아야 한다"]
        ),
        CalibrationQuestion(
            axis: .sour,
            eyebrow: "02 신맛",
            title: "기본 피클의 산미는\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "강한 산미 취향보다 익숙한 기준점이 내 입에 어떻게 들어오는지 떠올려보세요.",
            anchor: "수제버거집 기본 피클",
            anchorDetail: "얇은 피클 한 조각의 첫 인상",
            leftLabel: "불호",
            centerLabel: "적당히 즐김",
            rightLabel: "극호",
            responseLabels: ["거의 못 먹는다", "꽤 부담스럽다", "조금 부담스럽다", "적당히 즐긴다", "조금 더 강해도 좋다", "강한 산미가 좋다", "강한 산미를 찾아먹는다"]
        ),
        CalibrationQuestion(
            axis: .bitter,
            eyebrow: "03 쓴맛",
            title: "톨 아메리카노 투샷은\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "쓴맛 자체의 취향보다 대중적인 기준점이 나에게 어떻게 읽히는지 확인해요.",
            anchor: "아메리카노 톨 사이즈 기본 투샷",
            anchorDetail: "첫 두세 모금의 쓴맛과 탄 향",
            leftLabel: "너무 쓰다",
            centerLabel: "기분 좋다",
            rightLabel: "연하다",
            responseLabels: ["훨씬 쓰다", "꽤 쓰다", "조금 쓰다", "딱 좋다", "조금 연하다", "꽤 연하다", "훨씬 연하다"]
        ),
        CalibrationQuestion(
            axis: .salty,
            eyebrow: "04 짠맛",
            title: "신라면 기본 국물은\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "익숙한 국물의 첫 몇 숟갈이 내 입에 어떻게 느껴지는지만 확인해요.",
            anchor: "신라면 기본 레시피 국물",
            anchorDetail: "집에서 끓인 첫 몇 숟갈의 간",
            leftLabel: "짜다",
            centerLabel: "딱 맞다",
            rightLabel: "싱겁다",
            responseLabels: ["훨씬 짜다", "꽤 짜다", "조금 짜다", "딱 맞다", "조금 싱겁다", "꽤 싱겁다", "훨씬 싱겁다"]
        ),
        CalibrationQuestion(
            axis: .umami,
            eyebrow: "05 감칠맛",
            title: "평양냉면 육수의 깊이는\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "은은한 국물의 깊이를 기준점으로 감칠맛 축의 시작 좌표를 잡아요.",
            anchor: "평양냉면 육수",
            anchorDetail: "맑은 고기 육수 한 모금의 첫 인상",
            leftLabel: "맹맛이다",
            centerLabel: "은은하다",
            rightLabel: "깊게 반응한다",
            responseLabels: ["훨씬 밋밋하다", "꽤 밋밋하다", "조금 약하다", "은은해서 좋다", "조금 더 깊다", "꽤 깊게 느껴진다", "아주 깊게 반응한다"]
        ),
        CalibrationQuestion(
            axis: .fat,
            eyebrow: "06 지방맛",
            title: "삼겹살 첫 입의 고소함은\n지금의 나에게 어느 쪽에 가까운가요?",
            description: "기름지다와 고소하다 사이에서 익숙한 첫 입이 어떻게 느껴지는지 골라주세요.",
            anchor: "삼겹살 첫 입의 고소함",
            anchorDetail: "막 구운 첫 점의 고소함과 무게감",
            leftLabel: "느끼하다",
            centerLabel: "고소하다",
            rightLabel: "부족하다",
            responseLabels: ["훨씬 느끼하다", "꽤 느끼하다", "조금 느끼하다", "고소해서 좋다", "조금 부족하다", "꽤 부족하다", "훨씬 부족하다"]
        )
    ]
}

enum CalibrationEngine {
    static func makeProfile(responses: [TasteAxis: Int]) -> TasteProfile {
        let scoredAxes = TasteAxis.allCases.map { axis in
            let response = max(-3, min(3, responses[axis] ?? 0))
            let score = Int((Double(response + 3) / 6 * 100).rounded())
            return (axis: axis, score: score)
        }
        let sorted = scoredAxes.sorted {
            $0.score == $1.score
                ? TasteAxis.allCases.firstIndex(of: $0.axis)! < TasteAxis.allCases.firstIndex(of: $1.axis)!
                : $0.score > $1.score
        }
        let topAxes = sorted.prefix(2).map(\.axis)
        let cautionAxis = sorted.last?.axis ?? .fat
        let spread = (sorted.first?.score ?? 50) - (sorted.last?.score ?? 50)
        let summary: String

        if spread < 20 {
            summary = "전반적으로 기준점에 가까운 균형형 스타터 프로필이에요. 다음 식사의 피드백으로 작은 차이를 더 정교하게 다듬어갑니다."
        } else {
            let topLabels = topAxes.map(\.label).joined(separator: "과 ")
            summary = "지금은 \(topLabels) 축이 먼저 살아나요. \(cautionAxis.label)은 강도를 과하게 밀지 않는 편이 더 편안할 가능성이 높아요."
        }

        return TasteProfile(
            createdAt: .now,
            scores: Dictionary(uniqueKeysWithValues: scoredAxes.map { ($0.axis.rawValue, $0.score) }),
            confidence: "Starter",
            summary: summary,
            topAxes: topAxes,
            cautionAxis: cautionAxis
        )
    }

    static func interpretation(for axis: TasteAxis, score: Int) -> String {
        switch score {
        case ...35:
            "\(axis.label)은 기준보다 한 톤 가벼울 때 더 편안하게 느껴질 가능성이 높아요."
        case 66...:
            "\(axis.label)은 기준보다 조금 더 또렷할 때 만족감이 살아나는 편이에요."
        default:
            "\(axis.label)은 익숙한 기준점 근처에서 자연스럽게 받아들이는 편이에요."
        }
    }
}
