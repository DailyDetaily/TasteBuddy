import { useId, useState, type CSSProperties } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, Copy, Search, X } from "lucide-react";
import { COLOR_GROUPS, NATIVE_COLORS } from "./foundationReferenceData";
import "./color-foundation.css";

type Swatch = {
  label: string;
  value: string;
  code: string;
  description: string;
  alias?: string;
};

function colorFormats(value: string) {
  const channels = value.startsWith("#")
    ? [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16))
    : value
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
  const alpha = value.startsWith("#") ? 1 : Number(value.match(/[\d.]+/g)![3]);
  const hex =
    "#" +
    channels.map((channel) => channel.toString(16).padStart(2, "0")).join("") +
    (alpha === 1
      ? ""
      : Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0"));
  return {
    hex: hex.toUpperCase(),
    rgba: channels.join(" / ") + " / " + alpha,
  };
}

function ColorSwatch({ color, group }: { color: Swatch; group: string }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  const titleId = useId();
  const formats = colorFormats(color.value);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setMessage(label + "을 복사했어요.");
    } catch {
      setCopied("");
      setMessage("복사할 값을 직접 선택해 주세요.");
    }
  }

  function copyButton(value: string, label: string) {
    return (
      <button
        type="button"
        className="pl-color-copy"
        aria-label={label + " 복사"}
        onClick={() => copy(value, label)}
      >
        {copied === value ? <Check size={15} /> : <Copy size={15} />}
      </button>
    );
  }

  return (
    <div className="pl-color-cell" ref={setContainer}>
      <Popover.Root
        onOpenChange={() => {
          setCopied("");
          setMessage("");
        }}
      >
        <Popover.Trigger
          className="pl-color-swatch"
          aria-label={group + " · " + color.label + " 상세"}
        >
          <span className="pl-color-sample" aria-hidden="true">
            <i style={{ background: color.value }} />
          </span>
          <span className="pl-color-label">{color.label}</span>
        </Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content
            className="pl-color-detail"
            aria-labelledby={titleId}
            sideOffset={8}
            collisionPadding={16}
          >
            <header>
              <h4 id={titleId}>{group + " · " + color.label}</h4>
              <Popover.Close
                className="pl-color-close"
                aria-label="색상 상세 닫기"
              >
                <X size={17} />
              </Popover.Close>
            </header>
            <p className="pl-color-description">{color.description}</p>
            <dl className="pl-color-values">
              <div>
                <dt>HEX</dt>
                <dd>
                  <code>{formats.hex}</code>
                  {copyButton(formats.hex, "HEX")}
                </dd>
              </div>
              <div>
                <dt>RGBA</dt>
                <dd>
                  <code>{formats.rgba}</code>
                </dd>
              </div>
              <div className="pl-color-token">
                <dt>Swift</dt>
                <dd>
                  <code>{color.code}</code>
                  {copyButton(color.code, color.code)}
                </dd>
              </div>
              {color.alias && (
                <div>
                  <dt>참조</dt>
                  <dd>
                    <code>{color.alias}</code>
                  </dd>
                </div>
              )}
            </dl>
            <span className="pl-sr" role="status" aria-live="polite">
              {message}
            </span>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function SwatchGroup({
  title,
  description,
  colors,
}: {
  title: string;
  description: string;
  colors: Swatch[];
}) {
  const titleId = useId();
  return (
    <section className="pl-color-group" aria-labelledby={titleId}>
      <h3 id={titleId}>{title}</h3>
      <p>{description}</p>
      <div
        className="pl-color-strip"
        data-count={colors.length}
        style={{ "--pl-color-columns": colors.length } as CSSProperties}
      >
        {colors.map((color) => (
          <ColorSwatch key={color.code} color={color} group={title} />
        ))}
      </div>
    </section>
  );
}

const roleGroups = [
  {
    id: "background",
    title: "페이지 배경",
    description:
      "화면 전체의 바탕이에요. 일반 화면에는 page를, 집중해서 작성하는 흐름에는 focus를 사용해요.",
  },
  {
    id: "surface",
    title: "서페이스",
    description:
      "카드와 콘텐츠 영역을 받쳐줘요. 자리 채움에는 placeholderSurface, 실제로 조작할 수 없는 요소에는 disabledSurface를 사용해요.",
  },
  {
    id: "text",
    title: "텍스트",
    description:
      "주요 정보와 본문, 보조 행동의 위계를 만들어요. 활성 행동에는 textAction을, 실제 비활성에는 textDisabled를 사용해요.",
  },
  {
    id: "border",
    title: "경계",
    description:
      "카드와 반복되는 요소, 조작 영역을 구분해요. 경계의 역할에 맞는 이름을 선택해요.",
  },
  {
    id: "icon",
    title: "아이콘",
    description:
      "기본 아이콘과 포인터 반응, 약한 아이콘을 구분해요. 아이콘의 의미와 주변 글자 위계에 맞게 사용해요.",
  },
  {
    id: "state",
    title: "상태",
    description:
      "일반 안내·정보·성공·주의·오류를 구분해요. 작은 글자에는 각 배경에 맞는 글자색을 사용하고, 아이콘이나 문구로 의미를 함께 알려요.",
  },
  { id: "interaction", title: "행동과 선택", description: "주요 행동과 선택한 상태, 포인터·누름·초점을 표시해요. focusRing은 조작 초점이고, 페이지 배경의 focus와 역할이 달라요." },
  { id: "scrim", title: "딤", description: "뒤 화면을 어둡게 해 현재 작업에 집중하게 해요. 가벼운 맥락 안내는 35%, 확인 대화상자는 50%, 독립된 작업 시트는 60%를 사용해요. 시스템이 제공하는 딤은 플랫폼에 맡겨요." },
] as const;

const shortLabels: Record<string, string> = {
  page: "페이지",
  focus: "집중",
  surface: "기본",
  surfaceHover: "호버",
  mutedSurface: "보조",
  elevatedSurface: "상위",
  disabledSurface: "비활성",
  overlaySurface: "반투명",
  placeholderSurface: "자리 채움",
  inverseSurface: "반전",
  textPrimary: "주요",
  textSecondary: "보조 주요",
  textTertiary: "3차",
  textBody: "본문",
  textAction: "행동",
  textHint: "힌트",
  textDisabled: "비활성",
  textSubtle: "투명 60%",
  textMuted: "투명 50%",
  textFaint: "투명 40%",
  textInverse: "반전",
  borderCard: "카드",
  borderSubtle: "약한",
  border: "기본",
  borderStrong: "강한",
  borderDisabled: "비활성",
  borderAvatar: "아바타",
  borderAvatarSoft: "아바타 보조",
  iconPrimary: "기본",
  iconHover: "호버",
  iconMuted: "약한",
  success: "성공",
  successSoft: "성공 배경",
  warning: "주의",
  warningSoft: "주의 배경",
  destructive: "오류·삭제",
  neutral: "중립 글자",
  neutralSoft: "중립 배경",
  informative: "정보 글자",
  informativeSoft: "정보 배경",
  successText: "성공 글자",
  successStrong: "성공 채움",
  warningStrong: "주의 채움",
  destructiveText: "오류 글자",
  warningText: "주의 글자",
  destructiveSoft: "오류 배경",
  actionPrimary: "주요 행동",
  actionOnPrimary: "행동 위 글자",
  selectionSurface: "선택 배경",
  selectionText: "선택 글자",
  focusRing: "초점 경계",
  hoverOverlay: "호버",
  pressedOverlay: "누름",
  pressedInverseOverlay: "반전 누름",
  scrimSubtle: "약한 딤",
  scrimDefault: "기본 딤",
  scrimStrong: "강한 딤",
};

export function SemanticColorReference() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const searchId = useId();
  const filterId = useId();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const rows = NATIVE_COLORS.filter(
    (color) =>
      (group === "all" || group === color.group) &&
      [
        color.code,
        color.label,
        shortLabels[color.name],
        color.value,
        color.alias ?? "",
        COLOR_GROUPS[color.group],
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
  );
  return (
    <div className="pl-color-reference">
      <div className="pl-color-tools">
        <label htmlFor={searchId}>
          <span>색상 찾기</span>
          <div className="pl-color-search">
            <Search size={17} aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              placeholder="이름, 역할, 색상값"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
        <label htmlFor={filterId}>
          <span>역할</span>
          <select
            id={filterId}
            value={group}
            onChange={(event) => setGroup(event.target.value)}
          >
            <option value="all">모든 역할</option>
            {roleGroups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pl-color-results">
        <span role="status">{rows.length}개 색상</span>
        {(query || group !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup("all");
            }}
          >
            전체 보기
          </button>
        )}
      </div>
      {roleGroups.map((item) => {
        const colors = rows.filter((color) => color.group === item.id);
        if (!colors.length) return null;
        return (
          <SwatchGroup
            key={item.id}
            title={item.title}
            description={item.description}
            colors={colors.map((color) => ({
              label: shortLabels[color.name],
              value: color.value,
              code: color.code,
              description: color.label,
              alias: color.alias
                ? color.alias.startsWith("Color.")
                  ? color.alias
                  : "TBColor." + color.alias
                : undefined,
            }))}
          />
        );
      })}
      {!rows.length && (
        <p className="pl-color-empty">
          일치하는 색상이 없어요. 이름이나 역할을 바꿔 찾아보세요.
        </p>
      )}
      <p className="plfd-note">
        값이 같아도 역할 이름을 유지해요. 반투명 색의 체크무늬는 투명도를
        보여주며, 실제 적용 배경에서의 색과 구분해요.
      </p>
    </div>
  );
}
