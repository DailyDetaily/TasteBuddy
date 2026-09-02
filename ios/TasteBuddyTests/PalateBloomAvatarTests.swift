import XCTest
@testable import TasteBuddy

final class PalateBloomAvatarTests: XCTestCase {
    func testFNV1aMatchesReactUTF16HashContract() {
        XCTAssertEqual(
            PalateBloomHash.fnv1a("신준호|fallbackRank|sweet"),
            3_168_554_777
        )
        XCTAssertEqual(PalateBloomHash.fnv1a("current-user"), 1_447_870_242)
    }

    func testFallbackProfileMatchesReactSeededBandsAndJitter() {
        let profile = PalateBloomProfile.fallback(seed: "current-user")

        XCTAssertEqual(profile[.salty], 81)
        XCTAssertEqual(profile[.fat], 69)
        XCTAssertEqual(profile[.sour], 67)
        XCTAssertEqual(profile[.sweet], 50)
        XCTAssertEqual(profile[.umami], 37)
        XCTAssertEqual(profile[.bitter], 27)
    }

    func testShapeCountAndVariantMatchReactSeedContract() {
        let profile = PalateBloomProfile(values: [
            .sweet: 82,
            .sour: 76,
            .bitter: 54,
            .salty: 63,
            .umami: 91,
            .fat: 47
        ])
        let layout = PalateBloomLayout.make(
            profile: profile,
            shapeSeed: "current-user"
        )

        XCTAssertEqual(layout.shapeCount, 4)
        XCTAssertEqual(layout.shapeVariant.coreShape, .seedCluster)
        XCTAssertEqual(layout.shapeVariant.petalShape, .capsulePetal)
        XCTAssertEqual(layout.shapeVariant.starShape, .roundedSpokeStar)
        XCTAssertEqual(layout.layers.map(\.axis), [
            .umami, .sweet, .sour, .salty, .bitter, .fat
        ])
    }

    func testEqualValuesPreserveReactTasteKeyOrder() {
        let layout = PalateBloomLayout.make(
            profile: PalateBloomProfile(
                values: Dictionary(
                    uniqueKeysWithValues: TasteAxis.allCases.map { ($0, 50.0) }
                )
            )
        )

        XCTAssertEqual(layout.layers.map(\.axis), TasteAxis.allCases)
    }
}
