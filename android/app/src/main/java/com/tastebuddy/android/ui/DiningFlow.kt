package com.tastebuddy.android.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.tastebuddy.android.domain.*
import kotlin.math.*
import kotlinx.coroutines.delay

@Composable
fun DiningFlow(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val draft = state.draft
    if (draft == null) {
        LaunchedEffect(Unit) { vm.back() }
        return
    }
    val entry = draft.entry
    var exitDialog by remember { mutableStateOf(false) }
    val goBack = {
        when (draft.stage) {
            "result" -> vm.main("dining")
            "restaurant" -> vm.draftStage("camera")
            "menu" ->
                if (draft.editing) {
                    exitDialog = true
                } else vm.draftStage("restaurant")
            "feedback" ->
                if (draft.editing) {
                    exitDialog = true
                } else vm.draftStage("menu")
            "details" -> vm.draftStage("feedback")
            "note" -> vm.draftStage("details")
            else -> {
                exitDialog = true
            }
        }
    }
    BackHandler(onBack = goBack)
    val pick =
        rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) {
            it?.let { uri -> vm.importPhoto(uri) }
        }
    val titles =
        mapOf(
            "camera" to "식사 기록",
            "restaurant" to "어디서 드셨나요?",
            "menu" to "메뉴 선택",
            "feedback" to "느낀 맛 기록",
            "details" to "감각의 세부 표현",
            "note" to "기록 마무리",
            "result" to if (entry.hasCompletedTasteFeedback) "맛 기록 완료" else "기록 저장 완료",
        )
    Screen(
        titles[draft.stage] ?: "식사 기록",
        goBack,
        actions = {
            if (draft.stage != "result")
                IconButton({ exitDialog = true }) { Icon(Icons.Outlined.Close, "기록 닫기") }
            if (draft.stage !in listOf("camera", "result"))
                IconButton({
                    pick.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                }) {
                    Icon(Icons.Outlined.PhotoLibrary, "사진 변경")
                }
        },
    ) { padding ->
        if (draft.stage == "camera")
            CameraCapture(
                vm,
                Modifier.padding(padding),
                {
                    pick.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                },
            )
        else
            Page(Modifier.padding(padding)) {
                when (draft.stage) {
                    "restaurant" -> RestaurantSelection(vm, entry)
                    "menu" -> MenuSelection(vm, entry)
                    "feedback" -> {
                        Text(entry.title, style = MaterialTheme.typography.titleLarge)
                        Section(OverallEvaluation.QUESTION) {
                            Choices(
                                OverallEvaluation.labels,
                                entry.overallEvaluation?.responseValue,
                            ) { value ->
                                vm.changeDraft {
                                    it.copy(
                                        entry =
                                            it.entry.copy(
                                                overallEvaluation = OverallEvaluation(value),
                                                rating =
                                                    mapOf(
                                                        "veryLiked" to 5,
                                                        "liked" to 4,
                                                        "neutral" to 3,
                                                        "disliked" to 2,
                                                        "veryDisliked" to 1,
                                                    )[value] ?: 0,
                                            )
                                    )
                                }
                            }
                        }
                        Text("기억에 남은 맛을 골라주세요", style = MaterialTheme.typography.titleMedium)
                        Text("맛의 강도와 좋았는지는 따로 남길 수 있어요.", color = TB.body)
                        BubbleSelection(vm, entry)
                        PrimaryButton("세부 표현 남기기") { vm.draftStage("details") }
                        TextButton({ vm.draftStage("note") }) { Text("지금 선택으로 이어가기") }
                    }
                    "details" -> {
                        DetailSelections(vm, entry)
                        PrimaryButton("메모와 사진으로 마무리") { vm.draftStage("note") }
                    }
                    "note" -> {
                        vm.photos.file(entry.reflectionPhotoFilename)?.let {
                            AsyncImage(
                                it,
                                "선택한 식사 사진",
                                Modifier.fillMaxWidth()
                                    .aspectRatio(1f)
                                    .clip(RoundedCornerShape(20.dp)),
                                contentScale = ContentScale.Crop,
                            )
                        }
                        Field(
                            entry.menu,
                            "메뉴 이름",
                            onChange = { value ->
                                vm.changeDraft {
                                    it.copy(entry = it.entry.copy(menu = value, menuItemID = null))
                                }
                            },
                        )
                        Field(
                            entry.note,
                            "기억하고 싶은 맛과 순간",
                            singleLine = false,
                            onChange = { value ->
                                vm.changeDraft { it.copy(entry = it.entry.copy(note = value)) }
                            },
                        )
                        Text(
                            "예: 첫입에는 국물의 감칠맛이 좋았고, 뒤로 갈수록 짠맛이 강하게 느껴졌어요.",
                            color = TB.hint,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        PrimaryButton("맛 기록 저장", entry.menu.isNotBlank()) { vm.saveEntry(true) }
                    }
                    "result" -> {
                        EntryCard(vm, entry)
                        Text(
                            if (entry.hasCompletedTasteFeedback) "직접 남긴 감각과 평가를 입맛 해석에 반영했어요."
                            else "사진과 메뉴를 저장했어요. 맛 피드백을 완료하면 입맛 해석에 반영돼요.",
                            color = TB.body,
                        )
                        if (!entry.hasCompletedTasteFeedback)
                            PrimaryButton("맛 피드백 이어서 남기기") {
                                vm.draftStage(if (entry.menu.isBlank()) "menu" else "feedback")
                            }
                        Row {
                            TextButton({ vm.open("share") }) { Text("기록 카드 공유") }
                            TextButton({ vm.additionalMenu(entry) }) { Text("같은 식사에 메뉴 추가") }
                        }
                        PrimaryButton("완료") { vm.main("dining") }
                    }
                }
            }
    }
    if (exitDialog)
        AlertDialog(
            onDismissRequest = { exitDialog = false },
            title = { Text("작성 중인 기록을 어떻게 할까요?") },
            text = { Text("이어 쓰기를 선택하면 지금 입력한 내용을 보관해요.") },
            confirmButton = {
                TextButton({
                    exitDialog = false
                    vm.back()
                }) {
                    Text("나중에 이어 쓰기")
                }
            },
            dismissButton = {
                TextButton({
                    exitDialog = false
                    vm.task {
                        vm.repo.update { it.copy(draft = null) }
                        vm.back()
                    }
                }) {
                    Text("작성 취소")
                }
            },
        )
}

@Composable
private fun CameraCapture(vm: AppViewModel, modifier: Modifier, gallery: () -> Unit) {
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current
    var permission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    var cameraError by remember { mutableStateOf<String?>(null) }
    var capture by remember { mutableStateOf<ImageCapture?>(null) }
    var provider by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    var flash by rememberSaveable { mutableStateOf(false) }
    val permissionRequest =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            permission = it
        }
    DisposableEffect(Unit) { onDispose { provider?.unbindAll() } }
    Column(modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        if (permission && cameraError == null)
            AndroidView(
                factory = { ctx ->
                    PreviewView(ctx).also { previewView ->
                        val future = ProcessCameraProvider.getInstance(ctx)
                        future.addListener(
                            {
                                try {
                                    val cameraProvider = future.get()
                                    provider = cameraProvider
                                    val preview =
                                        Preview.Builder().build().also {
                                            it.surfaceProvider = previewView.surfaceProvider
                                        }
                                    val imageCapture =
                                        ImageCapture.Builder()
                                            .setCaptureMode(
                                                ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY
                                            )
                                            .build()
                                    capture = imageCapture
                                    cameraProvider.unbindAll()
                                    cameraProvider.bindToLifecycle(
                                        lifecycle,
                                        CameraSelector.DEFAULT_BACK_CAMERA,
                                        preview,
                                        imageCapture,
                                    )
                                } catch (_: Exception) {
                                    cameraError = "카메라를 열지 못했어요. 사진 보관함에서 선택할 수 있어요."
                                }
                            },
                            ContextCompat.getMainExecutor(ctx),
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().weight(1f),
            )
        else
            Box(
                Modifier.fillMaxWidth().weight(1f).background(TB.ink).padding(24.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Icon(Icons.Outlined.PhotoCamera, null, Modifier.size(56.dp), tint = Color.White)
                    Text(cameraError ?: "한 끼의 순간을 사진으로 남겨보세요", color = Color.White)
                    if (!permission)
                        Button({ permissionRequest.launch(Manifest.permission.CAMERA) }) {
                            Text("카메라 사용하기")
                        }
                }
            }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(gallery) { Icon(Icons.Outlined.PhotoLibrary, "사진 보관함에서 선택") }
            FilledIconButton(
                {
                    val imageCapture = capture ?: return@FilledIconButton
                    val file = vm.photos.captureFile()
                    imageCapture.flashMode =
                        if (flash) ImageCapture.FLASH_MODE_ON else ImageCapture.FLASH_MODE_OFF
                    imageCapture.takePicture(
                        ImageCapture.OutputFileOptions.Builder(file).build(),
                        ContextCompat.getMainExecutor(context),
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                                vm.importPhoto(
                                    FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.files",
                                        file,
                                    )
                                )
                            }

                            override fun onError(exception: ImageCaptureException) {
                                vm.message.value = "사진을 촬영하지 못했어요. 다시 시도해 주세요."
                                file.delete()
                            }
                        },
                    )
                },
                Modifier.size(72.dp),
                enabled = permission && capture != null,
            ) {
                Icon(Icons.Outlined.CameraAlt, "사진 촬영", Modifier.size(32.dp))
            }
            IconButton({ flash = !flash }) {
                Icon(
                    if (flash) Icons.Outlined.FlashOn else Icons.Outlined.FlashOff,
                    if (flash) "플래시 끄기" else "플래시 켜기",
                )
            }
        }
        TextButton({ vm.draftStage("restaurant") }, Modifier.align(Alignment.CenterHorizontally)) {
            Text("사진 없이 맛 기록하기")
        }
    }
}

@Composable
private fun RestaurantSelection(vm: AppViewModel, entry: DiningEntry) {
    var query by rememberSaveable { mutableStateOf(entry.restaurant) }
    var remote by remember { mutableStateOf<List<Restaurant>>(emptyList()) }
    var searching by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val nearby by vm.nearby.collectAsState()
    val context = LocalContext.current
    fun nearbyNow() {
        vm.task {
            val location =
                com.tastebuddy.android.data.CaptureLocation.current(context)
                    ?: error("현재 위치를 확인하지 못했어요. 식당 이름으로 검색할 수 있어요.")
            vm.nearby.value =
                if (vm.qaMode) emptyList()
                else vm.app.places.search("", location.latitude, location.longitude)
            query = ""
            if (vm.nearby.value.isEmpty()) vm.message.value = "주변 식당을 찾지 못했어요. 검색이나 직접 입력을 이용해 주세요."
        }
    }
    val locationPermission =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            granted ->
            if (granted.values.any { it }) nearbyNow()
            else vm.message.value = "위치 권한 없이도 식당을 검색하거나 직접 입력할 수 있어요."
        }
    LaunchedEffect(query) {
        remote = emptyList()
        error = null
        if (query.isNotBlank() && !vm.qaMode) {
            delay(350)
            searching = true
            try {
                remote = vm.app.places.search(query)
            } catch (e: java.io.IOException) {
                error = "식당 검색을 불러오지 못했어요. 직접 입력할 수 있어요."
            } finally {
                searching = false
            }
        }
    }
    Field(query, "식당 이름 검색 또는 직접 입력", onChange = { query = it })
    TextButton({
        if (
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            ) == PackageManager.PERMISSION_GRANTED
        )
            nearbyNow()
        else
            locationPermission.launch(
                arrayOf(
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                )
            )
    }) {
        Text("현재 위치 주변 식당 찾기")
    }
    if (searching) LinearProgressIndicator(Modifier.fillMaxWidth())
    error?.let { Text(it, color = TB.body) }
    val candidates =
        (if (query.isBlank()) nearby else remote) +
            vm.catalogs.restaurants.filter { query.isNotBlank() && it.name.contains(query, true) }
    if (query.isBlank() && nearby.isNotEmpty()) Text("위치 주변 식당", color = TB.hint)
    candidates
        .distinctBy { it.id }
        .forEach { restaurant ->
            CardBox {
                NavigationRow(
                    restaurant.name,
                    restaurant.address.ifBlank { restaurant.locationLabel },
                ) {
                    vm.changeDraft {
                        it.copy(
                            entry =
                                it.entry.copy(
                                    restaurant = restaurant.name,
                                    restaurantID = restaurant.id,
                                ),
                            stage = "menu",
                        )
                    }
                }
            }
        }
    PrimaryButton("이 이름으로 기록하기", query.isNotBlank()) {
        vm.changeDraft {
            it.copy(
                entry = it.entry.copy(restaurant = query.trim(), restaurantID = null),
                stage = "menu",
            )
        }
    }
}

@Composable
private fun MenuSelection(vm: AppViewModel, entry: DiningEntry) {
    val state by vm.state.collectAsState()
    var menu by rememberSaveable(entry.id) { mutableStateOf(entry.menu) }
    Text(entry.restaurant, style = MaterialTheme.typography.titleLarge)
    Field(menu, "메뉴 이름 직접 입력", onChange = { menu = it })
    val dishes = vm.catalogs.restaurant(entry.restaurantID.orEmpty())?.memorableDishes.orEmpty()
    dishes.forEach { dish ->
        CardBox {
            NavigationRow(dish.title, dish.summary) {
                menu = dish.title
                vm.changeDraft {
                    it.copy(entry = it.entry.copy(menu = dish.title, menuItemID = dish.id))
                }
            }
        }
    }
    state.rememberedMenus[entry.restaurant]
        .orEmpty()
        .filter { remembered -> dishes.none { it.title == remembered } }
        .forEach { remembered -> TextButton({ menu = remembered }) { Text(remembered) } }
    PrimaryButton("맛 피드백 남기기", menu.isNotBlank()) {
        vm.changeDraft {
            it.copy(entry = it.entry.copy(menu = menu.trim()), stage = "feedback", mode = "full")
        }
    }
    if (
        state.draft?.mode == "quickCapture" &&
            entry.reflectionPhotoFilename != null &&
            !entry.hasCompletedTasteFeedback
    )
        TextButton(
            {
                vm.task {
                    vm.repo.update {
                        it.copy(
                            draft =
                                it.draft?.let { d ->
                                    d.copy(entry = d.entry.copy(menu = menu.trim()))
                                }
                        )
                    }
                    vm.saveEntryFromCurrent(false)
                }
            },
            Modifier.fillMaxWidth(),
        ) {
            Text("맛 평가는 나중에 · 사진과 메뉴 저장")
        }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun BubbleSelection(vm: AppViewModel, entry: DiningEntry) {
    var axis by rememberSaveable { mutableStateOf(TasteAxis.sweet) }
    var selected by remember { mutableStateOf<SensorySelection?>(null) }
    var mapMode by rememberSaveable { mutableStateOf(true) }
    Row(
        Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        TasteAxis.entries.forEach { taste ->
            FilterChip(
                axis == taste,
                { axis = taste },
                label = { Text(taste.label) },
                colors =
                    FilterChipDefaults.filterChipColors(selectedContainerColor = Color(taste.tint)),
            )
        }
    }
    TextButton({ mapMode = !mapMode }) { Text(if (mapMode) "목록으로 선택" else "맛 지도로 선택") }
    val bubbles = vm.catalogs.bubbles.filter { it.axis == axis }
    fun choose(bubble: Bubble) {
        val existing =
            entry.sensorySelections.orEmpty().firstOrNull {
                it.id == bubble.id && it.type == "bubble"
            }
        if (
            existing == null && entry.sensorySelections.orEmpty().count { it.type == "bubble" } >= 3
        )
            vm.message.value = "기억에 남은 맛은 최대 3개까지 골라주세요."
        else selected = existing ?: vm.catalogs.selection(bubble.id, "bubble")
    }
    if (mapMode) {
        var scale by remember { mutableFloatStateOf(TasteMapLayout.entryZoom) }
        var pan by remember { mutableStateOf(Offset.Zero) }
        val density = LocalDensity.current.density
        val base = vm.catalogs.mapPositions
        val selectedIDs =
            entry.sensorySelections.orEmpty().filter { it.type == "bubble" }.map { it.id }.toSet()
        val points = remember(selectedIDs) { TasteMapLayout.render(base, selectedIDs) }
        LaunchedEffect(axis) {
            base
                .firstOrNull { it.bubble.axis == axis }
                ?.let {
                    pan =
                        Offset(
                            ((TasteMapLayout.center - it.x) * scale * density).toFloat(),
                            ((TasteMapLayout.center - it.y) * scale * density).toFloat(),
                        )
                }
        }
        Layout(
            content = {
                points.forEach { point ->
                    val bubble = point.bubble
                    val picked = bubble.id in selectedIDs
                    Box(
                        Modifier.clip(CircleShape)
                            .background(Color(if (picked) bubble.axis.main else bubble.axis.tint))
                            .clickable { choose(bubble) }
                            .padding(8.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            bubble.label,
                            color = Color(bubble.axis.text),
                            fontSize = (14 * scale).sp,
                            fontWeight = if (picked) FontWeight.Bold else FontWeight.Medium,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                    }
                }
            },
            modifier =
                Modifier.fillMaxWidth()
                    .height(400.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.White)
                    .clipToBounds()
                    .pointerInput(Unit) {
                        detectTransformGestures { _, drag, zoom, _ ->
                            val next =
                                (scale * zoom).coerceIn(
                                    TasteMapLayout.minZoom,
                                    TasteMapLayout.maxZoom,
                                )
                            pan =
                                (pan * (next / scale) + drag).let {
                                    Offset(
                                        it.x.coerceIn(-900f * density, 900f * density),
                                        it.y.coerceIn(-900f * density, 900f * density),
                                    )
                                }
                            scale = next
                        }
                    },
        ) { measurables, constraints ->
            val placeables = measurables.mapIndexed { index, measurable ->
                val size = (points[index].size * scale * density).roundToInt()
                measurable.measure(Constraints.fixed(size, size))
            }
            layout(constraints.maxWidth, constraints.maxHeight) {
                placeables.forEachIndexed { index, placeable ->
                    val point = points[index]
                    placeable.place(
                        (constraints.maxWidth / 2 +
                                (point.x - TasteMapLayout.center) * scale * density +
                                pan.x - placeable.width / 2)
                            .roundToInt(),
                        (constraints.maxHeight / 2 +
                                (point.y - TasteMapLayout.center) * scale * density +
                                pan.y - placeable.height / 2)
                            .roundToInt(),
                    )
                }
            }
        }
        Text(
            "두 손가락으로 확대하거나 움직일 수 있어요.",
            style = MaterialTheme.typography.bodyMedium,
            color = TB.hint,
        )
    } else
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            bubbles.forEach { bubble ->
                FilterChip(
                    entry.sensorySelections.orEmpty().any { it.id == bubble.id },
                    { choose(bubble) },
                    label = { Text(bubble.label) },
                )
            }
        }
    selected?.let { value -> SelectionEditor(vm, value, onDismiss = { selected = null }) }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DetailSelections(vm: AppViewModel, entry: DiningEntry) {
    var selected by remember { mutableStateOf<SensorySelection?>(null) }
    val picks = entry.sensorySelections.orEmpty()
    if (picks.isNotEmpty())
        Section("선택한 감각") {
            picks.forEach { selection ->
                CardBox {
                    NavigationRow(
                        selection.labelSnapshot,
                        listOfNotNull(
                                selection.liking?.let { SelectionLabels.liking[it] },
                                selection.intensity?.let { SelectionLabels.intensity[it] },
                                selection.preferenceFit?.let { SelectionLabels.fit[it] },
                            )
                            .joinToString(" · "),
                    ) {
                        selected = selection
                    }
                }
            }
        }
    Section("음식 종류") {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            vm.catalogs.dining.dishKindOptions.forEach { kind ->
                FilterChip(
                    kind.id in entry.dishKindIDs,
                    {
                        vm.changeDraft {
                            it.copy(
                                entry =
                                    it.entry.copy(
                                        dishKindIDs =
                                            if (kind.id in it.entry.dishKindIDs)
                                                it.entry.dishKindIDs - kind.id
                                            else it.entry.dishKindIDs + kind.id
                                    )
                            )
                        }
                    },
                    label = { Text(kind.label) },
                )
            }
        }
    }
    vm.catalogs.dining.detailTagCategories.forEach { category ->
        Section(category.label) {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                category.tags.forEach { tag ->
                    FilterChip(
                        picks.any { it.id == tag.id },
                        {
                            selected =
                                picks.firstOrNull { it.id == tag.id }
                                    ?: vm.catalogs.selection(tag.id, "detailTag")
                        },
                        label = { Text(tag.label) },
                    )
                }
            }
        }
    }
    selected?.let { value -> SelectionEditor(vm, value, onDismiss = { selected = null }) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SelectionEditor(vm: AppViewModel, initial: SensorySelection, onDismiss: () -> Unit) {
    val state by vm.state.collectAsState()
    var value by remember(initial) { mutableStateOf(initial) }
    val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheet, containerColor = TB.page) {
        Page(Modifier.fillMaxHeight(.88f)) {
            Text(value.labelSnapshot, style = MaterialTheme.typography.titleLarge)
            Text("기억나는 것만 남겨주세요. 선택하지 않은 항목은 추정하지 않아요.", color = TB.body)
            Section("이 감각은 어땠나요?") {
                Choices(SelectionLabels.liking, value.liking) {
                    value = value.copy(liking = if (value.liking == it) null else it)
                }
            }
            Section("얼마나 강하게 느꼈나요?") {
                Choices(SelectionLabels.intensity, value.intensity) {
                    value = value.copy(intensity = if (value.intensity == it) null else it)
                }
            }
            Section("나에게 알맞았나요?") {
                Choices(SelectionLabels.fit, value.preferenceFit) {
                    value = value.copy(preferenceFit = if (value.preferenceFit == it) null else it)
                }
            }
            Section("어느 부분인가요?") {
                Choices(SelectionLabels.targets, value.target) { value = value.copy(target = it) }
            }
            Section("언제 느꼈나요?") {
                Choices(SelectionLabels.phases, value.phase) { value = value.copy(phase = it) }
            }
            if (value.type == "detailTag")
                Section("연결할 맛") {
                    Choices(
                        mapOf("" to "따로 연결하지 않음") +
                            state.draft
                                ?.entry
                                ?.sensorySelections
                                .orEmpty()
                                .filter { it.type == "bubble" }
                                .associate { it.id to it.labelSnapshot },
                        value.relatedBubbleID.orEmpty(),
                    ) {
                        value = value.copy(relatedBubbleID = it.ifEmpty { null })
                    }
                }
            PrimaryButton("이 감각 남기기") {
                vm.changeDraft { draft ->
                    val selections =
                        draft.entry.sensorySelections.orEmpty().filterNot {
                            it.id == value.id && it.type == value.type
                        } + value
                    draft.copy(
                        entry =
                            draft.entry.copy(
                                sensorySelections = selections,
                                tasteExperienceIDs =
                                    selections.filter { it.type == "bubble" }.map { it.id },
                                detailTagIDs =
                                    selections.filter { it.type == "detailTag" }.map { it.id },
                            )
                    )
                }
                onDismiss()
            }
            TextButton({
                vm.changeDraft { draft ->
                    val selections =
                        draft.entry.sensorySelections.orEmpty().filterNot {
                            it.id == value.id && it.type == value.type
                        }
                    draft.copy(
                        entry =
                            draft.entry.copy(
                                sensorySelections = selections,
                                tasteExperienceIDs =
                                    selections.filter { it.type == "bubble" }.map { it.id },
                                detailTagIDs =
                                    selections.filter { it.type == "detailTag" }.map { it.id },
                            )
                    )
                }
                onDismiss()
            }) {
                Text("선택 지우기")
            }
        }
    }
}
