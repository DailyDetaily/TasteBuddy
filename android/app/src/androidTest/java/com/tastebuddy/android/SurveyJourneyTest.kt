package com.tastebuddy.android

import android.content.Intent
import androidx.compose.ui.graphics.asAndroidBitmap
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
class SurveyJourneyTest {
    @get:Rule val compose = createEmptyComposeRule()
    @Test fun sixRecallAnswersSaveAndRemainVisibleAfterReload() {
        val app = ApplicationProvider.getApplicationContext<TasteBuddyApplication>()
        runBlocking {
            app.repository.load()
            app.repository.reset()
            app.repository.update { it.copy(authEntryComplete = true, onboardingComplete = true,
                preferenceProfile = mapOf("allergies" to listOf("allergies-none"))) }
        }
        ActivityScenario.launch<MainActivity>(Intent(app, MainActivity::class.java).putExtra("qaMode", true)).use { scenario ->
            compose.onNodeWithText("시작하기").performScrollTo().performClick()
            repeat(3) { compose.onNodeWithText("계속").performScrollTo().performClick() }
            val choices = listOf("sweet-intensity-0", "salty-intensity-4", "sour-cannot_recall", "bitter-never_tried", "umami-intensity-2", "fat-cannot_isolate_taste")
            choices.forEachIndexed { index, choice ->
                compose.onNodeWithTag("survey-$choice").performScrollTo().performClick()
                compose.onNodeWithText(if (index == 5) "응답 검토" else "다음 문항").performScrollTo().performClick()
            }
            compose.onNodeWithText("전혀 느끼지 않음").assertExists()
            compose.onNodeWithText("지방맛을 구분하기 어려워요").assertExists()
            compose.onNodeWithText("기억한 맛 정리하기").performScrollTo().performClick()
            compose.onNodeWithText("기준 음식 회상").assertExists()
            compose.onNodeWithText("설문 결과 저장하고 시작하기").performScrollTo().performClick()
            compose.waitUntil(10_000) { app.repository.state.value.profile?.surveySubmission != null }
            runBlocking { app.repository.load() }
            val saved = app.repository.state.value.profile!!.surveySubmission!!
            assertEquals(3, saved.answeredCount)
            assertEquals(0, saved.responses.first().selectedValue)
            assertTrue(saved.respondentContext.isEmpty())
            assertTrue(app.repository.state.value.entries.isEmpty())
            scenario.recreate()
            compose.onNodeWithText("응답 보기").performScrollTo().performClick()
            compose.onNodeWithText("지방맛을 구분하기 어려워요").performScrollTo().assertIsDisplayed()
            val file = java.io.File(app.getExternalFilesDir(null), "survey-evidence-qa.png")
            file.outputStream().use { compose.onRoot().captureToImage().asAndroidBitmap().compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
        }
    }
}
