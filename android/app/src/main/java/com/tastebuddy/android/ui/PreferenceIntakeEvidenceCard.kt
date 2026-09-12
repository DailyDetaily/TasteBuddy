package com.tastebuddy.android.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tastebuddy.android.domain.PreferenceEvidenceSnapshot

@Composable
fun PreferenceIntakeEvidenceCard(evidence: PreferenceEvidenceSnapshot, hasLegacyProfile: Boolean, onEdit: () -> Unit) {
    CardBox {
        Text(if (evidence.submissionID == null) "식사 선호를 알려주세요" else "직접 알려준 식사 선호", style = MaterialTheme.typography.titleMedium)
        evidence.recordedAt?.let { Text("${it.take(10)} · 응답 ${evidence.answeredQuestionCount}개", color = TB.hint) }
        if (evidence.submissionID == null) Text(if (hasLegacyProfile) "기존 선택은 보관 중이에요. 다시 저장하면 질문과 응답 시점을 함께 남겨요."
            else "피해야 할 재료와 편안하게 즐기는 음식부터 입맛을 알아가요.", color = TB.body)
        evidence.records.forEach { record ->
            var expanded by remember(record.id) { mutableStateOf(false) }
            TextButton({ expanded = !expanded }, Modifier.fillMaxWidth().heightIn(min = 44.dp)) {
                Column(Modifier.fillMaxWidth()) {
                    Text(record.label, fontWeight = FontWeight.Medium, color = TB.ink)
                    Text(record.summary, color = TB.body)
                }
            }
            if (expanded) Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(record.response.questionText, color = TB.body)
                Text(record.response.questionDescription, color = TB.body)
                record.response.selectedOptions.forEach { Text("${it.label} · ${it.description}", color = TB.body) }
            }
        }
        Text("직접 알려준 선호는 실제 식사에서 확인한 반응과 구분해요.", color = TB.hint)
        if (evidence.records.any { it.kind == "sharing_preference" && it.state != "unanswered" }) Text("공유 선호를 저장해도 정보가 전송되지는 않아요.", color = TB.hint)
        if (evidence.excludedSubmissions.isNotEmpty()) Text("일부 응답의 출처를 확인하지 못했어요. 선호를 다시 확인해 주세요.", color = TB.hint)
        TextButton(onEdit) { Text(if (evidence.submissionID == null) "선호 기록하기" else "선호 수정하기") }
    }
}
