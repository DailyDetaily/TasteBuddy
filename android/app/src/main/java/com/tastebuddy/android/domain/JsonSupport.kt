package com.tastebuddy.android.domain

import java.security.MessageDigest
import java.time.Instant
import java.time.format.DateTimeFormatterBuilder
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*

val AppJson = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    encodeDefaults = true
}
val SparseJson = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    encodeDefaults = false
}

fun JsonElement.canonical(): String =
    when (this) {
        is JsonObject ->
            JsonObject(
                    toSortedMap().mapValues { (_, v) -> AppJson.parseToJsonElement(v.canonical()) }
                )
                .toString()
        is JsonArray -> joinToString(",", "[", "]") { it.canonical() }
        else -> toString()
    }

inline fun <reified T> canonical(value: T): String = AppJson.encodeToJsonElement(value).canonical()

fun jsonArray(vararg values: Any?): JsonArray = JsonArray(values.map(::jsonValue))

fun jsonValue(value: Any?): JsonElement =
    when (value) {
        null -> JsonNull
        is JsonElement -> value
        is String -> JsonPrimitive(value)
        is Boolean -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        is List<*> -> JsonArray(value.map(::jsonValue))
        is Map<*, *> ->
            JsonObject(value.entries.associate { it.key.toString() to jsonValue(it.value) })
        else -> error("지원하지 않는 JSON 값: ${value::class.simpleName}")
    }

fun digest(text: String, bytes: Int = 12): String =
    MessageDigest.getInstance("SHA-256")
        .digest(text.toByteArray(Charsets.UTF_8))
        .take(bytes)
        .joinToString("") { "%02x".format(it) }

fun stableID(parts: List<String>): String =
    digest(AppJson.encodeToString(parts).replace("/", "\\/"))

fun personalID(type: String, vararg parts: Any?): String =
    "$type:${digest(jsonArray(*parts).canonical(), 10)}"

fun timestamp(value: Instant): String =
    DateTimeFormatterBuilder().appendInstant(3).toFormatter().format(value)

fun parseInstant(value: String?): Instant? = value?.let {
    runCatching { Instant.parse(it) }.getOrNull()
}

val JsonPrimitive.sensoryText: String
    get() = booleanOrNull?.let { if (it) "있음" else "없음" } ?: content

fun JsonObject.string(key: String, default: String = ""): String =
    (get(key) as? JsonPrimitive)?.contentOrNull ?: default

fun JsonObject.array(key: String): JsonArray = get(key) as? JsonArray ?: JsonArray(emptyList())

fun JsonObject.obj(key: String): JsonObject = get(key) as? JsonObject ?: JsonObject(emptyMap())
