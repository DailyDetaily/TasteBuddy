import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { FlowLoadingState } from "./FlowState";
import "./primitives.css";

export default function AttachmentInput({ label = "식사 사진", disabled = false, onChange, initialPreview, initialError }: { label?: string; disabled?: boolean; onChange?: (file: File | null) => void; initialPreview?: string; initialError?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const ownedURL = useRef<string | null>(null);
  const request = useRef(0);
  const [preview, setPreview] = useState(initialPreview || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || "");
  useEffect(() => () => {
    request.current++;
    if (ownedURL.current) URL.revokeObjectURL(ownedURL.current);
  }, []);
  const select = async (file: File) => {
    const current = ++request.current;
    setError("");
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError("JPG, PNG, WebP, GIF 사진을 선택해 주세요.");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (request.current !== current) { URL.revokeObjectURL(url); return; }
      if (ownedURL.current) URL.revokeObjectURL(ownedURL.current);
      ownedURL.current = url;
      setPreview(url);
      onChange?.(file);
    } catch {
      URL.revokeObjectURL(url);
      if (request.current === current) setError("사진을 불러오지 못했어요. 다른 사진을 선택해 주세요.");
    } finally {
      if (request.current === current) setBusy(false);
    }
  };
  return <div className="tb-pl-attachment">
    <span id={`${id}-label`} className="tb-pl-field-label">{label}</span>
    <input ref={input} className="tb-pl-sr-only" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled || busy} aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined} onChange={event => {
      const file = event.target.files?.[0];
      if (file) void select(file);
      event.target.value = "";
    }} />
    {busy ? <FlowLoadingState message="사진을 준비하고 있어요" /> : preview ? <div className="tb-pl-attachment-preview">
      <img src={preview} alt="선택한 식사 사진" />
      <button type="button" disabled={disabled} aria-label="사진 삭제" onClick={() => {
        request.current++;
        if (ownedURL.current) URL.revokeObjectURL(ownedURL.current);
        ownedURL.current = null;
        setPreview(""); setError(""); onChange?.(null);
      }}><X size={18} aria-hidden="true" /></button>
    </div> : null}
    <button className="tb-pl-attachment-trigger" type="button" disabled={disabled || busy} onClick={() => input.current?.click()} aria-describedby={error ? `${id}-error` : undefined}>
      <ImagePlus size={20} aria-hidden="true" />{preview ? "사진 바꾸기" : "사진 선택"}
    </button>
    {error && <p className="tb-pl-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}
