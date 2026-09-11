package com.tastebuddy.android.data

import com.tastebuddy.android.BuildConfig
import com.tastebuddy.android.domain.*
import kotlinx.serialization.json.*
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request

class PlacesClient(
    private val http: OkHttpClient = OkHttpClient(),
    private val kakaoKey: String = BuildConfig.TB_KAKAO_REST_API_KEY,
    private val googleKey: String = BuildConfig.TB_GOOGLE_MAPS_API_KEY,
) {
    suspend fun search(
        query: String,
        latitude: Double? = null,
        longitude: Double? = null,
    ): List<Restaurant> {
        if (kakaoKey.isBlank() || query.isBlank() && latitude == null) return emptyList()
        val endpoint = if (query.isBlank()) "category" else "keyword"
        val url =
            "https://dapi.kakao.com/v2/local/search/$endpoint.json"
                .toHttpUrl()
                .newBuilder()
                .addQueryParameter("category_group_code", "FD6")
                .addQueryParameter("page", "1")
                .addQueryParameter("size", "15")
        if (query.isNotBlank()) url.addQueryParameter("query", query.trim())
        if (latitude != null && longitude != null) {
            url.addQueryParameter("x", longitude.toString())
                .addQueryParameter("y", latitude.toString())
                .addQueryParameter("radius", "300")
                .addQueryParameter("sort", "distance")
        }
        val raw =
            http
                .json(
                    Request.Builder()
                        .url(url.build())
                        .header("Authorization", "KakaoAK $kakaoKey")
                        .build()
                )
                .jsonObject
        return raw.array("documents").map { value ->
            val row = value.jsonObject
            Restaurant(
                "kakao:${row.string("id")}",
                row.string("place_name"),
                category = row.string("category_name").substringAfterLast(" > "),
                address = row.string("road_address_name").ifBlank { row.string("address_name") },
                phone = row.string("phone"),
                website = row.string("place_url"),
                latitude = row.string("y").toDoubleOrNull(),
                longitude = row.string("x").toDoubleOrNull(),
                source = "Kakao",
            )
        }
    }

    suspend fun enrich(restaurant: Restaurant): Restaurant {
        val base =
            if (restaurant.source == "catalog")
                runCatching { search(restaurant.name).firstOrNull { it.name == restaurant.name } }
                    .getOrNull()
                    ?.let {
                        restaurant.copy(
                            address = it.address,
                            phone = it.phone,
                            website = it.website,
                            latitude = it.latitude,
                            longitude = it.longitude,
                            source = "Kakao",
                        )
                    } ?: restaurant
            else restaurant
        if (googleKey.isBlank()) return base
        return try {
            val body = buildJsonObject {
                put("textQuery", "${base.name} ${base.address}".trim())
                put("includedType", "restaurant")
                put("languageCode", "ko")
                put("regionCode", "KR")
                put("maxResultCount", 5)
                if (base.latitude != null && base.longitude != null)
                    put(
                        "locationBias",
                        buildJsonObject {
                            put(
                                "circle",
                                buildJsonObject {
                                    put(
                                        "center",
                                        buildJsonObject {
                                            put("latitude", base.latitude)
                                            put("longitude", base.longitude)
                                        },
                                    )
                                    put("radius", 500)
                                },
                            )
                        },
                    )
            }
            val raw =
                http
                    .json(
                        Request.Builder()
                            .url("https://places.googleapis.com/v1/places:searchText")
                            .header("X-Goog-Api-Key", googleKey)
                            .header(
                                "X-Goog-FieldMask",
                                "places.id,places.displayName,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.regularOpeningHours,places.rating,places.userRatingCount,places.photos",
                            )
                            .post(body.requestBody())
                            .build()
                    )
                    .jsonObject
                    .array("places")
                    .firstOrNull()
                    ?.jsonObject ?: return base
            val photo = raw.array("photos").firstOrNull()?.jsonObject
            val photoURL =
                photo
                    ?.string("name")
                    ?.takeIf { it.matches(Regex("places/[^/]+/photos/[^/]+")) }
                    ?.let { name ->
                        runCatching {
                            http
                                .json(
                                    Request.Builder()
                                        .url(
                                            "https://places.googleapis.com/v1/$name/media"
                                                .toHttpUrl()
                                                .newBuilder()
                                                .addQueryParameter("maxWidthPx", "1200")
                                                .addQueryParameter("skipHttpRedirect", "true")
                                                .build()
                                        )
                                        .header("X-Goog-Api-Key", googleKey)
                                        .build()
                                )
                                .jsonObject
                                .string("photoUri")
                                .takeIf { it.startsWith("https://") }
                        }
                            .getOrNull()
                    }
            base.copy(
                phone = base.phone.ifBlank { raw.string("nationalPhoneNumber") },
                website = raw.string("websiteUri").ifBlank { base.website },
                googleMapsURL = raw.string("googleMapsUri").takeIf { it.isNotBlank() },
                googleRating = raw["rating"]?.jsonPrimitive?.doubleOrNull,
                googleRatingCount = raw["userRatingCount"]?.jsonPrimitive?.intOrNull,
                hours =
                    raw.obj("regularOpeningHours").array("weekdayDescriptions").map {
                        it.jsonPrimitive.content
                    },
                photoURL = photoURL,
                photoAttribution =
                    photo
                        ?.array("authorAttributions")
                        ?.map { it.jsonObject.string("displayName") }
                        ?.joinToString(", "),
            )
        } catch (_: java.io.IOException) {
            base
        }
    }
}
