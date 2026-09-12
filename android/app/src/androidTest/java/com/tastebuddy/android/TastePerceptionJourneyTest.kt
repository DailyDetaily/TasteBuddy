package com.tastebuddy.android

import android.content.Intent
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tastebuddy.android.domain.*
import kotlinx.coroutines.runBlocking
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TastePerceptionJourneyTest {
    @get:Rule val compose = createEmptyComposeRule()
    @Test fun emptyCardThenCompletedMealComparisonAndOriginalEvidence() {
        val app = ApplicationProvider.getApplicationContext<TasteBuddyApplication>()
        runBlocking { app.repository.load() }
        val original = app.repository.state.value
        val profile = SurveyScoring.profile(SurveyScoring.result(app.catalogs.survey.items, emptyList(), "2026-09-01T00:00:00Z"))
        try {
            runBlocking { app.repository.update { AppState(authEntryComplete = true, onboardingComplete = true, profile = profile, selectedTab = "analysis") } }
            ActivityScenario.launch<MainActivity>(Intent(app, MainActivity::class.java).putExtra("qaMode", true)).use { scenario ->
                compose.onNodeWithText("아직 변화없음").performScrollTo().assertIsDisplayed()
                compose.onNodeWithText("비교할 기록이 더 필요해요.").assertExists()
                compose.onNodeWithText("기록 비교").performScrollTo().performClick()
                compose.onNodeWithTag("taste-change-screen").assertExists()
                compose.onNodeWithText("강도 기록과 적용 조건").assertDoesNotExist()
                compose.onNodeWithContentDescription("뒤로").performClick()
                val entries = (1..6).map { index ->
                    val date = "2026-08-0${index}T12:00:00Z"
                    DiningEntry(restaurant = "검증 식당", menu = "국물 요리", date = date, savedAt = date, feedbackStatus = "completed",
                        sensorySelections = listOf(SensorySelection("salty-broth-salt", "bubble", labelSnapshot = "육수의 짠맛",
                            intensity = if (index <= 3) "light" else "strong", liking = "disliked", preferenceFit = "just_right", target = "broth", phase = "first_bite")))
                }
                runBlocking { app.repository.update { it.copy(entries = entries) }; app.repository.load() }
                scenario.recreate()
                compose.waitUntil(20_000) { compose.onAllNodesWithText("짠맛을 느낀 강도가 달라졌어요").fetchSemanticsNodes().isNotEmpty() }
                compose.onNodeWithText("기록 비교").performScrollTo().performClick()
                compose.onNodeWithTag("taste-change-screen").assertExists()
                compose.onNodeWithText("더 강하게").assertExists()
                compose.onAllNodesWithText("원본 기록과 응답 보기").onFirst().performScrollTo().performClick()
                compose.onAllNodesWithText("원래 기록 보기").onFirst().performScrollTo().performClick()
                compose.onNodeWithText("검증 식당", substring = true).assertExists()
            }
        } finally { runBlocking { app.repository.update { original } } }
    }
}
