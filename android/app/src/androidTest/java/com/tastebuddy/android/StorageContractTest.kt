package com.tastebuddy.android

import android.content.Context
import android.graphics.Bitmap
import androidx.core.content.FileProvider
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tastebuddy.android.data.*
import com.tastebuddy.android.domain.*
import java.io.File
import java.util.UUID
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StorageContractTest {
    private val context
        get() = ApplicationProvider.getApplicationContext<Context>()

    private fun directory() =
        File(context.cacheDir, "storage-test-${UUID.randomUUID()}").apply { mkdirs() }

    @Test
    fun concurrentWritesRemainCompleteAfterReload() = runBlocking {
        val dir = directory()
        val repo = AppRepository(dir)
        repo.load()
        (1..30)
            .map { index ->
                async {
                    repo.update { it.copy(entries = it.entries + DiningEntry(menu = "메뉴 $index")) }
                }
            }
            .awaitAll()
        val restored = AppRepository(dir)
        restored.load()
        assertEquals(30, restored.state.value.entries.size)
        assertEquals(30, restored.state.value.entries.map { it.id }.distinct().size)
        dir.deleteRecursively()
    }

    @Test
    fun corruptStateIsPreservedAndCannotBeOverwritten() = runBlocking {
        val dir = directory()
        val file = File(dir, "taste-buddy-state.json")
        file.writeText("{not valid")
        val repo = AppRepository(dir)
        repo.load()
        assertFalse(repo.ready.value)
        assertNotNull(repo.error.value)
        assertTrue(runCatching { repo.update { AppState() } }.isFailure)
        assertEquals("{not valid", file.readText())
        dir.deleteRecursively()
    }

    @Test
    fun futureSelectionPayloadSurvivesReadWrite() = runBlocking {
        val dir = directory()
        val file = File(dir, "taste-buddy-state.json")
        file.writeText(
            """{"schemaVersion":1,"entries":[{"id":"future-entry","sensorySelections":[{"future":"original meaning"}],"overallEvaluation":{"future":"overall"}}]}"""
        )
        val repo = AppRepository(dir)
        repo.load()
        assertTrue(repo.ready.value)
        repo.update { it.copy(selectedTab = "analysis") }
        val reload = AppRepository(dir)
        reload.load()
        assertNotNull(
            reload.state.value.entries.single().sensorySelections!!.single().unparsedPayload
        )
        assertNotNull(reload.state.value.entries.single().overallEvaluation!!.unparsedPayload)
        dir.deleteRecursively()
    }

    @Test
    fun encryptedSessionsAreReadableButNotPlaintextOnDisk() {
        val name = "test-${UUID.randomUUID()}"
        val store = SecureSessionStore(context, name)
        val secret = "test-token-${UUID.randomUUID()}"
        store.write(secret)
        assertEquals(secret, store.read())
        assertFalse(
            File(context.noBackupFilesDir, "$name.enc")
                .readBytes()
                .toString(Charsets.UTF_8)
                .contains(secret)
        )
        store.write(null)
        assertNull(store.read())
    }

    @Test
    fun photoImportNormalizesImageAndProducesPaletteAndShareCard() = runBlocking {
        val store = PhotoStore(context)
        val source = store.captureFile()
        val bitmap =
            Bitmap.createBitmap(2400, 1200, Bitmap.Config.ARGB_8888).apply {
                eraseColor(android.graphics.Color.RED)
            }
        source.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, 90, it) }
        bitmap.recycle()
        val photo =
            store.import(
                FileProvider.getUriForFile(context, "${context.packageName}.files", source)
            )
        val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
        android.graphics.BitmapFactory.decodeFile(store.file(photo.filename)!!.path, bounds)
        assertEquals(1600, bounds.outWidth)
        assertEquals(800, bounds.outHeight)
        assertFalse(photo.palette.isFallback)
        assertEquals(1.0, photo.palette.colorProportions.sum(), .001)
        val share =
            ShareCardStore(context, store)
                .render(
                    DiningEntry(
                        menu = "검증 메뉴",
                        restaurant = "검증 식당",
                        reflectionPhotoFilename = photo.filename,
                        photoPalette = photo.palette,
                    ),
                    ProfileIdentity(name = "검증 사용자"),
                )
        assertTrue(share.length() > 0)
        source.delete()
        store.file(photo.filename)?.delete()
        share.delete()
    }
}
