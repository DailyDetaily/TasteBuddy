import { useEffect } from 'react';
import SplashLogo from '../components/graphics/SplashLogo';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    useEffect(() => {
        // 2.8초 후 온보딩(또는 다음 화면)으로 전환
        const timer = setTimeout(() => {
            onComplete();
        }, 2800);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--tb-color-bg-page)] animate-fadeIn">
            <div className="animate-[fadein_1s_ease-out_forwards]">
                <SplashLogo />
            </div>
            <style>{`
        @keyframes fadein {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
