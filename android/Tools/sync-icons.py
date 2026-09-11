#!/usr/bin/env python3
"""웹과 네이티브의 Lucide 아이콘을 필요한 항목만 Compose 벡터로 보관한다."""
import json
import re
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[2]
icons = root / "node_modules/lucide-react/dist/esm/icons"
mapping = {"Add": "plus", "AutoAwesome": "sparkles", "BookmarkBorder": "bookmark", "Home": "house", "Person": "user", "Restaurant": "utensils", "Search": "search", "Close": "x", "Edit": "pencil", "CameraAlt": "camera", "PhotoCamera": "camera", "FlashOff": "zap-off", "FlashOn": "zap", "PhotoLibrary": "image", "FavoriteBorder": "heart", "PersonAdd": "user-plus", "Settings": "settings", "Share": "share-2", "ArrowBack": "arrow-left", "KeyboardArrowRight": "chevron-right"}

def path(tag, data):
    if tag == "path": return data["d"]
    if tag in ("polyline", "polygon"): return "M" + data["points"] + ("Z" if tag == "polygon" else "")
    if tag == "line": return f'M{data["x1"]} {data["y1"]}L{data["x2"]} {data["y2"]}'
    if tag == "circle":
        x, y, r = map(float, (data["cx"], data["cy"], data["r"]))
        return f'M{x-r} {y}a{r} {r} 0 1 0 {2*r} 0a{r} {r} 0 1 0 {-2*r} 0'
    if tag == "rect":
        x, y, w, h, r = [float(data.get(k, 0)) for k in ("x", "y", "width", "height", "rx")]
        return f'M{x+r} {y}H{x+w-r}Q{x+w} {y} {x+w} {y+r}V{y+h-r}Q{x+w} {y+h} {x+w-r} {y+h}H{x+r}Q{x} {y+h} {x} {y+h-r}V{y+r}Q{x} {y} {x+r} {y}Z'
    raise ValueError(tag)

output = '''// Lucide 0.487.0, ISC License. Tools/sync-icons.py에서 생성.
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
        paths.forEach { builder.addPath(PathParser().parsePathString(it).toNodes(), fill = null, stroke = SolidColor(Color.Black), strokeLineWidth = 1.8f, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round) }
        return builder.build()
    }
    object Outlined {
'''
for name, source in mapping.items():
    text = (icons / f"{source}.js").read_text()
    raw = re.search(r"const __iconNode = (\[[\s\S]*?\]);", text).group(1)
    raw = re.sub(r"([,{]\s*)([A-Za-z_]\w*):", r'\1"\2":', raw)
    nodes = json.loads(raw)
    paths = ", ".join(json.dumps(path(tag, data)) for tag, data in nodes)
    output += f'        val {name} by lazy {{ vector("{source}", listOf({paths}), {str(name in ("ArrowBack", "KeyboardArrowRight")).lower()}) }}\n'
output += '''    }
    object AutoMirrored { object Outlined {
        val ArrowBack get() = Icons.Outlined.ArrowBack
        val KeyboardArrowRight get() = Icons.Outlined.KeyboardArrowRight
    } }
}
'''
dest = root / "android/app/src/main/java/com/tastebuddy/android/ui/LucideIcons.kt"
dest.write_text(output)
license_dir = root / "android/app/src/main/assets/licenses"
license_dir.mkdir(exist_ok=True, parents=True)
shutil.copyfile(root / "node_modules/lucide-react/LICENSE", license_dir / "Lucide-LICENSE.txt")
for file in (root / "android/app/src/main/java").rglob("*.kt"):
    text = file.read_text()
    clean = re.sub(r"^import androidx\.compose\.material\.icons\.[^\n]+\n", "", text, flags=re.M)
    if clean != text: file.write_text(clean)
print(f"Lucide 아이콘 {len(mapping)}개 동기화 완료")
