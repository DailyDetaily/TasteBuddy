package com.tastebuddy.android.data

import com.tastebuddy.android.domain.*
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class ApiException(val status: Int, val code: String, override val message: String) :
    IOException(message)

suspend fun OkHttpClient.json(request: Request): JsonElement =
    suspendCancellableCoroutine { continuation ->
        val call = newCall(request)
        continuation.invokeOnCancellation { call.cancel() }
        call.enqueue(
            object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    if (continuation.isActive) continuation.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    response.use {
                        try {
                            val text = it.body?.string().orEmpty()
                            val value =
                                if (text.isBlank()) JsonNull
                                else
                                    runCatching { AppJson.parseToJsonElement(text) }
                                        .getOrElse { JsonPrimitive(text) }
                            if (!it.isSuccessful) {
                                val error = value as? JsonObject
                                val code =
                                    error
                                        ?.string("error_code")
                                        ?.ifBlank { error.string("code") }
                                        .orEmpty()
                                val message =
                                    when {
                                        it.code == 429 -> "요청이 많아요. 잠시 후 다시 시도해 주세요."
                                        code == "23505" -> "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해 주세요."
                                        it.code == 401 || it.code == 403 ->
                                            "계정 연결을 확인한 뒤 다시 시도해 주세요."
                                        else -> "요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
                                    }
                                throw ApiException(it.code, code, message)
                            }
                            if (continuation.isActive) continuation.resume(value)
                        } catch (e: Exception) {
                            if (continuation.isActive) continuation.resumeWithException(e)
                        }
                    }
                }
            }
        )
    }

fun JsonElement.requestBody() =
    toString().toRequestBody("application/json; charset=utf-8".toMediaType())
