import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type assets from "./assets.json";
export type BrandAsset = (typeof assets)[number];

interface MediaPlayerProps {
  asset: BrandAsset;
  hero?: boolean;
}

export default function MediaPlayer(props: MediaPlayerProps) {
  return <AssetMediaPlayer key={props.asset.id} {...props} />;
}

function AssetMediaPlayer({
  asset,
  hero = false,
}: MediaPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(asset.duration);
  const [speed, setSpeed] = useState("1");
  const [error, setError] = useState("");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => {
      setReduced(query.matches);
      if (query.matches) video.pause();
    };
    const background = () => {
      if (document.hidden) video.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", background);
    query.addEventListener("change", changed);
    return () => {
      observer.disconnect();
      video.pause();
      document.removeEventListener("visibilitychange", background);
      query.removeEventListener("change", changed);
    };
  }, [asset.id]);
  const play = async () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
        setError("");
      } catch {
        setError("영상을 재생하지 못했어요. 다시 시도해 주세요.");
      }
    } else video.pause();
  };
  return (
    <div className={`pl-media ${hero ? "is-hero" : ""}`}>
      <div
        className="pl-media-stage"
        style={{ aspectRatio: `${asset.width}/${asset.height}` }}
      >
        <video
          key={asset.id}
          ref={ref}
          src={asset.video}
          poster={asset.poster}
          preload="none"
          playsInline
          muted
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() =>
            setError("미디어를 불러오지 못했어요. 원본 파일을 확인해 주세요.")
          }
          aria-label={`${asset.title} 브랜드 모션. ${asset.description}`}
        />
      </div>
      <div className="pl-media-controls">
        <button onClick={play} aria-label={playing ? "일시정지" : "재생"}>
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          aria-label="처음으로"
          onClick={() => {
            if (ref.current) {
              ref.current.currentTime = 0;
              setPosition(0);
            }
          }}
        >
          <RotateCcw size={16} />
        </button>
        <input
          type="range"
          aria-label="영상 탐색"
          min="0"
          max={duration}
          step="0.01"
          value={position}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (ref.current) {
              ref.current.currentTime = value;
              setPosition(value);
            }
          }}
        />
        <span className="pl-time">
          {position.toFixed(1)} / {duration.toFixed(1)}s
        </span>
        <select
          value={speed}
          aria-label="재생 속도"
          onChange={(e) => {
            setSpeed(e.target.value);
            if (ref.current) ref.current.playbackRate = Number(e.target.value);
          }}
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>
      </div>
      {reduced && (
        <p className="pl-media-note">
          동작 줄이기 사용 중 · 직접 재생할 때만 움직여요.
        </p>
      )}
      {error && (
        <p role="alert" className="pl-error">
          {error}
        </p>
      )}
    </div>
  );
}
