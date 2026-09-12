import CoreGraphics
import CoreImage
import Foundation
import ImageIO
import SwiftUI
import UIKit

/// A serializable sRGB color used by photo-derived dining result artwork.
///
/// Components are stored at the same eight-bit precision used by `hex`, making
/// JSON round trips stable and keeping persisted result cards deterministic.
struct DiningPaletteColor: Codable, Equatable, Hashable, Sendable {
    struct PerceptualComponents: Equatable, Sendable {
        let lightness: Double
        let chroma: Double
        let hueDegrees: Double
    }

    private let redByte: UInt8
    private let greenByte: UInt8
    private let blueByte: UInt8

    var red: Double { Double(redByte) / 255 }
    var green: Double { Double(greenByte) / 255 }
    var blue: Double { Double(blueByte) / 255 }

    /// Uppercase `#RRGGBB`, suitable for persistence or sharing payloads.
    var hex: String {
        String(format: "#%02X%02X%02X", redByte, greenByte, blueByte)
    }

    var swiftUIColor: Color {
        Color(.sRGB, red: red, green: green, blue: blue, opacity: 1)
    }

    var uiColor: UIColor {
        UIColor(red: red, green: green, blue: blue, alpha: 1)
    }

    /// A light surface tint comparable to the existing taste result base layer.
    var tintSwiftUIColor: Color {
        mixedWithWhite(0.72).swiftUIColor
    }

    /// Mixes this color with sRGB white. `amount` is the white contribution in
    /// `0...1`, so `0` returns the receiver and `1` returns white.
    func mixedWithWhite(_ amount: Double) -> DiningPaletteColor {
        let amount = min(1, max(0, amount))
        return DiningPaletteColor(
            red: red + (1 - red) * amount,
            green: green + (1 - green) * amount,
            blue: blue + (1 - blue) * amount
        )
    }

    var oklch: PerceptualComponents {
        let lab = DiningPhotoPalette.ColorMath.okLab(red: red, green: green, blue: blue)
        let hue = DiningPhotoPalette.ColorMath.positiveHue(atan2(lab.b, lab.a))
        return PerceptualComponents(
            lightness: lab.l,
            chroma: hypot(lab.a, lab.b),
            hueDegrees: hue * 180 / .pi
        )
    }

    init(red: Double, green: Double, blue: Double) {
        redByte = Self.byte(from: red)
        greenByte = Self.byte(from: green)
        blueByte = Self.byte(from: blue)
    }

    init?(hex: String) {
        let value = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        guard value.count == 6, let rgb = UInt32(value, radix: 16) else {
            return nil
        }

        redByte = UInt8((rgb >> 16) & 0xFF)
        greenByte = UInt8((rgb >> 8) & 0xFF)
        blueByte = UInt8(rgb & 0xFF)
    }

    fileprivate init(rgb: UInt32) {
        redByte = UInt8((rgb >> 16) & 0xFF)
        greenByte = UInt8((rgb >> 8) & 0xFF)
        blueByte = UInt8(rgb & 0xFF)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let value = try container.decode(String.self)
        guard let color = Self(hex: value) else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Dining palette colors must be encoded as #RRGGBB."
            )
        }
        self = color
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(hex)
    }

    private static func byte(from component: Double) -> UInt8 {
        UInt8((min(1, max(0, component)) * 255).rounded())
    }
}

/// Three render-ready colors and their represented areas, derived from the
/// visible area of a dining photo.
///
/// The extractor clusters a small thumbnail in OKLab space, orders clusters by
/// represented pixel area, and preserves their hue while bringing lightness and
/// chroma into the visual range used by the existing dining result artwork.
struct DiningPhotoPalette: Codable, Equatable, Sendable {
    enum Source: String, Codable, Sendable {
        case photo
        case neutralFallback
    }

    static let maximumRepresentativeColorCount = 3
    private static let equalColorProportions = [1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0]

    /// A taste-token-independent fallback for unreadable, very dark, or
    /// effectively achromatic images.
    static let neutralFallback = DiningPhotoPalette(
        colors: [
            DiningPaletteColor(rgb: 0x929292),
            DiningPaletteColor(rgb: 0xB3B3B3),
            DiningPaletteColor(rgb: 0xD2D2D2)
        ],
        source: .neutralFallback,
        representativeColorCount: 0,
        colorProportions: equalColorProportions
    )

    /// Always contains three colors so the result background, bloom, and share
    /// card can consume one value without supplying their own fallback rules.
    let colors: [DiningPaletteColor]
    let source: Source

    /// Normalized photo coverage for each render color, in dominant-first
    /// order. Synthetic lightness variants receive zero coverage so they do
    /// not claim area that was not present in the source photo.
    let colorProportions: [Double]

    /// The number of perceptually distinct hues found in the photo, before a
    /// single hue is expanded into lightness variants for rendering.
    let representativeColorCount: Int

    var isNeutralFallback: Bool { source == .neutralFallback }
    var primary: DiningPaletteColor { colors[0] }
    var secondary: DiningPaletteColor { colors[1] }
    var tertiary: DiningPaletteColor { colors[2] }
    var swiftUIColors: [Color] { colors.map(\.swiftUIColor) }
    var tintSwiftUIColors: [Color] { colors.map(\.tintSwiftUIColor) }
    var hexColors: [String] { colors.map(\.hex) }

    /// Synchronous extraction for callers that already perform photo work away
    /// from the main thread. At most a 48-pixel thumbnail is decoded.
    static func extract(from imageData: Data) -> DiningPhotoPalette {
        guard !imageData.isEmpty,
              let image = thumbnailImage(from: imageData) else {
            return .neutralFallback
        }
        return extract(from: image)
    }

    /// UIImage convenience overload. Its underlying CGImage is sampled through
    /// the same thumbnail and clustering path as encoded data.
    static func extract(from image: UIImage) -> DiningPhotoPalette {
        guard let cgImage = cgImage(from: image) else {
            return .neutralFallback
        }
        return extract(from: cgImage)
    }

    /// Convenience for view models that receive full-resolution photo data on
    /// the main actor.
    static func extractInBackground(from imageData: Data) async -> DiningPhotoPalette {
        await Task.detached(priority: .userInitiated) {
            extract(from: imageData)
        }.value
    }

    private enum CodingKeys: String, CodingKey {
        case colors
        case source
        case representativeColorCount
        case colorProportions
    }

    private init(
        colors: [DiningPaletteColor],
        source: Source,
        representativeColorCount: Int,
        colorProportions: [Double]
    ) {
        precondition(colors.count == 3, "Dining result palettes require exactly three colors.")
        precondition(
            colorProportions.count == 3,
            "Dining result palettes require one proportion per color."
        )
        self.colors = colors
        self.source = source
        self.colorProportions = Self.normalizedProportions(colorProportions)
        self.representativeColorCount = min(
            Self.maximumRepresentativeColorCount,
            max(0, representativeColorCount)
        )
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let decodedColors = try container.decode([DiningPaletteColor].self, forKey: .colors)
        guard decodedColors.count == 3 else {
            throw DecodingError.dataCorruptedError(
                forKey: .colors,
                in: container,
                debugDescription: "Dining result palettes require exactly three colors."
            )
        }

        let decodedSource = try container.decode(Source.self, forKey: .source)
        let decodedCount = try container.decode(Int.self, forKey: .representativeColorCount)
        let decodedProportions: [Double]
        if let storedProportions = try container.decodeIfPresent(
            [Double].self,
            forKey: .colorProportions
        ) {
            decodedProportions = storedProportions
        } else {
            decodedProportions = Self.equalColorProportions
        }
        guard (0...Self.maximumRepresentativeColorCount).contains(decodedCount),
              decodedSource == .photo ? decodedCount > 0 : decodedCount == 0,
              decodedProportions.count == 3,
              decodedProportions.allSatisfy({ $0.isFinite && $0 >= 0 }),
              decodedProportions.reduce(0, +) > 0 else {
            throw DecodingError.dataCorruptedError(
                forKey: .representativeColorCount,
                in: container,
                debugDescription: "Representative color count does not match the palette source."
            )
        }

        self.init(
            colors: decodedColors,
            source: decodedSource,
            representativeColorCount: decodedCount,
            colorProportions: decodedProportions
        )
    }

    private static let thumbnailMaxDimension = 48
    private static let minimumChromaticChroma = 0.028
    private static let minimumUsableLightness = 0.22
    private static let maximumUsableLightness = 0.95
    private static let maximumCandidateClusterCount = 12
    private static let minimumRepresentedArea = 0.04
    private static let overlappingHueDistance = 22 * Double.pi / 180
    private static let overlappingColorDistanceSquared = 0.005_625

    private struct PixelSample {
        let red: Double
        let green: Double
        let blue: Double
        let lab: ColorMath.OKLab

        var chroma: Double { hypot(lab.a, lab.b) }
    }

    private struct BinAccumulator {
        var count = 0
        var l = 0.0
        var a = 0.0
        var b = 0.0

        mutating func add(_ sample: PixelSample) {
            count += 1
            l += sample.lab.l
            a += sample.lab.a
            b += sample.lab.b
        }

        var point: WeightedPoint {
            let divisor = Double(max(1, count))
            return WeightedPoint(
                lab: ColorMath.OKLab(l: l / divisor, a: a / divisor, b: b / divisor),
                weight: Double(count)
            )
        }
    }

    private struct WeightedPoint {
        let lab: ColorMath.OKLab
        let weight: Double
    }

    private struct Cluster {
        let lab: ColorMath.OKLab
        let weight: Double
    }

    private static func extract(from image: CGImage) -> DiningPhotoPalette {
        let samples = pixelSamples(from: image)
        guard isSuitableForPhotoPalette(samples) else {
            return .neutralFallback
        }

        let chromaticSamples = samples.filter { sample in
            sample.lab.l >= minimumUsableLightness
                && sample.lab.l <= maximumUsableLightness
                && sample.chroma >= minimumChromaticChroma
        }
        let points = histogramPoints(from: chromaticSamples)
        let clusters = clustered(points: points, maximumCount: maximumCandidateClusterCount)
        let distinct = dominantDistinctClusters(clusters)
        guard !distinct.isEmpty else {
            return .neutralFallback
        }

        let normalized = distinct.map { normalizedColor(from: $0.lab) }
        let renderColors = expandedRenderColors(from: normalized)
        let colorProportions = renderProportions(from: distinct)
        return DiningPhotoPalette(
            colors: renderColors,
            source: .photo,
            representativeColorCount: normalized.count,
            colorProportions: colorProportions
        )
    }

    private static func thumbnailImage(from data: Data) -> CGImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
            return nil
        }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: thumbnailMaxDimension,
            kCGImageSourceShouldCacheImmediately: true
        ]
        return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    }

    private static func cgImage(from image: UIImage) -> CGImage? {
        if let cgImage = image.cgImage {
            return cgImage
        }
        guard let ciImage = image.ciImage, !ciImage.extent.isEmpty else {
            return nil
        }
        return CIContext(options: [.cacheIntermediates: false]).createCGImage(
            ciImage,
            from: ciImage.extent
        )
    }

    private static func pixelSamples(from image: CGImage) -> [PixelSample] {
        let largestDimension = max(image.width, image.height)
        guard largestDimension > 0 else {
            return []
        }

        let scale = min(1, Double(thumbnailMaxDimension) / Double(largestDimension))
        let width = max(1, Int((Double(image.width) * scale).rounded()))
        let height = max(1, Int((Double(image.height) * scale).rounded()))
        let bytesPerRow = width * 4
        var pixels = [UInt8](repeating: 0, count: bytesPerRow * height)
        let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()

        let rendered = pixels.withUnsafeMutableBytes { bytes -> Bool in
            guard let context = CGContext(
                data: bytes.baseAddress,
                width: width,
                height: height,
                bitsPerComponent: 8,
                bytesPerRow: bytesPerRow,
                space: colorSpace,
                bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue
                    | CGImageAlphaInfo.premultipliedLast.rawValue
            ) else {
                return false
            }
            context.interpolationQuality = .medium
            context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
            return true
        }
        guard rendered else {
            return []
        }

        var samples = [PixelSample]()
        samples.reserveCapacity(width * height)
        for offset in stride(from: 0, to: pixels.count, by: 4) {
            let alpha = Double(pixels[offset + 3]) / 255
            guard alpha >= 0.5 else {
                continue
            }

            // The bitmap is premultiplied so translucent edge pixels need to be
            // restored before entering perceptual color space.
            let red = min(1, Double(pixels[offset]) / 255 / alpha)
            let green = min(1, Double(pixels[offset + 1]) / 255 / alpha)
            let blue = min(1, Double(pixels[offset + 2]) / 255 / alpha)
            samples.append(PixelSample(
                red: red,
                green: green,
                blue: blue,
                lab: ColorMath.okLab(red: red, green: green, blue: blue)
            ))
        }
        return samples
    }

    private static func isSuitableForPhotoPalette(_ samples: [PixelSample]) -> Bool {
        guard samples.count >= 4 else {
            return false
        }

        let orderedLightness = samples.map(\.lab.l).sorted()
        let upperQuartileIndex = min(
            orderedLightness.count - 1,
            Int(Double(orderedLightness.count - 1) * 0.75)
        )
        guard orderedLightness[upperQuartileIndex] >= 0.27 else {
            return false
        }

        let chromatic = samples.filter { sample in
            sample.lab.l >= minimumUsableLightness
                && sample.lab.l <= maximumUsableLightness
                && sample.chroma >= minimumChromaticChroma
        }
        let requiredChromaticPixels = max(4, Int((Double(samples.count) * 0.08).rounded(.up)))
        guard chromatic.count >= requiredChromaticPixels else {
            return false
        }

        let meanChromaticChroma = chromatic.reduce(0) { $0 + $1.chroma }
            / Double(chromatic.count)
        return meanChromaticChroma >= 0.035
    }

    private static func histogramPoints(from samples: [PixelSample]) -> [WeightedPoint] {
        var histogram = [Int: BinAccumulator]()
        histogram.reserveCapacity(min(samples.count, 4_096))

        for sample in samples {
            // Four bits per sRGB component remove JPEG noise while preserving
            // enough local structure for a 48-pixel thumbnail.
            let red = min(15, Int(sample.red * 16))
            let green = min(15, Int(sample.green * 16))
            let blue = min(15, Int(sample.blue * 16))
            let key = (red << 8) | (green << 4) | blue
            var accumulator = histogram[key, default: BinAccumulator()]
            accumulator.add(sample)
            histogram[key] = accumulator
        }

        return histogram.values
            .map(\.point)
            .sorted { left, right in
                if left.weight == right.weight {
                    if left.lab.l == right.lab.l {
                        if left.lab.a == right.lab.a {
                            return left.lab.b < right.lab.b
                        }
                        return left.lab.a < right.lab.a
                    }
                    return left.lab.l < right.lab.l
                }
                return left.weight > right.weight
            }
    }

    private static func clustered(points: [WeightedPoint], maximumCount: Int) -> [Cluster] {
        guard let first = points.first else {
            return []
        }

        let totalWeight = points.reduce(0) { $0 + $1.weight }
        var centers = [first.lab]
        while centers.count < min(maximumCount, points.count) {
            let candidates = points.map { point -> (point: WeightedPoint, distance: Double, score: Double) in
                let distance = centers.map { ColorMath.distanceSquared(point.lab, $0) }.min() ?? 0
                let area = point.weight / max(1, totalWeight)
                return (point, distance, pow(area, 0.72) * distance)
            }
            guard let candidate = candidates.max(by: { left, right in
                if left.score == right.score {
                    return left.point.weight < right.point.weight
                }
                return left.score < right.score
            }), candidate.distance >= 0.0016 else {
                break
            }
            centers.append(candidate.point.lab)
        }

        for _ in 0..<10 {
            var weights = [Double](repeating: 0, count: centers.count)
            var sumL = [Double](repeating: 0, count: centers.count)
            var sumA = [Double](repeating: 0, count: centers.count)
            var sumB = [Double](repeating: 0, count: centers.count)

            for point in points {
                let index = nearestCenter(to: point.lab, in: centers)
                weights[index] += point.weight
                sumL[index] += point.lab.l * point.weight
                sumA[index] += point.lab.a * point.weight
                sumB[index] += point.lab.b * point.weight
            }

            var didMove = false
            for index in centers.indices where weights[index] > 0 {
                let updated = ColorMath.OKLab(
                    l: sumL[index] / weights[index],
                    a: sumA[index] / weights[index],
                    b: sumB[index] / weights[index]
                )
                if ColorMath.distanceSquared(updated, centers[index]) > 0.000_000_5 {
                    didMove = true
                }
                centers[index] = updated
            }
            if !didMove {
                break
            }
        }

        var finalWeights = [Double](repeating: 0, count: centers.count)
        for point in points {
            finalWeights[nearestCenter(to: point.lab, in: centers)] += point.weight
        }
        return centers.indices
            .map { Cluster(lab: centers[$0], weight: finalWeights[$0]) }
            .filter { $0.weight > 0 }
            .sorted { $0.weight > $1.weight }
    }

    private static func nearestCenter(
        to point: ColorMath.OKLab,
        in centers: [ColorMath.OKLab]
    ) -> Int {
        var nearestIndex = 0
        var nearestDistance = Double.greatestFiniteMagnitude
        for (index, center) in centers.enumerated() {
            let distance = ColorMath.distanceSquared(point, center)
            if distance < nearestDistance {
                nearestDistance = distance
                nearestIndex = index
            }
        }
        return nearestIndex
    }

    private static func dominantDistinctClusters(_ clusters: [Cluster]) -> [Cluster] {
        let totalWeight = clusters.reduce(0) { $0 + $1.weight }
        var merged = [Cluster]()

        // Candidate clustering intentionally produces more than three groups.
        // Neighboring groups are then folded together so a textured dominant
        // color contributes its full area instead of occupying several slots.
        for cluster in clusters where hypot(cluster.lab.a, cluster.lab.b) >= minimumChromaticChroma {
            let overlappingIndices = merged.indices.filter { index in
                colorsOverlap(cluster.lab, merged[index].lab)
            }
            if let overlappingIndex = overlappingIndices.min(by: { left, right in
                ColorMath.distanceSquared(cluster.lab, merged[left].lab)
                    < ColorMath.distanceSquared(cluster.lab, merged[right].lab)
            }) {
                merged[overlappingIndex] = combined(merged[overlappingIndex], cluster)
            } else {
                merged.append(cluster)
            }
        }

        return merged
            .filter { $0.weight / max(1, totalWeight) >= minimumRepresentedArea }
            .sorted { left, right in
                if left.weight == right.weight {
                    return left.lab.l < right.lab.l
                }
                return left.weight > right.weight
            }
            .prefix(maximumRepresentativeColorCount)
            .map { $0 }
    }

    private static func colorsOverlap(_ left: ColorMath.OKLab, _ right: ColorMath.OKLab) -> Bool {
        let leftHue = ColorMath.positiveHue(atan2(left.b, left.a))
        let rightHue = ColorMath.positiveHue(atan2(right.b, right.a))
        return ColorMath.hueDistance(leftHue, rightHue) < overlappingHueDistance
            || ColorMath.distanceSquared(left, right) < overlappingColorDistanceSquared
    }

    private static func combined(_ left: Cluster, _ right: Cluster) -> Cluster {
        let weight = left.weight + right.weight
        return Cluster(
            lab: ColorMath.OKLab(
                l: (left.lab.l * left.weight + right.lab.l * right.weight) / weight,
                a: (left.lab.a * left.weight + right.lab.a * right.weight) / weight,
                b: (left.lab.b * left.weight + right.lab.b * right.weight) / weight
            ),
            weight: weight
        )
    }

    private static func renderProportions(from clusters: [Cluster]) -> [Double] {
        let representedWeight = clusters.reduce(0) { $0 + $1.weight }
        guard representedWeight > 0 else {
            return equalColorProportions
        }
        let represented = clusters.map { $0.weight / representedWeight }
        return Array((represented + [0, 0, 0]).prefix(3))
    }

    private static func normalizedProportions(_ proportions: [Double]) -> [Double] {
        let valid = proportions.map { $0.isFinite ? max(0, $0) : 0 }
        let total = valid.reduce(0, +)
        guard total > 0 else {
            return equalColorProportions
        }
        return valid.map { $0 / total }
    }

    private static func normalizedColor(from lab: ColorMath.OKLab) -> DiningPaletteColor {
        let lightness = min(0.80, max(0.60, lab.l))
        let chroma = min(0.20, max(0.08, hypot(lab.a, lab.b) * 1.04))
        let hue = ColorMath.positiveHue(atan2(lab.b, lab.a))
        return ColorMath.gamutMappedColor(lightness: lightness, chroma: chroma, hue: hue)
    }

    private static func expandedRenderColors(
        from representativeColors: [DiningPaletteColor]
    ) -> [DiningPaletteColor] {
        switch representativeColors.count {
        case 0:
            return neutralFallback.colors
        case 1:
            let seed = representativeColors[0].oklch
            let hue = seed.hueDegrees * .pi / 180
            let centerLightness = min(0.72, max(0.66, seed.lightness))
            return [
                ColorMath.gamutMappedColor(
                    lightness: centerLightness,
                    chroma: seed.chroma,
                    hue: hue
                ),
                ColorMath.gamutMappedColor(
                    lightness: min(0.80, centerLightness + 0.08),
                    chroma: max(0.08, seed.chroma * 0.90),
                    hue: hue
                ),
                ColorMath.gamutMappedColor(
                    lightness: max(0.60, centerLightness - 0.07),
                    chroma: max(0.08, seed.chroma * 0.86),
                    hue: hue
                )
            ]
        case 2:
            let primary = representativeColors[0]
            let seed = primary.oklch
            let variantLightness = seed.lightness >= 0.70
                ? max(0.60, seed.lightness - 0.09)
                : min(0.80, seed.lightness + 0.09)
            let variant = ColorMath.gamutMappedColor(
                lightness: variantLightness,
                chroma: max(0.08, seed.chroma * 0.88),
                hue: seed.hueDegrees * .pi / 180
            )
            return [primary, representativeColors[1], variant]
        default:
            return Array(representativeColors.prefix(3))
        }
    }

    enum ColorMath {
        struct OKLab {
            let l: Double
            let a: Double
            let b: Double
        }

        struct LinearRGB {
            let red: Double
            let green: Double
            let blue: Double

            var isInGamut: Bool {
                let tolerance = 0.000_001
                return red >= -tolerance && red <= 1 + tolerance
                    && green >= -tolerance && green <= 1 + tolerance
                    && blue >= -tolerance && blue <= 1 + tolerance
            }
        }

        static func okLab(red: Double, green: Double, blue: Double) -> OKLab {
            let red = linearized(red)
            let green = linearized(green)
            let blue = linearized(blue)

            let l = 0.412_221_470_8 * red + 0.536_332_536_3 * green + 0.051_445_992_9 * blue
            let m = 0.211_903_498_2 * red + 0.680_699_545_1 * green + 0.107_396_956_6 * blue
            let s = 0.088_302_461_9 * red + 0.281_718_837_6 * green + 0.629_978_700_5 * blue
            let lRoot = cbrt(l)
            let mRoot = cbrt(m)
            let sRoot = cbrt(s)

            return OKLab(
                l: 0.210_454_255_3 * lRoot + 0.793_617_785 * mRoot - 0.004_072_046_8 * sRoot,
                a: 1.977_998_495_1 * lRoot - 2.428_592_205 * mRoot + 0.450_593_709_9 * sRoot,
                b: 0.025_904_037_1 * lRoot + 0.782_771_766_2 * mRoot - 0.808_675_766 * sRoot
            )
        }

        static func gamutMappedColor(
            lightness: Double,
            chroma: Double,
            hue: Double
        ) -> DiningPaletteColor {
            let lightness = min(1, max(0, lightness))
            let requestedChroma = max(0, chroma)
            var mappedChroma = requestedChroma
            var linear = linearRGB(lightness: lightness, chroma: mappedChroma, hue: hue)

            if !linear.isInGamut {
                var lower = 0.0
                var upper = requestedChroma
                for _ in 0..<14 {
                    let candidate = (lower + upper) / 2
                    let candidateRGB = linearRGB(
                        lightness: lightness,
                        chroma: candidate,
                        hue: hue
                    )
                    if candidateRGB.isInGamut {
                        lower = candidate
                    } else {
                        upper = candidate
                    }
                }
                mappedChroma = lower
                linear = linearRGB(lightness: lightness, chroma: mappedChroma, hue: hue)
            }

            return DiningPaletteColor(
                red: encoded(linear.red),
                green: encoded(linear.green),
                blue: encoded(linear.blue)
            )
        }

        static func distanceSquared(_ left: OKLab, _ right: OKLab) -> Double {
            let l = left.l - right.l
            let a = left.a - right.a
            let b = left.b - right.b
            return l * l + a * a + b * b
        }

        static func positiveHue(_ hue: Double) -> Double {
            let fullTurn = 2 * Double.pi
            let remainder = hue.truncatingRemainder(dividingBy: fullTurn)
            return remainder >= 0 ? remainder : remainder + fullTurn
        }

        static func hueDistance(_ left: Double, _ right: Double) -> Double {
            let direct = abs(positiveHue(left) - positiveHue(right))
            return min(direct, 2 * .pi - direct)
        }

        private static func linearRGB(
            lightness: Double,
            chroma: Double,
            hue: Double
        ) -> LinearRGB {
            let a = chroma * cos(hue)
            let b = chroma * sin(hue)
            let lRoot = lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b
            let mRoot = lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b
            let sRoot = lightness - 0.089_484_177_5 * a - 1.291_485_548 * b
            let l = lRoot * lRoot * lRoot
            let m = mRoot * mRoot * mRoot
            let s = sRoot * sRoot * sRoot

            return LinearRGB(
                red: 4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s,
                green: -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s,
                blue: -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s
            )
        }

        private static func linearized(_ component: Double) -> Double {
            component <= 0.04045
                ? component / 12.92
                : pow((component + 0.055) / 1.055, 2.4)
        }

        private static func encoded(_ component: Double) -> Double {
            let clamped = min(1, max(0, component))
            return clamped <= 0.003_130_8
                ? 12.92 * clamped
                : 1.055 * pow(clamped, 1 / 2.4) - 0.055
        }
    }
}
