package com.tastebuddy.android.domain

import kotlin.math.*

data class Bubble(
    val id: String,
    val axis: TasteAxis,
    val label: String,
    val description: String,
    val intensity: Int,
    val angle: Double,
    val radiusOffset: Double,
)

@kotlinx.serialization.Serializable
data class TasteMapCoordinate(val id: String, val x: Double, val y: Double)

data class TasteMapPoint(val bubble: Bubble, val x: Double, val y: Double, val size: Double = 126.0)

/** iOS TasteExperienceMapEngine의 육각 격자, 슬롯 보정, 선택 후 충돌 완화 규칙. */
object TasteMapLayout {
    const val center = 840.0
    const val spacing = 136.0
    const val entryZoom = .86f
    const val minZoom = .72f
    const val maxZoom = 1.42f

    /** 기본 배치는 iOS 엔진에서 내보낸 좌표를 사용해 플랫폼별 부동소수점 정렬 차이를 없앤다. */
    fun base(bubbles: List<Bubble>, coordinates: List<TasteMapCoordinate>): List<TasteMapPoint> {
        require(bubbles.map { it.id }.toSet() == coordinates.map { it.id }.toSet()) {
            "맛 지도와 선택 항목의 버전이 다릅니다."
        }
        val byID = coordinates.associateBy { it.id }
        return bubbles.map { bubble ->
            val point = byID.getValue(bubble.id)
            TasteMapPoint(bubble, point.x, point.y)
        }
    }

    fun render(base: List<TasteMapPoint>, selected: Set<String>): List<TasteMapPoint> {
        val picked = base.filter { it.bubble.id in selected }
        if (picked.isEmpty()) return base
        val positions =
            base
                .map { point ->
                    if (point.bubble.id in selected) point.copy(size = 164.0)
                    else {
                        val nearest = picked.minBy { hypot(point.x - it.x, point.y - it.y) }
                        val dx = point.x - nearest.x
                        val dy = point.y - nearest.y
                        val distance = hypot(dx, dy).coerceAtLeast(.001)
                        point.copy(
                            x = point.x + dx / distance * 19,
                            y = point.y + dy / distance * 19,
                        )
                    }
                }
                .toMutableList()
        repeat(12) {
            for (leftIndex in positions.indices) for (rightIndex in
                leftIndex + 1 until positions.size) {
                val a = positions[leftIndex]
                val b = positions[rightIndex]
                val dx = b.x - a.x
                val dy = b.y - a.y
                val distance = hypot(dx, dy).coerceAtLeast(.001)
                val overlap = (a.size + b.size) / 2 + 10 - distance
                if (overlap <= 0) continue
                positions[leftIndex] =
                    a.copy(
                        x = a.x - dx / distance * overlap / 2,
                        y = a.y - dy / distance * overlap / 2,
                    )
                positions[rightIndex] =
                    b.copy(
                        x = b.x + dx / distance * overlap / 2,
                        y = b.y + dy / distance * overlap / 2,
                    )
            }
        }
        return positions
    }
}
