import React, { useEffect, useState } from "react";
import { staticFile, useDelayRender } from "remotion";
import type { LogoGridElement } from "./geometry";
import { wordmarkFillMaps, type WordmarkFillMap } from "./wordmarkFillMaps";

// The field sweeps locally sized circular brushes along the original ink.
// Thresholding gives the moving fill a round cap on both stems and bowls.
// The unchanged source path supplies the outer edge at every animation frame.
export const WordmarkTerminalFill: React.FC<{
  node: LogoGridElement;
  progress: number;
  prefix: string;
  map?: WordmarkFillMap;
}> = ({ node, progress, prefix, map: suppliedMap }) => {
  const map = suppliedMap ?? wordmarkFillMaps[node.index];
  const src = `${staticFile(map.src)}?v=${map.fieldHash.slice(0, 12)}`;
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() =>
    delayRender(`Load terminal fill: ${node.name}`),
  );
  useEffect(() => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      continueRender(handle);
    };
    image.onload = finish;
    image.onerror = () =>
      cancelRender(new Error(`Unable to load terminal fill: ${node.name}`));
    image.src = src;
    return () => {
      image.onload = null;
      image.onerror = null;
      finish();
    };
  }, [src, handle, continueRender, cancelRender, node.name]);

  if (progress <= 0) return null;
  // No mask at the settled endpoint: the exact vector source is rendered.
  if (progress >= 1)
    return (
      <path
        {...node.props}
        data-source-index={node.index}
        data-terminal-fill-progress={1}
      />
    );

  const id = `${prefix}terminal-fill-${node.index}`;
  const edgeSoftness = 128;
  const intercept = edgeSoftness * (progress - 1) + 0.5;
  return (
    <>
      <defs>
        <filter
          id={`${id}-threshold`}
          filterUnits="userSpaceOnUse"
          x={map.x}
          y={map.y}
          width={map.width}
          height={map.height}
          colorInterpolationFilters="sRGB"
        >
          <feComponentTransfer>
            <feFuncR type="linear" slope={edgeSoftness} intercept={intercept} />
            <feFuncG type="linear" slope={edgeSoftness} intercept={intercept} />
            <feFuncB type="linear" slope={edgeSoftness} intercept={intercept} />
          </feComponentTransfer>
        </filter>
        <mask
          id={id}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={map.x}
          y={map.y}
          width={map.width}
          height={map.height}
          style={{ maskType: "luminance" }}
        >
          <image
            href={src}
            x={map.x}
            y={map.y}
            width={map.width}
            height={map.height}
            preserveAspectRatio="none"
            filter={`url(#${id}-threshold)`}
          />
        </mask>
      </defs>
      <path
        {...node.props}
        mask={`url(#${id})`}
        data-source-index={node.index}
        data-terminal-fill-progress={progress}
        data-terminal-count={map.terminalCount}
      />
    </>
  );
};
