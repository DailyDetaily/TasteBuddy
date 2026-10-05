// Generated from the shared web motion geometry. No fixtures, network or persisted data.
(function(){
const factories={"brand-launch/src/TasteDataCategoryMotion/geometry.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryPlaybackDuration = exports.sensoryIdleSpeed = exports.categoryIntroDuration = exports.categoryLoopDuration = exports.responseLabels = exports.polar = exports.stateText = exports.LOOP = exports.INTRO = exports.COLORS = void 0;
exports.categoryFrame = categoryFrame;
const designTokens_1 = require("src/constants/designTokens.ts");
const change_1 = require("brand-launch/src/TasteDataCategoryMotion/change.ts");
const context_1 = require("brand-launch/src/TasteDataCategoryMotion/context.ts");
const sensory_1 = require("brand-launch/src/TasteDataCategoryMotion/sensory.ts");
const experience_1 = require("brand-launch/src/TasteDataCategoryMotion/experience.ts");
const taste_motion_1 = require("brand-launch/src/taste-motion.ts");
exports.COLORS = taste_motion_1.palette;
exports.INTRO = 1.8, exports.LOOP = 12;
exports.stateText = {
    valid: "",
    noData: "자료 없음",
    unanswered: "미응답",
    held: "해석 보류",
    unlinked: "연결 미확인",
};
const TAU = Math.PI * 2;
const smooth = (x) => {
    const v = Math.max(0, Math.min(1, x));
    return v * v * (3 - 2 * v);
};
const polar = (a, r) => ({
    x: 320 + Math.cos(a) * r,
    y: 320 + Math.sin(a) * r,
});
exports.polar = polar;
const responseLabels = (mode) => mode === "liking"
    ? ["좋음", "보통", "아쉬움"]
    : mode === "fit"
        ? ["부족", "알맞음", "과함"]
        : ["매우 좋음", "좋음", "보통", "아쉬움", "매우 아쉬움"];
exports.responseLabels = responseLabels;
const valid = (rows) => rows.filter((r) => typeof r.response === "number");
function baseCategoryFrame(data, time, options = {}) {
    if (data.kind === "experienceCluster")
        return (0, experience_1.experienceFrame)(data, time, options);
    if (data.kind === "sensoryRays")
        return (0, sensory_1.sensoryFrame)(data, time, options);
    if (data.kind === "contextLayers")
        return (0, context_1.contextFrame)(data, time, options);
    if (data.kind === "changeRipples")
        return (0, change_1.changeFrame)(data, time, options);
    const settled = options.playback === "idle" || options.playback === "reduced";
    const t = settled ? exports.INTRO : Math.max(0, time), idle = options.playback === "reduced"
        ? 0
        : Math.max(0, options.playback === "idle" ? time : time - exports.INTRO);
    const reveal = smooth((t - 1.4) / 0.4);
    const f = {
        dots: [],
        lines: [],
        labels: [],
        title: "",
        value: "—",
        unit: "",
        notes: [],
        legend: "",
        summaryOpacity: reveal,
        choices: [],
        selection: [],
        state: data.state,
    };
    if (data.kind === "preferenceFocus") {
        const labels = (0, exports.responseLabels)(data.mode), rows = valid(data.responses);
        f.title =
            data.mode === "overall"
                ? "음식 전체 평가"
                : data.mode === "fit"
                    ? "알맞음"
                    : "감각별 호감";
        f.value = data.state === "valid" ? String(rows.length) : "—";
        f.unit = data.mode === "overall" ? "개 요리 평가" : "개 식사 응답";
        const counts = labels.map((_, i) => rows.filter((r) => r.response === i).length);
        const quotas = counts.map((n) => rows.length ? (n / rows.length) * 126 : 0), allocated = quotas.map(Math.floor);
        const order = quotas
            .map((_, i) => i)
            .sort((a, b) => quotas[b] - allocated[b] - (quotas[a] - allocated[a]) || a - b);
        if (rows.length)
            for (const i of order.slice(0, 126 - allocated.reduce((a, b) => a + b, 0)))
                allocated[i]++;
        const colors = allocated.flatMap((n, i) => Array.from({ length: n }, () => i));
        // Reuse the original packed-dot expansion, alignment and drag rotation geometry.
        // Freeze free-motion time at the end of the entrance; the data distribution never drifts.
        const ring = (0, taste_motion_1.insightFrame)(Math.min(t / exports.INTRO, 1) * taste_motion_1.insightIntroDuration, settled, options.alignment || 0, 0, (options.rotation || 0) + (idle / 60) * TAU);
        ring.dots.forEach((dot, i) => {
            const category = colors[(i % 6) * 21 + Math.floor(i / 6)], key = category === undefined ? "" : String(category);
            f.dots.push({
                id: "proportion-" + i,
                x: 320 + (dot.x - 320) * 0.84,
                y: 320 + (dot.y - 320) * 0.84,
                r: dot.radius * 0.84,
                color: category === undefined ? "#e4e0da" : exports.COLORS[category],
                // Stable decorative tone levels remain visibly distinct at the preview scale.
                opacity: dot.progress *
                    [1, 0.84, 0.68, 0.52][(i * 7 + Math.floor(i / 6)) % 4] *
                    (options.selected && options.selected !== key ? 0.35 : 1),
                group: key,
            });
        });
        labels.forEach((label, i) => {
            f.choices.push({ id: String(i), label: label + " " + counts[i] });
            if (options.selected === String(i))
                f.selection = [
                    label,
                    counts[i] +
                        " / " +
                        rows.length +
                        (data.mode === "overall" ? "개 요리 평가" : "개 식사 응답"),
                    rows.length
                        ? ((counts[i] / rows.length) * 100).toFixed(1) +
                            "% · 실제 평가 비율"
                        : "유효 평가 없음",
                ];
        });
        f.notes = [
            labels.map((label, i) => label + " " + counts[i]).join(" · "),
            ["split", "unanswered", "held"]
                .map((status, i) => ["응답 나뉨", "미응답", "해석 보류"][i] +
                " " +
                data.responses.filter((r) => r.response === status).length)
                .join(" · "),
            rows.length > 0 && rows.length < 5
                ? "아직 적은 기록 · 실제 평가 " + rows.length + "개"
                : "유효 평가 " + rows.length + "개",
            "점은 126개 비율 표현용 · 점 하나가 평가 한 건은 아님",
        ];
        f.legend = "색 = " + labels.join(" / ") + " · 점 색 비율 ≈ 유효 평가 비율";
    }
    if (f.state !== "valid") {
        if (data.kind === "preferenceFocus") {
            const labels = (0, exports.responseLabels)(data.mode);
            f.choices = labels.map((label, i) => ({ id: String(i), label }));
            f.notes = [
                "유효 평가: " + exports.stateText[f.state],
                data.responses.length ? f.notes[1] : "응답 상태: 자료 없음",
                f.notes[3],
            ];
            if (f.selection.length)
                f.selection = [f.selection[0], exports.stateText[f.state]];
        }
        f.notes = [exports.stateText[f.state], ...f.notes];
    }
    return f;
}
const categoryLoopDuration = (kind) => kind === "preferenceFocus" || kind === "experienceCluster"
    ? 60
    : kind === "contextLayers" || kind === "changeRipples"
        ? context_1.CONTEXT_IDLE
        : exports.LOOP;
exports.categoryLoopDuration = categoryLoopDuration;
const categoryIntroDuration = (kind) => kind === "experienceCluster" ? experience_1.EXPERIENCE_INTRO : exports.INTRO;
exports.categoryIntroDuration = categoryIntroDuration;
const sensoryIdleSpeed = (id) => {
    let hash = 2166136261;
    for (const char of id)
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    return [1, 2, 3, 4][hash % 4];
};
exports.sensoryIdleSpeed = sensoryIdleSpeed;
/** Presentation drift is separate from the encoded data coordinates. */
function categoryFrame(data, time, options = {}) {
    var _a, _b, _c;
    const frame = baseCategoryFrame(data, time, options);
    if (frame.state === "held") {
        const neutral = designTokens_1.COLOR_TOKENS.border.subtle;
        // A missing data shape gets a decorative neutral ring, never synthetic records.
        if (!frame.dots.length) {
            const settled = options.playback === "idle" || options.playback === "reduced";
            const t = Math.min(Math.max(0, time) / (0, exports.categoryIntroDuration)(data.kind), 1) * taste_motion_1.insightIntroDuration;
            const ring = (0, taste_motion_1.insightFrame)(t, settled);
            frame.summaryOpacity = settled ? 1 : smooth((t / taste_motion_1.insightIntroDuration - 0.78) / 0.22);
            frame.dots = ring.dots.map((dot, i) => ({
                id: "held-placeholder-" + i,
                x: 320 + (dot.x - 320) * 0.84,
                y: 320 + (dot.y - 320) * 0.84,
                r: dot.radius * 0.84,
                color: neutral,
                opacity: dot.opacity,
                data: false,
            }));
        }
        frame.dots = frame.dots.map((dot) => ({
            ...dot, color: neutral, tintColor: neutral, tint: 0, data: false,
            group: undefined, role: undefined,
        }));
        frame.bridges = (_a = frame.bridges) === null || _a === void 0 ? void 0 : _a.map((bridge) => ({ ...bridge, color: neutral }));
        frame.lines = [];
        frame.legend = "뉴트럴 점은 해석 보류 상태 표시용이며 기록·평가 수를 나타내지 않음";
        frame.notes = [exports.stateText.held, ...frame.notes.filter((note) => note !== exports.stateText.held)];
    }
    if (data.kind === "experienceCluster") {
        const idle = options.playback === "reduced" ? 0 : Math.max(0, (_b = options.rotationTime) !== null && _b !== void 0 ? _b : (options.playback === "idle" ? time : time - experience_1.EXPERIENCE_INTRO));
        const angle = (idle / 60) * TAU + (options.rotation || 0);
        const c = Math.cos(angle), s = Math.sin(angle);
        const turn = (p) => ({ ...p,
            x: 320 + (p.x - 320) * c - (p.y - 320) * s,
            y: 320 + (p.x - 320) * s + (p.y - 320) * c });
        frame.dots = frame.dots.map(turn);
        frame.labels = frame.labels.map(turn);
        frame.bridges = (_c = frame.bridges) === null || _c === void 0 ? void 0 : _c.map(bridge => ({ ...bridge, points: bridge.points.map(turn) }));
    }
    if (data.kind === "sensoryRays" && options.rotation) {
        const c = Math.cos(options.rotation), s = Math.sin(options.rotation);
        frame.dots = frame.dots.map((d) => ({
            ...d,
            x: 320 + (d.x - 320) * c - (d.y - 320) * s,
            y: 320 + (d.x - 320) * s + (d.y - 320) * c,
        }));
    }
    if (data.kind === "experienceCluster" ||
        data.kind === "contextLayers" ||
        data.kind === "changeRipples" ||
        options.playback === "reduced")
        return frame;
    const idle = Math.max(0, options.playback === "idle" ? time : time - exports.INTRO);
    if (!idle)
        return frame;
    if (data.kind === "sensoryRays" || data.kind === "preferenceFocus") {
        frame.dots = frame.dots.map((dot) => {
            if (data.kind !== "sensoryRays")
                return { ...dot, ...(0, experience_1.experienceIdlePosition)(dot, dot.id, idle) };
            // Independent paths, with greater tangential travel than radial travel.
            // Per-ID integer speeds retain the shared 12-second loop boundary.
            const offset = (0, experience_1.experienceIdleOffset)(dot.id, idle * (0, exports.sensoryIdleSpeed)(dot.id));
            const radius = Math.hypot(dot.x - 320, dot.y - 320);
            const angle = Math.atan2(dot.y - 320, dot.x - 320);
            const radialRoom = Math.max(0, Math.min(6, 286 - radius, radius - 130));
            const r = radius + (offset.y / 1.32) * radialRoom;
            const a = angle + ((offset.x / 1.32) * 12) / radius;
            return { ...dot, x: 320 + Math.cos(a) * r, y: 320 + Math.sin(a) * r };
        });
    }
    return frame;
}
const categoryPlaybackDuration = (kind, playback) => (0, exports.categoryLoopDuration)(kind) + (playback === "intro" ? (0, exports.categoryIntroDuration)(kind) : 0);
exports.categoryPlaybackDuration = categoryPlaybackDuration;

},
"src/constants/designTokens.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESIGN_TOKENS = exports.NEUTRAL_TASTE_TOKENS = exports.TASTE_COLORS = exports.TASTE_LABEL_TO_ID = exports.TASTE_LABELS = exports.TASTE_TOKENS = exports.TASTE_IDS = exports.COMPONENT_TOKENS = exports.LAYOUT_TOKENS = exports.COLOR_TOKENS = exports.DATA_VIZ_TOKENS = exports.BOX_TOKENS = exports.ICON_TOKENS = exports.MOTION_TOKENS = exports.SHADOW_TOKENS = exports.TYPOGRAPHY_TOKENS = exports.RADIUS_TOKENS = exports.SPACING_TOKENS = exports.DESIGN_SYSTEM = void 0;
exports.DESIGN_SYSTEM = {
    name: '플레이팅',
    englishName: 'Plating',
    product: 'Taste Buddy',
    description: '맛의 경험을 담고, 관계를 정돈하고, 의미가 드러나는 순간을 설계한다.',
};
exports.SPACING_TOKENS = {
    2: '2px',
    4: '4px',
    6: '6px',
    8: '8px',
    10: '10px',
    12: '12px',
    16: '16px',
    20: '20px',
    24: '24px',
    40: '40px',
};
exports.RADIUS_TOKENS = {
    6: '6px',
    8: '8px',
    10: '10px',
    12: '12px',
    14: '14px',
    20: '20px',
    24: '24px',
    full: '9999px',
};
exports.TYPOGRAPHY_TOKENS = {
    family: {
        sans: '"Pretendard", ui-sans-serif, system-ui, sans-serif',
    },
    fontSize: {
        10: '10px',
        11: '11px',
        12: '12px',
        13: '13px',
        14: '14px',
        15: '15px',
        16: '16px',
        18: '18px',
        20: '18px',
        22: '18px',
        24: '18px',
        28: '18px',
    },
    fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.2,
        snug: 1.35,
        normal: 1.4,
        relaxed: 1.5,
    },
    letterSpacing: {
        tight: '-0.24px',
        micro: '0.14px',
        none: '0',
    },
};
exports.SHADOW_TOKENS = {
    hover: '0 1px 3px rgba(15, 15, 15, 0.06)',
    soft: '0 4px 20px rgba(0, 0, 0, 0.1)',
    strong: '0 12px 32px rgba(15, 15, 15, 0.12)',
    button: '0 8px 20px rgba(0, 0, 0, 0.1)',
    drawer: '0 20px 60px rgba(0, 0, 0, 0.24)',
};
exports.MOTION_TOKENS = {
    durationMs: {
        press: 120,
        fast: 180,
        normal: 300,
        medium: 500,
        slow: 620,
        slowest: 720,
        loopPulse: 1600,
        splash: 2500,
    },
    staggerMs: 60,
    easing: {
        standard: 'ease',
        entrance: 'cubic-bezier(0.22, 1, 0.36, 1)',
        exit: 'ease-out',
    },
    spring: {
        screenDamping: 25,
        screenStiffness: 200,
    },
    scale: {
        press: 0.98,
        tabHover: 1.05,
        tabActive: 1.1,
        loopNodePulse: 1.28,
        loopLabelPulse: 1.06,
    },
    distance: {
        xSmall: 8,
        small: 12,
        medium: 20,
        large: 40,
        onboardingSwipe: 100,
    },
};
exports.ICON_TOKENS = {
    size: {
        xs: 12,
        sm: 14,
        base: 16,
        md: 18,
        control: 20,
        lg: 24,
        xl: 28,
        touch: 24,
        hero: 24,
    },
    strokeWidth: {
        thin: 1.5,
        regular: 1.8,
        medium: 2,
        strong: 2.2,
        emphasis: 3,
    },
    container: {
        sm: 18,
        md: 24,
        lg: 32,
        xl: 32,
    },
};
exports.BOX_TOKENS = {
    size: {
        sm: 32,
        md: 40,
        lg: 48,
    },
};
exports.DATA_VIZ_TOKENS = {
    progress: {
        barHeight: 8,
        barTrack: '#E8E8E8',
    },
    radar: {
        size: 320,
        gridColor: '#E8E8E8',
        averageFill: 'rgba(240, 240, 240, 0.6)',
        averageStroke: '#D0D0D0',
        highlightFill: 'rgba(255, 153, 0, 0.12)',
        highlightStroke: '#FF9900',
        labelSize: 10,
        labelColor: '#888888',
        nodeSize: 3,
        outerDotSize: 8,
    },
    trend: {
        lineStrokeWidth: 1,
        dotSize: 4,
        activeDotSize: 5,
    },
    ring: {
        outerSize: 320,
        innerNodeRadius: 12,
        stepCount: 10,
        outerRingThickness: 24,
        guideDotSize: 1,
        stepPulses: 1,
    },
};
exports.COLOR_TOKENS = {
    background: {
        page: '#F3F3F3',
        focus: '#FFFFFF',
    },
    surface: {
        base: '#FFFFFF',
        card: '#FFFFFF',
        cardHover: '#FAFAFA',
        muted: '#F7F7F7',
        elevated: '#FCFCFC',
        disabled: '#EFEFEF',
        overlay: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
        primary: '#0F0F0F',
        secondary: '#3F3F3F',
        tertiary: '#535353',
        body: '#666666',
        hint: '#888888',
        disabled: '#AFAFAF',
        inverse: '#FFFFFF',
        subtle: 'rgba(15, 15, 15, 0.6)',
        muted: 'rgba(15, 15, 15, 0.5)',
        faint: 'rgba(15, 15, 15, 0.4)',
    },
    border: {
        card: '#F0F0F0',
        subtle: '#E8E8E8',
        default: '#E7E7E7',
        strong: '#E5E5E5',
        disabled: '#E0E0E0',
        avatar: 'rgba(15, 15, 15, 0.2)',
        avatarSoft: 'rgba(15, 15, 15, 0.15)',
    },
    icon: {
        primary: '#3F3F3F',
        hover: '#6F6F6F',
        muted: '#AFAFAF',
    },
    state: {
        success: '#2F8F5B',
        successSoft: '#E6F4EC',
        warning: '#A8661A',
        warningSoft: '#FFF1DE',
        destructive: '#D4183D',
    },
    shadow: exports.SHADOW_TOKENS,
};
exports.LAYOUT_TOKENS = {
    screenMaxWidth: '1440px',
    pageGutter: '20px',
    sectionGap: exports.SPACING_TOKENS[20],
    cardStackGap: exports.SPACING_TOKENS[12],
    cardPadding: '12px',
    topAppBarHeight: '56px',
    bottomTabBarHeight: '60px',
    primaryButtonHeight: '48px',
    bottomFadeMinHeight: '140px',
    bottomIndicatorWidth: '134px',
    tasteLoopSize: 320,
    tasteLoopGuideDotDiameter: 1,
    tasteLoopGuideDotGap: 3,
    tasteLoopGuideRadius: 138,
    tasteLoopLabelOffset: 4,
    tasteLoopNodeRadius: 12,
    tasteLoopOuterRingInset: 10,
    tasteLoopOuterRingThickness: 24,
    tasteLoopRingRadius: 138,
    tasteLoopStepCount: 10,
};
exports.COMPONENT_TOKENS = {
    card: {
        background: exports.COLOR_TOKENS.surface.card,
        hoverBackground: exports.COLOR_TOKENS.surface.cardHover,
        padding: exports.SPACING_TOKENS[12],
        radius: exports.RADIUS_TOKENS[20],
    },
    button: {
        height: exports.LAYOUT_TOKENS.primaryButtonHeight,
        radius: exports.RADIUS_TOKENS[10],
        background: exports.COLOR_TOKENS.text.primary,
        color: exports.COLOR_TOKENS.text.inverse,
        disabledBackground: exports.COLOR_TOKENS.surface.disabled,
        disabledColor: exports.COLOR_TOKENS.text.disabled,
    },
    badge: {
        radius: exports.RADIUS_TOKENS[6],
        paddingInline: exports.SPACING_TOKENS[8],
        paddingBlock: exports.SPACING_TOKENS[2],
    },
    chip: {
        radius: exports.RADIUS_TOKENS.full,
        size: {
            xs: {
                fontSize: exports.TYPOGRAPHY_TOKENS.fontSize[10],
                gap: exports.SPACING_TOKENS[4],
                iconSize: exports.TYPOGRAPHY_TOKENS.fontSize[12],
                paddingBlock: exports.SPACING_TOKENS[4],
                paddingInline: exports.SPACING_TOKENS[8],
            },
            sm: {
                fontSize: exports.TYPOGRAPHY_TOKENS.fontSize[11],
                gap: exports.SPACING_TOKENS[6],
                iconSize: exports.TYPOGRAPHY_TOKENS.fontSize[12],
                paddingBlock: exports.SPACING_TOKENS[6],
                paddingInline: exports.SPACING_TOKENS[10],
            },
            md: {
                fontSize: exports.TYPOGRAPHY_TOKENS.fontSize[12],
                gap: exports.SPACING_TOKENS[8],
                iconSize: exports.TYPOGRAPHY_TOKENS.fontSize[14],
                paddingBlock: exports.SPACING_TOKENS[8],
                paddingInline: exports.SPACING_TOKENS[12],
            },
        },
        tone: {
            neutral: {
                soft: {
                    backgroundColor: exports.COLOR_TOKENS.surface.muted,
                    borderColor: exports.COLOR_TOKENS.border.default,
                    color: exports.COLOR_TOKENS.text.muted,
                },
                outline: {
                    backgroundColor: 'transparent',
                    borderColor: exports.COLOR_TOKENS.border.default,
                    color: exports.COLOR_TOKENS.text.secondary,
                },
                solid: {
                    backgroundColor: exports.COLOR_TOKENS.text.primary,
                    borderColor: exports.COLOR_TOKENS.text.primary,
                    color: exports.COLOR_TOKENS.text.inverse,
                },
                text: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: exports.COLOR_TOKENS.text.secondary,
                },
            },
            success: {
                soft: {
                    backgroundColor: exports.COLOR_TOKENS.state.successSoft,
                    borderColor: exports.COLOR_TOKENS.state.successSoft,
                    color: exports.COLOR_TOKENS.state.success,
                },
                outline: {
                    backgroundColor: 'transparent',
                    borderColor: exports.COLOR_TOKENS.state.success,
                    color: exports.COLOR_TOKENS.state.success,
                },
                solid: {
                    backgroundColor: exports.COLOR_TOKENS.state.success,
                    borderColor: exports.COLOR_TOKENS.state.success,
                    color: exports.COLOR_TOKENS.text.inverse,
                },
                text: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: exports.COLOR_TOKENS.state.success,
                },
            },
            warning: {
                soft: {
                    backgroundColor: exports.COLOR_TOKENS.state.warningSoft,
                    borderColor: exports.COLOR_TOKENS.state.warningSoft,
                    color: exports.COLOR_TOKENS.state.warning,
                },
                outline: {
                    backgroundColor: 'transparent',
                    borderColor: exports.COLOR_TOKENS.state.warning,
                    color: exports.COLOR_TOKENS.state.warning,
                },
                solid: {
                    backgroundColor: exports.COLOR_TOKENS.state.warning,
                    borderColor: exports.COLOR_TOKENS.state.warning,
                    color: exports.COLOR_TOKENS.text.inverse,
                },
                text: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: exports.COLOR_TOKENS.state.warning,
                },
            },
            accent: {
                soft: {
                    backgroundColor: exports.COLOR_TOKENS.surface.base,
                    borderColor: exports.COLOR_TOKENS.text.primary,
                    color: exports.COLOR_TOKENS.text.primary,
                },
                outline: {
                    backgroundColor: 'transparent',
                    borderColor: exports.COLOR_TOKENS.text.primary,
                    color: exports.COLOR_TOKENS.text.primary,
                },
                solid: {
                    backgroundColor: exports.COLOR_TOKENS.text.primary,
                    borderColor: exports.COLOR_TOKENS.text.primary,
                    color: exports.COLOR_TOKENS.text.inverse,
                },
                text: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: exports.COLOR_TOKENS.text.primary,
                },
            },
        },
    },
    pill: {
        radius: exports.RADIUS_TOKENS.full,
    },
};
exports.TASTE_IDS = ['sweet', 'sour', 'bitter', 'salty', 'umami', 'fat'];
exports.TASTE_TOKENS = {
    sweet: {
        label: '단맛',
        palette: {
            main: '#FF9900',
            dark: '#CC7A00',
            light: '#FFCC80',
            bg: '#FFD699',
            tintSoft: 'rgba(255, 153, 0, 0.05)',
            tintSoftBorder: 'rgba(255, 153, 0, 0.18)',
            tintSurface: '#FFEBCC',
            tintSurfaceSubText: '#896735',
            tintSurfaceText: '#6F4609',
            gradient: 'linear-gradient(135deg, #FF9900, #FFB84D)',
        },
        measurement: {
            accent: '#FF9500',
            ordinal: '첫 번째',
            loop: {
                nodeColors: [
                    '#FFF5E5',
                    '#FFEBCC',
                    '#FFE0B2',
                    '#FFD699',
                    '#FFCC7F',
                    '#FFC266',
                    '#FFB74C',
                    '#FFAD33',
                    '#FFA319',
                    '#FF9900',
                ],
                ringBaseColor: '#FFEBCC',
                ringBaseColorSoft: '#FFEBCC1A',
                ringGuideBaseColor: '#FF9900',
                glowTransparentColor: '#FFEBCC08',
            },
        },
    },
    sour: {
        label: '신맛',
        palette: {
            main: '#FBC02D',
            dark: '#C99A00',
            light: '#FDD835',
            bg: '#FFEF99',
            tintSoft: 'rgba(251, 192, 45, 0.05)',
            tintSoftBorder: 'rgba(251, 192, 45, 0.18)',
            tintSurface: '#FFF7CC',
            tintSurfaceSubText: '#897C35',
            tintSurfaceText: '#6F5F09',
            gradient: 'linear-gradient(135deg, #FBC02D, #FFD54F)',
        },
        measurement: {
            accent: '#FFD600',
            ordinal: '두 번째',
            loop: {
                nodeColors: [
                    '#FFF7CC',
                    '#FFF4B8',
                    '#FFF1A3',
                    '#FFEE8F',
                    '#FFEB7A',
                    '#FFE866',
                    '#FFE552',
                    '#FFE23D',
                    '#FFDF29',
                    '#FFD600',
                ],
                ringBaseColor: '#FFF7CC',
                ringBaseColorSoft: '#FFF7CC1A',
                ringGuideBaseColor: '#FFD600',
                glowTransparentColor: '#FFF7CC08',
            },
        },
    },
    bitter: {
        label: '쓴맛',
        palette: {
            main: '#95C900',
            dark: '#6E9600',
            light: '#E6EE9C',
            bg: '#E0EBB4',
            tintSoft: 'rgba(149, 201, 0, 0.05)',
            tintSoftBorder: 'rgba(149, 201, 0, 0.18)',
            tintSurface: '#EAF4CC',
            tintSurfaceSubText: '#70794B',
            tintSurfaceText: '#505B24',
            gradient: 'linear-gradient(135deg, #95C900, #AED581)',
        },
        measurement: {
            accent: '#8CC600',
            ordinal: '세 번째',
            loop: {
                nodeColors: [
                    '#EAF4CC',
                    '#E1EFC0',
                    '#D8EAB4',
                    '#CFE5A8',
                    '#C5DF9C',
                    '#BCDA90',
                    '#B3D584',
                    '#AAD078',
                    '#A0CB6C',
                    '#95C900',
                ],
                ringBaseColor: '#EAF4CC',
                ringBaseColorSoft: '#EAF4CC1A',
                ringGuideBaseColor: '#95C900',
                glowTransparentColor: '#EAF4CC08',
            },
        },
    },
    salty: {
        label: '짠맛',
        palette: {
            main: '#7299FF',
            dark: '#4A70CC',
            light: '#90CAF9',
            bg: '#C6D6FF',
            tintSoft: 'rgba(114, 153, 255, 0.05)',
            tintSoftBorder: 'rgba(114, 153, 255, 0.18)',
            tintSurface: '#E3EBFF',
            tintSurfaceSubText: '#5A6789',
            tintSurfaceText: '#36466F',
            gradient: 'linear-gradient(135deg, #7299FF, #9FBFFF)',
        },
        measurement: {
            accent: '#5898FF',
            ordinal: '네 번째',
            loop: {
                nodeColors: [
                    '#E3EBFF',
                    '#D6E2FF',
                    '#C9D9FF',
                    '#BCD0FF',
                    '#AFC7FF',
                    '#A2BEFF',
                    '#95B5FF',
                    '#88ACFF',
                    '#7BA3FF',
                    '#7299FF',
                ],
                ringBaseColor: '#E3EBFF',
                ringBaseColorSoft: '#E3EBFF1A',
                ringGuideBaseColor: '#7299FF',
                glowTransparentColor: '#E3EBFF08',
            },
        },
    },
    umami: {
        label: '감칠맛',
        palette: {
            main: '#B372B4',
            dark: '#8A5490',
            light: '#CE93D8',
            bg: '#E1C7E1',
            tintSoft: 'rgba(179, 114, 180, 0.05)',
            tintSoftBorder: 'rgba(179, 114, 180, 0.18)',
            tintSurface: '#F0E3F0',
            tintSurfaceSubText: '#705B70',
            tintSurfaceText: '#513751',
            gradient: 'linear-gradient(135deg, #B372B4, #CE93D8)',
        },
        measurement: {
            accent: '#AF52DE',
            ordinal: '다섯 번째',
            loop: {
                nodeColors: [
                    '#F0E3F0',
                    '#E7D7E8',
                    '#DECAE0',
                    '#D5BED8',
                    '#CCB1D0',
                    '#C3A5C8',
                    '#BA98C0',
                    '#B18CB8',
                    '#A87FB0',
                    '#B372B4',
                ],
                ringBaseColor: '#F0E3F0',
                ringBaseColorSoft: '#F0E3F01A',
                ringGuideBaseColor: '#B372B4',
                glowTransparentColor: '#F0E3F008',
            },
        },
    },
    fat: {
        label: '지방맛',
        palette: {
            main: '#95867A',
            dark: '#6B5E54',
            light: '#BCAAA4',
            bg: '#D5CFCA',
            tintSoft: 'rgba(149, 134, 122, 0.05)',
            tintSoftBorder: 'rgba(149, 134, 122, 0.18)',
            tintSurface: '#EAE7E4',
            tintSurfaceSubText: '#66625D',
            tintSurfaceText: '#453F3A',
            gradient: 'linear-gradient(135deg, #95867A, #B0A49A)',
        },
        measurement: {
            accent: '#8E8279',
            ordinal: '여섯 번째',
            loop: {
                nodeColors: [
                    '#EAE7E4',
                    '#E2DEDA',
                    '#DAD5D0',
                    '#D2CCC6',
                    '#CAC3BC',
                    '#C2BAB2',
                    '#BAB1A8',
                    '#B2A89E',
                    '#AA9F94',
                    '#95867A',
                ],
                ringBaseColor: '#EAE7E4',
                ringBaseColorSoft: '#EAE7E41A',
                ringGuideBaseColor: '#95867A',
                glowTransparentColor: '#EAE7E408',
            },
        },
    },
};
exports.TASTE_LABELS = exports.TASTE_IDS.map((id) => exports.TASTE_TOKENS[id].label);
exports.TASTE_LABEL_TO_ID = Object.fromEntries(exports.TASTE_IDS.map((id) => [exports.TASTE_TOKENS[id].label, id]));
exports.TASTE_COLORS = Object.fromEntries(exports.TASTE_IDS.map((id) => [exports.TASTE_TOKENS[id].label, exports.TASTE_TOKENS[id].palette]));
exports.NEUTRAL_TASTE_TOKENS = {
    label: '모든맛',
    palette: {
        main: '#7A7A7A',
        tintSurface: '#E4E4E4',
    },
};
exports.DESIGN_TOKENS = {
    colors: exports.COLOR_TOKENS,
    shadows: exports.SHADOW_TOKENS,
    spacing: exports.SPACING_TOKENS,
    radius: exports.RADIUS_TOKENS,
    typography: exports.TYPOGRAPHY_TOKENS,
    motion: exports.MOTION_TOKENS,
    icon: exports.ICON_TOKENS,
    dataViz: exports.DATA_VIZ_TOKENS,
    layout: exports.LAYOUT_TOKENS,
    components: exports.COMPONENT_TOKENS,
    taste: exports.TASTE_TOKENS,
};

},
"brand-launch/src/TasteDataCategoryMotion/change.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeFrame = changeFrame;
const colors_1 = require("brand-launch/src/TasteDataCategoryMotion/colors.ts");
const designTokens_1 = require("src/constants/designTokens.ts");
const context_1 = require("brand-launch/src/TasteDataCategoryMotion/context.ts");
const statuses = {
    valid: "",
    noData: "자료 없음",
    unanswered: "미응답",
    held: "해석 보류",
    unlinked: "연결 미확인",
};
function changeFrame(data, time, options = {}) {
    var _a;
    const periods = [data.previous, data.recent];
    const values = periods.map((p) => data.state === "valid" &&
        p.state === "valid" &&
        p.value !== null &&
        Number.isFinite(p.value) &&
        p.value >= 0
        ? p.value
        : null);
    const comparable = values.every((v) => v !== null);
    const hasData = values.some((v) => v !== null);
    const maximum = Math.max(1, Number.isFinite(data.maximum) ? data.maximum : 1, ...values.map((v) => v !== null && v !== void 0 ? v : 0));
    const unknown = periods.find((_, i) => values[i] === null);
    const state = data.state !== "valid"
        ? data.state
        : comparable
            ? "valid"
            : (unknown === null || unknown === void 0 ? void 0 : unknown.state) === "valid"
                ? "noData"
                : ((_a = unknown === null || unknown === void 0 ? void 0 : unknown.state) !== null && _a !== void 0 ? _a : "noData");
    // Unavailable comparisons remain still and neutral instead of implying a change.
    const motion = (0, context_1.dotRingMotion)(hasData ? 2 : 0, time, comparable ? options : { ...options, playback: "reduced" });
    const f = {
        dots: [],
        lines: [],
        labels: [],
        title: data.metric,
        value: values.map((v) => (v === null ? "—" : String(v))).join(" → "),
        unit: data.unit,
        state,
        motionPhase: comparable ? motion.phase.label : "비교 대기",
        summaryOpacity: comparable ? motion.summaryOpacity : 1,
        choices: [],
        selection: [],
        legend: "안쪽 이전 · 바깥쪽 최근 · 공통 0–" +
            maximum +
            " " +
            data.unit +
            " · 진한 점 비율 ≈ 수치 / 공통 상한",
        notes: [
            ...(comparable ? [] : [statuses[state] + " · 비교 대기"]),
            ...periods.map((p) => p.label + " " + p.start + "–" + p.end),
            "점 하나는 기록 한 건이 아닌 비율 눈금 · 색은 기간 구분이며 좋고 나쁨을 뜻하지 않음",
        ],
    };
    periods.forEach((period, i) => {
        const value = values[i], token = (i === 0 ? designTokens_1.TASTE_TOKENS.fat : designTokens_1.TASTE_TOKENS.salty).palette;
        const id = "period-" + i;
        const dots = motion.layers[i] || [];
        const active = value === null ? 0 : Math.round((dots.length * value) / maximum);
        const emphasis = options.selected && options.selected !== id ? 0.35 : 1;
        dots.forEach((dot, slot) => f.dots.push({
            ...dot,
            id: id + ":" + slot,
            group: id,
            color: value === null ? "#dedad5" : token.main,
            tintColor: (0, colors_1.motionTint)(token),
            tint: value === null ? 0 : slot < active ? 0 : 1,
            opacity: dot.opacity * emphasis,
            data: false,
        }));
        const text = value === null
            ? "— · " +
                (period.state === "valid" ? "자료 없음" : statuses[period.state])
            : value + " " + data.unit;
        f.choices.push({ id, label: period.label + " " + text });
        if (options.selected === id)
            f.selection = [
                period.label + " " + period.start + "–" + period.end,
                text,
                "공통 척도 0–" + maximum + " " + data.unit,
            ];
    });
    if (comparable && motion.seed)
        f.dots.push({ ...motion.seed, id: "change-seed" });
    return f;
}

},
"brand-launch/src/TasteDataCategoryMotion/colors.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.motionTint = exports.MOTION_TINT_PIGMENT = void 0;
/** Shared filled-dot tint: retain the surface tone with a gentle amount of its own pigment. */
exports.MOTION_TINT_PIGMENT = 0.16;
const motionTint = ({ main, tintSurface }) => {
    const base = parseInt(tintSurface.slice(1), 16);
    const pigment = parseInt(main.slice(1), 16);
    return "#" + [16, 8, 0].map((shift) => Math.round(((base >> shift) & 255) * (1 - exports.MOTION_TINT_PIGMENT) + ((pigment >> shift) & 255) * exports.MOTION_TINT_PIGMENT)
        .toString(16).padStart(2, "0")).join("");
};
exports.motionTint = motionTint;

},
"brand-launch/src/TasteDataCategoryMotion/context.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextIdleZigzag = exports.CONTEXT_IDLE = exports.CONTEXT_INTRO = exports.contextRingRadius = exports.contextRingSlots = exports.CONTEXT_ZIGZAG = exports.CONTEXT_DOT_PITCH = exports.CONTEXT_DOT_RADIUS = void 0;
exports.contextPhase = contextPhase;
exports.dotRingMotion = dotRingMotion;
exports.contextFrame = contextFrame;
const colors_1 = require("brand-launch/src/TasteDataCategoryMotion/colors.ts");
const context_entry_1 = require("brand-launch/src/TasteDataCategoryMotion/context-entry.ts");
const taste_motion_1 = require("brand-launch/src/taste-motion.ts");
const designTokens_1 = require("src/constants/designTokens.ts");
exports.CONTEXT_DOT_RADIUS = 9.5;
exports.CONTEXT_DOT_PITCH = 26;
exports.CONTEXT_ZIGZAG = 6;
// The approved settled zigzag and the animated radial travel now both use ±6.
const CONTEXT_LAYOUT_OFFSET = 6;
// Even slot counts close the alternating inward/outward pattern at every seam.
const contextRingSlots = (layer) => 12 + layer * 4;
exports.contextRingSlots = contextRingSlots;
const contextRingRadius = (layer) => {
    const halfStep = Math.PI / ((0, exports.contextRingSlots)(layer) * 3);
    // Adjacent points have different radii: solve their chord length for the mean radius.
    return (Math.sqrt(exports.CONTEXT_DOT_PITCH ** 2 -
        4 * CONTEXT_LAYOUT_OFFSET ** 2 * Math.cos(halfStep) ** 2) /
        (2 * Math.sin(halfStep)));
};
exports.contextRingRadius = contextRingRadius;
exports.CONTEXT_INTRO = 1.8;
exports.CONTEXT_IDLE = 8;
const TAU = Math.PI * 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
    const t = clamp(v);
    return clamp(t * t * t * (t * (t * 6 - 15) + 10));
};
// Match zero velocity and acceleration at both reversals and the loop seam.
const contextIdleZigzag = (time) => {
    const phase = (((time % exports.CONTEXT_IDLE) + exports.CONTEXT_IDLE) % exports.CONTEXT_IDLE) / exports.CONTEXT_IDLE;
    return phase < 0.5
        ? 1 - 2 * ease(phase * 2)
        : -1 + 2 * ease((phase - 0.5) * 2);
};
exports.contextIdleZigzag = contextIdleZigzag;
const polar = (angle, radius) => ({
    x: 320 + Math.cos(angle) * radius,
    y: 320 + Math.sin(angle) * radius,
});
const status = {
    valid: "",
    noData: "자료 없음",
    unanswered: "미응답",
    held: "해석 보류",
    unlinked: "연결 미확인",
};
/** Presentation phases never change response counts, sector angles or denominators. */
function contextPhase(time, options = {}) {
    const reduced = options.playback === "reduced";
    const local = Math.max(0, time);
    const settled = reduced || options.playback === "idle";
    return {
        reduced,
        local,
        // Collapse is controlled only by seeking this entrance backwards on scroll.
        entry: settled ? exports.CONTEXT_INTRO : Math.min(exports.CONTEXT_INTRO, local),
        idle: reduced ? 0 : options.playback === "idle" ? local : Math.max(0, local - exports.CONTEXT_INTRO),
        label: reduced ? "완성 형태" : !settled && local < exports.CONTEXT_INTRO ? "진입" : "대기",
    };
}
/** Shared presentation geometry; it knows nothing about responses or periods. */
function dotRingMotion(layerCount, time, options = {}) {
    const phase = contextPhase(time, options);
    const entrance = (0, context_entry_1.contextEntry)(Array.from({ length: layerCount }, (_, i) => (0, exports.contextRingSlots)(i) * 3).reduce((a, b) => a + b, 0), (phase.entry / exports.CONTEXT_INTRO) * taste_motion_1.insightIntroDuration);
    let entryIndex = 0;
    const zigzagPhase = phase.reduced ? 1 : (0, exports.contextIdleZigzag)(phase.idle);
    const layers = Array.from({ length: layerCount }, (_, layer) => {
        const count = (0, exports.contextRingSlots)(layer) * 3, radius = (0, exports.contextRingRadius)(layer);
        return Array.from({ length: count }, (_, slot) => {
            const angle = -Math.PI / 2 + (TAU * (slot + 0.5)) / count;
            const target = polar(angle, radius + (slot % 2 === 0 ? 1 : -1) * exports.CONTEXT_ZIGZAG * zigzagPhase);
            const source = entrance.dots[entryIndex++];
            return {
                x: source.x + (target.x - source.x) * entrance.expansion,
                y: source.y + (target.y - source.y) * entrance.expansion,
                r: source.r,
                opacity: source.progress,
            };
        });
    });
    const seedOpacity = 1 - ease(phase.entry / 0.1);
    const seed = layerCount && seedOpacity > 0
        ? {
            id: "context-seed",
            x: 320,
            y: 320,
            r: exports.CONTEXT_DOT_RADIUS,
            color: designTokens_1.TASTE_TOKENS.salty.palette.main,
            opacity: seedOpacity,
            data: false,
        }
        : null;
    return {
        phase,
        layers,
        seed,
        summaryOpacity: phase.reduced
            ? 1
            : ease((entrance.expansion - 0.94) / 0.06),
    };
}
function contextFrame(data, time, options = {}) {
    const labels = data.mode === "liking"
        ? ["좋음", "보통", "아쉬움"]
        : ["부족", "알맞음", "과함"];
    const countPages = Math.max(1, Math.ceil(data.conditions.length / 4));
    const page = Math.max(0, Math.min(countPages - 1, Math.floor(options.page || 0)));
    const shown = data.state === "valid" ? data.conditions.slice(page * 4, page * 4 + 4) : [];
    const state = data.state === "valid" && !shown.length ? "noData" : data.state;
    const motion = dotRingMotion(shown.length, time, options);
    const phase = motion.phase;
    const reveal = motion.summaryOpacity;
    const f = {
        dots: [],
        lines: [],
        labels: [],
        title: data.sense + " · " + (data.mode === "liking" ? "호감" : "알맞음"),
        value: state === "valid" ? String(shown.length) : "—",
        unit: "개 조건 비교",
        state,
        summaryOpacity: state !== "valid" ? 1 : reveal,
        motionPhase: phase.label,
        choices: [],
        selection: [],
        legend: "점 링 하나 = 조건 하나 · 진한 점 비율 ≈ 조건별 응답 비율",
        notes: [
            ...(state !== "valid" ? [status[state]] : []),
            "조건: " +
                {
                    intensity: "연결된 강도",
                    food: "음식 종류",
                    target: "느낀 부위",
                    phase: "먹는 시점",
                }[data.dimension] +
                " · 동일 감각·척도 비교",
            "층별 n은 합산하지 않음 · 관찰된 연관",
            "점은 평가 건수가 아닌 비율 눈금 · 정확한 횟수는 조건 선택 시 표시",
        ],
    };
    if (data.conditions.length > 4)
        f.notes.push("현재 " +
            shown.length +
            " / " +
            data.conditions.length +
            "개 · 생략 " +
            (data.conditions.length - shown.length) +
            "개");
    f.notes.push("안쪽부터 " +
        (shown.length ? shown.map((c) => c.label).join(" → ") : "조건 자료 없음"));
    shown.forEach((condition, i) => {
        const rows = condition.responses.filter((r) => typeof r.response === "number" && r.response >= 0 && r.response < 3);
        const n = rows.length, slots = (0, exports.contextRingSlots)(i);
        const emphasis = options.selected && options.selected !== condition.id ? 0.35 : 1;
        const colorFor = (c) => designTokens_1.TASTE_TOKENS[designTokens_1.TASTE_IDS[c]].palette;
        labels.forEach((label, c) => {
            const token = colorFor(c), hits = rows.filter((r) => r.response === c).length;
            // More slots on larger circumferences preserve the same physical spacing.
            for (let slot = 0; slot < slots; slot++) {
                const id = condition.id + ":" + c + ":" + slot;
                const dot = motion.layers[i][c * slots + slot];
                const active = n > 0 && slot < Math.round((slots * hits) / n);
                f.dots.push({
                    id,
                    group: condition.id,
                    ...dot,
                    color: n ? token.main : "#dedad5",
                    tintColor: (0, colors_1.motionTint)(token),
                    tint: n && !active ? 1 : 0,
                    opacity: dot.opacity * emphasis,
                    data: false,
                });
            }
        });
        f.choices.push({
            id: condition.id,
            label: i + 1 + ". " + condition.label + " n=" + n,
        });
        const unresolved = ["split", "unanswered", "held"]
            .map((s, j) => ["응답 나뉨", "미응답", "해석 보류"][j] +
            " " +
            condition.responses.filter((r) => r.response === s).length)
            .join(" · ");
        if (options.selected === condition.id)
            f.selection = [
                condition.label + " · n=" + n,
                ...labels.map((label, c) => label + " " + rows.filter((r) => r.response === c).length + "/" + n),
                unresolved,
            ];
    });
    if (shown.length) {
        if (motion.seed)
            f.dots.push(motion.seed);
        labels.forEach((label, c) => f.labels.push({
            id: "response:" + c,
            ...polar(-Math.PI / 2 + ((c + 0.5) * TAU) / 3, 286),
            text: label,
            anchor: "middle",
        }));
    }
    return f;
}

},
"brand-launch/src/TasteDataCategoryMotion/context-entry.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextEntry = contextEntry;
const taste_motion_1 = require("brand-launch/src/taste-motion.ts");
const plans = new Map();
const smooth = (v) => {
    const t = Math.max(0, Math.min(1, v));
    return t * t * (3 - 2 * t);
};
/** The original six-branch packed-dot entrance, adapted to the context layer slot count. */
function plan(count) {
    const cached = plans.get(count);
    if (cached)
        return cached;
    let layers = 1;
    while (((layers * (layers + 1)) / 2) * 6 < count)
        layers++;
    const scaleLayers = Math.max(6, layers), packed = [];
    for (let layer = 1; layer <= layers; layer++) {
        const slots = Array.from({ length: layer }, (_, i) => i).sort((a, b) => Math.abs(a - (layer - 1) / 2) - Math.abs(b - (layer - 1) / 2) || a - b);
        const duration = layer === 1 ? 0.1 : (layer * 0.025) / Math.ceil(layer / 2);
        for (const slot of slots)
            for (let sector = 0; sector < 6 && packed.length < count; sector++) {
                const angle = (-2 * Math.PI) / 3 +
                    (sector * Math.PI) / 3 +
                    ((slot / layer) * Math.PI) / 3;
                const radius = ((79 - 4.8) * layer) / scaleLayers;
                const point = {
                    x: 320 + Math.cos(angle) * radius,
                    y: 320 + Math.sin(angle) * radius,
                };
                const start = layer === 1
                    ? 0
                    : 0.1 +
                        ((layer * (layer - 1)) / 2 - 1) * 0.025 +
                        Math.floor(Math.abs(slot - (layer - 1) / 2)) * duration;
                let parent = 0, closest = Infinity;
                packed.forEach((candidate, index) => {
                    if (index % 6 !== sector ||
                        candidate.start + candidate.duration > start + 1e-8)
                        return;
                    const d = Math.hypot(point.x - candidate.point.x, point.y - candidate.point.y);
                    if (d < closest) {
                        closest = d;
                        parent = index;
                    }
                });
                packed.push({ point, parent, start, duration });
            }
    }
    const end = Math.max(0.1, ...packed.map((d) => d.start + d.duration));
    const rate = (taste_motion_1.insightFillEnd - 0.1) / Math.max(0.001, end - 0.1);
    packed.forEach((d, i) => {
        if (i >= 6) {
            d.start = 0.1 + (d.start - 0.1) * rate;
            d.duration *= rate;
        }
    });
    plans.set(count, packed);
    return packed;
}
function contextEntry(count, time) {
    const packed = plan(count), rawExpansion = (0, taste_motion_1.insightExpansion)(time), expansion = rawExpansion > 1 - 1e-12 ? 1 : rawExpansion;
    return {
        expansion,
        dots: packed.map((entry, i) => {
            const progress = time >= taste_motion_1.insightFillEnd
                ? 1
                : smooth((time - entry.start) / entry.duration);
            const parent = i < 6 ? { x: 320, y: 320 } : packed[entry.parent].point;
            return {
                x: parent.x + (entry.point.x - parent.x) * progress,
                y: parent.y + (entry.point.y - parent.y) * progress,
                progress,
                r: (4.8 + (9.5 - 4.8) * expansion) * progress,
            };
        }),
    };
}

},
"brand-launch/src/taste-motion.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightFrame = exports.insightInertia = exports.insightDragDelta = exports.insightAlignment = exports.insightExpansion = exports.insightIntroDuration = exports.insightFillEnd = exports.dotColorIndex = exports.dotOpacity = exports.motionPoints = exports.feedbackEntry = exports.rotationAlignedTime = exports.feedbackPaths = exports.feedbackRings = exports.feedbackMorph = exports.analysisLineColorIndex = exports.analysisLineOpacity = exports.analysisPoints = exports.centeredAnalysisCircle = exports.analysisCircle = exports.analysisTravelDuration = exports.duration = exports.analysisMoveStarts = exports.feedbackEndDuration = exports.feedbackTransitionDuration = exports.rotationTransitionDuration = exports.analysisTimeScale = exports.palette = exports.styles = void 0;
exports.styles = ["analysis", "detailMatrix", "insightRing", "rotatingLayers", "feedbackRings"];
exports.palette = ["#FF9900", "#FBC02D", "#95C900", "#7299FF", "#B372B4", "#95867A"];
exports.analysisTimeScale = 1.7;
exports.rotationTransitionDuration = 1.2;
exports.feedbackTransitionDuration = 1.7;
exports.feedbackEndDuration = 0.8;
exports.analysisMoveStarts = [0, 1.25, 3.1, 4.15, 5.75, 7.75, 8.9, 10.6, 12];
const duration = (style, divisions = 12, rayCount = 12) => style === "analysis" ? 12 * exports.analysisTimeScale : style === "rotatingLayers" ? ({ 3: 24, 6: 96, 12: 192 })[divisions] * rayCount / 12 : style === "insightRing" ? 251 / 5 : 8;
exports.duration = duration;
const polar = (angle, radius) => ({ x: 320 + Math.cos(angle) * radius, y: 320 + Math.sin(angle) * radius });
const insightCloud = (() => {
    let seed = 42;
    const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    const order = Array.from({ length: 126 }, (_, i) => i);
    for (let i = 125; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    const points = Array(126);
    order.forEach((index, n) => {
        for (let attempt = 0; attempt < 2000; attempt++) {
            const angle = (n < 42 ? (Math.floor(n / 2) + random()) / 21 : random()) * Math.PI * 2;
            const low = n < 42 ? n % 2 === 0 ? 244 : 293 : 249;
            const high = n < 42 ? n % 2 === 0 ? 253 : 302 : 297;
            const point = polar(angle, Math.sqrt(low * low + (high * high - low * low) * random()));
            if (points.every((other, j) => !other || Math.hypot(point.x - other.x, point.y - other.y) >= (j % 6 === index % 6 ? 54 : 22))) {
                points[index] = point;
                break;
            }
        }
        if (!points[index])
            throw new Error('인사이트 링 점 배치 실패');
    });
    return points;
})();
const insightGroupedCloud = (() => {
    const points = insightCloud.map(point => ({
        angle: (Math.atan2(point.y - 320, point.x - 320) + Math.PI * 2) % (Math.PI * 2),
        radius: Math.hypot(point.x - 320, point.y - 320),
    })).sort((a, b) => a.angle - b.angle);
    for (let start = 0; start < points.length; start += 4) {
        const group = points.slice(start, start + 4).sort((a, b) => a.radius - b.radius);
        const inner = group[0], outer = group[group.length - 1];
        inner.radius = Math.min(inner.radius, 250 + 3 * Math.sin(inner.angle * 17));
        outer.radius = Math.max(outer.radius, 295 + 3 * Math.sin(outer.angle * 13));
    }
    return points;
})();
const radarRadii = [278, 130, 235, 178, 250, 155, 270, 200, 242, 162, 260, 190, 280, 205, 255, 170, 238, 275, 182, 240, 158, 265, 215, 190];
// 6층 상태 사이에 각 선을 다시 반으로 나누는 12층 분할·결합을 끼웁니다.
const rotationAngles = (() => {
    const base = [
        [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 15, 15], [0, 0, 15, 15, 30, 30],
        [0, 0, 15, 15, 30, 37.5], [0, 0, 15, 22.5, 30, 37.5], [0, 7.5, 15, 22.5, 30, 37.5],
        [7.5, 7.5, 15, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 30, 37.5], [7.5, 7.5, 22.5, 22.5, 37.5, 37.5],
        [22.5, 22.5, 22.5, 22.5, 37.5, 37.5], [37.5, 37.5, 37.5, 37.5, 37.5, 37.5],
    ];
    const states = base.slice(0, 6).map(angles => angles.flatMap(angle => [angle, angle]));
    for (let step = 1; step <= 6; step++) {
        states.push(base[5].flatMap((angle, layer) => [angle, angle + (layer >= 6 - step ? 3.75 : 0)]));
    }
    for (let step = 1; step <= 6; step++) {
        states.push(base[5].flatMap((angle, layer) => [angle + (layer < step ? 3.75 : 0), angle + 3.75]));
    }
    return {
        3: [[0, 0, 0], [0, 0, 15], [0, 15, 30], [15, 15, 30], [30, 30, 30]],
        6: base,
        12: [...states, ...base.slice(6).map(angles => angles.flatMap(angle => [angle + 3.75, angle + 3.75]))],
    };
})();
// 고정 시드로 프레임 탐색과 네이티브 재생에서 같은 불규칙한 경로를 만듭니다.
const random = (index) => {
    let value = 42;
    for (let i = 0; i < index + 3; i++)
        value = value * 16807 % 2147483647;
    return value / 2147483647;
};
const analysisStops = Array.from({ length: 8 }, (_, index) => ({
    ...polar(random(index * 3) * Math.PI * 2, 55 + 105 * Math.sqrt(random(index * 3 + 1))),
    radius: 316 / 4,
}));
const smooth = (value) => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * t * (t * (t * 6 - 15) + 10);
};
const analysisTravelDuration = (step) => (0.4 + 0.18 * random(24 + step)) / 0.75;
exports.analysisTravelDuration = analysisTravelDuration;
const analysisCircle = (time) => {
    const t = (Math.max(0, time) % (0, exports.duration)("analysis")) / exports.analysisTimeScale;
    let step = 0;
    while (step < analysisStops.length - 1 && t >= exports.analysisMoveStarts[step + 1])
        step++;
    const local = (t - exports.analysisMoveStarts[step]) / (0, exports.analysisTravelDuration)(step);
    const from = analysisStops[step];
    const to = analysisStops[(step + 1) % analysisStops.length];
    const travel = smooth(local);
    const expanded = from.radius + (Math.max(from.radius, to.radius) + 48 - from.radius) * smooth(local / 0.3);
    // 이동 후반의 62~92% 구간에서 수축하고, 도착 전에 작은 크기에 도달합니다.
    const radius = expanded + (to.radius - expanded) * smooth((local - 0.62) / 0.3);
    const beat = t / 0.75 * Math.PI * 2;
    return {
        x: from.x + (to.x - from.x) * travel,
        y: from.y + (to.y - from.y) * travel,
        radius: radius + 2.6 * Math.sin(beat) + 1.2 * Math.sin(beat * 2),
        lineDensity: 1 - smooth(local / 0.3) * (1 - smooth((local - 0.62) / 0.3)),
    };
};
exports.analysisCircle = analysisCircle;
const centeredAnalysisCircle = (from, time, rayCount = 12) => {
    const progress = smooth(time / exports.rotationTransitionDuration);
    return {
        x: from.x + (320 - from.x) * progress,
        y: from.y + (320 - from.y) * progress,
        radius: from.radius + (316 / 4 - from.radius) * progress,
        lineDensity: from.lineDensity + ((rayCount === 12 ? 0 : rayCount === 24 ? 0.5 : 1) - from.lineDensity) * progress,
    };
};
exports.centeredAnalysisCircle = centeredAnalysisCircle;
const analysisPoints = (circle, collapseFromDensity = null) => Array.from({ length: 48 }, (_, i) => {
    const angle = i / 48 * Math.PI * 2;
    const inner = { x: circle.x + circle.radius * Math.cos(angle), y: circle.y + circle.radius * Math.sin(angle) };
    const outer = polar(angle, 316);
    if (collapseFromDensity === null)
        return [inner, outer];
    const initial = (0, exports.analysisLineOpacity)(i, collapseFromDensity);
    const length = initial > 0 ? Math.min(1, (0, exports.analysisLineOpacity)(i, circle.lineDensity) / initial) : (0, exports.analysisLineOpacity)(i, circle.lineDensity);
    return [inner, { x: inner.x + (outer.x - inner.x) * length, y: inner.y + (outer.y - inner.y) * length }];
}).flat();
exports.analysisPoints = analysisPoints;
// 기존 선 사이를 동시에 나눠 12 → 24 → 48개로 늘리고, 확대 시 역순으로 줄입니다.
const analysisLineOpacity = (index, density) => index % 4 === 0 ? 1 : smooth(density * 2 - (index % 2 === 0 ? 0 : 1));
exports.analysisLineOpacity = analysisLineOpacity;
const analysisLineColorIndex = (index, density) => Math.floor(index / (density <= 0 ? 4 : density <= 0.5 ? 2 : 1)) % 6;
exports.analysisLineColorIndex = analysisLineColorIndex;
const feedbackEase = (value) => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
};
const feedbackMorph = (time) => {
    const progress = feedbackEase(time / exports.feedbackTransitionDuration);
    const bend = feedbackEase((progress - 0.72) / 0.28);
    return { rotation: -Math.PI / 2 * feedbackEase(progress / 0.72), bend, gradientBlend: feedbackEase((bend - 0.55) / 0.45) };
};
exports.feedbackMorph = feedbackMorph;
const feedbackRings = (time, endingAt = null) => {
    if (endingAt !== null && time >= Math.max(exports.feedbackTransitionDuration, endingAt)) {
        const end = Math.max(exports.feedbackTransitionDuration, endingAt);
        return (0, exports.feedbackRings)(end).sort((a, b) => a.radius - b.radius).map((ring, index) => {
            const remaining = 1 - feedbackEase((time - end) * 1.4 / exports.feedbackEndDuration - index * 0.2);
            return { radius: ring.radius * remaining, opacity: ring.opacity * remaining };
        });
    }
    const flowTime = Math.max(0, time - exports.feedbackTransitionDuration);
    const ramp = Math.min(1, flowTime / 0.3);
    const travel = flowTime < 0.3 ? 0.3 * (ramp ** 3 - ramp ** 4 / 2) : flowTime - 0.15;
    const fade = (phase) => feedbackEase(phase / 0.12) * (1 - feedbackEase((phase - 0.75) / 0.25));
    return Array.from({ length: 3 }, (_, layer) => {
        const initial = 1 / 6 + layer / 3;
        const unwrapped = initial + travel / 3;
        const phase = unwrapped % 1;
        return { radius: 79 + 237 * phase, opacity: unwrapped < 1 ? Math.min(1, fade(phase) / fade(initial)) : fade(phase) };
    });
};
exports.feedbackRings = feedbackRings;
const feedbackPaths = (time, rayCount = 24, angle = 0) => {
    const { rotation, bend } = (0, exports.feedbackMorph)(time);
    const rings = (0, exports.feedbackRings)(time);
    const halfSector = Math.PI / rayCount;
    return Array.from({ length: 3 * rayCount }, (_, index) => {
        const radius = rings[Math.floor(index / rayCount)].radius;
        const direction = index % rayCount / rayCount * Math.PI * 2 + angle;
        const center = polar(direction, radius);
        const fittingHalf = radius * Math.sin(halfSector) / (Math.abs(Math.sin(rotation)) * Math.cos(halfSector) + Math.abs(Math.cos(rotation)) * Math.sin(halfSector));
        const halfLength = Math.min(39.5, fittingHalf);
        return Array.from({ length: 25 }, (_, sample) => {
            const u = sample / 12 - 1;
            const straight = { x: center.x + Math.cos(direction + rotation) * halfLength * u, y: center.y + Math.sin(direction + rotation) * halfLength * u };
            const arc = polar(direction - u * halfSector, radius);
            return { x: straight.x + (arc.x - straight.x) * bend, y: straight.y + (arc.y - straight.y) * bend };
        });
    });
};
exports.feedbackPaths = feedbackPaths;
// 다음 2초 분할·결합 주기가 끝나 선이 정렬된 순간에 피드백으로 이어집니다.
const rotationAlignedTime = (time) => Math.max(0, Math.ceil(Math.max(0, time) / 2 - 1e-9) * 2);
exports.rotationAlignedTime = rotationAlignedTime;
const feedbackEntry = (rotationTime, time, divisions = 12, rayCount = 12) => {
    const alignedTime = (0, exports.rotationAlignedTime)(rotationTime);
    const delay = alignedTime - rotationTime;
    const point = (0, exports.motionPoints)("rotatingLayers", alignedTime, divisions, rayCount)[0];
    return { delay, time: Math.max(0, time - delay), angle: Math.atan2(point.y - 320, point.x - 320) };
};
exports.feedbackEntry = feedbackEntry;
const motionPoints = (style, time, divisions = 12, rayCount = 12) => {
    const phase = (time % (0, exports.duration)(style)) / (0, exports.duration)(style) * Math.PI * 2;
    if (style === "feedbackRings")
        return (0, exports.feedbackPaths)(time, rayCount).flat();
    if (style === "rotatingLayers") {
        // 분할부터 결합까지 60프레임(2초). 정지를 줄여 각 회전의 감쇠 구간을 확보합니다.
        const angles = rotationAngles[divisions];
        const stageCount = angles.length - 1;
        const cycleLength = 15 + stageCount * 22;
        const advance = angles[stageCount][0];
        const elapsed = (time % (0, exports.duration)(style, divisions, rayCount)) * 30;
        const cycle = Math.floor(elapsed / 60);
        const cycleFrame = (elapsed - cycle * 60) * cycleLength / 60;
        const starts = [0, ...Array.from({ length: stageCount }, (_, i) => 37 + i * 22)];
        let stage = 0;
        while (stage < stageCount - 1 && cycleFrame >= starts[stage + 1])
            stage++;
        const t = Math.min(1, Math.max(0, (cycleFrame - starts[stage + 1] + 14) / 14));
        // 임계 감쇠: 역회전 없이 목표 각도에 부드럽게 안착합니다.
        const progress = (1 - (1 + 6 * t) * Math.exp(-6 * t)) / (1 - 7 * Math.exp(-6));
        // 선 간격에 비례해 회전각을 줄여 다른 색의 옆 선과 결합하지 않게 합니다.
        return Array.from({ length: divisions * rayCount }, (_, i) => {
            const layer = Math.floor(i / rayCount);
            const from = angles[stage][layer], to = angles[stage + 1][layer];
            const angle = i % rayCount / rayCount * Math.PI * 2 + (cycle * advance + from + (to - from) * progress) * 12 / rayCount * Math.PI / 180;
            return [polar(angle, 79 + 237 / divisions * layer), polar(angle, 79 + 237 / divisions * (layer + 1))];
        }).flat();
    }
    if (style === "analysis") {
        return (0, exports.analysisPoints)((0, exports.analysisCircle)(time));
    }
    if (style === "detailMatrix") {
        return radarRadii.map((radius, i) => polar(i / 24 * Math.PI * 2, radius + 26 * Math.sin(phase + i * 1.7)));
    }
    return insightCloud.map((point, i) => {
        const baseAngle = Math.atan2(point.y - 320, point.x - 320);
        const wavePhase = phase * 3;
        const angle = baseAngle + phase + 0.02 * Math.sin(wavePhase + i * 1.618);
        const radius = Math.hypot(point.x - 320, point.y - 320) + 3 * Math.sin(wavePhase + baseAngle * 3) + 2 * Math.sin(wavePhase * 2 + i * 2.414);
        return polar(angle, radius);
    });
};
exports.motionPoints = motionPoints;
const dotOpacity = (index, time) => 0.45 + 0.5 * (0.5 + 0.5 * Math.sin(time % (0, exports.duration)("insightRing") / (0, exports.duration)("insightRing") * Math.PI * 6 + index * 1.7));
exports.dotOpacity = dotOpacity;
const dotColorIndex = (index) => (index * 5 + Math.floor(index / 6)) % 9;
exports.dotColorIndex = dotColorIndex;
// 여섯 갈래가 같은 박자로 증식해 회전 모션의 빈 원(반지름 79)을 채웁니다.
exports.insightFillEnd = 0.1 + 20 * 0.025;
exports.insightIntroDuration = exports.insightFillEnd + 0.2 + 1.1;
const insightPackedDots = [];
for (let layer = 1; layer <= 6; layer++) {
    const slots = Array.from({ length: layer }, (_, slot) => slot).sort((a, b) => Math.abs(a - (layer - 1) / 2) - Math.abs(b - (layer - 1) / 2) || a - b);
    const duration = layer === 1 ? 0 : layer * 0.025 / Math.ceil(layer / 2);
    for (const slot of slots) {
        const startsAt = layer === 1 ? 0 : 0.1 + (layer * (layer - 1) / 2 - 1) * 0.025 + Math.floor(Math.abs(slot - (layer - 1) / 2)) * duration;
        for (let sector = 0; sector < 6; sector++) {
            const angle = -2 * Math.PI / 3 + sector * Math.PI / 3 + slot / layer * Math.PI / 3;
            const point = polar(angle, (79 - 4.8) * layer / 6);
            let parent = 0, closest = Infinity;
            insightPackedDots.forEach((candidate, index) => {
                if (index % 6 !== sector || candidate.startsAt + candidate.duration > startsAt + 1e-8)
                    return;
                const distance = Math.hypot(point.x - candidate.point.x, point.y - candidate.point.y);
                if (distance < closest) {
                    parent = index;
                    closest = distance;
                }
            });
            insightPackedDots.push({ point, parent, startsAt, duration });
        }
    }
}
const insightExpansion = (time) => {
    if (time <= exports.insightFillEnd + 0.2)
        return 0;
    if (time >= exports.insightIntroDuration)
        return 1;
    return smooth((time - (exports.insightFillEnd + 0.2)) / 1.1);
};
exports.insightExpansion = insightExpansion;
const insightAlignment = (elapsed, from, to) => from + (to - from) * smooth(elapsed / 0.5);
exports.insightAlignment = insightAlignment;
const insightDragDelta = (from, to) => Math.hypot(from.x, from.y) < 40 || Math.hypot(to.x, to.y) < 40 ? 0 : Math.atan2(from.x * to.y - from.y * to.x, from.x * to.x + from.y * to.y);
exports.insightDragDelta = insightDragDelta;
const insightInertia = (velocity, elapsed) => {
    const duration = Math.min(1.8, 0.35 + Math.abs(velocity) * 0.15);
    const progress = Math.min(1, Math.max(0, elapsed / duration));
    return velocity * duration / 3 * (1 - (1 - progress) ** 3);
};
exports.insightInertia = insightInertia;
const insightFrame = (time, settled = false, alignment = 0, alignmentElapsed = 0, rotation = 0) => {
    const expansion = settled ? 1 : (0, exports.insightExpansion)(time);
    const freeTime = settled ? 0 : Math.max(0, time - exports.insightIntroDuration);
    const free = (0, exports.motionPoints)("insightRing", freeTime);
    const anchorTime = Math.max(0, freeTime - alignmentElapsed);
    const anchor = alignment > 0 ? (0, exports.motionPoints)("insightRing", anchorTime) : free;
    const dots = insightPackedDots.map((entry, index) => {
        const target = entry.point;
        const step = Math.floor(index / 6), sector = index % 6;
        const progress = step === 0 || settled || time >= exports.insightFillEnd ? 1 : Math.min(1, smooth((time - entry.startsAt) / entry.duration));
        const parent = insightPackedDots[entry.parent].point;
        const packed = step === 0 ? target : { x: parent.x + (target.x - parent.x) * progress, y: parent.y + (target.y - parent.y) * progress };
        const mixed = free[index];
        const freeAngle = Math.atan2(mixed.y - 320, mixed.x - 320);
        const anchorAngle = Math.atan2(anchor[index].y - 320, anchor[index].x - 320);
        const turn = Math.PI * 2;
        const angle = freeAngle + turn * Math.round((anchorAngle + turn * (freeTime - anchorTime) / (0, exports.duration)("insightRing") - freeAngle) / turn);
        const sorted = insightGroupedCloud[sector * 21 + step];
        const wavePhase = freeTime % (0, exports.duration)("insightRing") / (0, exports.duration)("insightRing") * turn * 3;
        const sortedAngle = Math.min(insightGroupedCloud[sector * 21 + 20].angle, Math.max(insightGroupedCloud[sector * 21].angle, sorted.angle + 0.012 * Math.sin(wavePhase + index * 1.618)));
        const delta = anchorAngle + Math.atan2(Math.sin(sorted.angle - anchorAngle), Math.cos(sorted.angle - anchorAngle)) + sortedAngle - sorted.angle - angle;
        const mixedRadius = Math.hypot(mixed.x - 320, mixed.y - 320), sortedRadius = sorted.radius + 3 * Math.sin(wavePhase + index * 2.414);
        const destination = polar(angle + delta * alignment - 2 * Math.PI / 3 + rotation, mixedRadius + (sortedRadius - mixedRadius) * alignment);
        const packedOpacity = Math.min(1, Math.max(0.35, 1 - 0.65 * (Math.hypot(target.x - 320, target.y - 320) / (79 - 4.8) * 6 - 1) / 5));
        return {
            x: packed.x + (destination.x - packed.x) * expansion,
            y: packed.y + (destination.y - packed.y) * expansion,
            radius: (4.8 + (9.5 - 4.8) * expansion) * progress,
            opacity: progress * (packedOpacity + ((0, exports.dotOpacity)(index, freeTime) - packedOpacity) * expansion),
            colorIndex: sector, progress,
        };
    });
    const bridges = [];
    if (expansion === 0)
        dots.forEach((dot, index) => {
            if (index < 6 || dot.progress <= 0 || dot.progress >= 0.95)
                return;
            const parentIndex = insightPackedDots[index].parent;
            const parent = dots[parentIndex];
            const dx = dot.x - parent.x, dy = dot.y - parent.y, distance = Math.hypot(dx, dy);
            const r1 = parent.radius, r2 = dot.radius;
            if (distance <= Math.abs(r1 - r2))
                return;
            // 원의 교점과 접선으로 연결합니다. Paper.js / SATO Hiroyuki의 메타볼 기하 모델.
            const acos = (value) => Math.acos(Math.max(-1, Math.min(1, value)));
            const u1 = distance < r1 + r2 ? acos((r1 * r1 + distance * distance - r2 * r2) / (2 * r1 * distance)) : 0;
            const u2 = distance < r1 + r2 ? acos((r2 * r2 + distance * distance - r1 * r1) / (2 * r2 * distance)) : 0;
            const direction = Math.atan2(dy, dx), tangent = acos((r1 - r2) / distance);
            const blend = 0.5 * (1 - smooth((dot.progress - 0.55) / 0.4));
            const a1 = direction + u1 + (tangent - u1) * blend, b1 = 2 * direction - a1;
            const a2 = direction + Math.PI - u2 - (Math.PI - u2 - tangent) * blend, b2 = 2 * direction - a2;
            const at = (center, angle, radius) => ({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
            const p1 = at(parent, a1, r1), p2 = at(dot, a2, r2), p3 = at(dot, b2, r2), p4 = at(parent, b1, r1);
            const handle = Math.min(blend * 2.4, Math.hypot(p1.x - p2.x, p1.y - p2.y) / (r1 + r2)) * Math.min(1, distance * 2 / (r1 + r2));
            bridges.push({
                points: [p1, at(p1, a1 - Math.PI / 2, r1 * handle), at(p2, a2 + Math.PI / 2, r2 * handle), p2,
                    p3, at(p3, b2 - Math.PI / 2, r2 * handle), at(p4, b1 + Math.PI / 2, r1 * handle), p4],
                colorIndex: dot.colorIndex, parent: parentIndex, child: index,
            });
        });
    return { dots, bridges, expansion };
};
exports.insightFrame = insightFrame;

},
"brand-launch/src/TasteDataCategoryMotion/sensory.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensorySummary = sensorySummary;
exports.sensoryFrame = sensoryFrame;
const colors_1 = require("brand-launch/src/TasteDataCategoryMotion/colors.ts");
const designTokens_1 = require("src/constants/designTokens.ts");
const taste_motion_1 = require("brand-launch/src/taste-motion.ts");
const statusText = {
    valid: "",
    noData: "자료 없음",
    unanswered: "미응답",
    held: "해석 보류",
    unlinked: "연결 미확인",
};
/** Every sensory percentage has its own numerator and the same eligible-meal denominator. */
function sensorySummary(data) {
    const eligible = new Set(data.validMealIds);
    const state = data.state !== "valid" ? data.state : eligible.size ? "valid" : "noData";
    const denominator = state === "valid" ? eligible.size : null;
    return {
        state,
        status: statusText[state],
        denominator,
        domainLabel: { taste: "맛", aroma: "향", texture: "식감" }[data.domain],
        senses: data.senses.map((sense) => {
            const count = denominator === null
                ? null
                : new Set(sense.mealIds.filter((id) => eligible.has(id))).size;
            const token = designTokens_1.TASTE_TOKENS[designTokens_1.TASTE_IDS[sense.color % designTokens_1.TASTE_IDS.length]].palette;
            return {
                ...sense,
                count,
                ratio: count === null || denominator === null ? null : count / denominator,
                color: token.main,
                tintColor: (0, colors_1.motionTint)(token),
                intensity: denominator === null ? null : sense.intensity,
            };
        }),
    };
}
const smooth = (v) => {
    const t = Math.max(0, Math.min(1, v));
    return t * t * (3 - 2 * t);
};
function sensoryFrame(data, time, options = {}) {
    const summary = sensorySummary(data);
    const reduced = options.playback === "reduced";
    const settled = reduced || options.playback === "idle";
    const t = settled ? 1.8 : Math.max(0, time);
    const reveal = smooth((t - 1.3) / 0.5);
    const f = {
        dots: [],
        lines: [],
        labels: [],
        title: summary.domainLabel,
        value: summary.denominator === null ? "—" : String(summary.denominator),
        unit: "번의 기준 식사",
        state: summary.state,
        summaryOpacity: reveal,
        choices: [],
        selection: [],
        legend: "126개 비율 점 · 진한 점 = 기록 비율 · 틴트 점 = 미기록 비율",
        notes: [
            ...(summary.status ? [summary.status] : []),
            "기준: 유효한 감각을 남긴 식사",
            "한 식사에 여러 감각 기록 가능 · 합계를 100%로 맞추지 않음",
            "기록 빈도와 강도 응답은 별개입니다.",
        ],
    };
    // Freeze the original ring geometry after entry. Each sector has its own denominator.
    const target = (0, taste_motion_1.insightFrame)(taste_motion_1.insightIntroDuration, true, 1);
    const ordered = target.dots
        .map((dot, index) => ({
        index,
        angle: (Math.atan2(dot.y - 320, dot.x - 320) + Math.PI * 2.5) % (Math.PI * 2),
    }))
        .sort((a, b) => a.angle - b.angle);
    const slots = summary.senses.map((_, i) => ordered.slice(Math.round((i * 126) / summary.senses.length), Math.round(((i + 1) * 126) / summary.senses.length)));
    summary.senses.forEach((sense, i) => {
        var _a;
        const selected = options.selected === sense.id;
        const opacity = options.selected && !selected ? 0.45 : 1;
        const darkCount = Math.round(slots[i].length * ((_a = sense.ratio) !== null && _a !== void 0 ? _a : 0));
        const center = slots[i].reduce((p, slot) => ({
            x: p.x + target.dots[slot.index].x / slots[i].length,
            y: p.y + target.dots[slot.index].y / slots[i].length,
        }), { x: 0, y: 0 });
        if (sense.ratio !== null)
            slots[i].forEach(({ index }, rank) => {
                const dot = target.dots[index];
                // Each taste grows as a local group; every dark slot precedes its tint slots.
                const start = 0.05 + (i / Math.max(1, summary.senses.length - 1)) * 0.5;
                const localRank = rank < darkCount
                    ? rank / Math.max(1, darkCount)
                    : (rank - darkCount) / Math.max(1, slots[i].length - darkCount);
                const delay = rank < darkCount ? localRank * 0.22 : 0.48 + localRank * 0.28;
                const progress = smooth((t - start - delay) / 0.28);
                const spread = smooth((t - start) / 1.1);
                const x = center.x + (dot.x - center.x) * (0.72 + 0.28 * spread);
                const y = center.y + (dot.y - center.y) * (0.72 + 0.28 * spread);
                f.dots.push({
                    id: sense.id + ":slot:" + rank,
                    x: 320 + (x - 320) * 0.92,
                    y: 320 + (y - 320) * 0.92,
                    r: dot.radius,
                    color: sense.color,
                    tintColor: sense.tintColor,
                    tint: rank < darkCount ? 0 : 1,
                    opacity: progress * opacity,
                    group: sense.id,
                });
            });
        f.choices.push({ id: sense.id, label: sense.name });
        if (selected) {
            f.selection = [
                sense.name +
                    " " +
                    (sense.count === null
                        ? summary.status
                        : sense.count + "/" + summary.denominator + "번"),
            ];
            if (sense.intensity === null)
                f.selection.push("강도 응답 자료 없음");
            else {
                const response = sense.intensity;
                f.selection.push(response.weak + response.medium + response.strong > 0
                    ? "강도 약함 " +
                        response.weak +
                        " · 중간 " +
                        response.medium +
                        " · 강함 " +
                        response.strong
                    : "강도 응답 없음");
                if (response.unanswered)
                    f.selection.push("강도 미응답 " + response.unanswered + "회");
                if (sense.count === 0)
                    f.selection.push("이 감각을 기록한 식사 없음 · 감각의 부재를 뜻하지 않음");
            }
        }
    });
    const selectedSense = summary.senses.find((s) => s.id === options.selected);
    if (selectedSense) {
        f.title = selectedSense.name;
        f.value =
            selectedSense.count === null
                ? "—"
                : selectedSense.count + "/" + summary.denominator;
        f.unit = "번 기록";
    }
    f.notes.push("점 하나는 기록 한 건이 아닌 비율 칸입니다. 점 수는 반올림하며 정확한 횟수는 선택 시 표시합니다.");
    return f;
}

},
"brand-launch/src/TasteDataCategoryMotion/experience.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPERIENCE_DOTS = exports.EXPERIENCE_INTRO = void 0;
exports.experienceIdleOffset = experienceIdleOffset;
exports.experienceIdlePosition = experienceIdlePosition;
exports.distributeDots = distributeDots;
exports.experiencePlan = experiencePlan;
exports.experienceFrame = experienceFrame;
const colors_1 = require("brand-launch/src/TasteDataCategoryMotion/colors.ts");
const taste_motion_1 = require("brand-launch/src/taste-motion.ts");
const designTokens_1 = require("src/constants/designTokens.ts");
const experience_physics_1 = require("brand-launch/src/TasteDataCategoryMotion/experience-physics.ts");
exports.EXPERIENCE_INTRO = 6.4;
exports.EXPERIENCE_DOTS = 126;
const TAU = Math.PI * 2;
const DOT_RADIUS = 9.5;
const CORE_GROWTH = 1.3;
const CLEARANCE = 7;
const IDLE_ROOM = 4;
const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => {
    const x = clamp(n);
    return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const seed = (id) => {
    let n = 42;
    for (const c of id)
        n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
// Independent seeded paths share a seamless 12s period, but no shared pause or breathing envelope.
// Each offset stays within 1.87 units, inside the 4-unit pairwise clearance reserve.
function experienceIdleOffset(id, time) {
    const phase = ((Math.max(0, time) % 12) / 12) * TAU;
    const axis = (name) => [2, 3, 5].reduce((sum, frequency, i) => {
        const offset = seed(id + ":idle:" + name + ":" + i) * TAU;
        return (sum +
            [0.52, 0.3, 0.18][i] *
                (Math.sin(phase * frequency + offset) - Math.sin(offset)));
    }, 0) * 0.66;
    return { x: axis("x"), y: axis("y") };
}
function experienceIdlePosition(rest, id, time) {
    const individual = experienceIdleOffset(id, time);
    return { x: rest.x + individual.x, y: rest.y + individual.y };
}
const polar = (a, r) => ({
    x: 320 + Math.cos(a) * r,
    y: 320 + Math.sin(a) * r,
});
const scaled = (p) => ({
    x: 320 + (p.x - 320) * 0.92,
    y: 320 + (p.y - 320) * 0.92,
});
const around = (p, a, r) => ({
    x: p.x + Math.cos(a) * r,
    y: p.y + Math.sin(a) * r,
});
function distributeDots(weights, total = exports.EXPERIENCE_DOTS) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (!sum)
        return weights.map(() => 0);
    const raw = weights.map((n) => (n / sum) * total), counts = raw.map(Math.floor);
    const order = raw
        .map((_, i) => i)
        .sort((a, b) => raw[b] - counts[b] - (raw[a] - counts[a]) || a - b);
    for (const i of order.slice(0, total - counts.reduce((a, b) => a + b, 0)))
        counts[i]++;
    return counts;
}
const plans = new WeakMap();
const scatterFrame = (0, taste_motion_1.insightFrame)(taste_motion_1.insightIntroDuration);
const scatter = scatterFrame.dots.map(scaled);
const bound = (p, inset = 0) => polar(Math.atan2(p.y - 320, p.x - 320), Math.max(207 + inset, Math.min(284 - inset, Math.hypot(p.x - 320, p.y - 320))));
// Solve all participating pairs together, so a point cannot jump between isolated pockets.
// Idle anchors reserve room for independent motion; no constraint projection runs during idle.
function separate(positions, marks, radii, shields, room = 0) {
    const inset = room ? 2 : 0;
    // Pair constraints do not change while the positions are being relaxed.
    const pairs = [];
    for (let a = 0; a < marks.length; a++)
        for (let b = a + 1; b < marks.length; b++) {
            const strength = Math.max(shields[a], shields[b]);
            if (strength === 0 && !room)
                continue;
            const bothHalos = marks[a].role === "halo" && marks[b].role === "halo";
            if (bothHalos && !room)
                continue;
            pairs.push({ a, b, minimum: radii[a] + radii[b] + (bothHalos ? 1 + room : CLEARANCE * strength + room) });
        }
    for (let pass = 0; pass < (room ? 700 : 100); pass++) {
        let overlap = 0;
        for (const { a, b, minimum } of pairs) {
            const pa = positions[a], pb = positions[b];
            const dx = pb.x - pa.x, dy = pb.y - pa.y;
            if (dx >= minimum || dx <= -minimum || dy >= minimum || dy <= -minimum)
                continue;
            const d = distance(pa, pb);
            if (d >= minimum)
                continue;
            overlap = Math.max(overlap, minimum - d);
            const amount = (minimum - d + 0.0001) / 2;
            const angle = d > 0.001
                ? Math.atan2(pb.y - pa.y, pb.x - pa.x)
                : seed(marks[a].id) * TAU;
            positions[a] = bound(around(pa, angle + Math.PI, amount), inset);
            positions[b] = bound(around(pb, angle, amount), inset);
        }
        if (overlap < 0.0005)
            break;
    }
}
function experiencePlan(data) {
    const cached = plans.get(data);
    if (cached)
        return cached;
    const byMenu = new Map();
    for (const record of [...data.records].sort((a, b) => a.id.localeCompare(b.id))) {
        const key = record.identity
            ? record.identity.kind + ":" + record.identity.id
            : "unconfirmed";
        byMenu.set(key, [...(byMenu.get(key) || []), record]);
    }
    const entries = [...byMenu.entries()].sort(([a], [b]) => a.localeCompare(b));
    const weights = entries.map(([, records]) => records.length), quotas = distributeDots(weights);
    const compressed = data.records.length > exports.EXPERIENCE_DOTS;
    // Over the fixed point budget, use an explicitly labelled ratio summary rather than invented record counts.
    const coreCounts = compressed
        ? distributeDots(weights, 63).map((n, i) => Math.min(quotas[i], Math.max(n, quotas[i] > 0 ? 1 : 0)))
        : weights;
    const groups = entries.map(([id, records], i) => {
        var _a;
        const angle = -Math.PI / 2 + (i * TAU) / Math.max(1, entries.length);
        return {
            id,
            records,
            name: ((_a = records[0].identity) === null || _a === void 0 ? void 0 : _a.name) || "확인 필요",
            color: id === "unconfirmed" ? "#95867A" : taste_motion_1.palette[i % 5],
            tintColor: (0, colors_1.motionTint)(designTokens_1.TASTE_TOKENS[id === "unconfirmed" ? "fat" : designTokens_1.TASTE_IDS[i % 5]].palette),
            center: polar(angle, 200 + (seed(id) - 0.5) * 10),
            quota: quotas[i],
            cores: coreCounts[i],
            angle,
        };
    });
    const marks = [];
    for (const group of groups) {
        const spacing = Math.min(22, 62 / Math.sqrt(Math.max(1, group.cores - 1)));
        const haloCounts = distributeDots(Array.from({ length: group.cores }, () => 1), group.quota - group.cores);
        for (let index = 0; index < group.cores; index++) {
            const angle = index * 2.3999632297 + seed(group.id) * TAU, rad = spacing * Math.sqrt(index);
            const core = marks.length, target = around(group.center, angle, rad);
            marks.push({
                id: compressed
                    ? "ratio:" + group.id + ":" + index
                    : group.records[index].id,
                group,
                role: "record",
                source: -1,
                target,
                core,
                rank: 0,
                at: 0,
            });
            for (let rank = 0; rank < haloCounts[index]; rank++) {
                const offsetAngle = seed(marks[core].id + ":" + rank) * TAU;
                const offsetRadius = 10 + seed(group.id + ":" + index + ":" + rank) * 20;
                marks.push({
                    id: marks[core].id + ":halo:" + rank,
                    group,
                    role: "halo",
                    source: -1,
                    target: around(target, offsetAngle, offsetRadius),
                    core,
                    rank,
                    at: 2.9 +
                        seed(marks[core].id) * 0.3 +
                        (haloCounts[index] > 1
                            ? (rank / (haloCounts[index] - 1)) * 2.3
                            : 0),
                });
            }
        }
    }
    // Each menu owns one contiguous set of ring slots, proportional to its records.
    // This prevents a large colour group from spilling into unrelated gaps around the ring.
    const angleOf = (p) => (Math.atan2(p.y - 320, p.x - 320) + Math.PI / 2 + TAU) % TAU;
    const orderedSlots = scatter
        .map((_, i) => i)
        .sort((a, b) => angleOf(scatter[a]) - angleOf(scatter[b]) || a - b);
    let slotOffset = 0;
    for (const group of groups) {
        const slots = orderedSlots.slice(slotOffset, slotOffset + group.quota);
        slotOffset += group.quota;
        const candidates = marks.flatMap((mark, m) => mark.group === group
            ? slots.map((s) => ({
                m,
                s,
                cost: distance(scatter[s], mark.target) + seed(mark.id + ":" + s) * 30,
            }))
            : []);
        candidates.sort((a, b) => a.cost - b.cost || a.m - b.m || a.s - b.s);
        const assigned = new Set();
        for (const c of candidates)
            if (marks[c.m].source < 0 && !assigned.has(c.s)) {
                marks[c.m].source = c.s;
                assigned.add(c.s);
            }
    }
    for (const mark of marks)
        mark.target = scatter[mark.source];
    const rest = marks.map((mark) => bound(scatter[mark.source], 2));
    // Keep the same 126 occupied ring slots. Within each colour's own area, assign
    // its central slots to records and the surrounding slots to tint companions.
    for (const group of groups) {
        const members = marks
            .map((mark, i) => ({ mark, i }))
            .filter(({ mark }) => mark.group === group);
        const centroid = members.reduce((p, { mark }) => ({
            x: p.x + scatter[mark.source].x / members.length,
            y: p.y + scatter[mark.source].y / members.length,
        }), { x: 0, y: 0 });
        const radius = members.reduce((r, { mark }) => r + distance(scatter[mark.source], { x: 320, y: 320 }) / members.length, 0);
        group.center = polar(Math.atan2(centroid.y - 320, centroid.x - 320), radius);
        group.angle = Math.atan2(centroid.y - 320, centroid.x - 320);
        const slots = members
            .map(({ mark }) => mark.source)
            .sort((a, b) => distance(scatter[a], group.center) -
            distance(scatter[b], group.center) || a - b);
        for (const role of ["record", "halo"]) {
            const roleSlots = role === "record"
                ? slots.slice(0, group.cores)
                : slots.slice(group.cores);
            const assignments = members
                .filter(({ mark }) => mark.role === role)
                .flatMap(({ mark, i }) => roleSlots.map((slot) => ({
                i,
                slot,
                cost: distance(scatter[mark.source], scatter[slot]),
            })));
            assignments.sort((a, b) => a.cost - b.cost || a.i - b.i || a.slot - b.slot);
            const usedMarks = new Set(), usedSlots = new Set();
            for (const { i, slot } of assignments)
                if (!usedMarks.has(i) && !usedSlots.has(slot)) {
                    rest[i] = bound(scatter[slot], 2);
                    marks[i].source = slot;
                    usedMarks.add(i);
                    usedSlots.add(slot);
                }
        }
    }
    // Reassign nearby same-menu pairs with balanced capacity. There are no orbital target slots.
    for (const group of groups) {
        const coreIndices = marks
            .map((m, i) => ({ m, i }))
            .filter(({ m }) => m.group.id === group.id && m.role === "record")
            .map(({ i }) => i);
        const halos = marks
            .map((m, i) => ({ m, i }))
            .filter(({ m }) => m.group.id === group.id && m.role === "halo");
        const capacities = distributeDots(coreIndices.map(() => 1), halos.length);
        const pairs = halos.flatMap(({ m, i }) => coreIndices.map((c, rank) => {
            const gap = distance(scatter[m.source], scatter[marks[c].source]);
            return { i, c, rank, cost: gap + (gap < 24 ? 64 : 0) };
        }));
        pairs.sort((a, b) => a.cost - b.cost || a.i - b.i || a.c - b.c);
        const assigned = new Set();
        for (const pair of pairs)
            if (!assigned.has(pair.i) && capacities[pair.rank] > 0) {
                marks[pair.i].core = pair.c;
                capacities[pair.rank]--;
                assigned.add(pair.i);
            }
    }
    for (const [coreIndex, core] of marks.entries())
        if (core.role === "record") {
            const followers = marks
                .filter((m) => m.role === "halo" && m.core === coreIndex)
                .sort((a, b) => {
                const gapA = distance(scatter[a.source], scatter[core.source]);
                const gapB = distance(scatter[b.source], scatter[core.source]);
                return (gapA + (gapA < 24 ? 64 : 0) - gapB - (gapB < 24 ? 64 : 0) ||
                    a.rank - b.rank);
            });
            followers.forEach((mark, rank) => (mark.at =
                2.65 +
                    seed(core.id) * 0.2 +
                    (followers.length > 1
                        ? (rank / (followers.length - 1)) * 2.15
                        : 0)));
        }
    separate(rest, marks, marks.map((mark) => DOT_RADIUS + (mark.role === "record" ? CORE_GROWTH : 0)), marks.map((mark) => (mark.role === "record" ? 1 : 0)), IDLE_ROOM);
    const motion = (0, experience_physics_1.simulateExperience)(marks.map((mark, i) => ({
        id: mark.id,
        group: mark.group.id,
        record: mark.role === "record",
        partner: mark.core,
        at: mark.at,
        start: scatter[mark.source],
        goal: rest[i],
    })), taste_motion_1.insightIntroDuration, exports.EXPERIENCE_INTRO);
    const plan = {
        motion,
        groups,
        marks,
        compressed,
        recordCount: data.records.length,
        // Idle starts at the actual collision endpoint, never at the separately calculated target.
        rest: motion.samples[motion.samples.length - 1].positions.map((point) => ({ ...point })),
    };
    plans.set(data, plan);
    return plan;
}
function experienceFrame(data, time, options = {}) {
    const plan = experiencePlan(data), reduced = options.playback === "reduced";
    const settled = reduced || options.playback === "idle", t = settled ? exports.EXPERIENCE_INTRO : Math.max(0, time);
    const ambient = reduced
        ? 0
        : options.playback === "idle"
            ? Math.max(0, time)
            : Math.max(0, time - exports.EXPERIENCE_INTRO);
    const f = {
        dots: [],
        lines: [],
        bridges: [],
        labels: [],
        title: "경험",
        value: data.state === "valid"
            ? String(new Set(data.records.map((r) => r.mealId)).size)
            : "—",
        unit: "번의 식사",
        notes: [],
        legend: "미각 팔레트 색 = 메뉴 구분 · 진한 점 = 기록 · 연한 점 = 충돌한 주변 표현점",
        summaryOpacity: ease((t - 5.9) / 0.5),
        choices: [],
        selection: [],
        state: data.state,
    };
    if (!plan.recordCount) {
        f.notes = [
            data.state === "valid"
                ? "0개 요리 기록"
                : {
                    noData: "자료 없음",
                    unanswered: "미응답",
                    held: "해석 보류",
                    unlinked: "연결 미확인",
                }[data.state] || "자료 없음",
        ];
        return f;
    }
    const ring = (0, taste_motion_1.insightFrame)(Math.min(t, taste_motion_1.insightIntroDuration));
    const sample = (0, experience_physics_1.simulationSample)(plan.motion, t - taste_motion_1.insightIntroDuration);
    const finished = t >= exports.EXPERIENCE_INTRO;
    const positions = finished
        ? plan.rest.map((p, i) => experienceIdlePosition(p, plan.marks[i].id, ambient))
        : sample.positions;
    const growths = plan.marks.map((mark, i) => mark.role === "record" ? (finished ? 1 : sample.growth[i]) : 0);
    const tints = plan.marks.map((mark, i) => mark.role === "halo" ? (finished ? 1 : sample.tint[i]) : 0);
    const radii = growths.map((growth) => DOT_RADIUS + CORE_GROWTH * growth);
    plan.marks.forEach((mark, index) => {
        const original = ring.dots[mark.source];
        let point = scaled(original), radius = original.radius, opacity = original.opacity;
        if (t > 1.6 && t <= taste_motion_1.insightIntroDuration) {
            const handoff = ease((t - 1.6) / (taste_motion_1.insightIntroDuration - 1.6));
            point = {
                x: mix(point.x, plan.motion.start[index].x, handoff),
                y: mix(point.y, plan.motion.start[index].y, handoff),
            };
        }
        if (t > taste_motion_1.insightIntroDuration) {
            const p = positions[index], a = Math.atan2(p.y - 320, p.x - 320), r = Math.hypot(p.x - 320, p.y - 320);
            point = polar(a, Math.max(207, Math.min(284, r)));
            radius = radii[index];
            const base = mix(scatterFrame.dots[mark.source].opacity, 0.58, ease((t - taste_motion_1.insightIntroDuration) / 0.4));
            if (mark.role === "record") {
                opacity = mix(base, 0.98, growths[index]);
            }
            else
                opacity = mix(base, 1, tints[index]);
        }
        f.dots.push({
            ...point,
            id: mark.id,
            r: radius,
            color: mark.group.color,
            tintColor: mark.group.tintColor,
            opacity: opacity *
                (options.selected && options.selected !== mark.group.id ? 0.3 : 1),
            group: mark.group.id,
            role: mark.role,
            tint: tints[index],
        });
    });
    if (t < taste_motion_1.insightIntroDuration) {
        const owner = new Map(plan.marks.map((mark, i) => [mark.source, i]));
        for (const bridge of ring.bridges) {
            const pi = owner.get(bridge.parent), ci = owner.get(bridge.child);
            if (pi === undefined || ci === undefined)
                continue;
            const parent = plan.marks[pi], child = plan.marks[ci];
            if (parent.group.id !== child.group.id)
                continue;
            f.bridges.push({
                id: "entry:" + bridge.child,
                points: bridge.points.map(scaled),
                color: child.group.color,
                opacity: Math.min(f.dots[pi].opacity, f.dots[ci].opacity),
            });
        }
    }
    for (const group of plan.groups) {
        const denseLabels = plan.groups.length > 6;
        f.choices.push({
            id: group.id,
            label: group.name + (denseLabels ? " · " + group.records.length + "개" : ""),
        });
        const label = polar(group.angle, 168);
        // The dense fixture keeps counts in the selection list to prevent small sectors' labels overlapping.
        if (!denseLabels || options.selected === group.id)
            f.labels.push({
                ...label,
                id: group.id,
                text: group.name,
                sub: group.records.length + "개 기록",
                group: group.id,
                anchor: "middle",
            });
        if (options.selected === group.id)
            f.selection = [
                group.name,
                new Set(group.records.map((r) => r.mealId)).size +
                    "번 식사 · " +
                    group.records.length +
                    "개 요리 기록",
                group.quota +
                    "개 점 = 진한 " +
                    group.cores +
                    " + 연한 " +
                    (group.quota - group.cores),
                group.id === "unconfirmed" ? "정체성 확인 필요" : "같은 메뉴의 기록",
            ];
    }
    f.notes = [
        plan.recordCount + "개 요리 기록 · 전체 126개 표현점",
        plan.marks.filter((m) => m.role === "record").length +
            "개 진한 점 · " +
            plan.marks.filter((m) => m.role === "halo").length +
            "개 연한 점",
        plan.compressed
            ? "126건 초과: 진한 점도 비율로 축약"
            : "진한 점 1개 = 기록 1개 · 충돌 후 조금 커지고 주변 간격 유지",
        "가까운 점끼리 끌림 → 구슬처럼 충돌 · 관성을 유지하며 부드럽게 움직임",
    ];
    return f;
}

},
"brand-launch/src/TasteDataCategoryMotion/experience-physics.ts":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateExperience = simulateExperience;
exports.simulationSample = simulationSample;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
    const t = clamp(v);
    return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const CENTER = 320;
const RADIUS = 9.5;
const GROWTH = 1.3;
const GAP = 7;
/** Fixed 120 Hz integration. Cached per fixture; seeking never restarts a running simulation. */
function simulateExperience(bodies, startTime, endTime) {
    const step = 1 / 120, n = bodies.length;
    const p = bodies.map((b) => ({ ...b.start }));
    const v = bodies.map(() => ({ x: 0, y: 0 }));
    const contacts = bodies.map(() => Infinity), firstContact = bodies.map(() => Infinity);
    const collisions = [];
    const partners = bodies.map((b) => b.partner);
    const growth = bodies.map(() => 0), tint = bodies.map(() => 0);
    const samples = [];
    const radius = (i) => RADIUS + (bodies[i].record ? GROWTH * growth[i] : 0);
    const shield = (i, time) => bodies[i].record ? ease((time - firstContact[i]) / 0.45) : 0;
    function confine(i) {
        const dx = p[i].x - CENTER, dy = p[i].y - CENTER, r = Math.hypot(dx, dy);
        const target = Math.max(207, Math.min(284, r));
        if (r === target)
            return;
        const nx = dx / r, ny = dy / r, speed = v[i].x * nx + v[i].y * ny;
        p[i] = { x: CENTER + nx * target, y: CENTER + ny * target };
        if ((r > 284 && speed > 0) || (r < 207 && speed < 0)) {
            v[i].x -= speed * nx * 1.2;
            v[i].y -= speed * ny * 1.2;
        }
    }
    function collide(time, settling, initial = false) {
        // These are constant throughout every solver pass at this time step.
        const radii = bodies.map((_, i) => radius(i));
        const shields = bodies.map((_, i) => shield(i, time));
        const broadDistance = 2 * (RADIUS + GROWTH) + 0.35 + GAP;
        for (let pass = 0; pass < (initial ? 100 : 14); pass++) {
            let maximum = 0;
            for (let a = 0; a < n; a++)
                for (let b = a + 1; b < n; b++) {
                    const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y;
                    // Distant pairs cannot touch; retain the original exact solver for nearby pairs.
                    if (dx >= broadDistance || dx <= -broadDistance || dy >= broadDistance || dy <= -broadDistance)
                        continue;
                    const minimum = radii[a] + radii[b] + 0.35 + GAP * Math.max(shields[a], shields[b]);
                    if (dx >= minimum || dx <= -minimum || dy >= minimum || dy <= -minimum)
                        continue;
                    const d = Math.hypot(dx, dy);
                    if (d >= minimum)
                        continue;
                    maximum = Math.max(maximum, minimum - d);
                    const nx = d > 0.001 ? dx / d : 1, ny = d > 0.001 ? dy / d : 0;
                    const correction = (minimum - d + 0.00001) / 2;
                    p[a].x -= nx * correction;
                    p[a].y -= ny * correction;
                    p[b].x += nx * correction;
                    p[b].y += ny * correction;
                    if (!initial) {
                        const relative = (v[b].x - v[a].x) * nx + (v[b].y - v[a].y) * ny;
                        if (relative < 0) {
                            if (relative < -8 && pass === 0)
                                collisions.push({ a, b, time });
                            const impulse = (-(1 + (settling ? 0.12 : 0.45)) * relative) / 2;
                            v[a].x -= impulse * nx;
                            v[a].y -= impulse * ny;
                            v[b].x += impulse * nx;
                            v[b].y += impulse * ny;
                        }
                        if (bodies[a].group === bodies[b].group) {
                            if (bodies[a].record)
                                firstContact[a] = Math.min(firstContact[a], time);
                            if (bodies[b].record)
                                firstContact[b] = Math.min(firstContact[b], time);
                            if (!bodies[a].record)
                                contacts[a] = Math.min(contacts[a], time);
                            if (!bodies[b].record)
                                contacts[b] = Math.min(contacts[b], time);
                            if (!bodies[a].record && bodies[b].record)
                                partners[a] = b;
                            if (!bodies[b].record && bodies[a].record)
                                partners[b] = a;
                        }
                    }
                }
            for (let i = 0; i < n; i++)
                confine(i);
            if (maximum < 0.001)
                break;
        }
    }
    collide(startTime, false, true);
    const start = p.map((q) => ({ ...q }));
    const capture = () => samples.push({
        positions: p.map((q) => ({ ...q })),
        growth: [...growth],
        tint: [...tint],
    });
    capture();
    const count = Math.round((endTime - startTime) / step);
    for (let tick = 1; tick <= count; tick++) {
        const time = startTime + tick * step;
        const settle = ease((time - (endTime - 1.55)) / 1.15);
        const placement = ease((time - 2.5) / (endTime - 2.9));
        const stiffness = lerp(18, 240, settle), damping = lerp(7, 31, settle);
        const force = bodies.map((body, i) => {
            const target = {
                x: lerp(start[i].x, body.goal.x, placement),
                y: lerp(start[i].y, body.goal.y, placement),
            };
            return {
                x: (target.x - p[i].x) * stiffness,
                y: (target.y - p[i].y) * stiffness,
            };
        });
        for (let i = 0; i < n; i++) {
            const body = bodies[i];
            if (body.record ||
                time < body.at - 0.65 ||
                Number.isFinite(contacts[i]) ||
                settle > 0.7)
                continue;
            const core = body.partner, dx = p[core].x - p[i].x, dy = p[core].y - p[i].y, d = Math.hypot(dx, dy);
            const activation = ease((time - body.at + 0.65) / 0.35);
            // Spring forces act on velocity. A collision releases the attraction and transfers momentum.
            const pull = Math.max(0, d - radius(i) - radius(core) + 2) * 160 * activation;
            const fx = (dx / Math.max(d, 0.001)) * pull, fy = (dy / Math.max(d, 0.001)) * pull;
            force[i].x += fx;
            force[i].y += fy;
            force[core].x -= fx * 0.45;
            force[core].y -= fy * 0.45;
        }
        for (let i = 0; i < n; i++) {
            v[i].x = (v[i].x + force[i].x * step) * Math.exp(-damping * step);
            v[i].y = (v[i].y + force[i].y * step) * Math.exp(-damping * step);
            const speed = Math.hypot(v[i].x, v[i].y), limit = lerp(90, 120, settle);
            if (speed > limit) {
                v[i].x *= limit / speed;
                v[i].y *= limit / speed;
            }
            p[i].x += v[i].x * step;
            p[i].y += v[i].y * step;
            growth[i] = bodies[i].record
                ? Math.max(ease((time - firstContact[i]) / 0.55), ease((time - (endTime - 0.8)) / 0.65))
                : 0;
            tint[i] = bodies[i].record ? 0 : ease((time - contacts[i]) / 0.24);
            confine(i);
        }
        collide(time, settle > 0.5);
        capture();
    }
    return {
        start,
        samples,
        contacts,
        partners,
        firstContact,
        collisions,
        step,
        unresolved: bodies.filter((b, i) => !b.record && !Number.isFinite(contacts[i])).length,
    };
}
function simulationSample(simulation, time) {
    const cursor = Math.max(0, Math.min(simulation.samples.length - 1, time / simulation.step));
    const before = simulation.samples[Math.floor(cursor)], after = simulation.samples[Math.min(simulation.samples.length - 1, Math.ceil(cursor))], amount = cursor % 1;
    return {
        positions: before.positions.map((p, i) => ({
            x: lerp(p.x, after.positions[i].x, amount),
            y: lerp(p.y, after.positions[i].y, amount),
        })),
        growth: before.growth.map((v, i) => lerp(v, after.growth[i], amount)),
        tint: before.tint.map((v, i) => lerp(v, after.tint[i], amount)),
    };
}

}};
const cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;factories[id](m,m.exports,require);return m.exports;}
const geometry=require("brand-launch/src/TasteDataCategoryMotion/geometry.ts");let payload=null;
globalThis.TasteBuddyCategoryMotion={configure:function(json){payload=JSON.parse(json);},frame:function(time,optionsJSON){if(!payload)throw Error('Missing category data');const options=JSON.parse(optionsJSON);if(payload.selected)options.selected=payload.selected;const f=geometry.categoryFrame(payload.data,time,options);if(payload.title)f.title=payload.title;return JSON.stringify(f);}};
})();
