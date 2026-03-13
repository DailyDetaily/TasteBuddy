import React from 'react';

export default function ScatterDotsGraphic() {
    const dots = Array.from({ length: 120 }).map((_, i) => ({
        x: 100 + Math.cos(i * 0.1) * (40 + Math.random() * 40),
        y: 100 + Math.sin(i * 0.1) * (40 + Math.random() * 40),
        r: 1.5 + Math.random() * 2.5,
        color: ['#FFB800', '#4DA1FF', '#FF5C00', '#00D084', '#9B51E0', '#FF9900', '#AFAFAF', '#E5E5E5'][Math.floor(Math.random() * 8)],
        delay: Math.random() * 1.5
    }));

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="70" stroke="#F5F5F5" strokeWidth="20" />
                {dots.map((dot, i) => (
                    <circle
                        key={i}
                        cx={dot.x}
                        cy={dot.y}
                        r={dot.r}
                        fill={dot.color}
                        className="animate-[fadein_1s_ease-in-out_both]"
                        style={{ animationDelay: `${dot.delay}s` }}
                    />
                ))}
            </svg>
            <style>{`
        @keyframes fadein {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
