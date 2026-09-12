import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const TasteBuddyAppMockupScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth scroll feed simulation
  const scrollOffset = interpolate(frame, [35, 120], [0, -320], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tap ripple effect at frame 80
  const tapScale = spring({
    frame: frame - 80,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const tapOpacity = interpolate(frame, [80, 100], [0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Pretendard", "SF Pro Text", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* iOS Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px 8px',
          fontSize: 14,
          fontWeight: 700,
          color: '#0f172a',
          zIndex: 40,
        }}
      >
        <span>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span>●●●●</span>
          <span>WiFi</span>
          <span>100% 🔋</span>
        </div>
      </div>

      {/* App Top Bar (Fixed) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #f1f5f9',
          zIndex: 35,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              border: '1px solid #fed7aa',
            }}
          >
            🍽️
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              Taste Buddy
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316' }}>
              AI TASTE CURATION
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              position: 'relative',
            }}
          >
            🔔
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#f97316',
              }}
            />
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            JH
          </div>
        </div>
      </div>

      {/* Scrollable Feed Container */}
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
            padding: '16px 20px 100px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Welcome & Search Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                반가워요, 준호님 👋
              </span>
              <h2
                style={{
                  margin: '4px 0 0',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                }}
              >
                오늘 내 미각이 원하는 다이닝
              </h2>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              <span style={{ fontSize: 16 }}>🔍</span>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>
                지역, 요리 종류, 취향 키워드 검색
              </span>
            </div>
          </div>

          {/* Taste Calibration Summary Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
              color: '#ffffff',
              padding: '18px 20px',
              borderRadius: 22,
              boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(249, 115, 22, 0.25)',
                    color: '#fb923c',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  내 미각 팔레트 분석 완료
                </span>
                <div style={{ fontSize: 17, fontWeight: 800 }}>섬세한 감칠맛 & 아로마</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
                  산미 밸런스 선호 • 내 미식 데이터 14건 반영
                </div>
              </div>

              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                ✨
              </div>
            </div>
          </div>

          {/* Restaurant Card 1 (Mingles) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.04)',
              position: 'relative',
            }}
          >
            {/* Hero Image / Visual Header */}
            <div
              style={{
                height: 140,
                background:
                  'linear-gradient(135deg, #451a03 0%, #78350f 50%, #9a3412 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    color: '#fef08a',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ★ 미쉐린 2스타
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.85)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  예약 추천
                </span>
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                ❤️
              </div>

              {/* Match Score Badge */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 14,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ea580c' }}>
                  98% 일치
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>내 취향 저격</span>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
                  밍글스 (Mingles)
                </h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  ★ 4.9 <span style={{ color: '#94a3b8', fontWeight: 500 }}>(328)</span>
                </span>
              </div>

              <p style={{ margin: '6px 0 12px', fontSize: 13, color: '#64748b' }}>
                강남구 청담동 • 컨템포러리 한식 파인다이닝
              </p>

              {/* Taste Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['전통 장과 발효', '은은한 단맛', '제철 식재료', '페어링 우수'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      padding: '4px 8px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Tap Indicator Ripple */}
            {frame >= 80 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(249, 115, 22, 0.4)',
                  transform: `translate(-50%, -50%) scale(${tapScale})`,
                  opacity: tapOpacity,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

          {/* Restaurant Card 2 (Onjium) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                height: 130,
                background:
                  'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '14px 16px',
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  color: '#fef08a',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ★ 미쉐린 1스타
              </span>

              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  backgroundColor: '#ffffff',
                  borderRadius: 14,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>
                  95% 일치
                </span>
              </div>
            </div>

            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
                  온지음 (Onjium)
                </h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  ★ 4.8 <span style={{ color: '#94a3b8', fontWeight: 500 }}>(210)</span>
                </span>
              </div>
              <p style={{ margin: '6px 0 12px', fontSize: 13, color: '#64748b' }}>
                종로구 통의동 • 전통 한식 맛연구소
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Bottom Navigation Bar (Fixed) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #f1f5f9',
          padding: '10px 24px 28px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>홈</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20, opacity: 0.5 }}>🧭</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>탐색</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20, opacity: 0.5 }}>📊</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>취향분석</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 20, opacity: 0.5 }}>👤</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>프로필</span>
        </div>
      </div>

      {/* iOS Home Indicator Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 134,
          height: 5,
          backgroundColor: '#0f172a',
          borderRadius: 10,
          zIndex: 45,
        }}
      />
    </div>
  );
};
