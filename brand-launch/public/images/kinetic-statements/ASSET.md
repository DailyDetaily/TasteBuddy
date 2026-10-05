# Kinetic Statements 음식 이미지

2026-09-22, Codex 내장 image_gen으로 생성하고 같은 도구로 사방의 배경을 확장했습니다. 실제 레스토랑의 촬영 사진이나 사용자 식사 기록이 아닌 브랜드 모션용 생성 이미지입니다.

- 사용 파일: `fine-dining-topview-padded.png`
- 보존한 최초 이미지: `fine-dining-topview.png`
- 최초 생성 원본: `/Users/sinjunho/.codex/generated_images/01a0c79f-0309-7321-842a-9561ea7d4151/exec-00c2a7d0-4de6-435b-84c4-31120fca2fd1.png`
- 확장 생성 원본: `/Users/sinjunho/.codex/generated_images/01a0c79f-0309-7321-842a-9561ea7d4151/exec-3a05ea65-b7ab-4f46-9773-21d13d56662c.png`

탑뷰 구도, 가리비 세 개, 소스, 채소와 꽃 장식을 유지하도록 편집했습니다. 접시의 실제 외곽은 확장 결과의 중앙 약 54%를 차지하며, 프롬프트의 40%는 요청값입니다. 화면마다 크롭과 확대율을 별도로 조정합니다. 원본 PNG 파일의 픽셀을 별도로 후처리하지 않았습니다.

## 최초 생성 프롬프트

```text
Use case: photorealistic-natural
Asset type: square fine-dining editorial photograph for a Taste Buddy kinetic brand statement in a Remotion film; the typography will be composed separately in code.
Primary request: an exquisite high-end fine-dining dish photographed directly overhead, true 90-degree top-down flat lay.
Scene/backdrop: pale warm stone tabletop, clean and quiet with very subtle natural texture, no additional props.
Subject: one large round warm-ivory porcelain plate with a generous refined rim. In the center, three beautifully golden pan-seared scallops in a delicate crescent arrangement, a small folded pale green vegetable ribbon, a restrained pool of silky ivory beurre blanc, a few precise deep green herb oil drops, and two tiny edible flower petals. Very refined contemporary restaurant plating, realistic food portions and textures, delicious and elegant.
Style/medium: high-end food editorial photography, tactile natural materials, precise realistic food detail, restrained art direction, no oversaturation.
Composition/framing: square 1:1 photograph, centered fully visible plate occupying about 86 percent of the frame width, even margin around all plate edges, strict overhead perspective, the plated food arrangement sits in the middle third and the broad ivory rim remains calm.
Lighting/mood: soft directional natural window light from upper left, delicate shadows at the plate edge, luminous highlights on sauce, quiet luxury.
Constraints: single plate only; no text, no lettering, no logo, no watermark, no cutlery, no hands, no tableware, no napkins, no second plate. Do not include any typography or branding.
```

## 사방 여백 확장 프롬프트

```text
Use case: precise-object-edit
Asset type: flexible master photograph for square 1:1, landscape 16:9 and portrait 9:16 kinetic brand compositions.
Input image: the supplied existing overhead scallop plate photograph is the edit target.
Primary request: expand the photograph substantially outward on ALL FOUR SIDES to add generous continuous pale stone tabletop negative space. Keep the SAME dish, SAME three seared scallops, SAME sauce, SAME vegetables and flower garnishes, SAME plate material, SAME exact overhead orientation and SAME illumination. Only change the amount of surrounding tabletop and the dish's size in the overall canvas.
Composition: output a high-resolution 2048 x 2048 square. The full round plate must be precisely centered horizontally and vertically. Its OUTER DIAMETER should occupy only 40 percent of the canvas width and height, leaving about 30 percent of the canvas as empty tabletop on each of the four sides. This is deliberate large padding for later 16:9 and 9:16 crops. The original photograph should look like the camera simply rose vertically above the exact same table and dish.
Background: naturally extend the existing subtle, pale warm ivory stone tabletop seamlessly into the expanded areas. Keep the new tabletop visually quiet, soft even texture and restrained contrast, with the same light from upper left.
Constraints: preserve the food arrangement and existing objects; no extra plates, no utensils, no props, no text, no logos, no borders, no frame; do not crop any part of the plate; do not use blurred edge stretching; no perspective tilt. The plate must be much smaller in the whole image than the input image, with generous even margins on every side.
```

