import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const TasteBuddyNativeAppScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth feed scrolling simulation
  const scrollOffset = interpolate(frame, [35, 125], [0, -280], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Center button pulse animation
  const centerPulse = interpolate(
    Math.sin((frame / 12) * Math.PI),
    [-1, 1],
    [1, 1.08]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f3f3f3', // TBColor.page
        color: '#0f0f0f', // TBColor.textPrimary
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Pretendard", "SF Pro Text", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. iOS Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 26px 4px',
          fontSize: 13,
          fontWeight: 600,
          color: '#0f0f0f',
          zIndex: 40,
        }}
      >
        <span>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span>●●●●</span>
          <span>WiFi</span>
          <span style={{ fontSize: 13 }}>🔋</span>
        </div>
      </div>

      {/* 2. Native TopAppBar (AppChromeComponents.swift) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 10px',
          backgroundColor: '#f3f3f3',
          borderBottom: '1px solid transparent',
          zIndex: 35,
          height: 48,
        }}
      >
        {/* Left: PalateBloom Avatar (Multi-color dot ring) */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {/* PalateBloom multi-color sensory ring */}
          <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: 'absolute' }}>
            <circle cx="17" cy="4" r="2.5" fill="#f97316" />
            <circle cx="28" cy="10" r="2.5" fill="#eab308" />
            <circle cx="28" cy="24" r="2.5" fill="#10b981" />
            <circle cx="17" cy="30" r="2.5" fill="#06b6d4" />
            <circle cx="6" cy="24" r="2.5" fill="#8b5cf6" />
            <circle cx="6" cy="10" r="2.5" fill="#ec4899" />
          </svg>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: '#18181b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            JH
          </div>
        </div>

        {/* Center: Inline Title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#0f0f0f',
          }}
        >
          홈
        </div>

        {/* Right: Notification Bell & Menu Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: '#3f3f3f',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#f97316',
              }}
            />
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3f3f3f',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Scrollable Main Content (MainTabChromeScrollView) */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${scrollOffset}px)`,
            padding: '12px 18px 120px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* HomeSearchCard (Native SwiftUI: Capsule input + Circular search button) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 44,
                padding: '0 16px',
                backgroundColor: '#f7f7f7', // TBColor.mutedSurface
                borderRadius: 999, // Capsule
                border: '1px solid #e7e7e7',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#888888', fontWeight: 500 }}>
                레스토랑, 메뉴, 셰프, 버디 검색
              </span>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#f7f7f7',
                border: '1px solid #e7e7e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3f3f3f',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Section 1: 인사이트 요약 (HomeSensorySummarySection) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f0f0f' }}>
                인사이트 요약
              </h2>
              <span style={{ fontSize: 12, color: '#888888' }}>나의 입맛 분석</span>
            </div>

            {/* Horizontal Rail of HomeSummaryCards */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflow: 'hidden',
                paddingBottom: 4,
              }}
            >
              {/* Card 1: 감칠맛 축 */}
              <div
                style={{
                  minWidth: 150,
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: '14px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    U
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#666666' }}>
                    선호 감칠맛
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                    섬세한 발효
                  </div>
                  <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
                    산미 밸런스 78%
                  </div>
                </div>
              </div>

              {/* Card 2: 단골 식당 / 셰프 축 */}
              <div
                style={{
                  minWidth: 150,
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: '14px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    ★
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#666666' }}>
                    셰프 매칭
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                    황정인 셰프
                  </div>
                  <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
                    레스토랑 베누
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Taste Next Question Card */}
            <div
              style={{
                marginTop: 10,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '14px 16px',
                border: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 2 }}>
                  ✦ 입맛 확인 질문
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0f0f' }}>
                  이 메뉴에서 느껴진 산미는 어떠셨나요?
                </div>
              </div>
              <span style={{ fontSize: 14, color: '#888888' }}>→</span>
            </div>
          </div>

          {/* Section 2: 최근 다이닝 아카이브 (HomeArchiveMetricsSection / HomeJournalSection) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f0f0f' }}>
                최근 다이닝 기록
              </h2>
              <span style={{ fontSize: 12, color: '#888888' }}>3개 기록</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Journal Entry 1: 레스토랑 베누 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 18,
                  padding: '16px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#666666',
                        backgroundColor: '#f7f7f7',
                        padding: '2px 8px',
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    >
                      2026.03.04 디너
                    </span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                      레스토랑 베누 (Benu)
                    </h3>
                    <div style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                      황정인 셰프 • 테이스팅 코스
                    </div>
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#f4f4f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    ★
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #f7f7f7',
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#475569',
                      backgroundColor: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    감칠맛 & 장류 발효
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#475569',
                      backgroundColor: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    은은한 산미
                  </span>
                </div>
              </div>

              {/* Journal Entry 2: 숍 리제 (Lysee) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 18,
                  padding: '16px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#666666',
                        backgroundColor: '#f7f7f7',
                        padding: '2px 8px',
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    >
                      2026.02.26 방문
                    </span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                      숍 리제 (Lysee)
                    </h3>
                    <div style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                      이은지 파티시에 • 시그니처 페어링
                    </div>
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#f4f4f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    ★
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Native BottomTabBar (AppChromeComponents.swift: 4 tabs + TasteBeam center button) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f3f3f3', // TBColor.page
          borderTop: '1px solid #e7e7e7',
          padding: '6px 8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 40,
          height: 72,
          boxSizing: 'border-box',
        }}
      >
        {/* Tab 1: 홈 (Active) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2.2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#0f0f0f', letterSpacing: '0.14px' }}>
            홈
          </span>
        </div>

        {/* Tab 2: 나의 입맛 (Inactive) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#afafaf" strokeWidth="1.8">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#afafaf', letterSpacing: '0.14px' }}>
            나의 입맛
          </span>
        </div>

        {/* Center: BottomTabCenterButton (디시 기록 추가 - TasteBeam radial pulse) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              padding: 2,
              background:
                'conic-gradient(from 0deg, #f97316, #eab308, #10b981, #06b6d4, #8b5cf6, #ec4899, #f97316)',
              transform: `scale(${centerPulse})`,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: '#0f0f0f',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              +
            </div>
          </div>
        </div>

        {/* Tab 3: 다이닝 (Inactive) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#afafaf" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#afafaf', letterSpacing: '0.14px' }}>
            다이닝
          </span>
        </div>

        {/* Tab 4: 프로필 (Inactive) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#afafaf" strokeWidth="1.8">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500, color: '#afafaf', letterSpacing: '0.14px' }}>
            프로필
          </span>
        </div>
      </div>

      {/* 5. iOS Home Indicator Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 4,
          backgroundColor: '#0f0f0f',
          borderRadius: 10,
          zIndex: 45,
          opacity: 0.8,
        }}
      />
    </div>
  );
};
