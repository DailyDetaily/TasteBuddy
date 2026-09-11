package com.tastebuddy.android.ui

import androidx.compose.foundation.background

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tastebuddy.android.data.PublicProfile
import com.tastebuddy.android.domain.*

@Composable
fun HomeContent(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val snapshot by vm.analysis.collectAsState()
    val updating by vm.analysisUpdating.collectAsState()
    val analysisError by vm.analysisError.collectAsState()
    Page {
        CardBox(Modifier.clickable { vm.open("search") }, TB.muted) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("레스토랑, 메뉴, 셰프, 버디 검색", Modifier.weight(1f), color = TB.hint)
                Icon(Icons.Outlined.Search, "검색")
            }
        }
        Section("나의 입맛") {
            if (updating) EmptyCard("입맛 해석을 정리하고 있어요", "완료한 경험의 감각과 직접 평가를 모으고 있어요.")
            else if (analysisError != null) EmptyCard("분석을 불러오지 못했어요", analysisError!!)
            else if (snapshot.completedExperienceCount == 0) {
                val survey = state.profile?.surveySubmission
                EmptyCard(
                    if (survey != null) "처음 남긴 맛의 단서" else "아직 해석할 식사 기록이 없어요",
                    survey?.summary ?: "아래 가운데 기록 버튼에서 식사 피드백을 완료하면 감각의 세부 표현과 상황을 함께 모아 보여드려요.",
                    if (survey != null) "응답 보기" else null,
                ) { vm.main("analysis") }
            }
            else {
                AnalysisHero(snapshot) { vm.main("analysis") }
                CandidateCards(vm, snapshot, limit = 2)
                NextQuestion(vm, snapshot)
            }
        }
        Section("최근 기록") {
            if (state.entries.isEmpty())
                EmptyCard(
                    "기억하고 싶은 한 끼를 남겨보세요",
                    "사진과 메뉴를 먼저 저장하고, 느낀 맛은 편할 때 이어서 남길 수 있어요.",
                    "첫 기록 남기기",
                ) {
                    vm.startDining()
                }
            else
                CardBox(Modifier.clickable { vm.main("dining") }) {
                    Text(
                        "${state.entries.size}개의 미식 기록",
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        "맛 피드백 완료 ${state.entries.count { it.hasCompletedTasteFeedback }}개 · 최근 메뉴 ${state.entries.first().menu}",
                        color = TB.body,
                    )
                }
        }
    }
}

@Composable
fun AnalysisHero(snapshot: SensorySnapshot, onClick: (() -> Unit)? = null) {
    CardBox(
        if (onClick == null) Modifier else Modifier.clickable(onClick = onClick),
        color = TB.muted,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Icon(
                Icons.Outlined.AutoAwesome,
                null,
                Modifier.size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color.White)
                    .padding(8.dp),
            )
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("현재 해석", style = MaterialTheme.typography.bodyMedium, color = TB.hint)
                Text(snapshot.mainWing.label, style = MaterialTheme.typography.titleLarge)
            }
        }
        Text(
            when (snapshot.mainWing.status) {
                "provisional_profile" -> "반복해서 나타난 직접 평가와 감각 기록을 바탕으로 한 현재 범위의 해석이에요."
                "ambiguous_main" -> "서로 다른 상황의 기록이 함께 있어 한 가지 입맛으로 정하지 않고 있어요."
                else -> "기록한 감각과 직접 평가를 쌓으며 좋아하는 조합과 부담스러운 조건을 확인하고 있어요."
            },
            color = TB.body,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                "완료 기록 ${snapshot.completedExperienceCount}개",
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(
                "근거 기록 ${snapshot.sourceExperienceCount}개",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
fun AnalysisContent(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val snapshot by vm.analysis.collectAsState()
    val updating by vm.analysisUpdating.collectAsState()
    val analysisError by vm.analysisError.collectAsState()
    Page {
        Section("나의 입맛") {
            if (updating) EmptyCard("입맛 해석을 정리하고 있어요", "완료한 경험의 감각과 직접 평가를 모으고 있어요.")
            else if (analysisError != null) EmptyCard("분석을 불러오지 못했어요", analysisError!!)
            else if (snapshot.completedExperienceCount == 0)
                EmptyCard(
                    "아직 해석할 식사 기록이 없어요",
                    "식사 피드백을 완료하면 감각의 세부 표현과 상황을 함께 모아 보여드려요.",
                    "기록 시작하기",
                ) {
                    vm.startDining()
                }
            else {
                AnalysisHero(snapshot)
                CardBox {
                    NavigationRow(
                        "기록 근거",
                        "감각 관찰 ${snapshot.observations.size}개 · 확인 중인 표현 ${snapshot.unresolved.size}개",
                    ) {
                        vm.evidenceIDs.value = null
                        vm.open("evidence")
                    }
                }
                if (snapshot.unresolved.isNotEmpty())
                    EmptyCard(
                        "아직 뜻을 확인 중인 표현이 있어요",
                        "원문은 보존하고, 의미가 분명해지기 전에는 입맛 사실로 확정하지 않아요.",
                        "표현 보기",
                    ) {
                        vm.evidenceIDs.value = null
                        vm.open("evidence")
                    }
            }
        }
        TastePerceptionCards(vm)
        Section("내가 알려준 선호") {
            PreferenceIntakeEvidenceCard(snapshot.statedPreferences, state.preferenceProfile.isNotEmpty()) { vm.open("preferences") }
        }
        state.profile?.surveySubmission?.let { submission ->
            Section("처음 남긴 맛의 단서") { SurveyEvidenceCard(submission) }
        }
        if (snapshot.completedExperienceCount > 0) {
            Section("인사이트") {
                CandidateCards(vm, snapshot)
                if (snapshot.personalModel?.candidates.isNullOrEmpty()) {
                    if (snapshot.insights.isEmpty())
                        EmptyCard(
                            "다음 단서를 모으고 있어요",
                            "같은 감각의 직접 평가나 다른 상황의 기록이 쌓이면 비교할 수 있는 해석을 보여드려요.",
                        )
                    else
                        snapshot.insights.forEach { insight ->
                            CardBox {
                                Text(insight.title, style = MaterialTheme.typography.titleMedium)
                                Text(insight.body, color = TB.body)
                                TextButton({
                                    vm.evidenceIDs.value = insight.evidenceIDs
                                    vm.open("evidence")
                                }) {
                                    Text("근거 보기")
                                }
                            }
                        }
                }
            }
            NextQuestion(vm, snapshot)
            Section("현재 기록의 범위") {
                CardBox {
                    NavigationRow("상황에 따라 달랐던 기록", "명시된 음식·부위·시점 범위 안에서만 비교해요.") {
                        vm.open("history")
                    }
                }
            }
            if (vm.backend.config.validChatGPTURL() != null)
                CardBox {
                    NavigationRow("ChatGPT로 분석 이어가기", "전달할 자료를 먼저 확인할 수 있어요.") {
                        vm.open("chatgpt")
                    }
                }
        }
    }
}

@Composable
private fun CandidateCards(
    vm: AppViewModel,
    snapshot: SensorySnapshot,
    limit: Int = Int.MAX_VALUE,
) {
    PersonalPresentation.groups(snapshot.personalModel?.candidates.orEmpty()) { condition ->
            if (condition.dimension == "dishKind") vm.catalogs.label(condition.value)
            else PersonalTasteModel.conditionLabel(condition)
        }
        .take(limit)
        .forEach { group ->
            CardBox {
                Text(group.eyebrow, style = MaterialTheme.typography.bodyMedium, color = TB.hint)
                Text(group.title, style = MaterialTheme.typography.titleMedium)
                Text(group.body, color = TB.body)
                TextButton({
                    vm.evidenceIDs.value = group.evidenceIDs
                    vm.open("evidence")
                }) {
                    Text("근거 보기")
                }
            }
        }
}

@Composable
private fun NextQuestion(vm: AppViewModel, snapshot: SensorySnapshot) {
    snapshot.personalModel?.nextSelection?.let { question ->
        LaunchedEffect(question.id) { vm.exposeQuestion(question) }
        Section("다음 선택") {
            CardBox {
                Text(question.question, style = MaterialTheme.typography.titleMedium)
                Text(question.reason, color = TB.body)
                PrimaryButton(
                    if (question.intent == "clarification") "기록 이어서 남기기" else "새 식사에서 확인하기"
                ) {
                    vm.question(question)
                }
                Row {
                    TextButton({
                        vm.evidenceIDs.value = question.evidenceIDs
                        vm.open("evidence")
                    }) {
                        Text("근거 보기")
                    }
                    TextButton({ vm.dismissQuestion(question) }) { Text("지금은 넘기기") }
                }
            }
        }
    }
}

@Composable
fun EvidenceScreen(vm: AppViewModel) {
    val snapshot by vm.analysis.collectAsState()
    val ids by vm.evidenceIDs.collectAsState()
    val state by vm.state.collectAsState()
    Screen("기록 근거", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            Text("원문과 직접 선택한 평가를 함께 보여드려요.", color = TB.body)
            val observations =
                snapshot.observations.filter { ids == null || it.id in ids.orEmpty() }
            observations
                .groupBy { it.experienceID }
                .forEach { (id, rows) ->
                    CardBox {
                        Text(rows.first().foodName, style = MaterialTheme.typography.titleMedium)
                        rows.forEach { row ->
                            Text(row.evidenceText, fontWeight = FontWeight.Medium)
                            Text(
                                listOf(
                                        row.attributeLabel,
                                        SelectionLabels.targets[row.target],
                                        SelectionLabels.phases[row.phase],
                                    )
                                    .filterNotNull()
                                    .joinToString(" · "),
                                color = TB.body,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                        state.entries
                            .firstOrNull { it.id == id }
                            ?.let { entry -> TextButton({ vm.entry(entry) }) { Text("원래 기록 보기") } }
                    }
                }
            if (ids == null && snapshot.unresolved.isNotEmpty())
                Section("뜻을 확인 중인 표현") {
                    snapshot.unresolved.forEach { row ->
                        CardBox {
                            Text(row.foodName, fontWeight = FontWeight.SemiBold)
                            Text("“${row.phrase}”")
                            Text("아직 감각이나 호감으로 확정하지 않았어요.", color = TB.body)
                        }
                    }
                }
            if (observations.isEmpty() && (ids != null || snapshot.unresolved.isEmpty()))
                EmptyCard("아직 연결된 근거가 없어요", "다음 기록에서 직접 평가를 남겨보세요.")
            snapshot.limits.forEach {
                Text(it, style = MaterialTheme.typography.bodyMedium, color = TB.hint)
            }
        }
    }
}

@Composable
fun DiningContent(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    var following by rememberSaveable { mutableStateOf(false) }
    var query by rememberSaveable { mutableStateOf("") }
    Page {
        Row {
            FilterChip(!following, { following = false }, label = { Text("나의 기록") })
            Spacer(Modifier.width(8.dp))
            FilterChip(following, { following = true }, label = { Text("팔로잉") })
        }
        if (following) {
            Text("둘러보기용 예시 기록", color = TB.hint)
            vm.catalogs.following.forEach { item ->
                CardBox {
                    NavigationRow(item.authorName, item.restaurantName) {
                        vm.selectedPerson.value = PublicProfile(item.id, item.authorName)
                        vm.open("person")
                    }
                    Text(item.dishTitle, style = MaterialTheme.typography.titleMedium)
                    Row {
                        IconButton({
                            vm.update {
                                it.copy(
                                    likedFeedIDs =
                                        if (item.id in it.likedFeedIDs) it.likedFeedIDs - item.id
                                        else it.likedFeedIDs + item.id
                                )
                            }
                        }) {
                            Icon(
                                Icons.Outlined.FavoriteBorder,
                                "좋아요",
                                tint =
                                    if (item.id in state.likedFeedIDs) Color(0xFFC36069)
                                    else TB.body,
                            )
                        }
                        TextButton({
                            vm.feedID.value = item.id
                            vm.open("comments")
                        }) {
                            Text("댓글 ${item.commentCount + state.comments[item.id].orEmpty().size}")
                        }
                    }
                }
            }
        } else {
            Field(query, "기록 검색", onChange = { query = it })
            state.draft
                ?.takeIf { it.stage != "result" }
                ?.let {
                    CardBox {
                        NavigationRow("작성 중인 기록", it.entry.title.ifBlank { "식사 기록을 이어서 남겨보세요" }) {
                            vm.open("diningFlow")
                        }
                    }
                }
            val entries =
                state.entries.filter {
                    query.isBlank() ||
                        "${it.menu} ${it.restaurant} ${it.note}".contains(query, true)
                }
            if (entries.isEmpty())
                EmptyCard(
                    if (query.isBlank()) "아직 기록이 없어요" else "검색 결과가 없어요",
                    "기억하고 싶은 맛을 사진과 함께 남겨보세요.",
                    "기록하기",
                ) {
                    vm.startDining()
                }
            entries.forEach { EntryCard(vm, it) }
        }
    }
}

@Composable
fun EntryCard(vm: AppViewModel, entry: DiningEntry) {
    CardBox(Modifier.clickable { vm.entry(entry) }) {
        vm.photos.file(entry.reflectionPhotoFilename)?.let {
            AsyncImage(
                it,
                entry.menu,
                Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(14.dp)),
                contentScale = ContentScale.Crop,
            )
        }
        Text(entry.title, style = MaterialTheme.typography.titleMedium)
        Text(entry.restaurant.ifBlank { "직접 남긴 식사" }, color = TB.body)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(entry.date.take(10), color = TB.hint, style = MaterialTheme.typography.bodyMedium)
            Text(
                if (entry.hasCompletedTasteFeedback) "맛 피드백 완료" else "사진·메뉴 저장",
                color = TB.body,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (entry.note.isNotBlank()) Text(entry.note, maxLines = 3, color = TB.body)
    }
}
