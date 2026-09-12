package com.tastebuddy.android.ui

import android.net.Uri
import android.app.DatePickerDialog
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import coil.compose.AsyncImage
import com.tastebuddy.android.domain.*
import java.time.Instant
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(vm: AppViewModel, linking: Boolean = false) {
    var emailMode by rememberSaveable { mutableStateOf(linking) }
    var email by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var sent by rememberSaveable { mutableStateOf(false) }
    val context = LocalContext.current
    val view = LocalView.current
    DisposableEffect(emailMode) {
        val controller =
            (context as? android.app.Activity)?.let {
                WindowCompat.getInsetsController(it.window, view)
            }
        controller?.isAppearanceLightStatusBars = emailMode
        controller?.isAppearanceLightNavigationBars = emailMode
        onDispose {
            controller?.isAppearanceLightStatusBars = true
            controller?.isAppearanceLightNavigationBars = true
        }
    }
    if (emailMode)
        Screen(
            if (linking) "이메일 연결" else "이메일로 시작하기",
            { if (linking) vm.back() else emailMode = false },
        ) { padding ->
            Page(Modifier.padding(padding)) {
                Text(
                    if (sent) "이메일로 보낸 인증 코드를 입력해 주세요" else "나의 기록을 이어갈 계정을 연결해요",
                    style = MaterialTheme.typography.titleLarge,
                )
                Field(email, "이메일 주소", onChange = { email = it })
                if (sent)
                    Field(code, "인증 코드", onChange = { code = it.filter(Char::isDigit).take(10) })
                PrimaryButton(
                    if (sent) "인증하고 계속" else "인증 코드 보내기",
                    email.contains('@') && (!sent || code.length >= 6),
                ) {
                    vm.task {
                        if (sent) {
                            vm.backend.verifyOTP(email, code, linking)
                            vm.finishAuthentication()
                        } else {
                            vm.backend.sendOTP(email, linking)
                            sent = true
                        }
                    }
                }
                if (sent)
                    TextButton({
                        vm.task {
                            vm.backend.sendOTP(email, linking)
                            vm.message.value = "인증 코드를 다시 보냈어요."
                        }
                    }) {
                        Text("인증 코드 다시 보내기")
                    }
            }
        }
    else
        Column(
            Modifier.fillMaxSize()
                .background(Color(0xFF181818))
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(
                Modifier.weight(1f),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Bloom(null, Modifier.fillMaxWidth().height(240.dp))
                Text(
                    "Taste Buddy",
                    fontFamily = TB.font,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "당신의 입맛을 이해하는\n더 섬세한 미식의 시작",
                    color = Color(0xFFCBCBCB),
                    textAlign = TextAlign.Center,
                    lineHeight = 25.sp,
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    {
                        vm.task {
                            val url = vm.backend.googleSignInURL()
                            CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))
                        }
                    },
                    Modifier.fillMaxWidth().heightIn(min = 52.dp),
                    colors =
                        ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = TB.ink,
                        ),
                ) {
                    Text("Google로 계속하기")
                }
                OutlinedButton(
                    { emailMode = true },
                    Modifier.fillMaxWidth().heightIn(min = 52.dp),
                ) {
                    Text("이메일로 계속하기", color = Color.White)
                }
                TextButton(vm::guest, Modifier.fillMaxWidth()) {
                    Text("게스트로 시작하기", color = Color(0xFFCBCBCB))
                }
            }
        }
}

@Composable
fun OnboardingScreen(vm: AppViewModel) {
    val titles =
        listOf(
            "더 잘 맞는 식사를\n시작해보세요",
            "가볍게 시작해\n현재 프로필을 만듭니다",
            "프로필은 식당과 식사 맥락에 맞춰\n실용적으로 전달됩니다",
            "프로필은 식사와 피드백을 통해\n조금씩 더 정교해집니다",
        )
    val details =
        listOf(
            "Taste Buddy는 당신의 현재 입맛을 이해해,\n다양한 식당에서 더 잘 맞는 식사로 이어줍니다.",
            "복잡한 설명보다, 지금의 미각 경향을 빠르게 정리해\n첫 예약부터 활용할 수 있는 프로필을 만듭니다.",
            "당신의 프로필은 매장과 주방이 의도를 해치지 않으면서도\n더 잘 맞는 경험을 준비할 수 있도록 정리됩니다.",
            "예약, 식후 피드백, 다시 찾은 선택이 쌓일수록\n다음 다이닝은 더 자연스럽고 섬세하게 맞춰집니다.",
        )
    val pager = rememberPagerState { 4 }
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize().background(Color.White).systemBarsPadding()) {
        HorizontalPager(pager, Modifier.weight(1f)) { index ->
            Column(
                Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                AsyncImage(
                    "file:///android_asset/images/onboarding_render_${index + 1}.png",
                    null,
                    Modifier.fillMaxWidth().heightIn(max = 280.dp).aspectRatio(1.1f),
                    contentScale = ContentScale.Fit,
                )
                Spacer(Modifier.height(28.dp))
                Text(
                    titles[index],
                    style = MaterialTheme.typography.titleLarge,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(12.dp))
                Text(details[index], textAlign = TextAlign.Center, color = TB.body)
            }
        }
        Column(
            Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text("${pager.currentPage + 1} / 4", color = TB.hint)
            PrimaryButton(if (pager.currentPage == 3) "시작하기" else "다음") {
                if (pager.currentPage == 3) vm.update { it.copy(onboardingComplete = true) }
                else scope.launch { pager.animateScrollToPage(pager.currentPage + 1) }
            }
        }
    }
}

@Composable
fun SurveyScreen(vm: AppViewModel, retake: Boolean = false) {
    val state by vm.state.collectAsState()
    val catalog = vm.catalogs.survey
    val androidContext = LocalContext.current
    var step by rememberSaveable { mutableIntStateOf(-1) }
    var answers by remember { mutableStateOf(
        if (state.surveyInstrumentVersion == catalog.instrument.version)
            SurveyScoring.normalizeResponses(catalog.items, state.surveyResponses) else emptyList()
    ) }
    var contextAnswers by remember { mutableStateOf(state.respondentContext) }
    var result by remember { mutableStateOf<SurveyResult?>(null) }
    val contextCount = catalog.contextSteps.size
    fun persist() {
        vm.update { it.copy(surveyResponses = answers, surveyInstrumentVersion = catalog.instrument.version, respondentContext = contextAnswers) }
    }
    Screen(
        if (result != null) "기억한 맛의 강도" else "입맛 알아보기",
        if (step >= 0 || retake) ({ if (result != null) result = null else if (step >= 0) step-- else vm.back() }) else null,
    ) { padding ->
        Page(Modifier.padding(padding)) {
            when {
                result != null -> {
                    val value = result!!
                    Text("기억한 맛을 정리했어요", style = MaterialTheme.typography.titleLarge)
                    value.snapshot.surveySubmission?.let { SurveyEvidenceCard(it) }
                    Text("실제 식사 기록과 감각 평가가 쌓이면 입맛 해석을 더해가요.", color = TB.body)
                    PrimaryButton("설문 결과 저장하고 시작하기") {
                        vm.task {
                            val profile = SurveyScoring.profile(value)
                            vm.repo.update {
                                it.copy(
                                    profile = profile,
                                    profileHistory = it.profileHistory + profile,
                                    surveyResponses = answers,
                                    surveyInstrumentVersion = catalog.instrument.version,
                                    respondentContext = contextAnswers,
                                )
                            }
                            vm.main()
                        }
                    }
                }
                step == -1 -> {
                    Bloom(state.profile, Modifier.fillMaxWidth().height(200.dp))
                    Text("최근의 입맛을 떠올려보세요", style = MaterialTheme.typography.titleLarge)
                    Text("최근 3개월에 경험한 여섯 가지 기준 음식에서 맛이 얼마나 강하게 느껴졌는지 기록해요. 먹어본 적 없거나 기억나지 않으면 따로 표시할 수 있어요.", color = TB.body)
                    PrimaryButton("시작하기") { step = 0 }
                }
                step < contextCount -> {
                    val item = catalog.contextSteps[step]
                    Text(item.badgeLabel, color = TB.hint)
                    Text(item.title, style = MaterialTheme.typography.titleLarge)
                    Text(item.description, color = TB.body)
                    if (item.id == "birthDate") {
                        OutlinedButton({
                            val selected = runCatching { java.time.LocalDate.parse(contextAnswers["birthDate"]) }.getOrNull()
                            DatePickerDialog(androidContext, { _, year, month, day ->
                                contextAnswers = contextAnswers + ("birthDate" to java.time.LocalDate.of(year, month + 1, day).toString())
                                persist()
                            }, selected?.year ?: 1990, (selected?.monthValue ?: 1) - 1, selected?.dayOfMonth ?: 1).apply {
                                datePicker.maxDate = System.currentTimeMillis()
                            }.show()
                        }, Modifier.fillMaxWidth()) { Text(contextAnswers["birthDate"] ?: "생년월일 선택") }
                    }
                    item.options.forEach { option ->
                        OutlinedButton({
                            contextAnswers = contextAnswers + (item.id to option.value)
                            persist()
                            step++
                        }, Modifier.fillMaxWidth()) {
                            Text(option.label, color = if (contextAnswers[item.id] == option.value) TB.ink else TB.body)
                        }
                    }
                    PrimaryButton("계속") { step++ }
                }
                step < contextCount + catalog.items.size -> {
                    val index = step - contextCount
                    val item = catalog.items[index]
                    val selected = answers.firstOrNull { it.itemId == item.id }
                    LinearProgressIndicator(progress = { (index + 1) / catalog.items.size.toFloat() }, Modifier.fillMaxWidth())
                    Text("${index + 1} / ${catalog.items.size} · ${item.tasteId.label}", color = Color(item.tasteId.text))
                    Text(item.prompt, style = MaterialTheme.typography.titleLarge)
                    CardBox(color = Color(item.tasteId.tint)) {
                        Text(item.anchor.label, fontWeight = FontWeight.SemiBold)
                        Text(item.anchor.description)
                    }
                    Text(item.helper, color = TB.body)
                    (catalog.likertScale.min..catalog.likertScale.max).forEach { value ->
                        OutlinedButton({
                            answers = answers.filterNot { it.itemId == item.id } + SurveyResponse(item.id, value)
                            persist()
                        }, Modifier.fillMaxWidth().testTag("survey-${item.tasteId.name}-intensity-$value"),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor =
                                if (selected?.selectedValue == value && !selected.uncertain) Color(item.tasteId.tint) else Color.Transparent)
                        ) { Text(catalog.likertScale.labels[value.toString()].orEmpty()) }
                    }
                    SurveyScoring.uncertaintyLabels.filterKeys { it != "cannot_isolate_taste" || item.tasteId == TasteAxis.fat }.forEach { (reason, label) ->
                        OutlinedButton({
                            answers = answers.filterNot { it.itemId == item.id } + SurveyResponse(item.id, uncertain = true, uncertaintyReason = reason)
                            persist()
                        }, Modifier.fillMaxWidth().testTag("survey-${item.tasteId.name}-$reason"),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor =
                                if (selected?.uncertaintyReason == reason) TB.muted else Color.Transparent)
                        ) { Text(label) }
                    }
                    PrimaryButton(if (index == catalog.items.lastIndex) "응답 검토" else "다음 문항", selected != null) { step++ }
                }
                else -> {
                    Text("응답을 확인해 주세요", style = MaterialTheme.typography.titleLarge)
                    CardBox {
                        catalog.items.forEachIndexed { index, item ->
                            NavigationRow(item.prompt, SurveyScoring.responseLabel(answers.firstOrNull { it.itemId == item.id }, catalog.likertScale)) {
                                step = contextCount + index
                            }
                        }
                    }
                    PrimaryButton("기억한 맛 정리하기") {
                        result = SurveyScoring.result(catalog.items, answers, timestamp(Instant.now()), contextAnswers, catalog.instrument, catalog.likertScale)
                    }
                }
            }
        }
    }
}
