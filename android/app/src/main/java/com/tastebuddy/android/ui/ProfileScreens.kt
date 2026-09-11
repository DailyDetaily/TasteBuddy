package com.tastebuddy.android.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tastebuddy.android.BuildConfig
import com.tastebuddy.android.data.BackendClient
import com.tastebuddy.android.domain.*
import java.time.LocalDate
import kotlinx.serialization.json.*

@Composable
fun ProfileContent(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val snapshot by vm.analysis.collectAsState()
    Page {
        CardBox {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(vm, Modifier.size(64.dp))
                Column(Modifier.weight(1f).padding(start = 14.dp)) {
                    Text(state.identity.displayName, style = MaterialTheme.typography.titleLarge)
                    Text(state.identity.displayNickname, color = TB.hint)
                }
                IconButton({ vm.open("settings") }) { Icon(Icons.Outlined.Settings, "프로필 설정 열기") }
            }
            Row {
                TextButton({ vm.open("followers") }) { Text("팔로워 —") }
                TextButton({ vm.open("following") }) { Text("팔로잉 —") }
            }
            OutlinedButton({ vm.open("peopleSearch") }) {
                Icon(Icons.Outlined.PersonAdd, null)
                Spacer(Modifier.width(8.dp))
                Text("버디 찾기")
            }
        }
        Section("활동 요약") {
            val metrics =
                listOf(
                    "근거 기록" to "${snapshot.sourceExperienceCount}개",
                    "다이닝 리뷰" to "${state.entries.count { it.hasCompletedTasteFeedback }}건",
                    "테이스트 리스트" to "${state.bookmarks.size}개",
                    "현재 인사이트" to "${snapshot.insights.size}개",
                )
            metrics.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { (label, value) ->
                        CardBox(Modifier.weight(1f)) {
                            Text(value, style = MaterialTheme.typography.titleLarge)
                            if (label == "테이스트 리스트")
                                TextButton({
                                    vm.selectedListID.value = null
                                    vm.open("saved")
                                }) {
                                    Text(label)
                                }
                            else Text(label, color = TB.body)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun Avatar(vm: AppViewModel, modifier: Modifier = Modifier) {
    val state by vm.state.collectAsState()
    val file = vm.photos.file(state.avatarFilename)
    if (file == null) Bloom(state.profile, modifier)
    else AsyncImage(file, "프로필 사진", modifier.clip(CircleShape), contentScale = ContentScale.Crop)
}

@Composable
fun SettingsScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val session by vm.backend.sessionState.collectAsState()
    var confirm by remember { mutableStateOf<String?>(null) }
    Screen("프로필 설정", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            CardBox {
                NavigationRow(state.identity.displayName, state.identity.displayNickname) {
                    vm.open("profileEdit")
                }
                NavigationRow("기준 정보와 식이 제한", "입맛 해석을 위한 참고 정보") { vm.open("profileContext") }
            }
            Section("계정 연결") {
                CardBox {
                    Text(
                        session?.user?.email?.takeIf { it.isNotBlank() } ?: "게스트로 이용 중이에요",
                        fontWeight = FontWeight.SemiBold,
                    )
                    NavigationRow("현재 계정을 이메일에 연결") { vm.open("linkEmail") }
                    Text("식사 기록과 사진은 현재 기기에 저장돼요.", color = TB.body)
                }
            }
            CardBox {
                NavigationRow("입맛 설문 다시 하기") { vm.open("survey") }
                NavigationRow("식사 선호 정보") { vm.open("preferences") }
                NavigationRow("현재 기록의 범위") { vm.open("history") }
            }
            CardBox {
                NavigationRow("로그아웃") { confirm = "logout" }
                if (session != null) NavigationRow("회원 탈퇴") { confirm = "delete" }
            }
            Text("Taste Buddy ${BuildConfig.VERSION_NAME}", color = TB.hint)
        }
    }
    confirm?.let { action ->
        AlertDialog(
            onDismissRequest = { confirm = null },
            title = { Text(if (action == "delete") "계정을 삭제할까요?" else "로그아웃할까요?") },
            text = {
                Text(
                    if (action == "delete") "계정과 이 기기에 저장한 기록·사진이 삭제되며 되돌릴 수 없어요."
                    else "이 기기에 저장한 기록·사진이 삭제돼요. 필요한 기록 카드를 먼저 저장해 주세요."
                )
            },
            confirmButton = {
                TextButton({
                    confirm = null
                    if (action == "delete") vm.deleteAccount() else vm.signOut()
                }) {
                    Text(if (action == "delete") "계정 삭제" else "로그아웃")
                }
            },
            dismissButton = { TextButton({ confirm = null }) { Text("취소") } },
        )
    }
}

@Composable
fun ProfileEditScreen(vm: AppViewModel, contextOnly: Boolean = false) {
    val state by vm.state.collectAsState()
    var identity by remember { mutableStateOf(state.identity) }
    var birth by rememberSaveable { mutableStateOf(state.identity.birthDate?.take(10).orEmpty()) }
    val picker =
        rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) {
            it?.let { uri -> vm.importPhoto(uri, avatar = true) }
        }
    Screen(if (contextOnly) "기준 정보와 식이 제한" else "프로필 편집", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            if (!contextOnly) {
                Avatar(vm, Modifier.size(96.dp).align(Alignment.CenterHorizontally))
                Row {
                    TextButton({
                        picker.launch(
                            PickVisualMediaRequest(
                                ActivityResultContracts.PickVisualMedia.ImageOnly
                            )
                        )
                    }) {
                        Text("사진 변경")
                    }
                    if (state.avatarFilename != null)
                        TextButton({ vm.update { it.copy(avatarFilename = null) } }) {
                            Text("기본 이미지")
                        }
                }
                Field(identity.name, "이름", onChange = { identity = identity.copy(name = it) })
                Field(
                    identity.nickname,
                    "버디네임",
                    onChange = { identity = identity.copy(nickname = it.trimStart('@')) },
                )
                Field(
                    identity.introduction,
                    "소개",
                    singleLine = false,
                    onChange = { identity = identity.copy(introduction = it) },
                )
            } else {
                Field(birth, "생년월일 (YYYY-MM-DD)", onChange = { birth = it })
                Section("성별") {
                    Choices(
                        linkedMapOf(
                            "female" to "여성",
                            "male" to "남성",
                            "other_or_not_listed" to "기타 / 직접 응답하지 않음",
                            "prefer_not_to_say" to "답변하지 않음",
                        ),
                        identity.sexContext,
                    ) {
                        identity = identity.copy(sexContext = it)
                    }
                }
                Section("흡연 여부") {
                    Choices(
                        linkedMapOf(
                            "never" to "비흡연",
                            "former" to "과거 흡연",
                            "current" to "현재 흡연",
                            "prefer_not_to_say" to "답변하지 않음",
                        ),
                        identity.smokingStatus,
                    ) {
                        identity = identity.copy(smokingStatus = it)
                    }
                }
                Section("식이 제한") {
                    linkedMapOf(
                            "vegetarian-forward" to "채식 위주",
                            "vegan" to "비건",
                            "pescatarian" to "페스코",
                            "no-pork" to "돼지고기 제외",
                            "no-beef" to "소고기 제외",
                            "gluten-conscious" to "글루텐 프리 지향",
                            "halal-oriented" to "할랄 지향",
                        )
                        .forEach { (id, label) ->
                            Row(
                                Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Checkbox(
                                    id in identity.dietaryRestrictions,
                                    {
                                        identity =
                                            identity.copy(
                                                dietaryRestrictions =
                                                    if (id in identity.dietaryRestrictions)
                                                        identity.dietaryRestrictions - id
                                                    else identity.dietaryRestrictions + id
                                            )
                                    },
                                )
                                Text(label)
                            }
                        }
                }
            }
            PrimaryButton(
                "저장",
                contextOnly || identity.name.isNotBlank() && identity.nickname.isNotBlank(),
            ) {
                vm.task {
                    val date =
                        if (birth.isBlank()) null
                        else
                            runCatching {
                                LocalDate.parse(birth).also {
                                    require(!it.isAfter(LocalDate.now()))
                                }
                            }
                                .getOrElse { error("생년월일을 YYYY-MM-DD 형식으로 확인해 주세요.") }
                                .toString()
                    val next =
                        identity.copy(
                            name = identity.name.trim(),
                            nickname = identity.nickname.trim(),
                            birthDate = date,
                        )
                    if (!contextOnly && vm.backend.sessionState.value != null)
                        vm.backend.updateIdentity(next)
                    vm.repo.update { it.copy(identity = next) }
                    vm.back()
                }
            }
        }
    }
}

@Composable
fun PreferencesScreen(vm: AppViewModel, isOnboarding: Boolean = false) {
    val state by vm.state.collectAsState()
    val busy by vm.busy.collectAsState()
    val questions = vm.catalogs.preferenceQuestions
    val source = remember(state.preferenceSubmissions) { PreferenceIntakeEvidence.build(state.preferenceSubmissions, questions) }
    var answers by remember { mutableStateOf<Map<String, List<String>>>(state.preferenceIntakeDraft ?: source.records.takeIf { it.isNotEmpty() }
        ?.associate { it.response.questionID to it.response.selectedOptions.map { option -> option.id } }
        ?: (if (state.preferenceSubmissions.isEmpty()) state.preferenceProfile else emptyMap())) }
    var index by rememberSaveable { mutableIntStateOf(0) }
    val question = questions.getOrNull(index) ?: return
    val selected = answers[question.id].orEmpty()
    val last = index == questions.lastIndex
    val answered = PreferenceIntakeEvidence.isAnswered(question, selected)
    Screen("식사 선호", {
        if (index > 0) index--
        else if (isOnboarding) vm.update { it.copy(onboardingComplete = false) } else vm.back()
    }) { padding ->
        Page(Modifier.padding(padding)) {
            Text("${index + 1} / ${questions.size}", color = TB.hint)
            Text(question.title, style = MaterialTheme.typography.titleLarge)
            Text(question.description, color = TB.body)
            question.options.forEach { option ->
                Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).testTag("preference-${option.id}").toggleable(
                    value = option.id in selected, role = if (question.selectionMode == "single") Role.RadioButton else Role.Checkbox,
                    onValueChange = {
                        val next = PreferenceIntakeEvidence.nextSelection(question, selected, option.id)
                        answers = answers + (question.id to next)
                        val draft = answers
                        vm.update { it.copy(preferenceIntakeDraft = draft) }
                    }), verticalAlignment = Alignment.CenterVertically) {
                    if (question.selectionMode == "single") RadioButton(option.id in selected, onClick = null)
                    else Checkbox(option.id in selected, onCheckedChange = null)
                    Column(Modifier.weight(1f)) {
                        Text(option.label)
                        Text(option.description, color = TB.body, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
            question.maxSelections?.let { Text("${selected.size}/${it} 선택", color = TB.hint) }
            Text("나의 입맛 화면에서 다시 바꿀 수 있어요", color = TB.hint)
            PrimaryButton(if (last) "선호 저장" else "다음 질문", enabled = answered && !busy) {
                if (!last) index++ else vm.task {
                    check(questions.all { PreferenceIntakeEvidence.isAnswered(it, answers[it.id].orEmpty()) }) { "답하지 않은 질문을 다시 확인해 주세요." }
                    val submission = PreferenceIntakeEvidence.create(questions, answers)
                    vm.repo.update { it.copy(preferenceProfile = answers, preferenceIntakeDraft = null, preferenceSubmissions = it.preferenceSubmissions + submission) }
                    if (!isOnboarding) vm.back()
                }
            }
        }
    }
}

@Composable
fun PersonScreen(vm: AppViewModel) {
    val person by vm.selectedPerson.collectAsState()
    val state by vm.state.collectAsState()
    val profile = person ?: return
    Screen(profile.title, vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            CardBox {
                Bloom(null, Modifier.size(96.dp))
                Text(profile.title, style = MaterialTheme.typography.titleLarge)
                Text(profile.handle, color = TB.hint)
                OutlinedButton({
                    vm.update {
                        it.copy(
                            followedProfileIDs =
                                if (profile.id in it.followedProfileIDs)
                                    it.followedProfileIDs - profile.id
                                else it.followedProfileIDs + profile.id
                        )
                    }
                }) {
                    Text(if (profile.id in state.followedProfileIDs) "팔로잉" else "팔로우")
                }
                Text(
                    "팔로우 선택은 현재 기기에 저장돼요.",
                    color = TB.hint,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Section("활동 요약") { EmptyCard("활동 통계 미제공", "이 프로필에서 공개한 기록 통계가 없습니다.") }
        }
    }
}

@Composable
fun ConnectionsScreen(vm: AppViewModel, following: Boolean) {
    Screen(if (following) "팔로잉" else "팔로워", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            EmptyCard(
                "${if (following) "팔로잉" else "팔로워"} 목록을 아직 불러올 수 없어요",
                "관계 데이터가 연결되면 여기에 표시됩니다.",
                "버디 찾기",
            ) {
                vm.open("peopleSearch")
            }
        }
    }
}

@Composable
fun CommentsScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val id by vm.feedID.collectAsState()
    var text by rememberSaveable(id) { mutableStateOf("") }
    val comments = vm.catalogs.seededComments[id].orEmpty() + state.comments[id].orEmpty()
    Screen("댓글", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            if (comments.isEmpty()) EmptyCard("아직 댓글이 없어요", "이 디시에 남긴 감상을 짧게 이어갈 수 있어요.")
            comments.forEach { comment ->
                CardBox {
                    Text(comment.author, fontWeight = FontWeight.SemiBold)
                    Text(comment.body)
                    if (comment.own)
                        TextButton({
                            vm.update {
                                it.copy(
                                    comments =
                                        it.comments +
                                            (id to
                                                it.comments[id].orEmpty().filterNot { row ->
                                                    row.id == comment.id
                                                })
                                )
                            }
                        }) {
                            Text("삭제")
                        }
                }
            }
            Field(text, "감상을 남겨주세요", singleLine = false, onChange = { text = it })
            PrimaryButton("댓글 남기기", text.isNotBlank()) {
                val body = text.trim()
                vm.update {
                    it.copy(
                        comments =
                            it.comments +
                                (id to
                                    (it.comments[id].orEmpty() +
                                        DishComment(author = it.identity.displayName, body = body)))
                    )
                }
                text = ""
            }
            Text("댓글은 현재 기기에 저장돼요.", color = TB.hint, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun HistoryScreen(vm: AppViewModel) {
    val snapshot by vm.analysis.collectAsState()
    Screen("현재 기록의 범위", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            Text("명시된 음식·부위·시점 범위 안에서만 비교해요.", color = TB.body)
            val insights =
                snapshot.insights.filter {
                    it.kind in listOf("context_difference", "temporal_change", "contrast")
                }
            if (insights.isEmpty()) EmptyCard("아직 비교할 기록이 없어요", "장기 변화는 비교 기록이 더 필요해요.")
            insights.forEach { insight ->
                CardBox {
                    Text(insight.title, style = MaterialTheme.typography.titleMedium)
                    Text(insight.body)
                    TextButton({
                        vm.evidenceIDs.value = insight.evidenceIDs
                        vm.open("evidence")
                    }) {
                        Text("근거 보기")
                    }
                }
            }
            CardBox {
                Text("현재 비교 범위", fontWeight = FontWeight.SemiBold)
                Text("근거 기록 ${snapshot.sourceExperienceCount}개 · 비교 인사이트 ${insights.size}개")
                Text("장기 변화는 비교 기록이 더 필요해요.", color = TB.body)
            }
        }
    }
}

@Composable
fun ChatGPTScreen(vm: AppViewModel) {
    val snapshot by vm.analysis.collectAsState()
    val session by vm.backend.sessionState.collectAsState()
    val context = LocalContext.current
    var consent by remember { mutableStateOf(false) }
    val export = remember(snapshot) { BackendClient.analysisExport(snapshot) }
    Screen("ChatGPT로 분석 이어가기", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            Text("최근 감각 기록으로 더 깊게 대화해요", style = MaterialTheme.typography.titleLarge)
            Text(
                "최근 최대 20개 기록의 메뉴 이름, 감각 평가와 원문 근거를 연결된 분석 자료에 저장해요. 사진은 포함하지 않아요.",
                color = TB.body,
            )
            CardBox {
                Text(
                    "포함할 기록 ${export["includedExperienceCount"]}개",
                    fontWeight = FontWeight.SemiBold,
                )
                TextButton({
                    vm.evidenceIDs.value = null
                    vm.open("evidence")
                }) {
                    Text("전달할 기록 근거 확인")
                }
            }
            if (session == null || session!!.user.isAnonymous)
                PrimaryButton("이메일 계정 연결") { vm.open("linkEmail") }
            else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(consent, { consent = it })
                    Text("위 자료를 연결된 분석에 전달할게요")
                }
                PrimaryButton(
                    "자료 연결하고 ChatGPT 열기",
                    consent && vm.backend.config.validChatGPTURL() != null,
                ) {
                    val id = session!!.user.id
                    vm.task {
                        val url = vm.backend.publishAnalysis(snapshot, id)
                        openURL(context, url, vm)
                    }
                }
                TextButton({
                    val id = session!!.user.id
                    vm.task {
                        vm.backend.removeAnalysisExport(id)
                        vm.message.value = "연결된 분석 자료를 삭제했어요."
                    }
                }) {
                    Text("연결된 분석 자료 삭제")
                }
            }
            if (vm.backend.config.validChatGPTURL() == null)
                Text("ChatGPT 연결을 준비 중이에요.", color = TB.hint)
            Text("이후 기록 수정·삭제는 자료를 다시 연결해야 반영돼요.", color = TB.hint)
        }
    }
}
