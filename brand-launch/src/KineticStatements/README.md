# Kinetic Statements — Kalice terminal fill

흰 배경의 화면 중앙에 2–3단어짜리 짧은 영어 문구를 한 번에 하나씩 크게 보여주고, Kalice의 획 끝에서 안쪽으로 빠르게 채운 뒤 다음 문구로 교체합니다. 음식 이미지와 꽃잎 심볼은 표시하지 않습니다. 디시 이미지는 16:9 `Logo-Black` / `Logo-Black-HD`의 배경으로 옮겼습니다.

> Save the meals → find the patterns → know your taste → Taste Buddy

| Studio 컴포지션 | 화면 |
| --- | --- |
| [Kinetic-Statements](http://localhost:3110/Kinetic-Statements) | 1920×1080 · 16:9 |
| [Kinetic-Statements-Square](http://localhost:3110/Kinetic-Statements-Square) | 1080×1080 · 1:1 |
| [Kinetic-Statements-Portrait](http://localhost:3110/Kinetic-Statements-Portrait) | 1080×1920 · 9:16 |

배경은 연한 그레이 `#F3F3F1`입니다. 가로·정사각형·세로형 모두 한 구절만 화면 정중앙에 한 줄로 보여줍니다. 짧은 문구에 맞춰 이전보다 타입 스케일을 키웠고, 각 비율별 최대 크기 안에서 자동으로 맞춥니다. 채워지는 글자 전체에 글자 크기의 0.9%만큼 알파 팽창을 적용해 Kalice의 획을 조금 두껍게 표시합니다. 등장 중과 완성 후에 같은 두께를 유지합니다.

## 채움 방식

- 로컬 `public/fonts/Kalice-Trial-Regular.otf`의 실제 벡터 경로와 커닝을 추출했습니다.
- 기존 `LogoGrid/WordmarkTerminalFill.tsx`와 `scripts/wordmark-distance-field.py`를 그대로 재사용합니다. 컴포넌트에 선택적 글자 맵만 추가했으며, 기존 로고는 원래 맵을 계속 사용합니다.
- Kalice 글자의 획 끝에서 둥근 브러시가 안쪽으로 전파됩니다. 막힌 곡선과 분리된 점에도 출발점을 두어 모든 획이 채워집니다.
- 기본 글자별 채움은 약 0.4초, 1프레임 시차이며 `progress ** 1.6` 가속 곡선은 `Logo-Black`의 terminal-fill 언어를 유지합니다.
- 한 구절이 완성되면 약 0.35초 머문 뒤 0.25초 동안 위로 아주 미세하게 빠지며 다음 구절과 절반 정도 겹쳐 전환됩니다.
- 등장 중에도 글자 위치·크기는 고정되어 있습니다. 채움 완료 후에는 마스크 없는 원본 Kalice 벡터 경로에 같은 두께 보정을 적용합니다.
- 재생 중에는 생성 도구를 실행하지 않습니다. 79개 글자의 생성 필드와 벡터를 로컬 자산으로 읽습니다.

기본 30fps, 179프레임, 약 5.97초입니다. 네 문구의 글자 수와 채움·유지·전환 속도에 맞춰 전체 길이를 자동 계산합니다. 마지막 `Taste Buddy`가 완성되면 Taste Buddy 워드마크가 하단 서명으로 나타납니다.

Studio Props: 문구 1–4, 문구 채움 시간, 글자 시차, 문구 유지, 전환 시간, 마지막 유지, 문장 색. 기본 문구는 2–3단어 단위이며 영문 대소문자·숫자·기본 문장부호를 지원합니다.

## 파일과 확인

- `layout.ts`: 화면별 문구·워드마크 배치
- `typography.ts`: Kalice 커닝·줄바꿈·크기 맞춤
- `TerminalStatement.tsx`: 문구에 기존 워드마크 채움 컴포넌트 적용
- `kalice.generated.ts`, `public/brand/kinetic-kalice/`: 생성된 벡터·전파 필드
- `scripts/generate-kinetic-kalice.mjs`, `scripts/kinetic-kalice-glyphs.py`: 생성기. sharp와 NumPy/Pillow/FontTools가 필요합니다. `WORDMARK_PYTHON`으로 Python 경로를 지정합니다.
- 원본 이미지와 프롬프트: `public/images/kinetic-statements/ASSET.md`
- 이전 꽃잎 버전 소스: `output/kinetic-statements/revisions/before-english-kalice/`

```sh
npm run lint
node --test scripts/wordmark-fill.test.mjs
node scripts/render-kinetic-statements.mjs
```

렌더 스크립트는 시작·채움 중간·완성 프레임을 `output/kinetic-statements/white-centered/`에 저장합니다. 디시 배경을 적용한 로고의 주요 프레임은 `output/logo-black-dish/rendered-frames/`에 함께 저장합니다. MP4는 자동 생성하지 않습니다.
