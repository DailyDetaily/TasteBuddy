package com.tastebuddy.android

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tastebuddy.android.domain.*
import com.tastebuddy.android.ui.*

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        vm.qaMode = BuildConfig.DEBUG && intent.getBooleanExtra("qaMode", false)
        intent.data?.let(vm::callback)
        setContent { TasteTheme { TasteBuddyApp(vm) } }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.let(vm::callback)
    }
}

@Composable
fun TasteBuddyApp(vm: AppViewModel) {
    val view = LocalView.current
    val ready by vm.ready.collectAsStateWithLifecycle()
    val error by vm.loadError.collectAsStateWithLifecycle()
    val state by vm.state.collectAsStateWithLifecycle()
    val route by vm.route.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    SideEffect {
        val activity = view.context as? android.app.Activity
        if (activity != null && state.phase() != AppPhase.Auth) {
            WindowCompat.getInsetsController(activity.window, view).apply {
                isAppearanceLightStatusBars = true
                isAppearanceLightNavigationBars = true
            }
        }
    }
    LaunchedEffect(message) {
        message?.let { value ->
            val undo = value.contains("실행 취소")
            val result =
                snackbar.showSnackbar(value, if (undo) "실행 취소" else null, withDismissAction = true)
            if (result == SnackbarResult.ActionPerformed) vm.undoDelete()
            if (vm.message.value == value) vm.message.value = null
        }
    }
    BackHandler(route != "main" && route != "diningFlow") { vm.back() }
    Box(Modifier.fillMaxSize().background(TB.page)) {
        when {
            !ready ->
                Column(
                    Modifier.fillMaxSize().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    if (error == null) CircularProgressIndicator()
                    else {
                        Text(error!!)
                        TextButton({ vm.task { vm.repo.load() } }) { Text("다시 불러오기") }
                    }
                }
            route == "linkEmail" -> AuthScreen(vm, linking = true)
            route == "survey" -> SurveyScreen(vm, retake = true)
            state.phase() == AppPhase.Auth -> AuthScreen(vm)
            state.phase() == AppPhase.Onboarding -> OnboardingScreen(vm)
            state.phase() == AppPhase.PreferenceIntake -> PreferencesScreen(vm, isOnboarding = true)
            state.phase() == AppPhase.Calibration -> SurveyScreen(vm)
            else ->
                when (route) {
                    "main" -> MainShell(vm)
                    "diningFlow" -> DiningFlow(vm)
                    "search" -> SearchScreen(vm)
                    "peopleSearch" -> SearchScreen(vm, peopleOnly = true)
                    "restaurant" -> RestaurantScreen(vm)
                    "bookmark" -> BookmarkScreen(vm)
                    "saved" -> SavedListsScreen(vm)
                    "settings" -> SettingsScreen(vm)
                    "profileEdit" -> ProfileEditScreen(vm)
                    "profileContext" -> ProfileEditScreen(vm, contextOnly = true)
                    "preferences" -> PreferencesScreen(vm)
                    "person" -> PersonScreen(vm)
                    "followers" -> ConnectionsScreen(vm, false)
                    "following" -> ConnectionsScreen(vm, true)
                    "comments" -> CommentsScreen(vm)
                    "history" -> HistoryScreen(vm)
                    "chatgpt" -> ChatGPTScreen(vm)
                    "evidence" -> EvidenceScreen(vm)
                    "tasteChange" -> TasteChangeScreen(vm)
                    "entry" -> RecordScreen(vm)
                    "share" -> ShareScreen(vm)
                    else -> MainShell(vm)
                }
        }
        SnackbarHost(
            snackbar,
            Modifier.align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = if (route == "main") 84.dp else 8.dp),
        )
        if (busy)
            Box(
                Modifier.fillMaxSize()
                    .background(Color.Black.copy(alpha = .12f))
                    .clickable(enabled = true, onClick = {}),
                contentAlignment = Alignment.Center,
            ) {
                Surface(shape = CircleShape) {
                    CircularProgressIndicator(Modifier.padding(20.dp).size(32.dp))
                }
            }
    }
}

@Composable
private fun MainShell(vm: AppViewModel) {
    val state by vm.state.collectAsStateWithLifecycle()
    val tabs = listOf("home", "analysis", "capture", "dining", "profile")
    val names =
        mapOf(
            "home" to "홈",
            "analysis" to "분석",
            "capture" to "기록",
            "dining" to "다이닝",
            "profile" to "프로필",
        )
    val icons =
        listOf(
            Icons.Outlined.Home,
            Icons.Outlined.AutoAwesome,
            Icons.Outlined.Add,
            Icons.Outlined.Restaurant,
            Icons.Outlined.Person,
        )
    Screen(
        names[state.selectedTab] ?: "홈",
        actions = {
            IconButton({ vm.open("search") }) { Icon(Icons.Outlined.Search, "검색") }
            IconButton({
                vm.selectedListID.value = null
                vm.open("saved")
            }) {
                Icon(Icons.Outlined.BookmarkBorder, "저장한 식당")
            }
        },
        bottom = {
            NavigationBar(containerColor = Color.White, tonalElevation = 0.dp) {
                tabs.forEachIndexed { index, tab ->
                    if (tab == "capture")
                        Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                            FilledIconButton(
                                {
                                    if (state.draft != null && state.draft?.stage != "result")
                                        vm.open("diningFlow")
                                    else vm.startDining()
                                },
                                Modifier.size(56.dp).semantics { contentDescription = "새 식사 기록" },
                            ) {
                                Bloom(state.profile, Modifier.size(40.dp))
                            }
                        }
                    else
                        NavigationBarItem(
                            state.selectedTab == tab,
                            { vm.update { it.copy(selectedTab = tab) } },
                            icon = { Icon(icons[index], names[tab]) },
                            label = { Text(names.getValue(tab)) },
                            colors = NavigationBarItemDefaults.colors(indicatorColor = TB.muted),
                        )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (state.selectedTab) {
                "analysis" -> AnalysisContent(vm)
                "dining" -> DiningContent(vm)
                "profile" -> ProfileContent(vm)
                else -> HomeContent(vm)
            }
        }
    }
}
