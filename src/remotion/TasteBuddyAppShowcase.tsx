import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TasteBuddyNativeAppScreen } from './TasteBuddyNativeAppScreen';

export interface TasteBuddyAppShowcaseProps {
  title?: string;
  subtitle?: string;
}

export const TasteBuddyAppShowcase: React.FC<TasteBuddyAppShowcaseProps> = ({
  title = 'Taste Buddy',
  subtitle = 'Quiet Hospitality Intelligence',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Phone Entrance Animation (Subtle, elegant float-in)
  const phoneEnter = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 70,
    },
  });

  const phoneY = interpolate(phoneEnter, [0, 1], [120, 0]);
  const phoneScale = interpolate(phoneEnter, [0, 1], [0.9, 1]);

  // Gentle float hover
  const floatHoverY = Math.sin((frame / 28) * Math.PI) * 6;

  // 2. Header Text Animation
  const textOpacity = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textTranslateY = interpolate(frame, [8, 24], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. Floating Badge 1 (Sensory Analysis Insight)
  const badge1Spring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14 },
  });
  const badge1X = interpolate(badge1Spring, [0, 1], [-60, 0]);
  const badge1Opacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 4. Floating Badge 2 (Chef Guidance Match)
  const badge2Spring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14 },
  });
  const badge2X = interpolate(badge2Spring, [0, 1], [60, 0]);
  const badge2Opacity = interpolate(frame, [55, 67], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 5. Bottom CTA
  const ctaOpacity = interpolate(frame, [75, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Pretendard", "SF Pro Display", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '70px 40px 60px',
        overflow: 'hidden',
      }}
    >
      {/* Top Header with official 6-petal geometric symbol */}
      <div
        style={{
          zIndex: 10,
          textAlign: 'center',
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Official Brand Logo Mark */}
        <div
          style={{
            width: 48,
            height: 48,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Img
            src={staticFile('symbol.png')}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#0f0f0f',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 20,
            fontWeight: 500,
            color: '#666666',
            letterSpacing: '-0.01em',
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Center: iPhone 16 Pro Frame running the ACTUAL Native App */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          perspective: 1200,
          marginTop: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            transform: `translateY(${phoneY + floatHoverY}px) scale(${phoneScale})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/* iPhone Outer Shell */}
          <div
            style={{
              width: 480,
              height: 1020,
              borderRadius: 60,
              padding: 12,
              backgroundColor: '#1c1917',
              boxShadow:
                '0 30px 70px -15px rgba(0, 0, 0, 0.18), 0 15px 25px -10px rgba(0, 0, 0, 0.08), inset 0 0 3px 1px rgba(255, 255, 255, 0.25)',
              border: '2px solid #44403c',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Screen Glass Container */}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 50,
                overflow: 'hidden',
                backgroundColor: '#f3f3f3',
                position: 'relative',
              }}
            >
              {/* Dynamic Island */}
              <div
                style={{
                  position: 'absolute',
                  top: 13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 136,
                  height: 34,
                  backgroundColor: '#000000',
                  borderRadius: 18,
                  zIndex: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 10,
                }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    backgroundColor: '#1e1b4b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                />
              </div>

              {/* The Actual Native iOS App Screen */}
              <TasteBuddyNativeAppScreen />

              {/* Subtle Screen Glass Sheen */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '35%',
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%)',
                  pointerEvents: 'none',
                  zIndex: 48,
                }}
              />
            </div>
          </div>

          {/* Floating Callout 1 (PalateBloom Sensory Analysis) */}
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: -140,
              opacity: badge1Opacity,
              transform: `translateX(${badge1X}px)`,
              zIndex: 20,
              backgroundColor: '#ffffff',
              padding: '14px 20px',
              borderRadius: 18,
              boxShadow:
                '0 16px 36px -8px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e8e8e8',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ✦
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f97316' }}>
                미각 인사이트
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                섬세한 발효 & 감칠맛
              </div>
            </div>
          </div>

          {/* Floating Callout 2 (Chef Guidance & Reservation) */}
          <div
            style={{
              position: 'absolute',
              bottom: '26%',
              right: -140,
              opacity: badge2Opacity,
              transform: `translateX(${badge2X}px)`,
              zIndex: 20,
              backgroundColor: '#ffffff',
              padding: '14px 20px',
              borderRadius: 18,
              boxShadow:
                '0 16px 36px -8px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e8e8e8',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ★
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>
                다이닝 셰프 매칭
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f0f0f' }}>
                황정인 셰프 연동
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Minimalist Footer */}
      <div
        style={{
          zIndex: 10,
          opacity: ctaOpacity,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '15px 32px',
            backgroundColor: '#0f0f0f',
            color: '#ffffff',
            borderRadius: 14,
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          <span>Taste Buddy iOS 앱 경험하기</span>
          <span style={{ fontSize: 18 }}>→</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#888888' }}>
          차분하고 정제된 프리미엄 미식 서비스
        </p>
      </div>
    </AbsoluteFill>
  );
};
