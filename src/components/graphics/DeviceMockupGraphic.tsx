import React from 'react';

export default function DeviceMockupGraphic() {
    return (
        <div className="relative w-full h-full flex items-center justify-center gap-6">
            {/* Front Device */}
            <div className="w-[70px] h-[220px] bg-white rounded-t-full rounded-b-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col items-center p-2 border border-gray-100 animate-[slide-up_0.8s_ease-out_forwards]">
                <div className="w-[54px] h-[120px] rounded-t-full rounded-b-[16px] bg-gradient-to-b from-gray-100 to-gray-300 shadow-inner flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-x-2 top-4 bottom-8 bg-gradient-to-b from-white/40 to-transparent rounded-t-full rounded-b-[12px]"></div>
                    <span className="text-gray-400 text-[8px] font-serif rotate-90 opacity-60">TasteBuddy</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full mt-4"></div>
                <div className="flex-1 w-full bg-white relative mt-2 flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-[var(--tb-taste-sweet-main)] rounded-full mt-10"></div>
                    <div className="mt-4 text-[6px] text-gray-300 font-serif">* TasteBuddy</div>
                </div>
            </div>

            {/* Back Device */}
            <div className="w-[70px] h-[220px] bg-[var(--tb-color-surface-muted)] rounded-t-full rounded-b-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col items-center p-2 border border-gray-100 animate-[slide-up_0.8s_ease-out_forwards] [animation-delay:0.1s]">
                <div className="w-[54px] h-[120px] rounded-t-full rounded-b-[16px] bg-gradient-to-b from-gray-200 to-gray-400 shadow-inner p-1 flex items-center justify-center">
                    <div className="w-[12px] h-[90%] bg-black rounded-full shadow-inner flex flex-col items-center justify-evenly py-2">
                        {[...Array(20)].map((_, i) => <div key={i} className="w-[2px] h-[2px] bg-gray-700 rounded-full"></div>)}
                    </div>
                </div>
                <div className="flex-1 w-full relative mt-2 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-gray-200"></div>
                </div>
            </div>
            <style>{`
        @keyframes slide-up {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
