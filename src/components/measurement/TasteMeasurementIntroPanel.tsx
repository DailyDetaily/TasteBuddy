import tasteCircleVideo from '../../assets/video/Taste circle.mp4';

export default function TasteMeasurementIntroPanel() {
  return (
    <>
      <div className="mb-16 mt-8 text-center">
        <h1 className="mb-3 text-[18px] font-bold leading-tight tracking-tight">
          이제, 당신의 미각을
          <br />
          만나볼 시간입니다.
        </h1>
        <p className="text-[14px] text-[var(--tb-color-text-body)]">
          총 6가지 기본 맛에 대한 민감도를 측정합니다.
          <br />
          약 3분 정도 소요되니, 잠시 집중해주세요.
        </p>
      </div>

      <div className="relative flex flex-1 w-full items-center justify-center">
        <div className="relative flex h-[300px] w-[300px] items-center justify-center">
          <video
            src={tasteCircleVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </>
  );
}
