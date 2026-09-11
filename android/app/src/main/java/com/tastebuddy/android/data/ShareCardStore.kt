package com.tastebuddy.android.data

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.core.content.FileProvider
import com.tastebuddy.android.BuildConfig
import com.tastebuddy.android.domain.*
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ShareCardStore(private val context: Context, private val photos: PhotoStore) {
    suspend fun render(entry: DiningEntry, identity: ProfileIdentity): File =
        withContext(Dispatchers.IO) {
            val side = 1080
            val bitmap = Bitmap.createBitmap(side, side, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            canvas.drawColor(Color.rgb(243, 243, 243))
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            val source =
                photos.file(entry.reflectionPhotoFilename)?.let {
                    BitmapFactory.decodeFile(it.path)
                }
            if (source != null) {
                val ratio = side / 700.0
                val cropWidth = minOf(source.width, (source.height * ratio).toInt())
                val cropHeight = minOf(source.height, (source.width / ratio).toInt())
                val rect =
                    Rect(
                        (source.width - cropWidth) / 2,
                        (source.height - cropHeight) / 2,
                        (source.width + cropWidth) / 2,
                        (source.height + cropHeight) / 2,
                    )
                canvas.drawBitmap(source, rect, Rect(0, 0, side, 700), paint)
                source.recycle()
            } else {
                paint.color = Color.rgb(232, 229, 226)
                canvas.drawRect(0f, 0f, side.toFloat(), 700f, paint)
            }
            val colors = entry.photoPalette?.colors ?: PhotoPalette.neutral.colors
            val proportions =
                entry.photoPalette?.colorProportions ?: PhotoPalette.neutral.colorProportions
            var x = 0f
            colors.forEachIndexed { index, value ->
                paint.color = runCatching { Color.parseColor(value) }.getOrDefault(Color.GRAY)
                val width = side * (proportions.getOrNull(index)?.toFloat() ?: 1f / colors.size)
                canvas.drawRect(x, 684f, x + width, 716f, paint)
                x += width
            }
            val font = context.resources.getFont(com.tastebuddy.android.R.font.pretendard_regular)
            fun text(value: String, top: Float, size: Float, color: Int, maxLines: Int) {
                val textPaint =
                    TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
                        textSize = size
                        this.color = color
                        typeface = font
                    }
                val layout =
                    StaticLayout.Builder.obtain(value, 0, value.length, textPaint, side - 96)
                        .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                        .setMaxLines(maxLines)
                        .setEllipsize(android.text.TextUtils.TruncateAt.END)
                        .build()
                canvas.save()
                canvas.translate(48f, top)
                layout.draw(canvas)
                canvas.restore()
            }
            text(entry.title, 758f, 46f, Color.rgb(30, 30, 30), 2)
            text(entry.restaurant, 875f, 28f, Color.rgb(98, 98, 98), 1)
            text(
                "${entry.date.take(10)}  ·  ${identity.displayName}",
                929f,
                25f,
                Color.rgb(133, 133, 133),
                1,
            )
            text("Taste Buddy", 1000f, 30f, Color.rgb(30, 30, 30), 1)
            val dir = File(context.cacheDir, "shared").apply { mkdirs() }
            val file = File(dir, "taste-buddy-${entry.id}.png")
            file.outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)) }
            bitmap.recycle()
            file
        }

    fun uri(file: File): Uri =
        FileProvider.getUriForFile(context, "${context.packageName}.files", file)

    fun share(file: File, instagram: Boolean = false) {
        val uri = uri(file)
        val intent =
            if (instagram && BuildConfig.TB_INSTAGRAM_FACEBOOK_APP_ID.isNotBlank())
                Intent("com.instagram.share.ADD_TO_STORY").apply {
                    setDataAndType(uri, "image/png")
                    setPackage("com.instagram.android")
                    putExtra("source_application", BuildConfig.TB_INSTAGRAM_FACEBOOK_APP_ID)
                }
            else
                Intent(Intent.ACTION_SEND).apply {
                    type = "image/png"
                    putExtra(Intent.EXTRA_STREAM, uri)
                    if (instagram) setPackage("com.instagram.android")
                }
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        intent.clipData = android.content.ClipData.newRawUri("Taste Buddy 기록", uri)
        if (instagram)
            context.grantUriPermission(
                "com.instagram.android",
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION,
            )
        context.startActivity(
            if (instagram) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            else Intent.createChooser(intent, "기록 카드 공유").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }

    suspend fun save(file: File): Uri =
        withContext(Dispatchers.IO) {
            val values =
                ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, file.name)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    if (Build.VERSION.SDK_INT >= 29) {
                        put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Taste Buddy")
                        put(MediaStore.Images.Media.IS_PENDING, 1)
                    }
                }
            val resolver = context.contentResolver
            val uri =
                resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    ?: error("사진 보관함을 열지 못했어요.")
            try {
                resolver.openOutputStream(uri)?.use { output ->
                    file.inputStream().use { it.copyTo(output) }
                } ?: error("기록 카드를 저장하지 못했어요.")
                if (Build.VERSION.SDK_INT >= 29)
                    resolver.update(
                        uri,
                        ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) },
                        null,
                        null,
                    )
                uri
            } catch (e: Exception) {
                resolver.delete(uri, null, null)
                throw e
            }
        }
}
