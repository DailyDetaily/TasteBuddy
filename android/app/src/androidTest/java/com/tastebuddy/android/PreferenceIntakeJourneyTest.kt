package com.tastebuddy.android

import android.content.Intent
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tastebuddy.android.domain.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PreferenceIntakeJourneyTest {
    @get:Rule val compose = createEmptyComposeRule()
    @Test fun sevenQuestionsSaveSourceAndRestoreAfterRecreation() {
        val app = ApplicationProvider.getApplicationContext<TasteBuddyApplication>()
        runBlocking {
            app.repository.load()
            app.repository.reset()
            app.repository.update { it.copy(authEntryComplete = true, onboardingComplete = true) }
        }
        ActivityScenario.launch<MainActivity>(Intent(app, MainActivity::class.java).putExtra("qaMode", true)).use { scenario ->
            compose.onNodeWithTag("preference-allergies-none").performScrollTo().performClick()
            compose.waitUntil(5_000) { app.repository.state.value.preferenceIntakeDraft?.get("allergies") == listOf("allergies-none") }
            scenario.recreate()
            compose.onNodeWithTag("preference-allergies-none").assertIsOn()
            compose.onNodeWithText("다음 질문").performScrollTo().performClick()
            val choices = listOf("dietary-restrictions-none", "korean-course", "high-acidity", "light", "adventurous", "preview-first")
            choices.forEachIndexed { index, id ->
                compose.onNodeWithTag("preference-$id").performScrollTo().performClick()
                compose.onNodeWithText(if (index == choices.lastIndex) "선호 저장" else "다음 질문").performScrollTo().performClick()
            }
            compose.waitUntil(10_000) { app.repository.state.value.preferenceSubmissions.size == 1 }
            runBlocking { app.repository.load() }
            val state = app.repository.state.value
            assertNull(state.preferenceIntakeDraft)
            assertEquals(AppPhase.Calibration, state.phase())
            val source = state.preferenceSubmissions.single()
            assertEquals("android", source.source.platform)
            assertEquals(7, source.responses.size)
            assertEquals("allergies-none", source.responses.first().selectedOptions.single().id)
            assertTrue(state.entries.isEmpty())
            scenario.recreate()
            compose.onNodeWithText("시작하기").assertExists()
        }
    }
}
