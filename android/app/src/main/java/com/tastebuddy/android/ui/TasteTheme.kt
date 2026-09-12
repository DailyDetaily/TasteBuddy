package com.tastebuddy.android.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tastebuddy.android.R
import com.tastebuddy.android.domain.*
import kotlin.math.*

object TB {
    val page = Color(0xFFF3F3F3)
    val ink = Color(0xFF1E1E1E)
    val body = Color(0xFF626262)
    val hint = Color(0xFF858585)
    val border = Color(0xFFE6E6E6)
    val muted = Color(0xFFF8F8F8)
    val disabled = Color(0xFFE8E8E8)
    val disabledText = Color(0xFFA3A3A3)
    val font =
        FontFamily(
            Font(R.font.pretendard_regular),
            Font(R.font.pretendard_medium, FontWeight.Medium),
            Font(R.font.pretendard_semibold, FontWeight.SemiBold),
            Font(R.font.pretendard_bold, FontWeight.Bold),
        )
}

@Composable
fun TasteTheme(content: @Composable () -> Unit) {
    val type =
        Typography(
            bodyLarge = TextStyle(fontFamily = TB.font, fontSize = 14.sp, lineHeight = 21.sp),
            bodyMedium = TextStyle(fontFamily = TB.font, fontSize = 13.sp, lineHeight = 19.sp),
            titleLarge =
                TextStyle(fontFamily = TB.font, fontSize = 18.sp, fontWeight = FontWeight.Bold),
            titleMedium =
                TextStyle(fontFamily = TB.font, fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
            labelLarge =
                TextStyle(fontFamily = TB.font, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
            labelSmall = TextStyle(fontFamily = TB.font, fontSize = 11.sp),
        )
    MaterialTheme(
        colorScheme =
            lightColorScheme(
                primary = TB.ink,
                onPrimary = Color.White,
                background = TB.page,
                surface = Color.White,
                surfaceVariant = TB.muted,
                onSurface = TB.ink,
                onSurfaceVariant = TB.body,
                outline = TB.border,
            ),
        typography = type,
        content = content,
    )
}

@Composable
fun Page(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        content = content,
    )
}

@Composable
fun CardBox(
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(color).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = content,
    )
}

@Composable
fun Section(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        content()
    }
}

@Composable
fun PrimaryButton(text: String, enabled: Boolean = true, onClick: () -> Unit) {
    Button(
        onClick,
        Modifier.fillMaxWidth().heightIn(min = 52.dp),
        enabled,
        shape = RoundedCornerShape(16.dp),
        colors =
            ButtonDefaults.buttonColors(
                disabledContainerColor = TB.disabled,
                disabledContentColor = TB.disabledText,
            ),
        contentPadding = PaddingValues(16.dp),
    ) {
        Text(text)
    }
}

@Composable
fun Field(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = true,
    onChange: (String) -> Unit,
) {
    OutlinedTextField(
        value,
        onChange,
        modifier.fillMaxWidth(),
        label = { Text(label) },
        singleLine = singleLine,
        minLines = if (singleLine) 1 else 3,
        shape = RoundedCornerShape(16.dp),
    )
}

@Composable
fun EmptyCard(title: String, detail: String, action: String? = null, onClick: () -> Unit = {}) {
    CardBox {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(detail, color = TB.body)
        if (action != null) TextButton(onClick) { Text(action) }
    }
}

@Composable
fun NavigationRow(title: String, detail: String = "", onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, fontWeight = FontWeight.Medium)
            if (detail.isNotBlank())
                Text(detail, style = MaterialTheme.typography.bodyMedium, color = TB.body)
        }
        Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, null, tint = TB.hint)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Screen(
    title: String,
    back: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    bottom: @Composable () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        containerColor = TB.page,
        topBar = {
            TopAppBar(
                title = { Text(title, style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    if (back != null)
                        IconButton(back) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "뒤로") }
                },
                actions = actions,
                colors =
                    TopAppBarDefaults.topAppBarColors(containerColor = TB.page.copy(alpha = .96f)),
            )
        },
        bottomBar = bottom,
        content = content,
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Choices(values: Map<String, String>, selected: String?, onSelect: (String) -> Unit) {
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        values.forEach { (key, label) ->
            FilterChip(selected == key, { onSelect(key) }, label = { Text(label) })
        }
    }
}

@Composable
fun Bloom(profile: TasteProfile?, modifier: Modifier = Modifier, axis: TasteAxis? = null) {
    Canvas(modifier) {
        val radius = min(size.width, size.height) * .25f
        TasteAxis.entries.forEachIndexed { index, taste ->
            rotate(index * 60f, center) {
                val length = radius * (1.05f + (profile?.score(taste) ?: 50) / 160f)
                val path =
                    Path().apply {
                        moveTo(center.x, center.y + radius * .2f)
                        cubicTo(
                            center.x - radius,
                            center.y - radius * .2f,
                            center.x - radius,
                            center.y - length,
                            center.x,
                            center.y - length,
                        )
                        cubicTo(
                            center.x + radius,
                            center.y - length,
                            center.x + radius,
                            center.y - radius * .2f,
                            center.x,
                            center.y + radius * .2f,
                        )
                    }
                drawPath(path, Color((axis ?: taste).main).copy(alpha = .8f))
            }
        }
        drawCircle(Color.White.copy(alpha = .35f), radius * .25f, center)
    }
}

fun colorHex(value: String) = runCatching {
    Color(android.graphics.Color.parseColor(value))
}
    .getOrDefault(TB.border)
