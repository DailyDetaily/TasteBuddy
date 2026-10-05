import { createElement, useId, useMemo } from "react";
import type { FoodIconEntry } from "./catalog";
import type { dessertMotion } from "./dessert-motion";
import { dessertStackLayers, prepareDessertShape } from "./dessert-shape";

export const DessertReturn = ({
  icon,
  cake,
  pose,
}: {
  icon: FoodIconEntry;
  cake: ReturnType<typeof prepareDessertShape>;
  pose: ReturnType<typeof dessertMotion>;
}) => {
  const maskId = `dessert-stack-${useId().replace(/:/g, "")}`;
  const layers = useMemo(() => dessertStackLayers(cake), [cake]);
  const stacked = pose.returnLayers.every(({ progress }) => progress === 1);

  if (stacked)
    return (
      <g
        data-dessert-part="restored-cake"
        data-dessert-line-trim={pose.lineTrim}
      >
        {createElement(icon.nodes[1][0], icon.nodes[1][1])}
        <path d={cake.cherryGap} opacity={pose.cherryGap} />
        {cake.layers.map(({ offset, endX }, index) => (
          <path
            key={index}
            data-dessert-part="return-layer-line"
            d={`M${cake.tip.x} ${cake.tip.y + offset}H${cake.rear.x + (endX - cake.rear.x) * pose.lineTrim}`}
          />
        ))}
      </g>
    );

  return (
    <g data-dessert-part="stacking-cake">
      <defs>
        {layers.map((_, index) => (
          <mask
            key={index}
            id={`${maskId}-${index}`}
            maskUnits="userSpaceOnUse"
            x={-24}
            y={-24}
            width={72}
            height={72}
            style={{ maskType: "luminance" }}
          >
            <rect
              x={-24}
              y={-24}
              width={72}
              height={72}
              fill="white"
              stroke="none"
            />
            {layers.slice(index + 1).map((layer, later) => {
              const upper = pose.returnLayers[index + later + 1];
              return (
                <path
                  key={later}
                  d={layer.body}
                  transform={`translate(0 ${upper.y})`}
                  opacity={upper.opacity}
                  fill="black"
                  stroke="black"
                />
              );
            })}
          </mask>
        ))}
      </defs>
      {layers.map((layer, index) => {
        const state = pose.returnLayers[index];
        if (state.opacity === 0) return null;
        return (
          <g
            key={index}
            data-dessert-part="return-layer"
            data-dessert-layer={index}
            data-dessert-layer-progress={state.progress}
            mask={`url(#${maskId}-${index})`}
          >
            <g transform={`translate(0 ${state.y})`} opacity={state.opacity}>
              <path d={layer.body} />
              {layer.topEdge && <path d={layer.topEdge} />}
            </g>
          </g>
        );
      })}
    </g>
  );
};
