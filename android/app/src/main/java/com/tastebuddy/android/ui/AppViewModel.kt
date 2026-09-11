package com.tastebuddy.android.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.tastebuddy.android.TasteBuddyApplication
import com.tastebuddy.android.data.*
import com.tastebuddy.android.domain.*
import java.time.Instant
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

@OptIn(ExperimentalCoroutinesApi::class)
class AppViewModel(application: Application) : AndroidViewModel(application) {
    val app = application as TasteBuddyApplication
    val repo = app.repository
    val catalogs = app.catalogs
    val photos = app.photos
    val backend = app.backend
    val state = repo.state
    val ready = repo.ready
    val loadError = repo.error
    val route = MutableStateFlow("main")
    val busy = MutableStateFlow(false)
    val message = MutableStateFlow<String?>(null)
    val selectedRestaurant = MutableStateFlow<Restaurant?>(null)
    val selectedEntryID = MutableStateFlow<String?>(null)
    val selectedPerson = MutableStateFlow<PublicProfile?>(null)
    val evidenceIDs = MutableStateFlow<List<String>?>(null)
    val feedID = MutableStateFlow("")
    val selectedListID = MutableStateFlow<String?>(null)
    val nearby = MutableStateFlow<List<Restaurant>>(emptyList())
    var qaMode = false
    private val stack = mutableListOf<String>()
    private var deletedEntry: DiningEntry? = null
    private val editMutex = Mutex()
    private val analyzer = SensoryAnalyzer(catalogs.sensory, catalogs.preferenceQuestions)
    val analysisUpdating = MutableStateFlow(false)
    val analysisError = MutableStateFlow<String?>(null)
    val analysis =
        state
            .map { s ->
                Triple(s.entries,
                    s.questionProgress.values
                        .filter { it.status in listOf("dismissed", "answered") }
                        .map { it.id }
                        .sorted(), s.preferenceSubmissions)
            }
            .distinctUntilChanged()
            .transformLatest { (entries, suppressed, preferences) ->
                analysisUpdating.value = true
                analysisError.value = null
                emit(SensorySnapshot())
                try {
                    emit(
                        withContext(Dispatchers.Default) {
                            analyzer.analyze(entries, suppressedQuestionIDs = suppressed, preferenceSubmissions = preferences)
                        }
                    )
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: Exception) {
                    analysisError.value = "입맛 해석을 불러오지 못했어요. 기록은 그대로 보존되어 있어요."
                } finally {
                    analysisUpdating.value = false
                }
            }
            .stateIn(viewModelScope, SharingStarted.Eagerly, SensorySnapshot())

    init {
        viewModelScope.launch {
            repo.load()
            runCatching { backend.restore() }
                .onFailure { message.value = "계정 연결을 다시 확인해 주세요. 저장된 기록은 그대로 있어요." }
            if (repo.ready.value) photos.cleanup(state.value)
        }
    }

    fun task(block: suspend () -> Unit) {
        if (busy.value) return
        viewModelScope.launch {
            busy.value = true
            try {
                editMutex.withLock { block() }
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                message.value =
                    error.message?.takeIf { it.any { c -> c in '가'..'힣' } }
                        ?: "작업을 완료하지 못했어요. 다시 시도해 주세요."
            } finally {
                busy.value = false
            }
        }
    }

    fun update(transform: (AppState) -> AppState) {
        viewModelScope.launch {
            try {
                editMutex.withLock { repo.update(transform) }
            } catch (e: Exception) {
                message.value = "기록을 저장하지 못했어요. 다시 시도해 주세요."
            }
        }
    }

    fun open(name: String) {
        if (route.value != name) {
            stack.add(route.value)
            route.value = name
        }
    }

    fun back() {
        route.value = if (stack.isNotEmpty()) stack.removeAt(stack.lastIndex) else "main"
    }

    fun main(tab: String? = null) {
        stack.clear()
        route.value = "main"
        if (tab != null) update { it.copy(selectedTab = tab) }
    }

    fun guest() = task { repo.update { it.copy(authEntryComplete = true) } }

    fun authenticated() = task { finishAuthentication() }

    suspend fun finishAuthentication() {
        val identity = runCatching { backend.currentIdentity() }.getOrNull()
        repo.update {
            it.copy(
                authEntryComplete = true,
                identity =
                    if (identity != null)
                        it.identity.copy(
                            name = identity.displayName ?: it.identity.name,
                            nickname = identity.nickname ?: it.identity.nickname,
                        )
                    else it.identity,
            )
        }
        stack.clear()
        route.value = "main"
    }

    fun callback(uri: Uri) {
        viewModelScope.launch {
            ready.first { it }
            task {
                backend.handleCallback(uri.toString())
                finishAuthentication()
            }
        }
    }

    fun startDining(restaurant: Restaurant? = null, menu: RestaurantDish? = null) = task {
        val draft =
            DiningDraft(
                DiningEntry(
                    restaurant = restaurant?.name.orEmpty(),
                    restaurantID = restaurant?.id,
                    menu = menu?.title.orEmpty(),
                    menuItemID = menu?.id,
                ),
                stage = if (menu != null) "feedback" else "camera",
                mode = if (menu != null) "full" else "quickCapture",
            )
        repo.update { it.copy(draft = draft) }
        open("diningFlow")
    }

    fun changeDraft(transform: (DiningDraft) -> DiningDraft) = update {
        it.copy(draft = it.draft?.let(transform))
    }

    fun draftStage(stage: String) = changeDraft { it.copy(stage = stage) }

    fun importPhoto(uri: Uri, avatar: Boolean = false) = task {
        val photo = photos.import(uri)
        if (avatar) repo.update { it.copy(avatarFilename = photo.filename) }
        else {
            repo.update {
                it.copy(
                    draft =
                        (it.draft ?: DiningDraft()).let { d ->
                            d.copy(
                                entry =
                                    d.entry.copy(
                                        reflectionPhotoFilename = photo.filename,
                                        photoPalette = photo.palette,
                                    ),
                                stage = if (d.stage == "camera") "restaurant" else d.stage,
                            )
                        }
                )
            }
            if (!qaMode && photo.latitude != null && photo.longitude != null)
                nearby.value =
                    runCatching { app.places.search("", photo.latitude, photo.longitude) }
                        .getOrDefault(emptyList())
        }
    }

    fun saveEntry(completed: Boolean) = task { saveEntryFromCurrent(completed) }

    suspend fun saveEntryFromCurrent(completed: Boolean) {
        val draft = state.value.draft ?: return
        if (completed) require(draft.entry.menu.isNotBlank()) { "메뉴 이름을 입력해 주세요." }
        else
            require(
                draft.entry.restaurant.isNotBlank() && draft.entry.reflectionPhotoFilename != null
            ) {
                "사진과 식당을 먼저 선택해 주세요."
            }
        val now = timestamp(Instant.now())
        val entry =
            draft.entry.copy(
                menu = draft.entry.menu.trim(),
                restaurant = draft.entry.restaurant.trim(),
                savedAt = draft.entry.savedAt ?: now,
                updatedAt = now,
                feedbackStatus = if (completed) "completed" else "captured",
                photoPalette = draft.entry.photoPalette ?: PhotoPalette.neutral,
            )
        val questionAnswered =
            draft.questionContext?.let { context ->
                require(PersonalQuestionPolicy.canSave(entry, context, state.value.entries)) {
                    "연결된 기록이 없어 저장하지 못했어요."
                }
                PersonalQuestionPolicy.isAnswered(
                    entry,
                    context,
                    withContext(Dispatchers.Default) { analyzer.analyze(listOf(entry)) },
                )
            } ?: false
        repo.update { s ->
            if (draft.editing && s.entries.none { it.id == entry.id })
                error("연결된 기록이 없어 저장하지 못했어요.")
            s.copy(
                entries =
                    (s.entries.filterNot { it.id == entry.id } + entry).sortedByDescending {
                        it.date
                    },
                draft = draft.copy(entry = entry, stage = "result", editing = true),
                rememberedMenus =
                    s.rememberedMenus +
                        (entry.restaurant to
                            ((s.rememberedMenus[entry.restaurant] ?: emptyList()) + entry.menu)
                                .distinct()),
                questionProgress =
                    if (draft.questionID == null || !questionAnswered) s.questionProgress
                    else
                        s.questionProgress +
                            (draft.questionID to
                                QuestionProgress(
                                    draft.questionID,
                                    "answered",
                                    s.questionProgress[draft.questionID]?.firstExposedAt ?: now,
                                    now,
                                )),
            )
        }
        selectedEntryID.value = entry.id
    }

    fun editEntry(entry: DiningEntry) = task {
        repo.update {
            it.copy(
                draft =
                    DiningDraft(
                        entry,
                        if (entry.menu.isBlank()) "menu" else "feedback",
                        true,
                        mode = "full",
                    )
            )
        }
        open("diningFlow")
    }

    fun additionalMenu(entry: DiningEntry) = task {
        repo.update {
            it.copy(draft = DiningDraft(entry.additionalMenuDraft(), "menu", mode = "full"))
        }
        open("diningFlow")
    }

    fun entry(entry: DiningEntry) {
        selectedEntryID.value = entry.id
        open("entry")
    }

    fun deleteEntry(entry: DiningEntry) = task {
        repo.update {
            it.copy(
                entries = it.entries.filterNot { row -> row.id == entry.id },
                draft = it.draft?.takeUnless { d -> d.entry.id == entry.id },
            )
        }
        deletedEntry = entry
        back()
        message.value = "기록을 삭제했어요. 실행 취소할 수 있어요."
    }

    fun undoDelete() = task {
        deletedEntry?.let { entry ->
            repo.update {
                it.copy(entries = (it.entries + entry).sortedByDescending { e -> e.date })
            }
        }
        deletedEntry = null
    }

    fun restaurant(value: Restaurant) {
        selectedRestaurant.value = value
        open("restaurant")
    }

    fun bookmark(value: Restaurant) {
        selectedRestaurant.value = value
        open("bookmark")
    }

    fun saveBookmark(value: Restaurant, listID: String? = null) = update { s ->
        val old = s.bookmarks.firstOrNull { it.restaurant.id == value.id }
        val bookmark = (old ?: RestaurantBookmark(value)).copy(listIDs = listOfNotNull(listID))
        s.copy(bookmarks = s.bookmarks.filterNot { it.restaurant.id == value.id } + bookmark)
    }

    fun question(question: NextSelection) = task {
        require(analysis.value.personalModel?.nextSelection?.id == question.id) {
            "다음 질문이 바뀌었어요. 현재 질문을 확인해 주세요."
        }
        val observations =
            analysis.value.observations
                .filter { it.id in question.evidenceIDs && it.attribute == question.attribute }
                .sortedWith(
                    compareByDescending<SensoryObservation> { it.recordedAt }.thenBy { it.id }
                )
        val sourceObservation =
            if (question.intent == "clarification")
                observations.firstOrNull { observation ->
                    state.value.entries.any { it.id == observation.experienceID }
                }
            else null
        val source =
            sourceObservation?.experienceID?.let { id ->
                state.value.entries.firstOrNull { it.id == id }
            }
        if (question.intent == "clarification" && source == null) error("연결된 기록이 없어 저장하지 못했어요.")
        val context =
            QuestionContext(
                question,
                source?.id,
                sourceObservation?.target ?: "unspecified",
                sourceObservation?.phase ?: "unspecified",
                sourceObservation?.reference ?: observations.firstOrNull()?.reference,
                state.value.entries.map { it.id }.toSet(),
                state.value.entries.map { it.mealID }.toSet(),
            )
        repo.update {
            it.copy(
                draft =
                    DiningDraft(
                        source ?: DiningEntry(),
                        if (source != null) "details" else "restaurant",
                        source != null,
                        questionID = question.id,
                        questionIntent = question.intent,
                        mode = "full",
                        questionContext = context,
                    )
            )
        }
        open("diningFlow")
    }

    fun dismissQuestion(question: NextSelection) = update {
        val now = timestamp(Instant.now())
        it.copy(
            questionProgress =
                it.questionProgress +
                    (question.id to
                        QuestionProgress(
                            question.id,
                            "dismissed",
                            it.questionProgress[question.id]?.firstExposedAt ?: now,
                            now,
                        ))
        )
    }

    fun exposeQuestion(question: NextSelection) {
        if (question.id !in state.value.questionProgress)
            update { state ->
                if (question.id in state.questionProgress) state
                else {
                    val now = timestamp(Instant.now())
                    state.copy(
                        questionProgress =
                            state.questionProgress +
                                (question.id to QuestionProgress(question.id, "exposed", now, now))
                    )
                }
            }
    }

    fun signOut() = task {
        backend.signOut()
        repo.reset()
        photos.clear()
        main()
    }

    fun deleteAccount() = task {
        backend.deleteAccount()
        repo.reset()
        photos.clear()
        main()
    }
}
