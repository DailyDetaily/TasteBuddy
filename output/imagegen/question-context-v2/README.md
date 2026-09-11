# 질문 맥락 일러스트 6종

2026-09-08 · 내장 image_gen으로 제작한 PNG 원본. 사용자의 정정에 따라 음식과 식사 동작으로 질문의 감각 맥락을 구체적으로 표현했다. 기존 Palate Bloom 아바타에서는 색감과 단순한 색면을 참고했다.

| 실제 감각 라벨 | 이미지의 구체 장면 | 원본 |
| --- | --- | --- |
| 산뜻한 산미 | 레몬즙과 소스 | [01-fresh-acidity.png](01-fresh-acidity.png) |
| 밀도 있는 단맛 | 캐러멜 푸딩 한입 | [02-dense-sweetness.png](02-dense-sweetness.png) |
| 바삭함 | 바삭한 튀김의 단면 | [03-crisp-texture.png](03-crisp-texture.png) |
| 씹는 힘이 있음 | 젓가락으로 들어 올린 굵은 면 | [04-chewy-texture.png](04-chewy-texture.png) |
| 훈연 향 | 훈연한 생선과 연기 | [05-smoky-aroma.png](05-smoky-aroma.png) |
| 따뜻하게 퍼짐 | 따뜻한 수프 한 숟가락 | [06-warm-spread.png](06-warm-spread.png) |

[index.html](index.html)에서 질문 문구와 원본, 60×60px 미리보기를 함께 볼 수 있다. [prompts.json](prompts.json)에 실제 생성 프롬프트를 저장했다.

감각 라벨은 ios/TasteBuddy/Resources/TBA/dining-sensory-selection-catalog.json의 resolved 항목에서 확인했고, 질문 예시는 PersonalTasteModel.swift의 질문 템플릿을 사용했다. 그림 속 음식은 맥락을 이해하기 위한 대표 모티프이며 실제 식사 기록이나 사용자 취향을 판정하는 근거가 아니다.

6종 모두 1254×1254 RGB PNG로 파일 디코딩과 크기를 확인했다. 불투명한 밝은 회색 배경이며 미세한 색 편차와 일부 색면 명암이 있어 코드 팔레트와의 정확한 픽셀 일치나 벡터 원본을 뜻하지 않는다. 생성 이미지를 육안으로 검토했으며 기기에서의 카드 적용은 검증하지 않았다.

앱 코드에는 적용하지 않았다. 앱 UI·로직·빌드 설정 변경이 없어 앱 빌드는 생략했다.

