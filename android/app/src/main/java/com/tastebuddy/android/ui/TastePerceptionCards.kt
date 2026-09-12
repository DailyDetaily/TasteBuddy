package com.tastebuddy.android.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tastebuddy.android.domain.*
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TastePerceptionCards(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val snapshot by vm.analysis.collectAsState()
    val model = snapshot.perception
    val survey = remember(state.profile, state.profileHistory) {
        SurveyPerception.points((listOfNotNull(state.profile) + state.profileHistory).mapNotNull { it.surveySubmission })
    }
    var showMeals by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<String?>(null) }
    var showPrevious by remember { mutableStateOf(false) }
    var sourceMenu by remember { mutableStateOf(false) }
    val surveyChanges = survey.filter { it.hasChange }
    val hasComparison = model.patterns.any { it.previousLevel != null && it.currentLevel != null } || survey.any { it.previousValue != null && it.value != null }
    val currentPatterns = TasteAxis.entries.mapNotNull { model.current(it) }
    fun valuesFor(previous: Boolean): Map<TasteAxis, Float> = if (showMeals) currentPatterns.mapNotNull { pattern ->
        (if (previous) pattern.previousLevel else pattern.currentLevel)?.let { pattern.axis to (it + 1).toFloat() }
    }.toMap() else survey.mapNotNull { point -> (if (previous) point.previousValue else point.value)?.let { point.axis to it.toFloat() } }.toMap()
    val values = valuesFor(showPrevious)
    val reference = if (showPrevious) emptyMap() else valuesFor(true)
    val hasPrevious = if (showMeals) currentPatterns.any { it.previous.mealIDs.isNotEmpty() } else survey.any { it.previousSubmission != null }
    val count = if (showMeals) currentPatterns.flatMap { (if (showPrevious) it.previous else it.recent).mealIDs }.distinct().size else values.size
    val dates = if (showMeals) currentPatterns.flatMap { val period = if (showPrevious) it.previous else it.recent; listOfNotNull(period.start, period.end) }
        else survey.mapNotNull { parseInstant((if (showPrevious) it.previousSubmission else it.submission)?.recordedAt)?.toEpochMilli() }
    val formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd").withZone(ZoneId.systemDefault())
    fun dateLabel(value: Long) = formatter.format(Instant.ofEpochMilli(value))
    val periodLabel = if (dates.isEmpty()) { if (showPrevious) "이전 기록" else "최근 기록" }
        else if (dateLabel(dates.min()) == dateLabel(dates.max())) dateLabel(dates.min()) else "${dateLabel(dates.min())} – ${dateLabel(dates.max())}"
    Section("맛을 느끼는 경향") {
        CardBox(Modifier.testTag("taste-perception-radar")) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                IconButton({ showPrevious = true }, enabled = !showPrevious && hasPrevious) { Icon(Icons.Outlined.KeyboardArrowRight, "이전 기간 보기", Modifier.rotate(180f)) }
                Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                    TextButton({ sourceMenu = true }) { Text(periodLabel, color = TB.ink, style = MaterialTheme.typography.labelLarge) }
                    DropdownMenu(sourceMenu, { sourceMenu = false }) {
                        DropdownMenuItem(text = { Text("기준 음식 회상") }, onClick = { showMeals = false; showPrevious = false; sourceMenu = false })
                        DropdownMenuItem(text = { Text("식사 기록") }, onClick = { showMeals = true; showPrevious = false; sourceMenu = false })
                    }
                }
                IconButton({ showPrevious = false }, enabled = showPrevious) { Icon(Icons.Outlined.KeyboardArrowRight, "다음 기간 보기") }
            }
            PerceptionRadar(values, if (showMeals) 3f else 4f, reference)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.Bottom) {
                Column(Modifier.heightIn(min = 44.dp).clickable { detail = if (showMeals) "meal" else "survey" }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom) {
                    Text("나의 반응", style = MaterialTheme.typography.labelSmall, color = TB.hint)
                    Spacer(Modifier.height(4.dp))
                    RadarValueBadge(if (count == 0) "기록 없음" else if (showMeals) "식사 ${count}회" else "회상 ${count}개")
                }
                Text("→", Modifier.padding(horizontal = 4.dp).size(24.dp).background(TB.hint, RoundedCornerShape(6.dp)), color = Color.White, textAlign = TextAlign.Center)
                Column(Modifier.heightIn(min = 44.dp).clickable(enabled = reference.isNotEmpty()) { detail = if (showMeals) "meal" else "survey" }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom) {
                    Text("기준 반응", style = MaterialTheme.typography.labelSmall, color = TB.hint)
                    Spacer(Modifier.height(4.dp))
                    RadarValueBadge(if (reference.isNotEmpty()) "이전 기록" else "아직 없음")
                }
            }
        }
        CardBox(Modifier.testTag("taste-perception-change").clickable { vm.open("tasteChange") }) {
            Text("미각변화", fontWeight = FontWeight.Bold)
            Text(model.changes.firstOrNull()?.let { "${it.axis.label}을 느낀 강도가 달라졌어요" }
                ?: if (surveyChanges.isNotEmpty()) "기준 음식에서 기억한 강도가 달라졌어요" else "아직 변화없음", style = MaterialTheme.typography.titleMedium)
            if (!hasComparison) TasteChangeEmptySummary()
            Text(model.changes.firstOrNull()?.let { "${it.conditionLabel} · 이전 ${it.previous.mealIDs.size}번과 최근 ${it.recent.mealIDs.size}번의 식사" }
                ?: if (surveyChanges.isNotEmpty()) "같은 음식·조건·척도로 남긴 이전·최근 회상 응답을 비교했어요."
                else if (hasComparison) "비교한 기록에서는 같은 강도로 남겼어요." else "비교할 기록이 더 필요해요.", color = TB.body)
            TextButton({ vm.open("tasteChange") }) { Text("기록 비교") }
        }
        CardBox {
            Text("특이사항", fontWeight = FontWeight.Bold)
            Text(if (model.contrasts.isEmpty()) "조건별 차이는 확인 중" else "같은 음식도 조건에 따라 다르게 느꼈어요", style = MaterialTheme.typography.titleMedium)
            Text(model.contrasts.firstOrNull()?.let { "${it.first.conditionLabel} · ${it.second.conditionLabel} — 근거 ${it.mealIDs.size}번의 식사" }
                ?: "같은 음식의 부위나 시점을 다르게 남긴 반복 기록을 살펴봐요.", color = TB.body)
            TextButton({ detail = "conditions" }) { Text("조건과 근거") }
        }
    }
    if (detail != null) {
        val patterns = when (detail) {
            "meal" -> currentPatterns
            "conditions" -> model.contrasts.flatMap { listOf(it.first, it.second) }.distinctBy { it.id }
            else -> emptyList()
        }
        val points = if (detail == "survey") survey else emptyList()
        ModalBottomSheet(onDismissRequest = { detail = null }) {
            Page {
                Text("강도 기록과 적용 조건", style = MaterialTheme.typography.titleLarge)
                if (patterns.isEmpty() && points.isEmpty()) Text("비교할 기록이 더 필요해요. 음식·부위·시점과 직접 느낀 강도를 함께 남겨주세요.")
                patterns.forEach { pattern ->
                    CardBox {
                        Text(pattern.axis.label, fontWeight = FontWeight.Bold)
                        Text(pattern.conditionLabel, color = TB.body)
                        Text("최근 ${pattern.recent.mealIDs.size}번의 식사 · ${perceptionDates(pattern.recent)}")
                        Text(pattern.currentLevel?.let { "${TastePerception.levelLabels[it]} 느낀 경향" } ?: "확인 중")
                        Text(pattern.counts.mapIndexedNotNull { index, count -> if (count > 0) "${TastePerception.levelLabels[index]} ${count}번" else null }.joinToString(" · "), color = TB.body)
                        pattern.previousLevel?.let { Text("이전 ${pattern.previous.mealIDs.size}번 · ${perceptionDates(pattern.previous)} · ${TastePerception.levelLabels[it]}") }
                        if (pattern.conflictCount > 0) Text("같은 식사에서 강도 응답이 나뉜 기록 ${pattern.conflictCount}개")
                        Text("기록된 음식·부위·시점 안에서만 비교해요. 조리 상태와 온도 등 기록하지 않은 조건이나 변화의 원인은 알 수 없어요.", color = TB.hint)
                        TextButton({
                            vm.evidenceIDs.value = (pattern.recent.evidenceIDs + pattern.previous.evidenceIDs).distinct()
                            detail = null; vm.open("evidence")
                        }) { Text("원본 기록과 응답 보기") }
                    }
                }
                points.forEach { point ->
                    val item = point.item; val submission = point.submission
                    if (item != null && submission != null) CardBox {
                        Text("${point.axis.label} · ${item.anchor.label}", fontWeight = FontWeight.Bold)
                        Text("최근 · ${submission.recordedAt.take(10)} · ${submission.responseLabel(item.id)}")
                        point.previousSubmission?.let { Text("이전 · ${it.recordedAt.take(10)} · ${it.responseLabel(item.id)}") }
                        Text(item.prompt)
                        item.anchor.conditions.forEach { Text(it, color = TB.body) }
                        Text("회상 응답은 실제 식사 횟수에 포함하지 않아요.", color = TB.hint)
                    }
                }
            }
        }
    }
}

@Composable
private fun TasteChangeEmptySummary() {
    Column(Modifier.fillMaxWidth().clearAndSetSemantics { contentDescription = "상승 변화와 하강 변화 모두 비교 기록 없음" }, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        listOf("상승 변화", "하강 변화").forEach { label ->
            Row(Modifier.fillMaxWidth().height(24.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Canvas(Modifier.size(18.dp).background(TB.hint, RoundedCornerShape(4.dp))) {
                        drawLine(Color.White, Offset(size.width * .3f, size.height / 2), Offset(size.width * .7f, size.height / 2), strokeWidth = 1.5.dp.toPx(), cap = StrokeCap.Round)
                    }
                    Text(label, color = TB.hint, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                }
                Canvas(Modifier.width(132.dp).height(24.dp)) {
                    // Decorative empty state, independent of recorded values.
                    val radius = 6.dp.toPx()
                    val start = Offset(radius, size.height / 2)
                    val end = Offset(size.width - radius, start.y)
                    drawLine(TB.hint.copy(alpha = .12f), start, end, strokeWidth = 12.dp.toPx(), cap = StrokeCap.Round)
                    drawLine(Brush.linearGradient(listOf(TB.hint.copy(alpha = .25f), TB.hint), start, end), start, end, strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
                    drawCircle(TB.hint, radius, end)
                }
            }
        }
    }
}

private fun perceptionDates(period: PerceptionPeriod): String {
    val formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd").withZone(ZoneId.systemDefault())
    return if (period.start != null && period.end != null) "${formatter.format(Instant.ofEpochMilli(period.start))}–${formatter.format(Instant.ofEpochMilli(period.end))}" else "시점 확인 중"
}

@Composable
private fun PerceptionRadar(values: Map<TasteAxis, Float>, maximum: Float, reference: Map<TasteAxis, Float>) {
    val axes = TasteAxis.entries
    BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(320f / 310f).clearAndSetSemantics { contentDescription = axes.joinToString(", ") { axis -> "${axis.label} ${values[axis]?.let { "강도 $it" } ?: "기록 없음"}" } }) {
        val scale = maxWidth / 320f
        Canvas(Modifier.matchParentSize()) {
            val factor = size.width / 320f
            val center = Offset(160f * factor, 145f * factor)
            fun point(index: Int, radius: Float): Offset {
                val angle = Math.PI / 3 * index - Math.PI / 2 - Math.PI / 6
                return center + Offset((cos(angle) * radius * factor).toFloat(), (sin(angle) * radius * factor).toFloat())
            }
            listOf(.25f, .5f, .75f, 1f).forEach { level ->
                val path = Path().apply { axes.indices.forEach { index -> val p = point(index, level * 100); if (index == 0) moveTo(p.x, p.y) else lineTo(p.x, p.y) }; close() }
                drawPath(path, Color(0xFFF3F3F3), style = Stroke(factor))
            }
            listOf(0 to 3, 1 to 4, 2 to 5).forEach { (a, b) -> drawLine(Color(0xFFF3F3F3), point(a, 100f), point(b, 100f), factor) }
            if (reference.size == axes.size) {
                val path = Path().apply { axes.forEachIndexed { index, axis -> val p = point(index, reference.getValue(axis) / maximum * 100f); if (index == 0) moveTo(p.x, p.y) else lineTo(p.x, p.y) }; close() }
                drawPath(path, Color(0xFFD0D0D0), style = Stroke(1.5f * factor))
            }
            val points = axes.mapIndexed { index, axis ->
                val value = values[axis]?.takeIf { it.isFinite() && it in 0f..maximum } ?: 0f
                point(index, maxOf(18f * (25f / 27f) + 8f, value / maximum * 100f - 8f))
            }
            axes.forEachIndexed { index, axis -> drawLine(lerp(Color(axis.main), Color.White, .6f), center, points[index], 16f * factor, StrokeCap.Round) }
            val mask = Path().apply {
                repeat(12) { index ->
                    val angle = (-90 + index * 30) * Math.PI / 180
                    val radius = 18f * (25f / 27f) * factor / if (index % 2 == 0) 1f else kotlin.math.sqrt(3f)
                    val p = center + Offset((cos(angle) * radius).toFloat(), (sin(angle) * radius).toFloat())
                    if (index == 0) moveTo(p.x, p.y) else lineTo(p.x, p.y)
                }; close()
            }
            drawPath(mask, Color.White)
            axes.forEachIndexed { index, axis -> drawLine(lerp(Color(axis.main), Color.White, .5f), points[index], points[(index + 1) % axes.size], 2f * factor, StrokeCap.Round) }
            axes.forEachIndexed { index, axis -> drawCircle(Color(axis.main), 8f * factor, points[index]) }

        }
        axes.forEachIndexed { index, axis ->
            val angle = Math.PI / 3 * index - Math.PI / 2 - Math.PI / 6
            Text(axis.label, modifier = Modifier.offset(x = scale * (160 + cos(angle).toFloat() * 118 - 26), y = scale * (145 + sin(angle).toFloat() * 118 - 8)).width(scale * 52),
                color = TB.hint, textAlign = TextAlign.Center, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun RadarValueBadge(label: String) {
    Box(Modifier.height(24.dp).background(TB.ink, RoundedCornerShape(6.dp)).padding(horizontal = 10.dp), contentAlignment = Alignment.Center) {
        Text(label, color = Color.White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasteChangeScreen(vm: AppViewModel) {
    val state by vm.state.collectAsState()
    val snapshot by vm.analysis.collectAsState()
    val allSeries = remember(snapshot.perception, state.profile, state.profileHistory) {
        TasteChangeSeries.build(snapshot.perception, SurveyPerception.points((listOfNotNull(state.profile) + state.profileHistory).mapNotNull { it.surveySubmission }))
    }
    val first = allSeries.firstOrNull { TasteChangeSeries.changeLabel(it.points) !in listOf("비교 부족", "같은 강도") } ?: allSeries.firstOrNull()
    var axis by remember { mutableStateOf(first?.axis ?: TasteAxis.sweet) }
    var selectedID by remember { mutableStateOf(first?.id) }
    var months by remember { mutableStateOf(0) }
    var offset by remember { mutableStateOf(0) }
    var sourceMenu by remember { mutableStateOf(false) }
    val choices = allSeries.filter { it.axis == axis }
    val selected = choices.firstOrNull { it.id == selectedID } ?: choices.firstOrNull()
    val points = selected?.points.orEmpty()
    val latest = points.maxOfOrNull { it.date } ?: System.currentTimeMillis()
    val endDate = Instant.ofEpochMilli(latest).atZone(ZoneId.systemDefault()).plusMonths((offset * months).toLong())
    val end = endDate.toInstant().toEpochMilli()
    val start = if (months == 0) points.minOfOrNull { it.start } ?: end else endDate.minusMonths(months.toLong()).toInstant().toEpochMilli()
    val visible = points.filter { it.date in start..end }
    val formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd").withZone(ZoneId.systemDefault())
    fun dateLabel(value: Long) = formatter.format(Instant.ofEpochMilli(value))
    fun move(direction: Int) { axis = TasteAxis.entries[(axis.ordinal + direction + 6) % 6]; selectedID = null; offset = 0 }
    Screen("미각 변화", back = vm::back) { padding ->
        Page(Modifier.padding(padding).testTag("taste-change-screen")) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                listOf(1, 3, 6, 12, 0).forEach { value ->
                    TextButton({ months = value; offset = 0 }, colors = ButtonDefaults.textButtonColors(contentColor = if (months == value) Color(axis.main) else TB.hint)) {
                        Text(if (value == 0) "전부" else if (value == 12) "1년" else "${value}개월")
                    }
                }
            }
            CardBox {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    IconButton({ offset -= 1 }, enabled = months > 0 && points.any { it.date < start }) { Icon(Icons.Outlined.KeyboardArrowRight, "이전 기간 보기", Modifier.rotate(180f)) }
                    Text(if (selected == null) "기록 대기" else "${dateLabel(start)} – ${dateLabel(end)}", Modifier.weight(1f), textAlign = TextAlign.Center, fontWeight = FontWeight.SemiBold)
                    IconButton({ offset += 1 }, enabled = offset < 0) { Icon(Icons.Outlined.KeyboardArrowRight, "다음 기간 보기") }
                }
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    TextButton({ move(-1) }) { Text(TasteAxis.entries[(axis.ordinal + 5) % 6].label, color = TB.hint) }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(axis.label, color = Color(axis.main), fontWeight = FontWeight.Bold)
                        Text(visible.lastOrNull()?.label ?: "기록 없음", style = MaterialTheme.typography.labelSmall)
                    }
                    TextButton({ move(1) }) { Text(TasteAxis.entries[(axis.ordinal + 1) % 6].label, color = TB.hint) }
                }
                if (selected != null) Box {
                    TextButton({ sourceMenu = true }) { Text("${selected.source} · ${selected.condition}", color = TB.body) }
                    DropdownMenu(sourceMenu, { sourceMenu = false }) {
                        choices.forEach { row -> DropdownMenuItem(text = { Text("${row.source} · ${row.condition}") }, onClick = { selectedID = row.id; offset = 0; sourceMenu = false }) }
                    }
                }
                TasteChangeChart(axis, visible, selected?.maximum ?: 4, start, end)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("이전" to (visible.firstOrNull { it.id == "이전" }?.label ?: "기록 없음"), "최근" to (visible.firstOrNull { it.id == "최근" }?.label ?: "기록 없음"), "변화" to TasteChangeSeries.changeLabel(visible)).forEach { (label, value) ->
                        Column(Modifier.weight(1f).background(TB.muted, RoundedCornerShape(12.dp)).padding(10.dp)) {
                            Text(label, color = TB.hint, style = MaterialTheme.typography.labelSmall)
                            Text(value, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
            }
            Section("미각 세부 정보") {
                CardBox {
                    Text(if (visible.size == 2) "같은 음식·조건에서 ${TasteChangeSeries.changeLabel(visible)} 남겼어요." else "아직 변화없음 · 이 기간에 비교할 기록이 더 필요해요.")
                    (selected?.details ?: listOf("같은 음식·조건에서 직접 느낀 강도를 남기면 이전과 최근을 비교할 수 있어요.")).forEach { Text(it, color = TB.body) }
                }
                visible.forEach { point -> CardBox {
                    Text("${point.id} · ${dateLabel(point.start)} – ${dateLabel(point.date)}", fontWeight = FontWeight.SemiBold)
                    Text("${point.label} · ${if (selected?.source == "식사 기록") "식사 ${point.count}회" else "회상 응답 ${point.count}개"}")
                    if (point.evidenceIDs.isNotEmpty()) TextButton({ vm.evidenceIDs.value = point.evidenceIDs; vm.open("evidence") }) { Text("원본 기록과 응답 보기") }
                } }
            }
        }
    }
}

@Composable
private fun TasteChangeChart(axis: TasteAxis, points: List<TasteChangePoint>, maximum: Int, start: Long, end: Long) {
    val color = Color(axis.main)
    Box(Modifier.fillMaxWidth().height(280.dp).clearAndSetSemantics { contentDescription = "${axis.label} 미각 변화 그래프, " + points.joinToString { "${it.id} ${it.label}" } }) {
        Canvas(Modifier.fillMaxSize().padding(start = 12.dp, end = 42.dp, top = 14.dp, bottom = 30.dp)) {
            for (value in 0..maximum) {
                val y = size.height * (1 - value.toFloat() / maximum)
                drawLine(Color(0xFFE6E8ED), Offset(0f, y), Offset(size.width, y), 1.dp.toPx())
            }
            val positions = points.map { point -> Offset(size.width * (if (end == start) .5f else (point.date - start).toFloat() / (end - start)), size.height * (1 - point.value.toFloat() / maximum)) }
            positions.zipWithNext().forEach { (a, b) ->
                drawLine(color.copy(alpha = .18f), a, b, 12.dp.toPx(), StrokeCap.Round)
                drawLine(color, a, b, 2.dp.toPx(), StrokeCap.Round)
            }
            positions.forEach { drawCircle(color, 6.dp.toPx(), it) }
        }
        Column(Modifier.align(Alignment.CenterEnd).fillMaxHeight().padding(top = 7.dp, bottom = 23.dp), verticalArrangement = Arrangement.SpaceBetween) {
            (maximum downTo 0).forEach { value -> Text(if (maximum == 2) listOf("약함", "중간", "강함")[value] else "${value}단계", color = TB.hint, style = MaterialTheme.typography.labelSmall) }
        }
        Row(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(start = 12.dp, end = 42.dp), horizontalArrangement = if (points.size == 1) Arrangement.Center else Arrangement.SpaceBetween) {
            points.forEach { Text(it.id, color = TB.hint, style = MaterialTheme.typography.labelSmall) }
        }
        if (points.isEmpty()) Text("비교할 기록이 더 필요해요", Modifier.align(Alignment.Center), color = TB.hint)
    }
}
