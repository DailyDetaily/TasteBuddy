import SwiftUI

struct RestaurantSummary: Identifiable, Hashable {
    struct Dish: Identifiable, Hashable {
        let id: String
        let title: String
        let summary: String
        let axis: TasteAxis
        let tags: [String]
    }

    struct InfoRow: Identifiable, Hashable {
        let id: String
        let label: String
        let value: String
        let symbol: String
    }

    let id: String
    let name: String
    let chefName: String
    let category: String
    let locationLabel: String
    let imageName: String?
    let axis: TasteAxis
    let matchRate: Int
    let summary: String
    let tags: [String]
    let memorableDishes: [Dish]
    let infoRows: [InfoRow]
}

enum RestaurantCatalog {
    static let restaurants: [RestaurantSummary] = [
        RestaurantSummary(
            id: "onjium",
            name: "온지음",
            chefName: "온지음 셰프",
            category: "Korean course",
            locationLabel: "서울 종로 · 한식 파인다이닝",
            imageName: "OnjiumChefs",
            axis: .umami,
            matchRate: 92,
            summary: "맑은 감칠맛과 편안한 여운을 중심으로, 후반부 무게를 가볍게 조절하기 좋은 레스토랑입니다.",
            tags: ["맑은 감칠맛", "절제된 간", "가벼운 피니시"],
            memorableDishes: [
                RestaurantSummary.Dish(
                    id: "clear-broth-course",
                    title: "맑은 육수 코스",
                    summary: "감칠맛은 살리면서 짠맛의 밀도를 낮춰 프로필과 비교하기 좋은 메뉴입니다.",
                    axis: .umami,
                    tags: ["감칠맛", "산미", "정돈감"]
                ),
                RestaurantSummary.Dish(
                    id: "seasonal-herb-finish",
                    title: "계절 허브 피니시",
                    summary: "쌉싸름한 허브가 코스의 끝을 정리하는지 확인하기 좋습니다.",
                    axis: .bitter,
                    tags: ["여운", "허브", "쓴맛"]
                )
            ],
            infoRows: [
                RestaurantSummary.InfoRow(id: "hours", label: "운영", value: "저녁 코스 중심", symbol: "clock"),
                RestaurantSummary.InfoRow(id: "tone", label: "추천 맥락", value: "맑은 감칠맛과 낮은 후반 무게", symbol: "sparkles")
            ]
        ),
        RestaurantSummary(
            id: "mingles",
            name: "밍글스",
            chefName: "강민구 셰프",
            category: "Modern Korean",
            locationLabel: "서울 강남구 도산대로67길 19",
            imageName: "KangMingoo",
            axis: .umami,
            matchRate: 83,
            summary: "밍글스는 현재 프로필 기준에서 메뉴의 감각 흐름을 차분히 읽어볼 만한 레스토랑이에요.",
            tags: ["모던 한식 코스", "서울 청담", "한우 메인", "현대 한식", "페어링 추천"],
            memorableDishes: [
                RestaurantSummary.Dish(
                    id: "mingles-tasting",
                    title: "밍글링 팟",
                    summary: "밍글링 팟 · 2가지 만두, 버섯 치킨, 은행, 해삼 & 새우전, 한우 브로스",
                    axis: .umami,
                    tags: ["감칠맛", "깊은 여운"]
                )
            ],
            infoRows: [
                RestaurantSummary.InfoRow(
                    id: "hours",
                    label: "운영",
                    value: "금 오후 12:00–3:00, 오후 6:00–10:00",
                    symbol: "clock"
                ),
                RestaurantSummary.InfoRow(
                    id: "phone",
                    label: "전화",
                    value: "02-515-7306",
                    symbol: "phone"
                )
            ]
        ),
        RestaurantSummary(
            id: "jungsik",
            name: "정식당",
            chefName: "임정식 셰프",
            category: "Modern Korean",
            locationLabel: "서울 강남 · 모던 한식",
            imageName: nil,
            axis: .sour,
            matchRate: 88,
            summary: "밝은 산미와 절제된 단맛이 코스 리듬을 만드는 곳이라, 산미 반응을 실제 식사 맥락에서 확인하기 좋습니다.",
            tags: ["밝은 산미", "절제된 단맛", "모던 코스"],
            memorableDishes: [
                RestaurantSummary.Dish(
                    id: "citrus-fish",
                    title: "시트러스 소스 생선 요리",
                    summary: "초반 산미의 리듬과 단맛의 받침을 함께 기록하기 좋은 메뉴입니다.",
                    axis: .sour,
                    tags: ["신맛", "단맛", "피니시"]
                )
            ],
            infoRows: [
                RestaurantSummary.InfoRow(id: "hours", label: "운영", value: "점심·저녁 코스", symbol: "clock"),
                RestaurantSummary.InfoRow(id: "tone", label: "추천 맥락", value: "산미 리듬과 절제된 단맛", symbol: "sparkles")
            ]
        ),
        RestaurantSummary(
            id: "mosu",
            name: "모수",
            chefName: "모수 셰프",
            category: "Contemporary",
            locationLabel: "서울 용산 · 컨템포러리",
            imageName: nil,
            axis: .bitter,
            matchRate: 84,
            summary: "쌉싸름한 여운이 장식이 아니라 정돈감으로 느껴지는지 확인하기 좋은 코스 맥락입니다.",
            tags: ["긴 여운", "정돈된 쓴맛", "지방맛 균형"],
            memorableDishes: [
                RestaurantSummary.Dish(
                    id: "quiet-finish",
                    title: "쌉싸름한 여운의 디저트",
                    summary: "쓴맛과 지방맛의 마무리 균형을 피드백하기 좋습니다.",
                    axis: .bitter,
                    tags: ["쓴맛", "지방맛", "여운"]
                )
            ],
            infoRows: [
                RestaurantSummary.InfoRow(id: "hours", label: "운영", value: "코스 운영", symbol: "clock"),
                RestaurantSummary.InfoRow(id: "tone", label: "추천 맥락", value: "여운과 지방맛의 정돈감", symbol: "sparkles")
            ]
        )
    ]

    static let savedDefaults: [String] = ["onjium", "jungsik"]

    static func restaurant(id: String) -> RestaurantSummary {
        restaurants.first { $0.id == id } ?? restaurants[0]
    }

    static func restaurants(ids: Set<String>) -> [RestaurantSummary] {
        restaurants.filter { ids.contains($0.id) }
    }
}
