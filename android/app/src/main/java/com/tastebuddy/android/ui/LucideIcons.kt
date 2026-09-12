// Lucide 0.487.0, ISC License. Tools/sync-icons.py에서 생성.
package com.tastebuddy.android.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

object Icons {
    private fun vector(name: String, paths: List<String>, mirrored: Boolean = false): ImageVector {
        val builder = ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f, autoMirror = mirrored)
        paths.forEach {
            builder.addPath(
                PathParser().parsePathString(it).toNodes(),
                fill = null,
                stroke = SolidColor(Color.Black),
                strokeLineWidth = 1.8f,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round,
            )
        }
        return builder.build()
    }

    object Outlined {
        val Add by lazy { vector("plus", listOf("M5 12h14", "M12 5v14"), false) }
        val AutoAwesome by lazy {
            vector(
                "sparkles",
                listOf(
                    "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
                    "M20 3v4",
                    "M22 5h-4",
                    "M4 17v2",
                    "M5 18H3",
                ),
                false,
            )
        }
        val BookmarkBorder by lazy {
            vector("bookmark", listOf("m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"), false)
        }
        val Home by lazy {
            vector(
                "house",
                listOf(
                    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
                    "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
                ),
                false,
            )
        }
        val Person by lazy {
            vector(
                "user",
                listOf(
                    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
                    "M8.0 7.0a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0",
                ),
                false,
            )
        }
        val Restaurant by lazy {
            vector(
                "utensils",
                listOf(
                    "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
                    "M7 2v20",
                    "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
                ),
                false,
            )
        }
        val Search by lazy {
            vector(
                "search",
                listOf("M3.0 11.0a8.0 8.0 0 1 0 16.0 0a8.0 8.0 0 1 0 -16.0 0", "m21 21-4.3-4.3"),
                false,
            )
        }
        val Close by lazy { vector("x", listOf("M18 6 6 18", "m6 6 12 12"), false) }
        val Edit by lazy {
            vector(
                "pencil",
                listOf(
                    "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
                    "m15 5 4 4",
                ),
                false,
            )
        }
        val CameraAlt by lazy {
            vector(
                "camera",
                listOf(
                    "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
                    "M9.0 13.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                ),
                false,
            )
        }
        val PhotoCamera by lazy {
            vector(
                "camera",
                listOf(
                    "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
                    "M9.0 13.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                ),
                false,
            )
        }
        val FlashOff by lazy {
            vector(
                "zap-off",
                listOf(
                    "M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317",
                    "M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773",
                    "M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643",
                    "m2 2 20 20",
                ),
                false,
            )
        }
        val FlashOn by lazy {
            vector(
                "zap",
                listOf(
                    "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
                ),
                false,
            )
        }
        val PhotoLibrary by lazy {
            vector(
                "image",
                listOf(
                    "M5.0 3.0H19.0Q21.0 3.0 21.0 5.0V19.0Q21.0 21.0 19.0 21.0H5.0Q3.0 21.0 3.0 19.0V5.0Q3.0 3.0 5.0 3.0Z",
                    "M7.0 9.0a2.0 2.0 0 1 0 4.0 0a2.0 2.0 0 1 0 -4.0 0",
                    "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
                ),
                false,
            )
        }
        val FavoriteBorder by lazy {
            vector(
                "heart",
                listOf(
                    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                ),
                false,
            )
        }
        val PersonAdd by lazy {
            vector(
                "user-plus",
                listOf(
                    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
                    "M5.0 7.0a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0",
                    "M19 8L19 14",
                    "M22 11L16 11",
                ),
                false,
            )
        }
        val Settings by lazy {
            vector(
                "settings",
                listOf(
                    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
                    "M9.0 12.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                ),
                false,
            )
        }
        val Share by lazy {
            vector(
                "share-2",
                listOf(
                    "M15.0 5.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                    "M3.0 12.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                    "M15.0 19.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0",
                    "M8.59 13.51L15.42 17.49",
                    "M15.41 6.51L8.59 10.49",
                ),
                false,
            )
        }
        val ArrowBack by lazy { vector("arrow-left", listOf("m12 19-7-7 7-7", "M19 12H5"), true) }
        val KeyboardArrowRight by lazy { vector("chevron-right", listOf("m9 18 6-6-6-6"), true) }
    }

    object AutoMirrored {
        object Outlined {
            val ArrowBack
                get() = Icons.Outlined.ArrowBack

            val KeyboardArrowRight
                get() = Icons.Outlined.KeyboardArrowRight
        }
    }
}
