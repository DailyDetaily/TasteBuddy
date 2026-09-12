package com.tastebuddy.android.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.tastebuddy.android.data.ShareCardStore
import java.io.File

@Composable
fun RecordScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val id by vm.selectedEntryID.collectAsState()
    val entry = state.entries.firstOrNull { it.id == id }
    var delete by remember { mutableStateOf(false) }
    Screen(
        entry?.title ?: "기록",
        vm::back,
        actions = {
            if (entry != null)
                IconButton({ vm.open("share") }) { Icon(Icons.Outlined.Share, "기록 카드 공유") }
        },
    ) { padding ->
        Page(Modifier.padding(padding)) {
            if (entry == null) EmptyCard("기록을 찾지 못했어요", "삭제되었거나 더 이상 사용할 수 없는 기록이에요.")
            else {
                EntryCard(vm, entry)
                if (!entry.hasCompletedTasteFeedback)
                    EmptyCard("맛 피드백을 이어서 남겨보세요", "사진만 저장한 기록은 입맛 분석에 쓰지 않아요.", "맛 피드백 남기기") {
                        vm.editEntry(entry)
                    }
                entry.overallEvaluation?.let {
                    CardBox {
                        Text(it.questionLabelSnapshot, fontWeight = FontWeight.SemiBold)
                        Text(it.responseLabelSnapshot)
                    }
                }
                if (!entry.sensorySelections.isNullOrEmpty())
                    Section("남긴 감각") {
                        entry.sensorySelections.forEach { choice ->
                            CardBox {
                                Text(
                                    choice.labelSnapshot,
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(
                                    listOfNotNull(
                                            choice.liking?.let {
                                                com.tastebuddy.android.domain.SelectionLabels
                                                    .liking[it]
                                            },
                                            choice.intensity?.let {
                                                com.tastebuddy.android.domain.SelectionLabels
                                                    .intensity[it]
                                            },
                                            choice.preferenceFit?.let {
                                                com.tastebuddy.android.domain.SelectionLabels.fit[
                                                        it]
                                            },
                                        )
                                        .joinToString(" · ")
                                )
                                Text(
                                    "${com.tastebuddy.android.domain.SelectionLabels.targets[choice.target]} · ${com.tastebuddy.android.domain.SelectionLabels.phases[choice.phase]}",
                                    color = TB.body,
                                )
                            }
                        }
                    }
                Row {
                    TextButton({ vm.editEntry(entry) }) { Text("수정") }
                    TextButton({ vm.additionalMenu(entry) }) { Text("같은 식사에 메뉴 추가") }
                    TextButton({ delete = true }) { Text("삭제") }
                }
            }
        }
    }
    if (delete && entry != null)
        AlertDialog(
            onDismissRequest = { delete = false },
            title = { Text("이 기록을 삭제할까요?") },
            text = { Text("기록을 삭제하면 입맛 해석에서도 해당 근거가 제외돼요.") },
            confirmButton = {
                TextButton({
                    delete = false
                    vm.deleteEntry(entry)
                }) {
                    Text("삭제")
                }
            },
            dismissButton = { TextButton({ delete = false }) { Text("취소") } },
        )
}

@Composable
fun ShareScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val id by vm.selectedEntryID.collectAsState()
    val entry = state.entries.firstOrNull { it.id == id } ?: state.draft?.entry
    val context = LocalContext.current
    val store = remember { ShareCardStore(context, vm.photos) }
    var file by remember { mutableStateOf<File?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(entry, state.identity) {
        if (entry != null)
            try {
                file = store.render(entry, state.identity)
            } catch (_: Exception) {
                error = "기록 카드를 만들지 못했어요. 다시 시도해 주세요."
            }
    }
    fun save() {
        file?.let { value ->
            vm.task {
                store.save(value)
                vm.message.value = "기록 카드를 사진 보관함에 저장했어요."
            }
        }
    }
    val permission =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            if (it) save() else vm.message.value = "사진 저장 권한이 필요해요. 공유 메뉴로 내보낼 수도 있어요."
        }
    Screen("기록 카드 공유", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            file?.let { AsyncImage(it, "공유할 기록 카드 미리보기", Modifier.fillMaxWidth().aspectRatio(1f)) }
                ?: if (error == null) LinearProgressIndicator(Modifier.fillMaxWidth())
                else Text(error!!)
            PrimaryButton("공유하기", file != null) {
                file?.let {
                    runCatching { store.share(it) }
                        .onFailure { vm.message.value = "공유할 앱을 열지 못했어요." }
                }
            }
            OutlinedButton(
                {
                    if (
                        Build.VERSION.SDK_INT <= 28 &&
                            ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                            ) != PackageManager.PERMISSION_GRANTED
                    )
                        permission.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    else save()
                },
                Modifier.fillMaxWidth(),
                enabled = file != null,
            ) {
                Text("사진 보관함에 저장")
            }
            TextButton(
                {
                    file?.let {
                        runCatching { store.share(it, instagram = true) }
                            .onFailure {
                                vm.message.value = "Instagram을 열지 못했어요. 공유하기에서 다른 앱을 선택할 수 있어요."
                            }
                    }
                },
                enabled = file != null,
            ) {
                Text("Instagram으로 공유")
            }
        }
    }
}
