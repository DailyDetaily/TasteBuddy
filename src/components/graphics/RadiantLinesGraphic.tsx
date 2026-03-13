import React from 'react';

export default function RadiantLinesGraphic() {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="100" y1="100" x2="100" y2="20" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.1s]" />
                <line x1="100" y1="100" x2="160" y2="40" stroke="#4DA1FF" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.2s]" />
                <line x1="100" y1="100" x2="180" y2="100" stroke="#FF5C00" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.3s]" />
                <line x1="100" y1="100" x2="160" y2="160" stroke="#00D084" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.4s]" />
                <line x1="100" y1="100" x2="100" y2="180" stroke="#9B51E0" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.5s]" />
                <line x1="100" y1="100" x2="40" y2="160" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.6s]" />
                <line x1="100" y1="100" x2="20" y2="100" stroke="#B372B4" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.7s]" />
                <line x1="100" y1="100" x2="40" y2="40" stroke="#7299FF" strokeWidth="2" strokeLinecap="round" className="animate-[grow_1.5s_ease-out_forwards] origin-center opacity-0 [animation-delay:0.8s]" />
            </svg>
            <style>{`
        @keyframes grow {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
