#!/usr/bin/env python3
"""Export the current editable food SVGs to web, iOS, and Android chip assets.

Run after deliberately applying icon-editor changes. Product builds use the
checked-in exports and do not depend on the editor or its local HTTP server.
"""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

ROOT = Path(__file__).resolve().parents[1]
EDITOR = ROOT / "output/design/tb-icon-editor"
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


def write(relative, text):
    target = ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.read_text() != text:
        target.write_text(text)


def path_data(tag, attrs):
    """Keep SVG paths; convert primitives with exact circular/elliptical arcs."""
    if tag == "path":
        return attrs["d"]
    if tag == "circle":
        x, y, r = (float(attrs[key]) for key in ("cx", "cy", "r"))
        return f"M{x-r:g} {y:g}a{r:g} {r:g} 0 1 0 {2*r:g} 0a{r:g} {r:g} 0 1 0 {-2*r:g} 0Z"
    if tag == "rect":
        x, y, w, h = (float(attrs.get(key, 0)) for key in ("x", "y", "width", "height"))
        rx = min(float(attrs.get("rx", attrs.get("ry", 0))), w / 2)
        ry = min(float(attrs.get("ry", attrs.get("rx", 0))), h / 2)
        if not rx or not ry:
            return f"M{x:g} {y:g}h{w:g}v{h:g}h{-w:g}Z"
        return (f"M{x+rx:g} {y:g}H{x+w-rx:g}a{rx:g} {ry:g} 0 0 1 {rx:g} {ry:g}"
                f"V{y+h-ry:g}a{rx:g} {ry:g} 0 0 1 {-rx:g} {ry:g}"
                f"H{x+rx:g}a{rx:g} {ry:g} 0 0 1 {-rx:g} {-ry:g}"
                f"V{y+ry:g}a{rx:g} {ry:g} 0 0 1 {rx:g} {-ry:g}Z")
    raise ValueError(f"Unsupported SVG primitive: {tag}")


def main():
    manifest = json.loads((EDITOR / "manifest.json").read_text())
    active = [icon for icon in manifest["icons"] if icon.get("group") == "food"]
    ids = [icon["dishKindId"] for icon in active]
    source = (ROOT / "src/constants/dishKindTags.ts").read_text()
    def catalog_ids(name):
        literal = re.search(rf"export const {name}:[^\n]*=\s*(\[[\s\S]*?\n\]);", source).group(1)
        return re.findall(r'id:\s*"([^\"]+)"', literal)
    legacy = catalog_ids("LEGACY_DISH_KIND_OPTIONS")
    assert ids == catalog_ids("DISH_KIND_OPTIONS"), "Editor and product catalogs differ"
    assert ids and len(set(ids + legacy)) == len(ids + legacy)
    license_text = (EDITOR / "vendor/LUCIDE-LICENSE.txt").read_text().strip()
    nodes_by_id = {}
    resources = {}
    allowed = {"path": {"d"}, "circle": {"cx", "cy", "r"}, "rect": {"x", "y", "width", "height", "rx", "ry"}}

    for kind in ids + legacy:
        assert re.fullmatch(r"[a-z][a-z0-9_]*", kind), f"Invalid asset ID: {kind}"
        source_svg = EDITOR / "icons" / f"food-{kind.replace('_', '-')}.svg"
        svg = ET.fromstring(source_svg.read_text())
        for attr, value in {"viewBox": "0 0 24 24", "fill": "none", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round"}.items():
            assert svg.get(attr) == value, f"Unexpected {attr}: {source_svg}"
        nodes = []
        for element in svg:
            tag = element.tag.removeprefix(f"{{{SVG_NS}}}")
            assert tag in allowed and set(element.attrib) <= allowed[tag], f"Unsupported geometry: {source_svg}"
            assert not len(element), f"Nested geometry: {source_svg}"
            nodes.append([tag, dict(element.attrib)])
        nodes_by_id[kind] = nodes

        # Fixed-size, black template source; native tint follows chip foreground.
        svg.attrib.clear()
        svg.attrib.update({"width": "24", "height": "24", "viewBox": "0 0 24 24", "fill": "none", "stroke": "#000000", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round"})
        svg.insert(0, ET.Comment("\n" + license_text + "\n"))
        asset = f"DishKind-{kind}"
        imageset = f"ios/TasteBuddy/Resources/Assets.xcassets/DishKindIcons/{asset}.imageset"
        write(f"{imageset}/{asset}.svg", ET.tostring(svg, encoding="unicode") + "\n")
        write(f"{imageset}/Contents.json", json.dumps({
            "images": [{"filename": f"{asset}.svg", "idiom": "universal"}],
            "info": {"author": "xcode", "version": 1},
            "properties": {"preserves-vector-representation": True, "template-rendering-intent": "template"},
        }, indent=2) + "\n")

        resource = f"dish_kind_{kind}"
        resources[kind] = resource
        paths = "\n".join(
            '    <path android:fillColor="#00000000" android:strokeColor="#FF000000" '
            'android:strokeWidth="2" android:strokeLineCap="round" android:strokeLineJoin="round" '
            f'android:pathData={quoteattr(path_data(tag, attrs))} />'
            for tag, attrs in nodes
        )
        write(f"android/app/src/main/res/drawable/{resource}.xml",
              '<?xml version="1.0" encoding="utf-8"?>\n<!--\n' + escape(license_text) + '\n-->\n'
              '<vector xmlns:android="http://schemas.android.com/apk/res/android" '
              'android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">\n'
              + paths + '\n</vector>\n')

    write("src/constants/dishKindIcons.ts",
          "// Generated by python3 scripts/sync-dish-kind-icons.py. Do not edit by hand.\n"
          + "/*\n" + license_text + "\n*/\n"
          + "export const DISH_KIND_ICON_NODES: Readonly<Record<string, readonly (readonly [string, Readonly<Record<string, string>>])[]>> = "
          + json.dumps(nodes_by_id, indent=2, ensure_ascii=False) + ";\n")
    write("android/app/src/main/java/com/tastebuddy/android/ui/DishKindIcons.kt",
          "// Generated by python3 scripts/sync-dish-kind-icons.py.\n"
          "package com.tastebuddy.android.ui\n\nimport com.tastebuddy.android.R\n\n"
          "object DishKindIcons {\n    fun resource(id: String): Int? = when (id) {\n"
          + "".join(f'        "{kind}" -> R.drawable.{resource}\n' for kind, resource in resources.items())
          + "        else -> null\n    }\n}\n")
    write("ios/TasteBuddy/Resources/Assets.xcassets/DishKindIcons/Contents.json",
          json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2) + "\n")
    print(f"Exported {len(ids)} active and {len(legacy)} historical icons to web/iOS/Android.")


if __name__ == "__main__":
    main()
