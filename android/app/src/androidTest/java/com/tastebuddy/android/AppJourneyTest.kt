package com.tastebuddy.android

import android.content.Intent
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tastebuddy.android.domain.*
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AppJourneyTest {
    @get:Rule val compose = createEmptyComposeRule()
    private val app
        get() = ApplicationProvider.getApplicationContext<TasteBuddyApplication>()

    private var scenario: ActivityScenario<MainActivity>? = null

    @Before
    fun prepare() {
        runBlocking {
            app.repository.load()
            app.repository.reset()
        }
    }

    @After
    fun cleanup() {
        scenario?.close()
    }

    private fun launch(main: Boolean = true) {
        if (main)
            runBlocking {
                app.repository.update {
                    it.copy(
                        authEntryComplete = true,
                        onboardingComplete = true,
                        profile =
                            TasteProfile(
                                scores = TasteAxis.entries.associate { axis -> axis.name to 50 },
                                confidence = "Starter",
                                summary = "검증용",
                                topAxes = listOf(TasteAxis.sweet, TasteAxis.sour),
                                cautionAxis = TasteAxis.bitter,
                            ),
                    )
                }
            }
        scenario =
            ActivityScenario.launch(Intent(app, MainActivity::class.java).putExtra("qaMode", true))
        compose.waitForIdle()
    }

    @Test
    fun guestOnboardingReachesActualSurvey() {
        launch(false)
        compose.onNodeWithText("게스트로 시작하기").performClick()
        compose.waitUntil(10_000) { app.repository.state.value.authEntryComplete }
        repeat(3) {
            compose.onNodeWithText("다음").performClick()
            compose.waitForIdle()
        }
        compose.onNodeWithText("시작하기").performClick()
        compose.waitUntil(10_000) { app.repository.state.value.onboardingComplete }
        compose.onNodeWithText("최근의 입맛을 떠올려보세요").assertExists()
        compose.onNodeWithText("시작하기").performScrollTo().performClick()
        compose.onNodeWithText(app.catalogs.survey.contextSteps.first().title).assertExists()
    }

    @Test
    fun textRecordPersistsAndFeedsAnalysisOnlyAfterCompletion() {
        launch()
        compose.onNodeWithContentDescription("새 식사 기록").performClick()
        compose.onNodeWithText("사진 없이 맛 기록하기").performClick()
        compose.onNodeWithText("식당 이름 검색 또는 직접 입력").performTextInput("검증 식당")
        compose.onNodeWithText("이 이름으로 기록하기").performScrollTo().performClick()
        compose.onNodeWithText("메뉴 이름 직접 입력").performTextInput("검증 국수")
        compose.onNodeWithText("맛 피드백 남기기").performScrollTo().performClick()
        compose.onNodeWithText("좋았어요", useUnmergedTree = true).performClick()
        compose.onNodeWithText("지금 선택으로 이어가기").performScrollTo().performClick()
        compose.onNodeWithText("기억하고 싶은 맛과 순간").performTextInput("국물의 감칠맛이 좋았어요")
        compose.onNodeWithText("맛 기록 저장").performScrollTo().performClick()
        compose.waitUntil(10_000) { app.repository.state.value.entries.size == 1 }
        assertTrue(app.repository.state.value.entries.single().hasCompletedTasteFeedback)
        assertEquals("국물의 감칠맛이 좋았어요", app.repository.state.value.entries.single().note)
        scenario!!.recreate()
        compose.waitForIdle()
        runBlocking { app.repository.load() }
        assertEquals("검증 국수", app.repository.state.value.entries.single().menu)
        val snapshot =
            SensoryAnalyzer(app.catalogs.sensory).analyze(app.repository.state.value.entries)
        assertEquals(1, snapshot.completedExperienceCount)
        assertTrue(snapshot.observations.isNotEmpty())
    }

    @Test
    fun capturedPhotoIsExcludedAndDraftSurvivesRecreation() {
        val captured =
            DiningEntry(
                restaurant = "검증 식당",
                menu = "저장만 한 메뉴",
                note = "단맛이 좋았어요",
                feedbackStatus = "captured",
            )
        runBlocking {
            app.repository.update {
                it.copy(
                    entries = listOf(captured),
                    draft = DiningDraft(DiningEntry(restaurant = "작성 중인 식당"), stage = "menu"),
                )
            }
        }
        launch()
        compose.onNodeWithContentDescription("새 식사 기록").performClick()
        compose.onNodeWithText("작성 중인 식당").assertExists()
        scenario!!.recreate()
        compose.waitForIdle()
        assertEquals("작성 중인 식당", app.repository.state.value.draft?.entry?.restaurant)
        assertEquals(
            0,
            SensoryAnalyzer(app.catalogs.sensory)
                .analyze(app.repository.state.value.entries)
                .completedExperienceCount,
        )
    }
}
