import React from 'react';

export default function RadarChartGraphic() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Background radial lines */}
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute">
                {[...Array(24)].map((_, i) => (
                    <line
                        key={i}
                        x1="120" y1="120"
                        x2={120 + Math.cos((i * 15 * Math.PI) / 180) * 110}
                        y2={120 + Math.sin((i * 15 * Math.PI) / 180) * 110}
                        stroke="#F5F5F5"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            {/* Dynamic Data Polygon */}
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 animate-[scale-in_1s_ease-out_forwards]">
                <path
                    d="M120 120 L150 50 L180 60 L160 80 L190 90 L170 120 L210 130 L160 160 L150 190 L120 150 L90 190 L70 140 L50 150 L60 110 L40 70 L90 80 L100 40 Z"
                    fill="#FF9900"
                    fillOpacity="0.3"
                    stroke="#FF9900"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                {/* Points */}
                {[
                    [150, 50], [180, 60], [160, 80], [190, 90], [170, 120], [210, 130], [160, 160],
                    [150, 190], [120, 150], [90, 190], [70, 140], [50, 150], [60, 110], [40, 70], [90, 80], [100, 40]
                ].map(([cx, cy], i) => (
                    <g key={i}>
                        <line x1="120" y1="120" x2={cx} y2={cy} stroke="#FF9900" strokeWidth="0.5" strokeOpacity="0.5" />
                        <circle cx={cx} cy={cy} r="3" fill="#FF9900" />
                    </g>
                ))}
                <circle cx="120" cy="120" r="4" fill="#FF9900" />
            </svg>
            <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
