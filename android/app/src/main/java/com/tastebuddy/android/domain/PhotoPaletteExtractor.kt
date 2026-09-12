package com.tastebuddy.android.domain

import kotlin.math.*

/** iOS와 같은 OKLab 군집·면적 정렬·유사색 병합. 사진 색은 취향 근거가 아니다. */
object PhotoPaletteExtractor {
    data class RGB(val r: Double, val g: Double, val b: Double) {
        val hex
            get() =
                "#%02X%02X%02X"
                    .format(
                        (r.coerceIn(0.0, 1.0) * 255).roundToInt(),
                        (g.coerceIn(0.0, 1.0) * 255).roundToInt(),
                        (b.coerceIn(0.0, 1.0) * 255).roundToInt(),
                    )
    }

    data class Lab(val l: Double, val a: Double, val b: Double) {
        val chroma
            get() = hypot(a, b)

        val hue
            get() = ((atan2(b, a) % (2 * PI)) + 2 * PI) % (2 * PI)
    }

    private data class Point(val lab: Lab, val weight: Double)

    private fun distance(a: Lab, b: Lab) =
        (a.l - b.l).pow(2) + (a.a - b.a).pow(2) + (a.b - b.b).pow(2)

    fun lab(rgb: RGB): Lab {
        fun linear(v: Double) = if (v <= 0.04045) v / 12.92 else ((v + 0.055) / 1.055).pow(2.4)
        val r = linear(rgb.r)
        val g = linear(rgb.g)
        val b = linear(rgb.b)
        val l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
        val m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
        val s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
        return Lab(
            0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
        )
    }

    fun extract(pixels: List<RGB>): PhotoPalette {
        if (pixels.size < 4) return PhotoPalette.neutral
        val samples = pixels.map { it to lab(it) }
        val light = samples.map { it.second.l }.sorted()
        if (light[((light.size - 1) * 0.75).toInt()] < 0.27) return PhotoPalette.neutral
        val chromatic = samples.filter { it.second.l in 0.22..0.95 && it.second.chroma >= 0.028 }
        if (
            chromatic.size < max(4, ceil(pixels.size * 0.08).toInt()) ||
                chromatic.map { it.second.chroma }.average() < 0.035
        )
            return PhotoPalette.neutral
        val points =
            chromatic
                .groupBy { (rgb, _) ->
                    (min(15, (rgb.r * 16).toInt()) shl 8) or
                        (min(15, (rgb.g * 16).toInt()) shl 4) or
                        min(15, (rgb.b * 16).toInt())
                }
                .values
                .map { group ->
                    Point(
                        Lab(
                            group.map { it.second.l }.average(),
                            group.map { it.second.a }.average(),
                            group.map { it.second.b }.average(),
                        ),
                        group.size.toDouble(),
                    )
                }
                .sortedWith(
                    compareByDescending<Point> { it.weight }
                        .thenBy { it.lab.l }
                        .thenBy { it.lab.a }
                        .thenBy { it.lab.b }
                )
        val total = points.sumOf { it.weight }
        val centers = mutableListOf(points[0].lab)
        while (centers.size < min(12, points.size)) {
            val candidates = points.map { p ->
                val d = centers.minOf { distance(p.lab, it) }
                Triple(p, d, (p.weight / max(1.0, total)).pow(0.72) * d)
            }
            val candidate =
                candidates.maxWithOrNull(
                    compareBy<Triple<Point, Double, Double>> { it.third }.thenBy { it.first.weight }
                ) ?: break
            if (candidate.second < 0.0016) break
            centers += candidate.first.lab
        }
        fun nearest(point: Lab) = centers.indices.minBy { distance(point, centers[it]) }
        for (iteration in 0 until 10) {
            val groups = points.groupBy { nearest(it.lab) }
            var moved = false
            for ((index, group) in groups) {
                val weight = group.sumOf { it.weight }
                val next =
                    Lab(
                        group.sumOf { it.lab.l * it.weight } / weight,
                        group.sumOf { it.lab.a * it.weight } / weight,
                        group.sumOf { it.lab.b * it.weight } / weight,
                    )
                if (distance(next, centers[index]) > 0.0000005) moved = true
                centers[index] = next
            }
            if (!moved) break
        }
        val clusters =
            points
                .groupBy { nearest(it.lab) }
                .map { group -> Point(centers[group.key], group.value.sumOf { it.weight }) }
                .sortedByDescending { it.weight }
        val merged = mutableListOf<Point>()
        for (cluster in clusters.filter { it.lab.chroma >= 0.028 }) {
            val match =
                merged.indices
                    .filter { index ->
                        val d = abs(cluster.lab.hue - merged[index].lab.hue)
                        min(d, 2 * PI - d) < 22 * PI / 180 ||
                            distance(cluster.lab, merged[index].lab) < 0.005625
                    }
                    .minByOrNull { distance(cluster.lab, merged[it].lab) }
            if (match == null) merged += cluster
            else {
                val old = merged[match]
                val w = old.weight + cluster.weight
                merged[match] =
                    Point(
                        Lab(
                            (old.lab.l * old.weight + cluster.lab.l * cluster.weight) / w,
                            (old.lab.a * old.weight + cluster.lab.a * cluster.weight) / w,
                            (old.lab.b * old.weight + cluster.lab.b * cluster.weight) / w,
                        ),
                        w,
                    )
            }
        }
        val distinct =
            merged
                .filter { it.weight / max(1.0, total) >= 0.04 }
                .sortedWith(compareByDescending<Point> { it.weight }.thenBy { it.lab.l })
                .take(3)
        if (distinct.isEmpty()) return PhotoPalette.neutral
        val normalized = distinct.map {
            mapped(
                it.lab.l.coerceIn(0.60, 0.80),
                (it.lab.chroma * 1.04).coerceIn(0.08, 0.20),
                it.lab.hue,
            )
        }
        val colors =
            when (normalized.size) {
                1 -> {
                    val seed = lab(quantized(normalized[0]))
                    val l = seed.l.coerceIn(0.66, 0.72)
                    listOf(
                        mapped(l, seed.chroma, seed.hue),
                        mapped(min(0.80, l + 0.08), max(0.08, seed.chroma * 0.90), seed.hue),
                        mapped(max(0.60, l - 0.07), max(0.08, seed.chroma * 0.86), seed.hue),
                    )
                }
                2 -> {
                    val seed = lab(quantized(normalized[0]))
                    val l =
                        if (seed.l >= 0.70) max(0.60, seed.l - 0.09) else min(0.80, seed.l + 0.09)
                    normalized + mapped(l, max(0.08, seed.chroma * 0.88), seed.hue)
                }
                else -> normalized
            }
        val weight = distinct.sumOf { it.weight }
        return PhotoPalette(
            colors.map { it.hex },
            "photo",
            normalized.size,
            (distinct.map { it.weight / weight } + listOf(0.0, 0.0, 0.0)).take(3),
        )
    }

    private fun quantized(rgb: RGB) =
        RGB(
            (rgb.r * 255).roundToInt() / 255.0,
            (rgb.g * 255).roundToInt() / 255.0,
            (rgb.b * 255).roundToInt() / 255.0,
        )

    private fun mapped(lightness: Double, chroma: Double, hue: Double): RGB {
        fun linear(c: Double): RGB {
            val a = c * cos(hue)
            val b = c * sin(hue)
            val l = (lightness + 0.3963377774 * a + 0.2158037573 * b).pow(3)
            val m = (lightness - 0.1055613458 * a - 0.0638541728 * b).pow(3)
            val s = (lightness - 0.0894841775 * a - 1.291485548 * b).pow(3)
            return RGB(
                4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
            )
        }
        fun inGamut(rgb: RGB) = listOf(rgb.r, rgb.g, rgb.b).all { it in -0.000001..1.000001 }
        var rgb = linear(chroma)
        if (!inGamut(rgb)) {
            var lower = 0.0
            var upper = chroma
            repeat(14) {
                val candidate = (lower + upper) / 2
                if (inGamut(linear(candidate))) lower = candidate else upper = candidate
            }
            rgb = linear(lower)
        }
        fun encoded(v: Double): Double {
            val c = v.coerceIn(0.0, 1.0)
            return if (c <= 0.0031308) 12.92 * c else 1.055 * c.pow(1 / 2.4) - 0.055
        }
        return RGB(encoded(rgb.r), encoded(rgb.g), encoded(rgb.b))
    }
}
