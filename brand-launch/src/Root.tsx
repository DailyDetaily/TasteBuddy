import { DiningFeedbackFlip } from "./DiningFeedbackMotion/Flip";
import { flipSchema } from "./DiningFeedbackMotion/flip-settings";
import { flipTiming } from "./DiningFeedbackMotion/flip-motion";
import { DishTopviewCompositions } from "./DishTopviews";
import { FoodIconCompositions } from "./FoodIcons";
import { InsightCategoryIconCompositions } from "./InsightCategoryIcons";
import { ColorGuide } from "./ColorGuide/ColorGuide";
import { ColorGuideOriginal } from "./ColorGuide/Original/ColorGuideOriginal";
import {
  COLOR_GUIDE_FPS as ORIGINAL_COLOR_GUIDE_FPS,
  originalColorGuideDuration,
} from "./ColorGuide/Original/settings";
import { TasteColorGradientCircle } from "./ColorGuide/GradientCircle";
import { COLOR_GUIDE_FPS, colorGuideDuration, colorGuideSchema } from "./ColorGuide/settings";
import { SauceSplatter } from "./SauceSplatter/Scene";
import { sauceSplatterSchema } from "./SauceSplatter/settings";
import {
  SAUCE_SPLATTER_FPS,
  sauceSplatterTiming,
} from "./SauceSplatter/motion";
import { TabBarPlusButton } from "./TabBarPlusButton/PlusButton";
import { plusButtonSchema } from "./TabBarPlusButton/settings";
import { BUTTON_FPS, buttonTiming } from "./TabBarPlusButton/motion";
import { TabBarCameraEntryPortrait } from "./TabBarCameraEntry/Portrait";
import { cameraEntrySchema } from "./TabBarCameraEntry/settings";
import { ENTRY_FPS, entryTiming } from "./TabBarCameraEntry/motion";
import { feedbackTiming } from "./TabBarCameraEntry/feedback-timing";
import {
  DiningFeedbackResult,
  DiningFeedbackCard,
  DiningFeedbackGradient,
} from "./DiningFeedbackMotion";
import { carouselSchema } from "./DiningFeedbackMotion/carousel-settings";
import { carouselTiming } from "./DiningFeedbackMotion/carousel-motion";
import "./index.css";
import { TasteBubbleMapCompositions } from "./TasteBubbleMapMotion";
import { KineticStatementsCompositions } from "./KineticStatements";
import { HomePeriodInsightMotion } from "./HomePeriodInsightMotion";
import { homePeriodMotionSchema } from "./HomePeriodInsightMotion/settings";
import { periodTiming } from "./HomePeriodInsightMotion/motion";
import { SummaryCardGridMotion } from "./SummaryCardGridMotion";
import {
  SUMMARY_GRID_FPS,
  summaryCardGridSchema,
  summaryCardGridDefaultProps,
} from "./SummaryCardGridMotion/settings";
import { summaryGridTiming } from "./SummaryCardGridMotion/motion";
import { TasteBloomAvatarCompositions } from "./TasteBloomAvatars";
import { PetalLogoCompositions } from "./PetalLogo";
import { LogoGridCompositions } from "./LogoGrid";
import { TasteDataCategoryCompositions } from "./TasteDataCategoryMotion";
import { BarGraph } from "./GraphMotion/BarGraph";
import { GraphTransition } from "./GraphMotion/GraphTransition";
import {
  GRAPH_TRANSITION_DURATION,
  graphTransitionSchema,
  graphTransitionDefaultProps,
} from "./GraphMotion/graph-transition-settings";
import { GRAPH_FPS, barTiming } from "./GraphMotion/motion";
import { barGraphSchema } from "./GraphMotion/settings";
import { MiniLineGraph } from "./GraphMotion/MiniLineGraph";
import { miniLineGraphSchema } from "./GraphMotion/mini-line-settings";
import { miniLineTiming } from "./GraphMotion/mini-line-motion";
import { MiniAreaGraph } from "./GraphMotion/MiniAreaGraph";
import { miniAreaGraphSchema } from "./GraphMotion/mini-area-settings";
import { AREA_DURATION, AREA_FPS } from "./GraphMotion/mini-area-motion";
import { MiniStackedBarGraph } from "./GraphMotion/MiniStackedBarGraph";
import {
  miniStackedBarGraphSchema,
  miniStackedBarDefaultProps,
} from "./GraphMotion/mini-stacked-bar-settings";
import {
  STACKED_BAR_DURATION,
  STACKED_BAR_FPS,
} from "./GraphMotion/mini-stacked-bar-motion";
import { MiniGroupedBarGraph } from "./GraphMotion/MiniGroupedBarGraph";
import {
  miniGroupedBarGraphSchema,
  miniGroupedBarDefaultProps,
} from "./GraphMotion/mini-grouped-bar-settings";
import {
  GROUPED_BAR_DURATION,
  GROUPED_BAR_FPS,
} from "./GraphMotion/mini-grouped-bar-motion";
import { MiniHeatmapGraph } from "./GraphMotion/MiniHeatmapGraph";
import {
  miniHeatmapGraphSchema,
  miniHeatmapDefaultProps,
} from "./GraphMotion/mini-heatmap-settings";
import {
  HEATMAP_DURATION,
  HEATMAP_FPS,
} from "./GraphMotion/mini-heatmap-motion";
import { MiniPieGraph } from "./GraphMotion/MiniPieGraph";
import {
  miniPieGraphSchema,
  miniPieDefaultProps,
} from "./GraphMotion/mini-pie-settings";
import { PIE_DURATION, PIE_FPS } from "./GraphMotion/mini-pie-motion";
import { MiniBubbleGraph } from "./GraphMotion/MiniBubbleGraph";
import {
  miniBubbleGraphSchema,
  miniBubbleDefaultProps,
} from "./GraphMotion/mini-bubble-settings";
import { BUBBLE_DURATION, BUBBLE_FPS } from "./GraphMotion/mini-bubble-motion";
import { MiniTreemapGraph } from "./GraphMotion/MiniTreemapGraph";
import {
  miniTreemapGraphSchema,
  miniTreemapDefaultProps,
} from "./GraphMotion/mini-treemap-settings";
import {
  TREEMAP_DURATION,
  TREEMAP_FPS,
} from "./GraphMotion/mini-treemap-motion";
import { TasteMotionCompositions } from "./TasteMotion";
import { Composition, Folder } from "remotion";
import { BrandLaunch } from "./BrandLaunch";
import { Opening } from "./scenes/Opening";
import { Feedback } from "./scenes/Feedback";
import { Connection } from "./scenes/Connection";
import { Record } from "./scenes/Record";
import { Insight } from "./scenes/Insight";
import { Signature } from "./scenes/Signature";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="App-UI">
        <Composition
          id="TabBar-PlusButton"
          component={TabBarPlusButton}
          schema={plusButtonSchema}
          defaultProps={{
            재생: "반복" as const,
            상태: "기본" as const,
            "버튼 크기": 360,
            속도: 1,
            "시작 색 조합": "파랑 · 초록" as const,
            "글래스 강도": 1,
            "배경 색": "#F3F3F3",
          }}
          width={1080}
          height={1080}
          fps={BUTTON_FPS}
          durationInFrames={buttonTiming(1).durationInFrames}
          calculateMetadata={({ props }) => ({
            durationInFrames: buttonTiming(props.속도).durationInFrames,
          })}
        />
        <Composition
          id="TabBar-CameraEntry-Portrait"
          component={TabBarCameraEntryPortrait}
          schema={cameraEntrySchema}
          defaultProps={{
            "캔버스 배경": "#ffffff",
            "화면 높이": 980,
            "클릭 전 대기": 1.2,
            "누름 시간": 0.24,
            "진입 속도": 1,
            "카메라 유지 시간": 5,
            "버튼 크기": 144,
            "하단 여백": 192,
            "컬러 모드": "블루 · 퍼플" as const,
            "색 전환 간격": 0.75,
            "랜덤 시드": 29,
            "글래스 강도": 1,
            "배경 색": "#FFFFFF",
          }}
          width={1920}
          height={1280}
          fps={ENTRY_FPS}
          durationInFrames={2189}
          calculateMetadata={({ props }) => ({
            durationInFrames:
              entryTiming(props).durationInFrames +
              feedbackTiming(ENTRY_FPS).durationInFrames,
          })}
        />
      </Folder>
      <DishTopviewCompositions />
      <FoodIconCompositions />
      <InsightCategoryIconCompositions />
      <Folder name="Color-Guide">
        <Composition
          id="TasteColor-Guide"
          component={ColorGuide}
          schema={colorGuideSchema}
          defaultProps={{ 재생: "영상", 속도: 0.8, "배경 색": "#FFFFFF" }}
          width={1080}
          height={1080}
          fps={COLOR_GUIDE_FPS}
          durationInFrames={colorGuideDuration(0.8)}
          calculateMetadata={({ props }) => ({ durationInFrames: colorGuideDuration(props.속도) })}
        />
        <Composition
          id="TasteColor-Guide-Original"
          component={ColorGuideOriginal}
          schema={colorGuideSchema}
          defaultProps={{ 재생: "영상", 속도: 0.8, "배경 색": "#FFFFFF" }}
          width={1080}
          height={1080}
          fps={ORIGINAL_COLOR_GUIDE_FPS}
          durationInFrames={originalColorGuideDuration(0.8)}
          calculateMetadata={({ props }) => ({
            durationInFrames: originalColorGuideDuration(props.속도),
          })}
        />
        <Composition
          id="TasteColor-GradientCircle"
          component={TasteColorGradientCircle}
          schema={colorGuideSchema}
          defaultProps={{ 재생: "영상", 속도: 0.8, "배경 색": "#FFFFFF" }}
          width={1080}
          height={1080}
          fps={ORIGINAL_COLOR_GUIDE_FPS}
          durationInFrames={originalColorGuideDuration(0.8)}
          calculateMetadata={({ props }) => ({
            durationInFrames: originalColorGuideDuration(props.속도),
          })}
        />
      </Folder>
      <Folder name="Chip-Motion">
        <Composition
          id="Sauce-Splatter"
          component={SauceSplatter}
          schema={sauceSplatterSchema}
          width={1080}
          height={1080}
          fps={SAUCE_SPLATTER_FPS}
          durationInFrames={395}
          calculateMetadata={({ props }) => ({
            durationInFrames: sauceSplatterTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "진입 후 유지" as const,
            속도: 1,
            "시작 대기": 0.4,
            "유지 시간": 1.5,
            "확대 배율": 5,
            "줄 수": 5,
            "상하 여백": 72,
            "카메라 여백": 80,
            칩: [
              { 문구: "해산물", 선택: false, 아이콘: "seafood" },
              { 문구: "육류", 선택: false, 아이콘: "meat" },
              { 문구: "채소/허브", 선택: false, 아이콘: "vegetable_herb" },
              { 문구: "두부/콩", 선택: false, 아이콘: "legume_tofu" },
              { 문구: "달걀", 선택: false, 아이콘: "egg" },
              { 문구: "버섯", 선택: false, 아이콘: "mushroom" },
              { 문구: "과일", 선택: false, 아이콘: "fruit" },
              { 문구: "견과·씨앗", 선택: false, 아이콘: "nut_seed" },
              { 문구: "해조류", 선택: false, 아이콘: "seaweed" },
              { 문구: "면류", 선택: false, 아이콘: "noodle" },
              { 문구: "밥·곡물", 선택: false, 아이콘: "rice_grain" },
              { 문구: "빵", 선택: false, 아이콘: "bread" },
              { 문구: "만두", 선택: false, 아이콘: "dumpling" },
              { 문구: "국물/브로스", 선택: false, 아이콘: "broth" },
              { 문구: "향신료", 선택: false, 아이콘: "spice" },
              { 문구: "구이", 선택: false, 아이콘: "grilled" },
              { 문구: "훈연", 선택: false, 아이콘: "smoked" },
              { 문구: "볶음/웍", 선택: false, 아이콘: "stir_fried_wok" },
              { 문구: "튀김/크리스피", 선택: false, 아이콘: "fried_crispy" },
              { 문구: "찜·스팀", 선택: false, 아이콘: "steamed" },
              { 문구: "전·부침", 선택: false, 아이콘: "pancake" },
              { 문구: "디저트", 선택: false, 아이콘: "dessert" },
              { 문구: "음료/페어링", 선택: false, 아이콘: "beverage_pairing" },
              { 문구: "유제품/치즈", 선택: false, 아이콘: "dairy_cheese" },
            ],
          }}
        />
      </Folder>
      <Folder name="Dining-Feedback">
        <Composition
          id="DiningFeedback-Flip"
          component={DiningFeedbackFlip}
          schema={flipSchema}
          defaultProps={{
            재생: "자동 플립",
            "카드 유지 시간": 1.5,
            "접힘 시간": 0.32,
            "펼침 시간": 0.48,
            "플립 방향": "왼쪽",
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "주색 영역 비중": 0.8,
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={414}
          calculateMetadata={({ props }) => ({
            durationInFrames: flipTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Result"
          component={DiningFeedbackResult}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Card"
          component={DiningFeedbackCard}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
        <Composition
          id="DiningFeedback-Gradient"
          component={DiningFeedbackGradient}
          schema={carouselSchema}
          defaultProps={{
            재생: "자동 스크롤",
            "카드 유지 시간": 0,
            "스크롤 시간": 2.5,
            "주변 카드 불투명도": 1,
            "카드 간격": 24,
            "배경 속도": 2,
            "정지 카드": 1,
            카드: [
              {
                "사진 경로": "brand/dish-topviews/dish-19.png",
                메뉴명: "단호박 라비올리",
                식당명: "오르토 루체",
                "메인 컬러": "단맛",
                "보조 컬러": "지방맛",
                "세 번째 컬러": "감칠맛",
                "맛 반응": [
                  { 미각: "단맛", 문구: "밀도 있는 단맛" },
                  { 미각: "지방맛", 문구: "버터리함" },
                  { 미각: "감칠맛", 문구: "은근한 깊이" },
                ],
                "상세 태그": ["부드러움", "밀도 있음", "재료 간 연결이 좋음"],
                "미식 노트":
                  "단호박 속이 알차고 버터 소스도 잘 어울렸다. 마지막 한 입까지 기분 좋게 먹었다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-12.png",
                메뉴명: "시트러스 타르트",
                식당명: "직접 만든 요리",
                "메인 컬러": "신맛",
                "보조 컬러": "단맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "신맛", 문구: "시트러스 산미" },
                  { 미각: "단맛", 문구: "깔끔한 단맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["과일 향", "바삭함"],
                "미식 노트":
                  "크림의 산미는 마음에 들지만 바닥이 생각보다 두꺼웠다. 다음엔 반죽을 더 얇게 밀어볼 것.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-16.png",
                메뉴명: "구운 관자와 리크",
                식당명: "리에르 테이블",
                "메인 컬러": "쓴맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "쓴맛", 문구: "쌉싸름한 여운" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": [
                  "구운 향",
                  "수분감 있음",
                  "부드러움",
                  "오래 남음",
                ],
                "미식 노트":
                  "관자는 부드러웠는데 리크의 쌉싸름함이 오래 남았다. 내 입맛에는 채소를 조금 덜 구운 쪽이 좋겠다.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-18.png",
                메뉴명: "캐비아 타르틀렛",
                식당명: "메종 네리브",
                "메인 컬러": "짠맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "지방맛",
                "맛 반응": [
                  { 미각: "짠맛", 문구: "선명한 짠맛" },
                  { 미각: "감칠맛", 문구: "해산물 감칠맛" },
                  { 미각: "지방맛", 문구: "크리미함" },
                ],
                "상세 태그": ["해산물 향", "간이 선명함"],
                "미식 노트":
                  "톡톡 터지는 식감은 재미있었다. 다만 내겐 간이 세서 한 입 이상 먹으면 부담스러울 듯.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-20.png",
                메뉴명: "조개와 버섯 브로스",
                식당명: "마레 앤 포레",
                "메인 컬러": "감칠맛",
                "보조 컬러": "짠맛",
                "세 번째 컬러": "단맛",
                "맛 반응": [
                  { 미각: "감칠맛", 문구: "맑은 감칠맛" },
                  { 미각: "짠맛", 문구: "맑은 해수감" },
                  { 미각: "단맛", 문구: "부드러운 단맛" },
                ],
                "상세 태그": ["해산물 향", "흙내음", "따뜻하게 퍼짐"],
                "미식 노트":
                  "뜨거울 때는 조개 향이 먼저, 식으니 버섯 향이 더 또렷했다. 비 오는 날 다시 먹고 싶은 국물.",
              },
              {
                "사진 경로": "brand/dish-topviews/dish-15.png",
                메뉴명: "오리 콩피",
                식당명: "비스트로 루벨",
                "메인 컬러": "지방맛",
                "보조 컬러": "감칠맛",
                "세 번째 컬러": "짠맛",
                "맛 반응": [
                  { 미각: "지방맛", 문구: "풍성한 지방감" },
                  { 미각: "감칠맛", 문구: "육향의 감칠맛" },
                  { 미각: "짠맛", 문구: "풍미를 살린 간" },
                ],
                "상세 태그": [
                  "바삭함",
                  "육향",
                  "코팅감 있음",
                  "마무리가 무거움",
                ],
                "미식 노트":
                  "첫 몇 입은 바삭하고 고소해서 좋았다. 끝에는 조금 무거워져서 산미 있는 곁들임이 있으면 더 좋겠다.",
              },
            ],
          }}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={450}
          calculateMetadata={({ props }) => ({
            durationInFrames: carouselTiming(props).durationInFrames,
          })}
        />
      </Folder>
      <KineticStatementsCompositions />
      <TasteBubbleMapCompositions />
      <Folder name="Card-Motion">
        <Composition
          id="SummaryCard-MiniGraphs-Grid"
          component={SummaryCardGridMotion}
          schema={summaryCardGridSchema}
          fps={SUMMARY_GRID_FPS}
          width={1920}
          height={1080}
          durationInFrames={
            summaryGridTiming(summaryCardGridDefaultProps).durationInFrames
          }
          calculateMetadata={({ props }) => ({
            durationInFrames: summaryGridTiming(props).durationInFrames,
          })}
          defaultProps={summaryCardGridDefaultProps}
        />
        <Composition
          id="HomePeriodInsightCard"
          component={HomePeriodInsightMotion}
          schema={homePeriodMotionSchema}
          fps={30}
          width={1920}
          height={1080}
          durationInFrames={120}
          calculateMetadata={({ props }) => ({
            durationInFrames: periodTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "전체 모션",
            "카드 간격": 12,
            "화면 배율": 1.8,
            "카드 시차": 0.16,
            "정지 시간": 1.5,
            "배경 색": "#F3F3F3",
            카드: [
              {
                종류: "tasteChange",
                제목: "단맛과 감칠맛 반응이 현재 기준에서 달라요",
                설명: "",
                기록: [],
                섹션명: "미각변화",
                키워드: [],
                미각: "기본",
                "가로 그래프": [
                  { 미각: "단맛", 기록: [0, 0, 5, 3, 10, 10, 15.2] },
                  { 미각: "감칠맛", 기록: [0, 0, -4, -4, -7, -6, -10.7] },
                ],
              },
              {
                종류: "recordFlow",
                제목: "4번 기록",
                설명: "이전 7일보다 2번 더 기록했어요.",
                기록: [0, 1, 0, 1, 0, 1, 1],
                섹션명: "",
                미각: "기본",
              },
              {
                종류: "experienceBreadth",
                제목: "메뉴 12개",
                설명: "레스토랑 8곳",
                기록: [2, 4, 3, 7, 5, 9, 6, 10, 4, 8, 7, 12],
                섹션명: "",
                미각: "기본",
              },
            ],
          }}
        />
      </Folder>
      <Folder name="Graph-Motion">
        <Composition
          id="TasteGraph-Transition"
          component={GraphTransition}
          schema={graphTransitionSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={GRAPH_TRANSITION_DURATION}
          defaultProps={graphTransitionDefaultProps}
        />
        <Composition
          id="TasteGraph-Bar"
          component={BarGraph}
          schema={barGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={300}
          calculateMetadata={({ props }) => ({
            durationInFrames: barTiming(props).durationInFrames,
          })}
          defaultProps={{
            색상: "감칠맛",
            재생: "진입·유지·퇴장",
            "시작 대기": 0.3,
            "진입 시간": 0.8,
            "막대 간 지연": 0.08,
            "유지 시간": 1.6,
            "끝 여백": 0.5,
            "확대 배율": 6,
            "배경 색": "#FFFFFF",
            데이터: [
              { 항목: "1일", 값: 0 },
              { 항목: "2일", 값: 1 },
              { 항목: "3일", 값: 3 },
              { 항목: "4일", 값: 2 },
              { 항목: "5일", 값: 5 },
              { 항목: "6일", 값: 4 },
              { 항목: "7일", 값: 7 },
            ],
          }}
        />
        <Composition
          id="TasteGraph-Line"
          component={MiniLineGraph}
          schema={miniLineGraphSchema}
          fps={GRAPH_FPS}
          width={1080}
          height={1080}
          durationInFrames={300}
          calculateMetadata={({ props }) => ({
            durationInFrames: miniLineTiming(props).durationInFrames,
          })}
          defaultProps={{
            재생: "진입·유지·퇴장",
            "시작 대기": 0.3,
            "진입 시간": 1.2,
            "행 간 지연": 0.12,
            "유지 시간": 1.6,
            "끝 여백": 0.7,
            "확대 배율": 6,
            "배경 색": "#FFFFFF",
            데이터: [{ 미각: "감칠맛", 기록: [1.2, 2.1, 2.4, 4.5] }],
          }}
        />
        <Composition
          id="TasteGraph-Area"
          component={MiniAreaGraph}
          schema={miniAreaGraphSchema}
          fps={AREA_FPS}
          width={1080}
          height={1080}
          durationInFrames={AREA_DURATION}
          defaultProps={{
            재생: "진입·유지·퇴장",
            미각: "감칠맛",
            "확대 배율": 6,
            "배경 색": "#FFFFFF",
            기록: [1.2, 2.1, 2.4, 4.5],
          }}
        />
        <Composition
          id="TasteGraph-StackedBar"
          component={MiniStackedBarGraph}
          schema={miniStackedBarGraphSchema}
          fps={STACKED_BAR_FPS}
          width={1080}
          height={1080}
          durationInFrames={STACKED_BAR_DURATION}
          defaultProps={miniStackedBarDefaultProps}
        />
        <Composition
          id="TasteGraph-GroupedBar"
          component={MiniGroupedBarGraph}
          schema={miniGroupedBarGraphSchema}
          fps={GROUPED_BAR_FPS}
          width={1080}
          height={1080}
          durationInFrames={GROUPED_BAR_DURATION}
          defaultProps={miniGroupedBarDefaultProps}
        />
        <Composition
          id="TasteGraph-Heatmap"
          component={MiniHeatmapGraph}
          schema={miniHeatmapGraphSchema}
          fps={HEATMAP_FPS}
          width={1080}
          height={1080}
          durationInFrames={HEATMAP_DURATION}
          defaultProps={miniHeatmapDefaultProps}
        />
        <Composition
          id="TasteGraph-Pie"
          component={MiniPieGraph}
          schema={miniPieGraphSchema}
          fps={PIE_FPS}
          width={1080}
          height={1080}
          durationInFrames={PIE_DURATION}
          defaultProps={miniPieDefaultProps}
        />
        <Composition
          id="TasteGraph-Bubble"
          component={MiniBubbleGraph}
          schema={miniBubbleGraphSchema}
          fps={BUBBLE_FPS}
          width={1080}
          height={1080}
          durationInFrames={BUBBLE_DURATION}
          defaultProps={miniBubbleDefaultProps}
        />
        <Composition
          id="TasteGraph-Treemap"
          component={MiniTreemapGraph}
          schema={miniTreemapGraphSchema}
          fps={TREEMAP_FPS}
          width={1080}
          height={1080}
          durationInFrames={TREEMAP_DURATION}
          defaultProps={miniTreemapDefaultProps}
        />
      </Folder>
      <TasteBloomAvatarCompositions />
      <PetalLogoCompositions />
      <LogoGridCompositions />
      <TasteMotionCompositions />
      <TasteDataCategoryCompositions />
      <Composition
        id="TasteBuddyLaunch"
        component={BrandLaunch}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Folder name="Scenes">
        <Composition
          id="Opening"
          component={Opening}
          durationInFrames={102}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Record"
          component={Record}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Feedback"
          component={Feedback}
          durationInFrames={192}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Insight"
          component={Insight}
          durationInFrames={252}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Connection"
          component={Connection}
          durationInFrames={162}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Signature"
          component={Signature}
          durationInFrames={90}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
