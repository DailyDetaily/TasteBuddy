package com.tastebuddy.android.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tastebuddy.android.data.PublicProfile
import com.tastebuddy.android.domain.*
import java.io.IOException
import kotlinx.coroutines.delay

fun openURL(context: Context, value: String, vm: AppViewModel? = null) {
    val uri = runCatching { Uri.parse(value) }.getOrNull()
    if (uri == null || uri.scheme !in listOf("https", "http", "geo", "tel", "mailto")) {
        vm?.message?.value = "연결할 주소를 확인하지 못했어요."
        return
    }
    try {
        context.startActivity(
            Intent(if (uri.scheme == "tel") Intent.ACTION_DIAL else Intent.ACTION_VIEW, uri)
        )
    } catch (_: android.content.ActivityNotFoundException) {
        vm?.message?.value = "이 기능을 열 수 있는 앱을 찾지 못했어요."
    }
}

@Composable
fun SearchScreen(vm: AppViewModel, peopleOnly: Boolean = false) {
    val state by vm.state.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    var kind by rememberSaveable { mutableStateOf(if (peopleOnly) "버디" else "전체") }
    var remote by remember { mutableStateOf<List<Restaurant>>(emptyList()) }
    var people by remember { mutableStateOf<List<PublicProfile>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(query, kind) {
        remote = emptyList()
        people = emptyList()
        error = null
        if (query.isNotBlank() && !vm.qaMode) {
            delay(350)
            loading = true
            try {
                if (kind in listOf("전체", "레스토랑")) remote = vm.app.places.search(query)
            } catch (_: IOException) {
                error = "식당 검색을 불러오지 못했어요. 다시 입력해 주세요."
            }
            try {
                if (kind in listOf("전체", "버디")) people = vm.backend.searchPeople(query)
            } catch (_: IOException) {
                error = "버디 검색 연결을 확인해 주세요."
            }
            loading = false
        }
    }
    fun rememberQuery() {
        if (query.isNotBlank())
            vm.update {
                it.copy(
                    recentSearches = (listOf(query.trim()) + it.recentSearches).distinct().take(10)
                )
            }
    }
    Screen(if (peopleOnly) "버디 찾기" else "검색", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            Field(
                query,
                if (peopleOnly) "이름 또는 버디네임" else "레스토랑, 메뉴, 셰프, 버디 검색",
                onChange = { query = it },
            )
            if (!peopleOnly)
                Row(
                    Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    listOf("전체", "레스토랑", "메뉴", "셰프", "버디").forEach { name ->
                        FilterChip(kind == name, { kind = name }, label = { Text(name) })
                    }
                }
            if (query.isBlank()) {
                if (state.recentSearches.isNotEmpty())
                    Section("최근 검색") {
                        CardBox {
                            state.recentSearches.forEach { text ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    TextButton({ query = text }, Modifier.weight(1f)) { Text(text) }
                                    IconButton({
                                        vm.update {
                                            it.copy(recentSearches = it.recentSearches - text)
                                        }
                                    }) {
                                        Icon(Icons.Outlined.Close, "$text 검색어 삭제")
                                    }
                                }
                            }
                        }
                    }
                Section(if (peopleOnly) "버디 추천" else "추천 탐색") {
                    Text(
                        if (peopleOnly) "이름과 버디네임을 기준으로 다이닝 친구 후보를 찾을 수 있어요."
                        else "레스토랑을 먼저, 셰프와 메뉴, 다이닝 친구까지 함께 찾을 수 있어요.",
                        color = TB.body,
                    )
                }
                if (!peopleOnly)
                    vm.catalogs.restaurants.take(5).forEach { restaurant ->
                        RestaurantRow(vm, restaurant) {
                            rememberQuery()
                            vm.restaurant(restaurant)
                        }
                    }
            } else {
                if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
                val local =
                    vm.catalogs.restaurants.filter {
                        "${it.name} ${it.category} ${it.locationLabel}".contains(query, true)
                    }
                val restaurants = (remote + local).distinctBy { it.name + it.address }
                if (kind in listOf("전체", "레스토랑"))
                    restaurants.forEach { restaurant ->
                        RestaurantRow(vm, restaurant) {
                            rememberQuery()
                            vm.restaurant(restaurant)
                        }
                    }
                if (kind in listOf("전체", "메뉴"))
                    vm.catalogs.restaurants.forEach { restaurant ->
                        restaurant.memorableDishes
                            .filter { "${it.title} ${it.summary}".contains(query, true) }
                            .forEach { dish ->
                                CardBox {
                                    NavigationRow(dish.title, restaurant.name) {
                                        rememberQuery()
                                        vm.restaurant(restaurant)
                                    }
                                    TextButton({
                                        rememberQuery()
                                        vm.startDining(restaurant, dish)
                                    }) {
                                        Text("이 메뉴 기록하기")
                                    }
                                }
                            }
                    }
                if (kind in listOf("전체", "셰프"))
                    vm.catalogs.restaurants
                        .filter { it.chefName.isNotBlank() && it.chefName.contains(query, true) }
                        .forEach { restaurant ->
                            CardBox {
                                NavigationRow(restaurant.chefName, restaurant.name) {
                                    rememberQuery()
                                    vm.restaurant(restaurant)
                                }
                            }
                        }
                if (kind in listOf("전체", "버디"))
                    people.forEach { person ->
                        CardBox {
                            NavigationRow(person.title, person.handle) {
                                rememberQuery()
                                vm.selectedPerson.value = person
                                vm.open("person")
                            }
                        }
                    }
                error?.let { Text(it, color = TB.body) }
                if (
                    !loading &&
                        restaurants.isEmpty() &&
                        people.isEmpty() &&
                        vm.catalogs.restaurants.none {
                            it.chefName.contains(query, true) ||
                                it.memorableDishes.any { dish ->
                                    "${dish.title} ${dish.summary}".contains(query, true)
                                }
                        }
                )
                    EmptyCard("아직 맞는 결과를 찾지 못했어요", "이름이나 메뉴를 다른 표현으로 검색해 보세요.")
            }
        }
    }
}

@Composable
fun RestaurantRow(vm: AppViewModel, restaurant: Restaurant, onClick: () -> Unit) {
    val state by vm.state.collectAsState()
    CardBox {
        NavigationRow(
            restaurant.name,
            listOf(restaurant.category, restaurant.address.ifBlank { restaurant.locationLabel })
                .filter { it.isNotBlank() }
                .joinToString(" · "),
            onClick,
        )
        Row {
            TextButton({ vm.startDining(restaurant) }) { Text("기록") }
            TextButton({ vm.bookmark(restaurant) }) {
                Text(
                    if (state.bookmarks.any { it.restaurant.id == restaurant.id }) "저장됨" else "북마크"
                )
            }
        }
    }
}

@Composable
fun RestaurantScreen(vm: AppViewModel) {
    val original by vm.selectedRestaurant.collectAsState()
    val restaurant = original ?: return
    var enriched by remember(restaurant.id) { mutableStateOf(restaurant) }
    var showSuggestion by remember { mutableStateOf(false) }
    var suggestion by rememberSaveable { mutableStateOf("") }
    val context = LocalContext.current
    LaunchedEffect(restaurant.id) { if (!vm.qaMode) enriched = vm.app.places.enrich(restaurant) }
    Screen(
        restaurant.name,
        vm::back,
        actions = {
            IconButton({ vm.bookmark(enriched) }) { Icon(Icons.Outlined.BookmarkBorder, "북마크") }
        },
    ) { padding ->
        Page(Modifier.padding(padding)) {
            (enriched.photoURL
                    ?: restaurant.imageName?.let { "file:///android_asset/images/$it.png" })
                ?.let {
                    AsyncImage(
                        it,
                        restaurant.name,
                        Modifier.fillMaxWidth().aspectRatio(1.5f).clip(RoundedCornerShape(20.dp)),
                        contentScale = ContentScale.Crop,
                    )
                }
            enriched.photoAttribution
                ?.takeIf { it.isNotBlank() }
                ?.let {
                    Text(
                        "사진: $it · Google",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TB.hint,
                    )
                }
            CardBox {
                Text(restaurant.name, style = MaterialTheme.typography.titleLarge)
                if (restaurant.chefName.isNotBlank()) Text(restaurant.chefName, color = TB.body)
                Text(
                    listOf(restaurant.category, restaurant.locationLabel)
                        .filter { it.isNotBlank() }
                        .joinToString(" · "),
                    color = TB.body,
                )
                if (restaurant.summary.isNotBlank()) Text(restaurant.summary)
                Text(
                    "나의 입맛 적합도 · 미계산",
                    color = TB.hint,
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (enriched.googleRating != null)
                    Text(
                        "Google 평점 ${enriched.googleRating} · 평가 ${enriched.googleRatingCount ?: 0}개",
                        color = TB.body,
                    )
                PrimaryButton("이 식당에서 기록하기") { vm.startDining(enriched) }
            }
            Section("기억할 만한 디시") {
                if (restaurant.memorableDishes.isEmpty())
                    EmptyCard("아직 연결된 메뉴가 없어요", "먹은 메뉴 이름을 직접 입력해 기록할 수 있어요.", "메뉴 직접 기록") {
                        vm.startDining(enriched)
                    }
                restaurant.memorableDishes.forEach { dish ->
                    CardBox {
                        Text(dish.title, style = MaterialTheme.typography.titleMedium)
                        Text(dish.summary, color = TB.body)
                        if (dish.price.isNotBlank()) Text(dish.price)
                        TextButton({ vm.startDining(enriched, dish) }) { Text("이 메뉴 기록하기") }
                    }
                }
            }
            Section("위치 및 정보") {
                CardBox {
                    if (enriched.address.isNotBlank())
                        NavigationRow("주소", enriched.address) {
                            val clipboard =
                                context.getSystemService(Context.CLIPBOARD_SERVICE)
                                    as ClipboardManager
                            clipboard.setPrimaryClip(
                                ClipData.newPlainText("식당 주소", enriched.address)
                            )
                            vm.message.value = "주소를 복사했어요."
                        }
                    if (enriched.latitude != null && enriched.longitude != null)
                        NavigationRow("지도에서 보기") {
                            openURL(
                                context,
                                enriched.googleMapsURL
                                    ?: "geo:${enriched.latitude},${enriched.longitude}?q=${Uri.encode(enriched.name)}",
                                vm,
                            )
                        }
                    if (enriched.phone.isNotBlank())
                        NavigationRow("전화", enriched.phone) {
                            openURL(context, "tel:${enriched.phone}", vm)
                        }
                    if (enriched.website.isNotBlank())
                        NavigationRow("웹사이트") { openURL(context, enriched.website, vm) }
                    if (enriched.hours.isNotEmpty()) {
                        Text("영업시간 · Google", fontWeight = FontWeight.SemiBold)
                        enriched.hours.forEach { Text(it, color = TB.body) }
                    }
                    restaurant.infoRows.forEach { row ->
                        Text("${row.label}  ${row.value}", color = TB.body)
                    }
                    Text(
                        "기본 위치 정보: ${enriched.source}. 영업시간 등은 매장에 확인해 주세요.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TB.hint,
                    )
                    TextButton({ showSuggestion = true }) { Text("정보 수정 제안") }
                }
            }
        }
    }
    if (showSuggestion)
        AlertDialog(
            onDismissRequest = { showSuggestion = false },
            title = { Text("정보 수정 메모") },
            text = {
                Field(
                    suggestion,
                    "수정이 필요한 내용을 남겨주세요",
                    singleLine = false,
                    onChange = { suggestion = it },
                )
            },
            confirmButton = {
                TextButton({
                    vm.update { s ->
                        val old =
                            s.bookmarks.firstOrNull { it.restaurant.id == restaurant.id }
                                ?: RestaurantBookmark(restaurant)
                        s.copy(
                            bookmarks =
                                s.bookmarks.filterNot { it.restaurant.id == restaurant.id } +
                                    old.copy(note = suggestion)
                        )
                    }
                    showSuggestion = false
                    vm.message.value = "이 기기의 식당 메모에 저장했어요."
                }) {
                    Text("메모 저장")
                }
            },
            dismissButton = { TextButton({ showSuggestion = false }) { Text("취소") } },
        )
}

@Composable
fun BookmarkScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val restaurant by vm.selectedRestaurant.collectAsState()
    var creating by remember { mutableStateOf(false) }
    Screen("북마크", vm::back) { padding ->
        Page(Modifier.padding(padding)) {
            restaurant?.let { value ->
                Text(value.name, style = MaterialTheme.typography.titleLarge)
                CardBox {
                    NavigationRow("전체 저장 목록") {
                        vm.saveBookmark(value)
                        vm.back()
                    }
                    state.bookmarkLists.forEach { list ->
                        NavigationRow(list.name, if (list.isPrivate) "비밀 리스트" else "공개 리스트") {
                            vm.saveBookmark(value, list.id)
                            vm.back()
                        }
                    }
                }
                TextButton({ creating = true }) { Text("새 리스트 만들기") }
                if (state.bookmarks.any { it.restaurant.id == value.id })
                    TextButton({
                        vm.update {
                            it.copy(
                                bookmarks =
                                    it.bookmarks.filterNot { bookmark ->
                                        bookmark.restaurant.id == value.id
                                    }
                            )
                        }
                        vm.back()
                    }) {
                        Text("북마크 해제")
                    }
            }
        }
    }
    if (creating) ListEditor(vm, onDismiss = { creating = false }, restaurant = restaurant)
}

@Composable
fun SavedListsScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val listID by vm.selectedListID.collectAsState()
    val list = state.bookmarkLists.firstOrNull { it.id == listID }
    var creating by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }
    Screen(
        list?.name ?: "테이스트 리스트",
        vm::back,
        actions = {
            if (list != null) IconButton({ editing = true }) { Icon(Icons.Outlined.Edit, "리스트 편집") }
        },
    ) { padding ->
        Page(Modifier.padding(padding)) {
            if (listID == null) {
                PrimaryButton("새 리스트 만들기") { creating = true }
                state.bookmarkLists.forEach { value ->
                    CardBox(color = Color(value.coverTasteID.tint)) {
                        NavigationRow(
                            "${coverSymbol(value.coverIconID)}  ${value.name}",
                            "${if (value.isPrivate) "비밀 리스트" else "공개 리스트"} · ${state.bookmarks.count { value.id in it.listIDs }}곳",
                        ) {
                            vm.selectedListID.value = value.id
                        }
                    }
                }
            } else if (list != null) {
                CardBox(color = Color(list.coverTasteID.tint)) {
                    Text(
                        "${coverSymbol(list.coverIconID)}  ${list.name}",
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(list.description)
                    Text(if (list.isPrivate) "비밀 리스트" else "공개 리스트", color = TB.body)
                }
                TextButton({ vm.selectedListID.value = null }) { Text("전체 리스트 보기") }
            }
            val bookmarks = state.bookmarks.filter { listID == null || listID in it.listIDs }
            if (bookmarks.isEmpty())
                EmptyCard("저장한 식당이 없어요", "관심 있는 식당을 북마크해 한곳에 모아보세요.", "식당 찾아보기") {
                    vm.open("search")
                }
            bookmarks.forEach { RestaurantRow(vm, it.restaurant) { vm.restaurant(it.restaurant) } }
            if (list != null) TextButton({ deleting = true }) { Text("리스트 삭제") }
        }
    }
    if (creating || editing)
        ListEditor(
            vm,
            if (editing) list else null,
            {
                creating = false
                editing = false
            },
        )
    if (deleting && list != null)
        AlertDialog(
            onDismissRequest = { deleting = false },
            title = { Text("${list.name} 리스트를 삭제할까요?") },
            text = { Text("식당 북마크는 전체 저장 목록에 남아 있어요.") },
            confirmButton = {
                TextButton({
                    vm.update {
                        it.copy(
                            bookmarkLists = it.bookmarkLists.filterNot { row -> row.id == list.id },
                            bookmarks =
                                it.bookmarks.map { row ->
                                    row.copy(listIDs = row.listIDs - list.id)
                                },
                        )
                    }
                    vm.selectedListID.value = null
                    deleting = false
                }) {
                    Text("삭제")
                }
            },
            dismissButton = { TextButton({ deleting = false }) { Text("취소") } },
        )
}

fun coverSymbol(id: String) =
    mapOf(
        "utensils" to "◌",
        "heart" to "♡",
        "star" to "☆",
        "coffee" to "☕",
        "wine" to "♧",
        "pin" to "⌖",
    )[id] ?: "◌"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ListEditor(
    vm: AppViewModel,
    initial: BookmarkList? = null,
    onDismiss: () -> Unit,
    restaurant: Restaurant? = null,
) {
    var name by rememberSaveable { mutableStateOf(initial?.name.orEmpty()) }
    var description by rememberSaveable { mutableStateOf(initial?.description.orEmpty()) }
    var isPrivate by rememberSaveable { mutableStateOf(initial?.isPrivate ?: false) }
    var axis by remember { mutableStateOf(initial?.coverTasteID ?: TasteAxis.sweet) }
    var icon by remember { mutableStateOf(initial?.coverIconID ?: "utensils") }
    ModalBottomSheet(
        onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = TB.page,
    ) {
        Page(Modifier.fillMaxHeight(.9f)) {
            Text(
                if (initial == null) "새 리스트" else "리스트 편집",
                style = MaterialTheme.typography.titleLarge,
            )
            CardBox(color = Color(axis.tint)) {
                Text(
                    "${coverSymbol(icon)}  ${name.ifBlank { "새 리스트" }}",
                    style = MaterialTheme.typography.titleLarge,
                )
            }
            Field(name, "리스트 이름", onChange = { name = it })
            Field(description, "설명", singleLine = false, onChange = { description = it })
            Section("리스트 커버") {
                Choices(TasteAxis.entries.associate { it.name to it.label }, axis.name) {
                    axis = TasteAxis.valueOf(it)
                }
                Choices(
                    listOf("utensils", "heart", "star", "coffee", "wine", "pin")
                        .associateWith(::coverSymbol),
                    icon,
                ) {
                    icon = it
                }
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("비밀 리스트로 설정하기", Modifier.weight(1f))
                Switch(isPrivate, { isPrivate = it })
            }
            Text("현재 리스트는 이 기기에 저장돼요.", color = TB.hint)
            PrimaryButton("저장", name.isNotBlank()) {
                val list =
                    (initial ?: BookmarkList(name = name.trim())).copy(
                        name = name.trim(),
                        description = description,
                        isPrivate = isPrivate,
                        coverIconID = icon,
                        coverTasteID = axis,
                    )
                vm.update { state ->
                    state.copy(
                        bookmarkLists = state.bookmarkLists.filterNot { it.id == list.id } + list,
                        bookmarks =
                            if (restaurant == null) state.bookmarks
                            else
                                state.bookmarks.filterNot { it.restaurant.id == restaurant.id } +
                                    (state.bookmarks.firstOrNull {
                                            it.restaurant.id == restaurant.id
                                        } ?: RestaurantBookmark(restaurant))
                                        .copy(listIDs = listOf(list.id)),
                    )
                }
                onDismiss()
            }
        }
    }
}
