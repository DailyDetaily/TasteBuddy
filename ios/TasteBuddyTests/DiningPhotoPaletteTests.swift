import XCTest
import UIKit
@testable import TasteBuddy

final class DiningPhotoPaletteTests: XCTestCase {
    func testDominantColorsAreOrderedByRepresentedPhotoArea() throws {
        let red = UIColor(red: 0.92, green: 0.18, blue: 0.10, alpha: 1)
        let green = UIColor(red: 0.12, green: 0.72, blue: 0.30, alpha: 1)
        let blue = UIColor(red: 0.12, green: 0.28, blue: 0.92, alpha: 1)
        let data = try stripedPNG([
            (red, 0.60),
            (green, 0.28),
            (blue, 0.12)
        ])

        let palette = DiningPhotoPalette.extract(from: data)

        XCTAssertEqual(palette.source, .photo)
        XCTAssertEqual(palette.representativeColorCount, 3)
        XCTAssertEqual(palette.colors.count, 3)
        XCTAssertLessThan(hueDistance(palette.colors[0], red), 6)
        XCTAssertLessThan(hueDistance(palette.colors[1], green), 8)
        XCTAssertLessThan(hueDistance(palette.colors[2], blue), 8)
        XCTAssertEqual(palette.colorProportions[0], 0.60, accuracy: 0.03)
        XCTAssertEqual(palette.colorProportions[1], 0.28, accuracy: 0.03)
        XCTAssertEqual(palette.colorProportions[2], 0.12, accuracy: 0.03)
    }

    func testSimilarDominantColorsMergeBeforeRankingDistinctColors() throws {
        let warmRed = UIColor(red: 0.86, green: 0.16, blue: 0.09, alpha: 1)
        let neighboringRed = UIColor(red: 0.76, green: 0.22, blue: 0.11, alpha: 1)
        let blue = UIColor(red: 0.10, green: 0.34, blue: 0.84, alpha: 1)
        let green = UIColor(red: 0.10, green: 0.68, blue: 0.28, alpha: 1)
        let palette = DiningPhotoPalette.extract(from: try stripedPNG([
            (warmRed, 0.40),
            (neighboringRed, 0.25),
            (blue, 0.22),
            (green, 0.13)
        ]))

        XCTAssertEqual(palette.representativeColorCount, 3)
        XCTAssertLessThan(hueDistance(palette.colors[0], warmRed), 10)
        XCTAssertLessThan(hueDistance(palette.colors[1], blue), 8)
        XCTAssertLessThan(hueDistance(palette.colors[2], green), 8)
        XCTAssertEqual(palette.colorProportions[0], 0.65, accuracy: 0.04)
        XCTAssertEqual(palette.colorProportions[1], 0.22, accuracy: 0.03)
        XCTAssertEqual(palette.colorProportions[2], 0.13, accuracy: 0.03)
    }

    func testSingleRepresentativeHueExpandsIntoThreeLightnessVariants() throws {
        let sourceColor = UIColor(red: 0.82, green: 0.32, blue: 0.12, alpha: 1)
        let palette = DiningPhotoPalette.extract(from: try stripedPNG([(sourceColor, 1)]))

        XCTAssertEqual(palette.source, .photo)
        XCTAssertEqual(palette.representativeColorCount, 1)
        XCTAssertEqual(Set(palette.hexColors).count, 3)
        XCTAssertEqual(palette.colorProportions, [1, 0, 0])

        let components = palette.colors.map(\.oklch)
        let sourceHue = components[0].hueDegrees
        XCTAssertTrue(components.dropFirst().allSatisfy {
            circularDistance($0.hueDegrees, sourceHue) < 2
        })
        XCTAssertGreaterThan(
            (components.map(\.lightness).max() ?? 0) - (components.map(\.lightness).min() ?? 0),
            0.10
        )
    }

    func testPhotoColorsAreNormalizedToDiningResultVisualDensityAndKeepHue() throws {
        let sourceColor = UIColor(red: 0.34, green: 0.04, blue: 0.78, alpha: 1)
        let sourceValue = try XCTUnwrap(DiningPaletteColor(hex: "#570AC7"))
        let palette = DiningPhotoPalette.extract(from: try stripedPNG([(sourceColor, 1)]))

        XCTAssertFalse(palette.isNeutralFallback)
        XCTAssertLessThan(
            circularDistance(palette.primary.oklch.hueDegrees, sourceValue.oklch.hueDegrees),
            3
        )
        for color in palette.colors {
            XCTAssertGreaterThanOrEqual(color.oklch.lightness, 0.595)
            XCTAssertLessThanOrEqual(color.oklch.lightness, 0.805)
            XCTAssertGreaterThanOrEqual(color.oklch.chroma, 0.075)
            XCTAssertLessThanOrEqual(color.oklch.chroma, 0.205)
        }
    }

    func testInvalidDarkAndAchromaticImagesUseIndependentNeutralFallback() throws {
        let invalid = DiningPhotoPalette.extract(from: Data("not an image".utf8))
        let dark = DiningPhotoPalette.extract(from: try stripedPNG([
            (UIColor(red: 0.035, green: 0.01, blue: 0.015, alpha: 1), 1)
        ]))
        let gray = DiningPhotoPalette.extract(from: try stripedPNG([
            (UIColor(white: 0.58, alpha: 1), 1)
        ]))

        for palette in [invalid, dark, gray] {
            XCTAssertEqual(palette, .neutralFallback)
            XCTAssertEqual(palette.source, .neutralFallback)
            XCTAssertEqual(palette.representativeColorCount, 0)
            XCTAssertEqual(palette.hexColors, ["#929292", "#B3B3B3", "#D2D2D2"])
        }
    }

    func testUIImageAndEncodedDataUseTheSameExtractionContract() throws {
        let image = try stripedImage([
            (UIColor(red: 0.80, green: 0.20, blue: 0.12, alpha: 1), 0.72),
            (UIColor(red: 0.08, green: 0.48, blue: 0.82, alpha: 1), 0.28)
        ])
        let data = try XCTUnwrap(image.pngData())

        let imagePalette = DiningPhotoPalette.extract(from: image)
        let dataPalette = DiningPhotoPalette.extract(from: data)

        XCTAssertEqual(imagePalette.source, dataPalette.source)
        XCTAssertEqual(imagePalette.representativeColorCount, dataPalette.representativeColorCount)
        for (imageColor, dataColor) in zip(imagePalette.colors, dataPalette.colors) {
            // ImageIO and Core Graphics can differ by one quantization step when
            // they downsample the encoded image through their respective paths.
            XCTAssertEqual(imageColor.red, dataColor.red, accuracy: 1.5 / 255)
            XCTAssertEqual(imageColor.green, dataColor.green, accuracy: 1.5 / 255)
            XCTAssertEqual(imageColor.blue, dataColor.blue, accuracy: 1.5 / 255)
        }
    }

    func testPaletteAndColorHexEncodingRoundTripExactly() throws {
        let palette = DiningPhotoPalette.extract(from: try stripedPNG([
            (UIColor(red: 0.78, green: 0.24, blue: 0.10, alpha: 1), 0.65),
            (UIColor(red: 0.10, green: 0.50, blue: 0.82, alpha: 1), 0.35)
        ]))

        let encoded = try JSONEncoder().encode(palette)
        let decoded = try JSONDecoder().decode(DiningPhotoPalette.self, from: encoded)
        let json = try XCTUnwrap(String(data: encoded, encoding: .utf8))

        XCTAssertEqual(decoded, palette)
        XCTAssertTrue(palette.hexColors.allSatisfy { json.contains($0) })
        XCTAssertTrue(json.contains("colorProportions"))
        XCTAssertNil(DiningPaletteColor(hex: "not-a-color"))
        XCTAssertEqual(DiningPaletteColor(hex: "75A4D2")?.hex, "#75A4D2")
    }

    func testLegacyPaletteWithoutProportionsDecodesWithEqualAreas() throws {
        let legacyJSON = Data(
            """
            {
              "colors": ["#D06432", "#5C8C57", "#BF9E5C"],
              "source": "photo",
              "representativeColorCount": 3
            }
            """.utf8
        )

        let palette = try JSONDecoder().decode(DiningPhotoPalette.self, from: legacyJSON)

        XCTAssertEqual(palette.colorProportions[0], 1 / 3, accuracy: 0.000_001)
        XCTAssertEqual(palette.colorProportions[1], 1 / 3, accuracy: 0.000_001)
        XCTAssertEqual(palette.colorProportions[2], 1 / 3, accuracy: 0.000_001)
    }

    func testSurfaceTintMixesSeventyTwoPercentWhiteWithoutChangingRawColor() throws {
        let color = try XCTUnwrap(DiningPaletteColor(hex: "#336699"))
        let tint = color.mixedWithWhite(0.72)

        XCTAssertEqual(color.hex, "#336699")
        XCTAssertEqual(tint.hex, "#C6D4E2")
        XCTAssertEqual(color.mixedWithWhite(0), color)
        XCTAssertEqual(color.mixedWithWhite(1).hex, "#FFFFFF")
    }

    func testBackgroundExtractionMatchesSynchronousResult() async throws {
        let data = try stripedPNG([
            (UIColor(red: 0.86, green: 0.30, blue: 0.10, alpha: 1), 1)
        ])

        let synchronous = DiningPhotoPalette.extract(from: data)
        let background = await DiningPhotoPalette.extractInBackground(from: data)

        XCTAssertEqual(background, synchronous)
    }

    private func stripedPNG(_ stripes: [(color: UIColor, portion: Double)]) throws -> Data {
        try XCTUnwrap(stripedImage(stripes).pngData())
    }

    private func stripedImage(
        _ stripes: [(color: UIColor, portion: Double)],
        width: Int = 300,
        height: Int = 120
    ) throws -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.preferredRange = .standard
        let renderer = UIGraphicsImageRenderer(
            size: CGSize(width: width, height: height),
            format: format
        )
        return renderer.image { context in
            var x = 0.0
            for (index, stripe) in stripes.enumerated() {
                let remainingWidth = Double(width) - x
                let stripeWidth = index == stripes.count - 1
                    ? remainingWidth
                    : (Double(width) * stripe.portion).rounded()
                stripe.color.setFill()
                context.fill(CGRect(x: x, y: 0, width: stripeWidth, height: Double(height)))
                x += stripeWidth
            }
        }
    }

    private func hueDistance(_ color: DiningPaletteColor, _ uiColor: UIColor) -> Double {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        XCTAssertTrue(uiColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha))
        let value = DiningPaletteColor(
            red: Double(red),
            green: Double(green),
            blue: Double(blue)
        )
        return circularDistance(color.oklch.hueDegrees, value.oklch.hueDegrees)
    }

    private func circularDistance(_ left: Double, _ right: Double) -> Double {
        let direct = abs(left - right).truncatingRemainder(dividingBy: 360)
        return min(direct, 360 - direct)
    }
}
