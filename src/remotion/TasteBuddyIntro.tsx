import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TasteBuddyIntroProps {
  title?: string;
  subtitle?: string;
  brandColor?: string;
}

export const TasteBuddyIntro: React.FC<TasteBuddyIntroProps> = ({
  title = 'Taste Buddy',
  subtitle = '내 취향에 딱 맞는 미식 큐레이션',
  brandColor = '#f97316',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo & Title Spring
  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Subtitle fade and slide-up
  const subtitleTranslateY = interpolate(frame, [25, 45], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Feature cards staggered entrance
  const features = [
    { icon: '✨', text: '개인화 미식 취향 분석' },
    { icon: '🍽️', text: '엄선된 로컬 맛집 큐레이션' },
    { icon: '🎯', text: '실시간 추천 & 기록' },
  ];

  // Glow pulse animation
  const glowScale = interpolate(
    Math.sin((frame / 15) * Math.PI),
    [-1, 1],
    [0.9, 1.1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#ffffff',
        color: '#18181b',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brandColor}15 0%, rgba(255, 255, 255, 0) 70%)`,
          transform: `scale(${glowScale})`,
          filter: 'blur(50px)',
          zIndex: 0,
        }}
      />

      {/* Main Header */}
      <div
        style={{
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            fontSize: 90,
            marginBottom: 24,
            filter: 'drop-shadow(0 10px 20px rgba(249, 115, 22, 0.2))',
          }}
        >
          🍽️
        </div>

        <h1
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0,
            color: '#18181b',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            transform: `translateY(${subtitleTranslateY}px)`,
            opacity: subtitleOpacity,
            fontSize: 32,
            fontWeight: 500,
            color: '#71717a',
            marginTop: 18,
            marginBottom: 60,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Feature Pills */}
      <div
        style={{
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          width: '100%',
          maxWidth: 600,
        }}
      >
        {features.map((feature, i) => {
          const delay = 50 + i * 18;
          const cardScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14 },
          });
          const cardOpacity = interpolate(
            frame,
            [delay, delay + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={feature.text}
              style={{
                transform: `scale(${cardScale})`,
                opacity: cardOpacity,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '24px 32px',
                borderRadius: 24,
                backgroundColor: '#ffffff',
                border: '1px solid #e4e4e7',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <span style={{ fontSize: 36 }}>{feature.icon}</span>
              <span style={{ fontSize: 28, fontWeight: 600, color: '#18181b' }}>
                {feature.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
