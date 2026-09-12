package com.tastebuddy.android.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tastebuddy.android.domain.SurveySubmission

@Composable
fun SurveyEvidenceCard(submission: SurveySubmission) {
    var showsConditions by remember { mutableStateOf(false) }
    CardBox {
        Text("기준 음식 회상", fontWeight = FontWeight.SemiBold)
        Text(submission.summary, color = TB.body)
        submission.items.forEach { item ->
            HorizontalDivider(color = TB.border)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1f)) {
                    Text(item.tasteId.label, color = Color(item.tasteId.text))
                    Text(item.anchor.label, color = TB.hint, style = MaterialTheme.typography.bodySmall)
                }
                Text(submission.responseLabel(item.id), Modifier.widthIn(max = 144.dp), style = MaterialTheme.typography.bodyMedium)
            }
        }
        Text("우유의 지방맛은 예비 단서예요. 부드러움·고소한 향·느끼함과 구분해 살펴봐요.", color = TB.hint)
        TextButton({ showsConditions = !showsConditions }) { Text("기준 음식과 조건 보기") }
        if (showsConditions) submission.items.forEach { item ->
            Text(item.anchor.label, fontWeight = FontWeight.SemiBold)
            Text(item.anchor.description, color = TB.body)
        }
    }
}
