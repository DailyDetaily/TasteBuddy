import SwiftUI
import XCTest
@testable import TasteBuddy

final class NativeLayoutComponentsTests: XCTestCase {
    func testExactWidthFitDoesNotCreateAnotherRow() {
        let arrangement = TBWrapArrangement(
            sizes: [CGSize(width: 40, height: 20), CGSize(width: 54, height: 26)],
            availableWidth: 100,
            spacing: 6
        )

        XCTAssertEqual(arrangement.origins, [CGPoint(x: 0, y: 0), CGPoint(x: 46, y: 0)])
        XCTAssertEqual(arrangement.size, CGSize(width: 100, height: 26))
    }

    func testNarrowerWidthWrapsBelowTheTallestItemInThePreviousRow() {
        let arrangement = TBWrapArrangement(
            sizes: [
                CGSize(width: 40, height: 38),
                CGSize(width: 45, height: 20),
                CGSize(width: 20, height: 26)
            ],
            availableWidth: 100,
            spacing: 6
        )

        XCTAssertEqual(
            arrangement.origins,
            [CGPoint(x: 0, y: 0), CGPoint(x: 46, y: 0), CGPoint(x: 0, y: 44)]
        )
        XCTAssertEqual(arrangement.size.height, 70)
    }

    func testOversizedChipKeepsItsNaturalWidthWithoutAddingABlankFirstRow() {
        let arrangement = TBWrapArrangement(
            sizes: [CGSize(width: 180, height: 26), CGSize(width: 40, height: 20)],
            availableWidth: 120,
            spacing: 6
        )

        XCTAssertEqual(arrangement.origins, [CGPoint(x: 0, y: 0), CGPoint(x: 0, y: 32)])
        XCTAssertEqual(arrangement.size, CGSize(width: 120, height: 52))
    }

    func testUnconstrainedWidthUsesTheNaturalContentWidthWithoutATrailingGap() {
        let sizes = [CGSize(width: 40, height: 20), CGSize(width: 54, height: 26)]
        let widths: [CGFloat?] = [nil, .infinity]

        for width in widths {
            let arrangement = TBWrapArrangement(sizes: sizes, availableWidth: width, spacing: 6)
            XCTAssertEqual(arrangement.size, CGSize(width: 100, height: 26))
        }
    }

    func testEmptyCollectionHasNoPhantomRowOrGap() {
        let arrangement = TBWrapArrangement(sizes: [], availableWidth: 220, spacing: 6)

        XCTAssertTrue(arrangement.origins.isEmpty)
        XCTAssertEqual(arrangement.size, CGSize(width: 220, height: 0))
    }
}
