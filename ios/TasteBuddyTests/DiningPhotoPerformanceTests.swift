import XCTest
import UIKit
import ImageIO
import UniformTypeIdentifiers
@testable import TasteBuddy

final class DiningPhotoPerformanceTests: XCTestCase {
    func testNormalizationLimitsActualPixelsAndDoesNotUpscaleSmallImages() throws {
        for (width, height, expectedWidth, expectedHeight) in [
            (2_400, 1_800, 1_600, 1_200),
            (1_800, 2_400, 1_200, 1_600),
            (320, 240, 320, 240)
        ] {
            let input = try jpeg(width: width, height: height)
            let output = try XCTUnwrap(DiningReflectionPhotoStore.normalizedJPEGData(input))
            let image = try decodedImage(output)
            XCTAssertEqual(image.width, expectedWidth)
            XCTAssertEqual(image.height, expectedHeight)
        }
    }

    @MainActor
    func testNormalizationBakesEXIFRotationAndMirroringIntoPixels() throws {
        for (orientation, uiOrientation) in [
            (CGImagePropertyOrientation.right, UIImage.Orientation.right),
            (.upMirrored, .upMirrored),
            (.leftMirrored, .leftMirrored)
        ] {
            let sourceImage = try quadrantImage(width: 120, height: 80)
            let input = try jpeg(image: sourceImage, orientation: orientation)
            let output = try XCTUnwrap(DiningReflectionPhotoStore.normalizedJPEGData(input))
            let actual = try decodedImage(output)

            let expectedImage = UIImage(cgImage: sourceImage, scale: 1, orientation: uiOrientation)
            let rotatesAxes = [UIImage.Orientation.left, .right, .leftMirrored, .rightMirrored]
                .contains(uiOrientation)
            let expectedSize = rotatesAxes
                ? CGSize(width: sourceImage.height, height: sourceImage.width)
                : CGSize(width: sourceImage.width, height: sourceImage.height)
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1
            format.preferredRange = .standard
            let expected = try XCTUnwrap(UIGraphicsImageRenderer(
                size: expectedSize, format: format
            ).image { _ in
                expectedImage.draw(in: CGRect(origin: .zero, size: expectedSize))
            }.cgImage)

            XCTAssertEqual(actual.width, expected.width)
            XCTAssertEqual(actual.height, expected.height)
            let actualSamples = try quadrantSamples(actual)
            let expectedSamples = try quadrantSamples(expected)
            for (actualValue, expectedValue) in zip(actualSamples, expectedSamples) {
                XCTAssertEqual(Double(actualValue), Double(expectedValue), accuracy: 20)
            }
            let source = try XCTUnwrap(CGImageSourceCreateWithData(output as CFData, nil))
            let properties = try XCTUnwrap(CGImageSourceCopyPropertiesAtIndex(source, 0, nil)
                as? [CFString: Any])
            XCTAssertEqual(properties[kCGImagePropertyOrientation] as? Int ?? 1, 1)
        }
    }

    func testInvalidImageAndInvalidThumbnailSizeFailWithoutImages() async throws {
        let invalid = Data("not an image".utf8)
        XCTAssertNil(DiningReflectionPhotoStore.normalizedJPEGData(invalid))
        let invalidThumbnail = await DiningReflectionPhotoStore.thumbnail(
            for: nil, data: invalid, fillingSquareOf: 144
        )
        XCTAssertNil(invalidThumbnail)
        let invalidSize = await DiningReflectionPhotoStore.thumbnail(
            for: nil, data: try jpeg(width: 80, height: 60), fillingSquareOf: 0
        )
        XCTAssertNil(invalidSize)
    }

    func testThumbnailPreservesSquareCropResolutionAndBoundsPanoramas() async throws {
        let input = try jpeg(width: 1_600, height: 1_200)
        let result = await DiningReflectionPhotoStore.thumbnail(
            for: nil, data: input, fillingSquareOf: 432
        )
        let thumbnail = try XCTUnwrap(result)
        XCTAssertEqual(thumbnail.width, 576)
        XCTAssertEqual(thumbnail.height, 432)
        XCTAssertLessThan(thumbnail.bytesPerRow * thumbnail.height, 1_100_000)

        let panorama = await DiningReflectionPhotoStore.thumbnail(
            for: nil, data: try jpeg(width: 8_000, height: 80), fillingSquareOf: 432
        )
        let panoramaImage = try XCTUnwrap(panorama)
        XCTAssertLessThanOrEqual(max(panoramaImage.width, panoramaImage.height), 1_600)
        XCTAssertLessThan(panoramaImage.bytesPerRow * panoramaImage.height, 200_000)
    }

    func testRepeatedThumbnailReusesDecodedImageAndDeletionInvalidatesIt() async throws {
        let filename = try DiningReflectionPhotoStore.save(
            jpeg(width: 160, height: 120), entryID: UUID()
        )
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let first = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 60)
        let second = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 60)
        XCTAssertNotNil(first)
        XCTAssertTrue(first === second)

        DiningReflectionPhotoStore.remove(filename: filename)
        let deleted = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 60)
        XCTAssertNil(deleted)
    }

    @MainActor
    func testReplacementChangesImageIdentityAndExistingModelRemovesOldPhoto() async throws {
        let suiteName = "tastebuddy.photo-performance.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let id = UUID()
        let firstFilename = try DiningReflectionPhotoStore.save(jpeg(width: 160, height: 120), entryID: id)
        let model = AppModel(defaults: defaults)
        model.addDiningEntry(DiningEntry(
            id: id, restaurant: "테스트", menu: "사진", rating: 4, note: "",
            reflectionPhotoFilename: firstFilename
        ))
        let firstImage = await DiningReflectionPhotoStore.thumbnail(for: firstFilename, fillingSquareOf: 60)
        XCTAssertNotNil(firstImage)

        let replacementFilename = try DiningReflectionPhotoStore.save(
            jpeg(width: 120, height: 160), entryID: id
        )
        defer {
            DiningReflectionPhotoStore.remove(filename: firstFilename)
            DiningReflectionPhotoStore.remove(filename: replacementFilename)
        }
        XCTAssertNotEqual(firstFilename, replacementFilename)
        model.updateDiningEntry(DiningEntry(
            id: id, restaurant: "테스트", menu: "사진", rating: 4, note: "",
            reflectionPhotoFilename: replacementFilename
        ))
        XCTAssertNil(DiningReflectionPhotoStore.data(for: firstFilename))
        XCTAssertNotNil(DiningReflectionPhotoStore.data(for: replacementFilename))
        let oldImage = await DiningReflectionPhotoStore.thumbnail(for: firstFilename, fillingSquareOf: 60)
        let replacement = await DiningReflectionPhotoStore.thumbnail(for: replacementFilename, fillingSquareOf: 60)
        XCTAssertNil(oldImage)
        XCTAssertEqual(replacement?.width, 60)
        XCTAssertEqual(replacement?.height, 80)
        let itemImage = DiningDishFeedbackItem.Image(
            id: id.uuidString, alt: "사진", localPhotoFilename: replacementFilename
        )
        XCTAssertTrue(itemImage.isUserFeedbackMedia)
        XCTAssertNil(itemImage.imageData)
    }

    @MainActor
    func testMemoryWarningDropsDecodedCache() async throws {
        let filename = try DiningReflectionPhotoStore.save(jpeg(width: 160, height: 120), entryID: UUID())
        defer { DiningReflectionPhotoStore.remove(filename: filename) }
        let first = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 60)
        NotificationCenter.default.post(name: UIApplication.didReceiveMemoryWarningNotification, object: nil)
        let reloaded = await DiningReflectionPhotoStore.thumbnail(for: filename, fillingSquareOf: 60)
        XCTAssertNotNil(first)
        XCTAssertNotNil(reloaded)
        XCTAssertFalse(first === reloaded)
    }

    func testDecodedCacheEvictsImagesBeyondItsPixelBudget() async throws {
        let input = try jpeg(width: 1_600, height: 1_600)
        let firstFilename = try DiningReflectionPhotoStore.save(input, entryID: UUID())
        let secondFilename = try DiningReflectionPhotoStore.save(input, entryID: UUID())
        defer {
            DiningReflectionPhotoStore.remove(filename: firstFilename)
            DiningReflectionPhotoStore.remove(filename: secondFilename)
        }
        let first = await DiningReflectionPhotoStore.thumbnail(for: firstFilename, fillingSquareOf: 1_600)
        let second = await DiningReflectionPhotoStore.thumbnail(for: secondFilename, fillingSquareOf: 1_600)
        let reloaded = await DiningReflectionPhotoStore.thumbnail(for: firstFilename, fillingSquareOf: 1_600)
        XCTAssertNotNil(first)
        XCTAssertNotNil(second)
        XCTAssertNotNil(reloaded)
        XCTAssertFalse(first === reloaded)
    }

    func testCancelledNormalizationDoesNotPublishAResult() async throws {
        let data = try jpeg(width: 160, height: 120)
        let worker = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            return await DiningReflectionPhotoStore.normalizedJPEGDataInBackground(data)
        }
        let result = await worker.value
        XCTAssertNil(result)
    }

    @MainActor
    func testReportsLegacy3xAndNewNormalizationBuffersAndTime() throws {
        let input = try jpeg(width: 2_400, height: 1_800)
        let oldStart = CFAbsoluteTimeGetCurrent()
        let oldOutput = try XCTUnwrap(legacy3xNormalizedJPEGData(input))
        let oldElapsed = CFAbsoluteTimeGetCurrent() - oldStart
        let newStart = CFAbsoluteTimeGetCurrent()
        let newOutput = try XCTUnwrap(DiningReflectionPhotoStore.normalizedJPEGData(input))
        let newElapsed = CFAbsoluteTimeGetCurrent() - newStart
        let oldImage = try decodedImage(oldOutput)
        let newImage = try decodedImage(newOutput)
        XCTAssertEqual(oldImage.width, 4_800)
        XCTAssertEqual(oldImage.height, 3_600)
        XCTAssertEqual(newImage.width, 1_600)
        XCTAssertEqual(newImage.height, 1_200)
        print("PHOTO_NORMALIZATION_BASELINE old=\(oldImage.width)x\(oldImage.height) decodedBytes=\(oldImage.bytesPerRow * oldImage.height) elapsedSeconds=\(oldElapsed) jpegBytes=\(oldOutput.count)")
        print("PHOTO_NORMALIZATION_RESULT new=\(newImage.width)x\(newImage.height) decodedBytes=\(newImage.bytesPerRow * newImage.height) elapsedSeconds=\(newElapsed) jpegBytes=\(newOutput.count)")
        // Timings are observational; they intentionally have no flaky pass/fail threshold.
    }

    @MainActor
    private func legacy3xNormalizedJPEGData(_ data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let scale = min(1, 1_600 / max(max(image.size.width, image.size.height), 1))
        let size = CGSize(width: max(1, image.size.width * scale), height: max(1, image.size.height * scale))
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3 // Reproduce the previous default renderer on a 3x iPhone.
        return UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }.jpegData(compressionQuality: 0.84)
    }

    private func jpeg(width: Int, height: Int) throws -> Data {
        try jpeg(image: quadrantImage(width: width, height: height))
    }

    private func jpeg(image: CGImage, orientation: CGImagePropertyOrientation = .up) throws -> Data {
        let data = NSMutableData()
        let destination = try XCTUnwrap(CGImageDestinationCreateWithData(
            data, UTType.jpeg.identifier as CFString, 1, nil
        ))
        CGImageDestinationAddImage(destination, image, [
            kCGImageDestinationLossyCompressionQuality: 0.95,
            kCGImagePropertyOrientation: orientation.rawValue
        ] as CFDictionary)
        XCTAssertTrue(CGImageDestinationFinalize(destination))
        return data as Data
    }

    private func quadrantImage(width: Int, height: Int) throws -> CGImage {
        let context = try XCTUnwrap(CGContext(
            data: nil, width: width, height: height, bitsPerComponent: 8,
            bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ))
        let halfWidth = CGFloat(width) / 2
        let halfHeight = CGFloat(height) / 2
        for (x, y, color) in [
            (CGFloat(0), CGFloat(0), CGColor(red: 1, green: 0, blue: 0, alpha: 1)),
            (halfWidth, CGFloat(0), CGColor(red: 0, green: 1, blue: 0, alpha: 1)),
            (CGFloat(0), halfHeight, CGColor(red: 0, green: 0, blue: 1, alpha: 1)),
            (halfWidth, halfHeight, CGColor(red: 1, green: 1, blue: 0, alpha: 1))
        ] {
            context.setFillColor(color)
            context.fill(CGRect(x: x, y: y, width: halfWidth, height: halfHeight))
        }
        return try XCTUnwrap(context.makeImage())
    }

    private func decodedImage(_ data: Data) throws -> CGImage {
        let source = try XCTUnwrap(CGImageSourceCreateWithData(data as CFData, nil))
        return try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, [
            kCGImageSourceShouldCacheImmediately: true
        ] as CFDictionary))
    }

    private func quadrantSamples(_ image: CGImage) throws -> [UInt8] {
        let context = try XCTUnwrap(CGContext(
            data: nil, width: image.width, height: image.height, bitsPerComponent: 8,
            bytesPerRow: image.width * 4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ))
        context.draw(image, in: CGRect(x: 0, y: 0, width: CGFloat(image.width), height: CGFloat(image.height)))
        let bytes = try XCTUnwrap(context.data).assumingMemoryBound(to: UInt8.self)
        return [(1, 1), (3, 1), (1, 3), (3, 3)].flatMap { x, y in
            let offset = ((image.height * y / 4) * image.width + image.width * x / 4) * 4
            return Array(UnsafeBufferPointer(start: bytes.advanced(by: offset), count: 3))
        }
    }
}
