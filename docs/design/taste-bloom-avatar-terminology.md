# 블룸 아바타 구성 요소 명칭

블룸 아바타의 부위 명칭은 **꽃잎 · 수술 · 암술**로 통일한다. 이 변경은 부위의 이름을 정리하며, 기존 아바타의 도형·색상·크기·생성 규칙·모션은 유지한다.

| 부위 | 영어 | 코드 속성 | 미각 순위에 따른 레이어 |
| --- | --- | --- | --- |
| 배경 | Background | `background` | 1위 |
| 꽃잎 | Petal | `petalShape` | 2위 바깥 꽃잎, 3위 안쪽 꽃잎 |
| 수술 (기존 별) | Stamen | `stamenShape` | 4위 바깥 수술, 5위 안쪽 수술 |
| 암술 (기존 중심) | Pistil | `pistilShape` | 6위 |

## 형태 선택

- 꽃잎: `roundPetal`, `capsulePetal`, `softDiamondPetal`, `serratedTipPetal`
- 수술: `thinStamen`(가는 수술), `roundedSpokeStamen`(둥근 수술), `dottedRayStamen`(점 수술)
- 암술: `solidPistil`(원형), `diamondPistil`(마름모), `seedCluster`(씨앗)

4 × 3 × 3 = 36종의 조합 및 Round, Rosette, Star 등 기존 고유 이름은 유지한다. 위치·회전축을 뜻하는 “중심/center”와 도형을 설명하는 “별 모양”은 부위 이름과 구분한다.

## 구현 및 호환성

- 웹 원본: `src/components/system/PalateBloomAvatar.tsx`
- iOS 원본: `ios/TasteBuddy/Components/PalateBloomAvatar.swift`
- 디자인 시스템: `src/pages/DesignSystemPage.tsx`
- Remotion: `brand-launch/src/TasteBloomAvatars/`
- 조절 화면과 조작 영상: `brand-launch/src/TasteBloomWorkbench/`

웹·iOS 타입, 속성, 열거형, 레이어와 생성 파일도 `stamen`/`pistil` 명칭을 사용한다. 사용자와 점수에서 형태를 결정하는 해시에는 과거의 문자열 `starShape`와 `coreShape`를 유지한다. 이 문자열까지 바꾸면 같은 사용자에게 다른 형태가 생성되므로, 호환성 상수에만 기존 문자열을 남긴다.

웹 원본 변경 후 `brand-launch`에서 다음 명령으로 생성 파일을 갱신한다.

```sh
node scripts/sync-bloom-avatars.mjs
node scripts/sync-bloom-workbench.mjs
node --test scripts/bloom-workbench.test.mjs scripts/bloom-profile.test.mjs
```

`scripts/fixtures/bloom-terminology-baseline.json`은 명칭 변경 전 20개 프로필·시드 조합의 SVG 해시다. 회귀 테스트는 원본 웹 컴포넌트와 조절 화면 모두에서 기존 출력이 보존되는지 확인한다.
