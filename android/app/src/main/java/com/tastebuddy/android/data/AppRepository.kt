package com.tastebuddy.android.data

import android.util.AtomicFile
import com.tastebuddy.android.domain.*
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*

/** 저장이 성공한 상태만 발행한다. 읽기 실패 시 원래 파일을 덮어쓰지 않는다. */
class AppRepository(private val directory: File, private val initialState: AppState = AppState()) {
    private val file = AtomicFile(File(directory, "taste-buddy-state.json"))
    private val mutex = Mutex()
    private val mutableState = MutableStateFlow(initialState)
    val state = mutableState.asStateFlow()
    private val mutableReady = MutableStateFlow(false)
    val ready = mutableReady.asStateFlow()
    private val mutableError = MutableStateFlow<String?>(null)
    val error = mutableError.asStateFlow()

    suspend fun load() =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                try {
                    directory.mkdirs()
                    mutableState.value =
                        if (file.baseFile.exists() || File(file.baseFile.path + ".bak").exists()) {
                            val text = file.openRead().bufferedReader().use { it.readText() }
                            val raw = AppJson.parseToJsonElement(text).jsonObject
                            val version = raw["schemaVersion"]?.jsonPrimitive?.intOrNull ?: 1
                            require(version == 1) { "새 버전에서 저장한 기록입니다. 앱을 업데이트해 주세요." }
                            AppJson.decodeFromJsonElement(normalizeSelections(raw))
                        } else initialState
                    mutableError.value = null
                    mutableReady.value = true
                } catch (error: Exception) {
                    mutableReady.value = false
                    mutableError.value =
                        error.message?.takeIf { it.startsWith("새 버전") }
                            ?: "저장된 기록을 읽지 못했어요. 원래 기록은 보존되어 있어요."
                }
            }
        }

    suspend fun update(transform: (AppState) -> AppState): AppState =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                check(mutableReady.value && mutableError.value == null) { "기록을 불러온 뒤 다시 시도해 주세요." }
                val next = transform(mutableState.value)
                persist(next)
                mutableState.value = next
                next
            }
        }

    suspend fun reset() =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                persist(initialState)
                mutableState.value = initialState
                mutableReady.value = true
                mutableError.value = null
            }
        }

    private fun persist(value: AppState) {
        directory.mkdirs()
        val stream = file.startWrite()
        try {
            stream.write(AppJson.encodeToString(value).toByteArray(Charsets.UTF_8))
            file.finishWrite(stream)
        } catch (error: Exception) {
            file.failWrite(stream)
            throw error
        }
    }

    private fun normalizeSelections(raw: JsonObject): JsonObject {
        fun entry(element: JsonElement): JsonElement {
            val item = element as? JsonObject ?: return element
            val result = item.toMutableMap()
            (item["sensorySelections"] as? JsonArray)?.let {
                result["sensorySelections"] =
                    JsonArray(
                        it.map { selected ->
                            AppJson.encodeToJsonElement(SensorySelection.fromRaw(selected))
                        }
                    )
            }
            item["overallEvaluation"]
                ?.takeIf { it != JsonNull }
                ?.let {
                    result["overallEvaluation"] =
                        AppJson.encodeToJsonElement(OverallEvaluation.fromRaw(it))
                }
            return JsonObject(result)
        }
        val result = raw.toMutableMap()
        (raw["entries"] as? JsonArray)?.let { result["entries"] = JsonArray(it.map(::entry)) }
        (raw["draft"] as? JsonObject)?.let { draft ->
            draft["entry"]?.let { e ->
                result["draft"] = JsonObject(draft.toMutableMap().apply { put("entry", entry(e)) })
            }
        }
        return JsonObject(result)
    }
}
