function HistoryCard({ history, isFirst }: { history: typeof adjustmentHistoryData[0], isFirst?: boolean }) {
  // 맛에 따른 색상 매핑
  const getTasteColor = (taste: string) => {
    const tasteColors: { [key: string]: string } = {
      "단맛": "#FF9900",
      "신맛": "#FFD600",
      "쓴맛": "#95C900",
      "짠맛": "#7299FF",
      "감칠맛": "#B372B4",
      "지방맛": "#95867A"
    };
    return tasteColors[taste] || "#FF9900";
  };

  return (
    <div className="bg-[#f3f3f3] relative rounded-[20px] shrink-0 w-full" data-name="History Card">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[12px] relative w-full">
          {/* 헤더 */}
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
              <div 
                className="relative rounded-[8px] shrink-0 size-[40px]" 
                style={{ backgroundColor: history.color }}
              />
              <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0">
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold relative shrink-0 text-[#0f0f0f] text-[14px] text-nowrap whitespace-pre">
                  {history.chefName} 셰프
                </p>
                <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal relative shrink-0 text-[10px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">
                  {history.restaurant}
                </p>
              </div>
            </div>
            {/* 만족도 */}
            <div className="flex gap-[2px] items-center">
              {[...Array(history.satisfaction)].map((_, i) => (
                <Star key={i} className="size-[12px] fill-[#FF9900] text-[#FF9900]" />
              ))}
            </div>
          </div>

          {/* 사용 정보 */}
          <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full flex-wrap">
            <div className="flex gap-[4px] items-center">
              <Clock className="size-[12px] text-[rgba(15,15,15,0.6)]" />
              <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">
                {history.date} {history.time}
              </p>
            </div>
            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal text-[11px] text-[rgba(15,15,15,0.6)] text-nowrap whitespace-pre">
              • 사용 시간 {history.duration}
            </p>
          </div>

          {/* 조정값 */}
          <div className="content-stretch flex gap-[6px] items-start relative shrink-0 w-full flex-wrap">
            {history.adjustments.map((adj, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-[8px] px-[8px] py-[4px] flex gap-[4px] items-center"
              >
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[10px] text-[#0f0f0f] text-nowrap whitespace-pre">
                  {adj.taste}
                </p>
                <p 
                  className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[10px] text-nowrap whitespace-pre"
                  style={{ color: getTasteColor(adj.taste) }}
                >
                  {adj.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isFirst && (
        <div className="absolute -top-[18px] left-[12px] bg-gradient-to-r from-orange-500 to-purple-600 rounded-full px-[10px] py-[3px]">
          <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[9px] text-white text-nowrap whitespace-pre">
            가장 최근
          </p>
        </div>
      )}
    </div>
  );
}
