package com.tastebuddy.android.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import com.tastebuddy.android.domain.*
import java.io.File
import java.util.UUID
import kotlin.math.max
import kotlin.math.roundToInt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class ImportedPhoto(
    val filename: String,
    val palette: PhotoPalette,
    val latitude: Double?,
    val longitude: Double?,
)

class PhotoStore(private val context: Context) {
    private val directory = File(context.filesDir, "photos").apply { mkdirs() }

    fun file(filename: String?): File? =
        filename
            ?.takeIf { it.matches(Regex("[A-Za-z0-9_-]+\\.(jpg|jpeg|png)")) }
            ?.let { File(directory, it) }

    fun uri(filename: String?): Uri? =
        file(filename)
            ?.takeIf { it.exists() }
            ?.let { FileProvider.getUriForFile(context, "${context.packageName}.files", it) }

    fun captureFile(): File = File(directory, "capture_${UUID.randomUUID()}.jpg")

    suspend fun import(uri: Uri): ImportedPhoto =
        withContext(Dispatchers.IO) {
            val resolver = context.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            require(bounds.outWidth > 0 && bounds.outHeight > 0) {
                "사진을 읽지 못했어요. 다른 사진으로 다시 시도해 주세요."
            }
            val exif = runCatching {
                resolver.openInputStream(uri)?.use(::ExifInterface)
            }
                .getOrNull()
            var sample = 1
            while (max(bounds.outWidth, bounds.outHeight) / sample > 3200) sample *= 2
            val decoded =
                resolver.openInputStream(uri)?.use {
                    BitmapFactory.decodeStream(
                        it,
                        null,
                        BitmapFactory.Options().apply {
                            inSampleSize = sample
                            inPreferredConfig = Bitmap.Config.ARGB_8888
                        },
                    )
                } ?: error("사진을 읽지 못했어요.")
            val matrix =
                Matrix().apply {
                    when (
                        exif?.getAttributeInt(
                            ExifInterface.TAG_ORIENTATION,
                            ExifInterface.ORIENTATION_NORMAL,
                        )
                    ) {
                        ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> setScale(-1f, 1f)
                        ExifInterface.ORIENTATION_ROTATE_180 -> setRotate(180f)
                        ExifInterface.ORIENTATION_FLIP_VERTICAL -> setScale(1f, -1f)
                        ExifInterface.ORIENTATION_TRANSPOSE -> {
                            setRotate(90f)
                            postScale(-1f, 1f)
                        }
                        ExifInterface.ORIENTATION_ROTATE_90 -> setRotate(90f)
                        ExifInterface.ORIENTATION_TRANSVERSE -> {
                            setRotate(270f)
                            postScale(-1f, 1f)
                        }
                        ExifInterface.ORIENTATION_ROTATE_270 -> setRotate(270f)
                    }
                }
            val oriented =
                if (matrix.isIdentity) decoded
                else
                    Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
                        .also { if (it !== decoded) decoded.recycle() }
            val scale = minOf(1.0, 1600.0 / max(oriented.width, oriented.height))
            val normalized =
                if (scale < 1)
                    Bitmap.createScaledBitmap(
                            oriented,
                            (oriented.width * scale).roundToInt().coerceAtLeast(1),
                            (oriented.height * scale).roundToInt().coerceAtLeast(1),
                            true,
                        )
                        .also { if (it !== oriented) oriented.recycle() }
                else oriented
            val filename = "photo_${UUID.randomUUID()}.jpg"
            val dest = File(directory, filename)
            try {
                val palette = palette(normalized)
                dest.outputStream().use {
                    check(normalized.compress(Bitmap.CompressFormat.JPEG, 88, it)) {
                        "사진을 저장하지 못했어요."
                    }
                    it.fd.sync()
                }
                val coordinates = exif?.latLong
                ImportedPhoto(filename, palette, coordinates?.get(0), coordinates?.get(1))
            } catch (error: Exception) {
                dest.delete()
                throw error
            } finally {
                normalized.recycle()
            }
        }

    private fun palette(bitmap: Bitmap): PhotoPalette {
        val scale = minOf(1.0, 48.0 / max(bitmap.width, bitmap.height))
        val thumb =
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * scale).roundToInt().coerceAtLeast(1),
                (bitmap.height * scale).roundToInt().coerceAtLeast(1),
                true,
            )
        val pixels = IntArray(thumb.width * thumb.height)
        thumb.getPixels(pixels, 0, thumb.width, 0, 0, thumb.width, thumb.height)
        if (thumb !== bitmap) thumb.recycle()
        return PhotoPaletteExtractor.extract(
            pixels
                .filter { (it ushr 24) >= 128 }
                .map {
                    PhotoPaletteExtractor.RGB(
                        ((it ushr 16) and 255) / 255.0,
                        ((it ushr 8) and 255) / 255.0,
                        (it and 255) / 255.0,
                    )
                }
        )
    }

    suspend fun cleanup(state: AppState, preserve: Set<String> = emptySet()) =
        withContext(Dispatchers.IO) {
            val used =
                state.entries.mapNotNull { it.reflectionPhotoFilename }.toSet() +
                    listOfNotNull(
                        state.avatarFilename,
                        state.draft?.entry?.reflectionPhotoFilename,
                    ) +
                    preserve
            directory
                .listFiles()
                ?.filter {
                    it.name !in used &&
                        it.lastModified() < System.currentTimeMillis() - 24 * 60 * 60 * 1000
                }
                ?.forEach { it.delete() }
        }

    suspend fun clear() =
        withContext(Dispatchers.IO) {
            directory.listFiles()?.forEach { it.delete() }
            Unit
        }
}
