import SplashLogo from '../components/graphics/SplashLogo';
import PrimaryButton from '../components/system/PrimaryButton';

/** AuthLandingView / 08 Flows · iOS. The logo uses the same bundled vector as launch. */
export default function AuthLandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="relative flex h-full w-full items-center justify-center bg-[var(--tb-color-bg-page)]">
      <SplashLogo autoplays={false} />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(12px,var(--tb-safe-area-bottom))]">
        <PrimaryButton onClick={onStart}>시작하기</PrimaryButton>
      </div>
    </main>
  );
}
