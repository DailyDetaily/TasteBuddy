import React from 'react';
import { Player } from '@remotion/player';
import { TasteBuddyIntro } from './TasteBuddyIntro';

export interface TasteBuddyPlayerProps {
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TasteBuddyPlayer: React.FC<TasteBuddyPlayerProps> = ({
  autoPlay = true,
  loop = true,
  controls = true,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        ...style,
      }}
    >
      <Player
        component={TasteBuddyIntro}
        durationInFrames={150}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={30}
        style={{
          width: '100%',
          aspectRatio: '9 / 16',
        }}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
      />
    </div>
  );
};
