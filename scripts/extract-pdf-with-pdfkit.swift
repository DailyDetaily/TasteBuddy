import AppKit
import Foundation
import PDFKit

struct PDFPageOutput: Codable {
    let pageNumber: Int
    let imagePath: String
    let text: String
}

struct PDFExtractionOutput: Codable {
    let pdfPath: String
    let pageCount: Int
    let pages: [PDFPageOutput]
}

enum ScriptError: Error {
    case missingPdfPath
    case missingOutputDirectory
    case unableToLoadPDF(String)
    case unableToAccessPage(Int)
    case unableToEncodeImage(String)
}

func parseArgs() throws -> (pdfPath: String, outputDir: String, baseName: String?) {
    let args = Array(CommandLine.arguments.dropFirst())
    var pdfPath: String?
    var outputDir: String?
    var baseName: String?

    var index = 0
    while index < args.count {
        let argument = args[index]

        switch argument {
        case "--pdf", "-p":
            index += 1
            guard index < args.count else {
                throw ScriptError.missingPdfPath
            }
            pdfPath = args[index]
        case "--output-dir", "-o":
            index += 1
            guard index < args.count else {
                throw ScriptError.missingOutputDirectory
            }
            outputDir = args[index]
        case "--base-name", "-b":
            index += 1
            guard index < args.count else {
                break
            }
            baseName = args[index]
        default:
            if !argument.hasPrefix("--") && pdfPath == nil {
                pdfPath = argument
            }
        }

        index += 1
    }

    guard let pdfPath else {
        throw ScriptError.missingPdfPath
    }

    guard let outputDir else {
        throw ScriptError.missingOutputDirectory
    }

    return (pdfPath, outputDir, baseName)
}

func normalizeText(_ value: String) -> String {
    value
        .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func createPNGData(from image: NSImage) throws -> Data {
    guard let tiffData = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData),
          let pngData = bitmap.representation(using: .png, properties: [:]) else {
        throw ScriptError.unableToEncodeImage("Unable to encode PNG preview.")
    }

    return pngData
}

func renderPageImage(_ page: PDFPage, targetLongEdge: CGFloat) -> NSImage {
    let bounds = page.bounds(for: .mediaBox)
    let aspectRatio = bounds.width / max(bounds.height, 1)

    let size: NSSize
    if bounds.width >= bounds.height {
        size = NSSize(width: targetLongEdge, height: max(targetLongEdge / max(aspectRatio, 0.01), 1))
    } else {
        size = NSSize(width: max(targetLongEdge * aspectRatio, 1), height: targetLongEdge)
    }

    return page.thumbnail(of: size, for: .mediaBox)
}

let targetLongEdge: CGFloat = 2200

do {
    let args = try parseArgs()
    let pdfURL = URL(fileURLWithPath: args.pdfPath)
    let outputURL = URL(fileURLWithPath: args.outputDir, isDirectory: true)
    try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

    guard let document = PDFDocument(url: pdfURL) else {
        throw ScriptError.unableToLoadPDF(args.pdfPath)
    }

    let resolvedBaseName = normalizeText(
        args.baseName ?? pdfURL.deletingPathExtension().lastPathComponent
    )
    .replacingOccurrences(of: " ", with: "-")
    .lowercased()

    var pages: [PDFPageOutput] = []

    for pageIndex in 0..<document.pageCount {
        guard let page = document.page(at: pageIndex) else {
            throw ScriptError.unableToAccessPage(pageIndex + 1)
        }

        let pageImage = renderPageImage(page, targetLongEdge: targetLongEdge)
        let fileName = "\(resolvedBaseName)-page-\(String(format: "%02d", pageIndex + 1)).png"
        let imageURL = outputURL.appendingPathComponent(fileName)
        let pngData = try createPNGData(from: pageImage)
        try pngData.write(to: imageURL)

        pages.append(
            PDFPageOutput(
                pageNumber: pageIndex + 1,
                imagePath: imageURL.path,
                text: normalizeText(page.string ?? "")
            )
        )
    }

    let payload = PDFExtractionOutput(
        pdfPath: pdfURL.path,
        pageCount: document.pageCount,
        pages: pages
    )

    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    let data = try encoder.encode(payload)
    if let output = String(data: data, encoding: .utf8) {
        print(output)
    }
} catch ScriptError.missingPdfPath {
    fputs("Usage: swift scripts/extract-pdf-with-pdfkit.swift --pdf <pdf-path> --output-dir <dir> [--base-name <name>]\n", stderr)
    exit(1)
} catch ScriptError.missingOutputDirectory {
    fputs("Missing --output-dir for PDF extraction.\n", stderr)
    exit(1)
} catch ScriptError.unableToLoadPDF(let path) {
    fputs("Unable to load PDF: \(path)\n", stderr)
    exit(1)
} catch ScriptError.unableToAccessPage(let pageNumber) {
    fputs("Unable to access PDF page \(pageNumber)\n", stderr)
    exit(1)
} catch {
    fputs("Unexpected PDF extraction error: \(error.localizedDescription)\n", stderr)
    exit(1)
}
