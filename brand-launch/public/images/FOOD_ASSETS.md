# 브랜드 런칭 영상 음식 자산

두 이미지 모두 2026-09-06에 Codex의 내장 `image_gen` 도구로 새로 생성한 원본 음식 이미지다. 외부 사진을 다운로드하거나 참조 이미지로 사용하지 않았다. 원본 파일을 그대로 복사했으며 이미지 후처리를 하지 않았다.

| 파일 | 장면 | 생성 원본 |
| --- | --- | --- |
| `hero-food.png` | 어두운 웜 브라운 배경, 앰버 글레이즈를 입힌 구운 배 클로즈업, 아이보리 접시 | `/Users/sinjunho/.codex/generated_images/01a07692-1752-7843-b313-338befc8f81b/exec-07803025-5482-4533-99f0-d85ccac3f003.png` |
| `second-food.png` | 밝은 리넨 위 아이보리 접시, 시트러스와 배 슬라이스, 허브 | `/Users/sinjunho/.codex/generated_images/01a07692-1752-7843-b313-338befc8f81b/exec-59192e76-952a-437d-a465-06f11468b34c.png` |

생성 결과를 직접 확인했다. 음식과 접시의 형태가 자연스럽고, 의도한 상단 자막 여백이 확보되어 있으며, 이미지에 글자나 로고가 없다. 사진은 브랜드 영상의 감각적인 음식 장면용으로 생성됐으며 실제 사용자 식사 기록이나 실제 촬영 사진을 나타내지 않는다.

## `hero-food.png` 최종 프롬프트

```text
Use case: photorealistic-natural
Asset type: original food photograph for a portrait 9:16 Taste Buddy brand launch video.
Primary request: Cinematic editorial macro of a single elegant thick slice of charred pear with gleaming amber glaze resting on warm ivory ceramic.
Scene/backdrop: very dark warm brown background with clear, uninterrupted dark negative space in the upper third, reserved for later-added white Korean title (do not draw text).
Subject: one appetizing pear slice with caramelized edges, delicate natural surface, translucent amber glaze. Place the pear and ceramic in the lower two thirds.
Style/medium: premium food magazine photography, realistic tactile food, restrained art direction, close macro lens.
Composition/framing: portrait 9:16 vertical composition, close-up food in lower frame, excellent smooth negative space above, warm ivory curved ceramic edge partially visible.
Lighting/mood: warm natural side light with beautiful soft falloff, calm and intimate, subtle glossy highlights.
Constraints: realistic food structure, no text, no logo, no watermark, no people, no hands, no extra utensils or ingredients.
```

## `second-food.png` 최종 프롬프트

```text
Use case: photorealistic-natural
Asset type: original food photograph for a portrait 9:16 Taste Buddy brand launch video.
Primary request: overhead editorial plate of natural citrus segments, neatly sliced pear, and a single fresh green herb leaf on sculptural ivory ceramic.
Scene/backdrop: light neutral warm linen surface. Generous bright, softly textured empty negative space in upper third for later-added Korean title; do not draw text.
Subject: carefully arranged citrus segments with translucent pulp, fine pale pear slices with natural skin, and one delicate green herb leaf, on a single beautiful ivory ceramic plate.
Style/medium: premium food magazine photography, realistic tactile organic textures, restrained calm art direction.
Composition/framing: portrait 9:16 vertical format, true overhead view; plate and food centered in lower two thirds, upper third mostly bright linen with clean negative space.
Lighting/mood: soft natural side light, warm but neutral color, tactile soft shadows, fresh and quiet.
Constraints: realistic fruit structure and natural ceramic, no text, no logo, no watermark, no people, no hands, no utensils, no additional props.
```
