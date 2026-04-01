import CoreGraphics
import Foundation
import ImageIO
import Vision

struct OCRLine: Codable {
    let text: String
    let confidence: Double
    let boundingBox: BoundingBox
}

struct BoundingBox: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OCRResult: Codable {
    let imagePath: String
    let fullText: String
    let lines: [OCRLine]
}

enum ScriptError: Error {
    case missingImagePath
    case unableToLoadImage(String)
    case unableToConvertImage(String)
}

func parseArgs() throws -> String {
    let args = CommandLine.arguments.dropFirst()
    var index = 0
    let values = Array(args)

    while index < values.count {
        let argument = values[index]
        if argument == "--image" || argument == "-i" {
            let nextIndex = index + 1
            guard nextIndex < values.count else {
                throw ScriptError.missingImagePath
            }
            return values[nextIndex]
        }

        if !argument.hasPrefix("--") {
            return argument
        }

        index += 1
    }

    throw ScriptError.missingImagePath
}

func loadCGImage(from imagePath: String) throws -> CGImage {
    let fileURL = URL(fileURLWithPath: imagePath)
    guard let imageSource = CGImageSourceCreateWithURL(fileURL as CFURL, nil) else {
        throw ScriptError.unableToLoadImage(imagePath)
    }

    guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
        throw ScriptError.unableToConvertImage(imagePath)
    }

    return cgImage
}

func normalizeLine(_ value: String) -> String {
    value
        .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func performOCR(imagePath: String) throws -> OCRResult {
    let cgImage = try loadCGImage(from: imagePath)
    var collectedLines: [OCRLine] = []

    let request = VNRecognizeTextRequest { request, error in
        if let error {
            fputs("[ocr] Vision error: \(error.localizedDescription)\n", stderr)
            return
        }

        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            return
        }

        let sorted = observations.sorted { lhs, rhs in
            let leftY = lhs.boundingBox.minY
            let rightY = rhs.boundingBox.minY

            if abs(leftY - rightY) > 0.015 {
                return leftY > rightY
            }

            return lhs.boundingBox.minX < rhs.boundingBox.minX
        }

        collectedLines = sorted.compactMap { observation in
            guard let candidate = observation.topCandidates(1).first else {
                return nil
            }

            let normalized = normalizeLine(candidate.string)
            if normalized.isEmpty {
                return nil
            }

            return OCRLine(
                text: normalized,
                confidence: Double(candidate.confidence),
                boundingBox: BoundingBox(
                    x: Double(observation.boundingBox.origin.x),
                    y: Double(observation.boundingBox.origin.y),
                    width: Double(observation.boundingBox.size.width),
                    height: Double(observation.boundingBox.size.height)
                )
            )
        }
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["ko-KR", "en-US"]
    request.minimumTextHeight = 0.015

    if #available(macOS 13.0, *) {
        request.automaticallyDetectsLanguage = true
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let fullText = collectedLines.map(\.text).joined(separator: "\n")
    return OCRResult(imagePath: imagePath, fullText: fullText, lines: collectedLines)
}

do {
    let imagePath = try parseArgs()
    let result = try performOCR(imagePath: imagePath)

    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    let data = try encoder.encode(result)
    if let json = String(data: data, encoding: .utf8) {
        print(json)
    }
} catch ScriptError.missingImagePath {
    fputs("Usage: swift scripts/ocr-image-with-vision.swift --image <image-path>\n", stderr)
    exit(1)
} catch ScriptError.unableToLoadImage(let imagePath) {
    fputs("Failed to load image: \(imagePath)\n", stderr)
    exit(1)
} catch ScriptError.unableToConvertImage(let imagePath) {
    fputs("Failed to convert image to CGImage: \(imagePath)\n", stderr)
    exit(1)
} catch {
    fputs("Unexpected OCR error: \(error.localizedDescription)\n", stderr)
    exit(1)
}
