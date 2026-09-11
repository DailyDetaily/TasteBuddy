import React from 'react';
import { Composition } from 'remotion';
import { TasteBuddyAppShowcase } from './TasteBuddyAppShowcase';
import { TasteBuddyIntro } from './TasteBuddyIntro';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TasteBuddyNativeShowcase"
        component={TasteBuddyAppShowcase}
        durationInFrames={180} // 6 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Taste Buddy',
          subtitle: '나만을 위한 정교한 미식 큐레이션',
        }}
      />
      <Composition
        id="TasteBuddyIntro"
        component={TasteBuddyIntro}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Taste Buddy',
          subtitle: '내 취향에 딱 맞는 미식 큐레이션',
          brandColor: '#f97316',
        }}
      />
      <Composition
        id="TasteBuddyLandscape"
        component={TasteBuddyIntro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Taste Buddy',
          subtitle: '내 취향에 딱 맞는 미식 큐레이션',
          brandColor: '#f97316',
        }}
      />
    </>
  );
};
