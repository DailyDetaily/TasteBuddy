import SplashLogo from '../components/graphics/SplashLogo';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--tb-color-bg-page)]"
            data-testid="splash-screen">
            <SplashLogo onComplete={onComplete} />
        </div>
    );
}
