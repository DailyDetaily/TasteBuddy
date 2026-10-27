import { createElement, useId, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { FoodIconEntry } from "./catalog";
import type { FoodIconMotionProps } from "./settings";
import { DESSERT_FRONT_DEPTH, dessertMotion } from "./dessert-motion";
import { dessertShape, prepareDessertShape } from "./dessert-shape";
import { fruitOutline, prepareFruitOutline } from "./fruit-shape";
import { DessertReturn } from "./DessertReturn";

type DessertProps = { icon: FoodIconEntry; motion: FoodIconMotionProps };

export const Dessert = (props: DessertProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <DessertFrame {...props} frame={frame} fps={fps} />;
};

/** Reuse the original animation with an explicit local clock when embedded. */
export const DessertFrame = ({
  icon,
  motion,
  frame,
  fps,
}: DessertProps & { frame: number; fps: number }) => {
  const cutMask = `dessert-cut-${useId().replace(/:/g, "")}`;
  const cake = useMemo(
    () =>
      prepareDessertShape(
        icon.nodes[1][1].d,
        icon.nodes.slice(2).map(([, attributes]) => attributes.d),
      ),
    [icon.nodes],
  );
  const frontBite = useMemo(() => {
    const shape = dessertShape(cake, DESSERT_FRONT_DEPTH);
    const cornerShape = dessertShape(cake, DESSERT_FRONT_DEPTH, 1);
    if (!shape || !cornerShape) throw new Error("Dessert bite leaves no cake");
    return {
      shape,
      cornerShape,
      outline: prepareFruitOutline(cornerShape.body),
    };
  }, [cake]);
  const pose = dessertMotion(
    frame,
    fps,
    motion["모션 속도"],
    motion["모션 강도"],
    motion.재생 === "정지",
  );
  const bitten = pose.eaten > 0.00001;
  const shape = bitten
    ? pose.eaten === DESSERT_FRONT_DEPTH
      ? pose.corner === 0
        ? frontBite.shape
        : pose.corner === 1
          ? frontBite.cornerShape
          : dessertShape(cake, pose.eaten, pose.corner)
      : dessertShape(cake, pose.eaten)
    : null;
  const bites = pose.bites.filter((bite) => bite.radius > 0.001);
  const body = bites.length
    ? fruitOutline(frontBite.outline, bites)
    : shape?.body;
  const sectionBands = bites
    .map((bite) => {
      const radius = bite.radius + 2.4;
      return `M${bite.x + radius} ${bite.y}a${radius} ${radius} 0 1 0 ${-2 * radius} 0a${radius} ${radius} 0 1 0 ${2 * radius} 0Z`;
    })
    .join(" ");
  const cherry = icon.nodes[0][1];
  return (
    <g
      data-dessert-part="cake"
      data-dessert-eaten={pose.eaten}
      data-dessert-corner={pose.corner}
      data-dessert-final-progress={pose.lastBite}
      data-dessert-bites={[
        ...(pose.corner > 0 ? ["right-corner"] : []),
        ...bites.map((bite) => bite.id),
        ...(pose.lastBite > 0 ? ["last-bite"] : []),
      ].join(" ")}
      transform={`translate(${pose.x} ${pose.y})`}
    >
      {pose.rebuilding ? (
        <DessertReturn icon={icon} cake={cake} pose={pose} />
      ) : !bitten ? (
        <>
          {icon.nodes.slice(1).map(([tag, attributes], index) =>
            createElement(tag, {
              ...attributes,
              key: index,
              "data-icon-part": `${icon.id}-${index + 1}`,
            }),
          )}
          <path
            d={cake.cherryGap}
            opacity={pose.cherryGap}
            data-dessert-part="cherry-gap"
          />
        </>
      ) : shape && body ? (
        <>
          <defs>
            <mask
              id={cutMask}
              maskUnits="userSpaceOnUse"
              x={-24}
              y={-24}
              width={72}
              height={72}
              style={{ maskType: "luminance" }}
            >
              <path d={shape.body} fill="white" stroke="none" />
              {bites.map((bite) => (
                <circle
                  key={bite.id}
                  cx={bite.x}
                  cy={bite.y}
                  r={bite.radius}
                  fill="black"
                  stroke="none"
                />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${cutMask})`}>
            <path
              d={shape.face}
              fill="currentColor"
              fillOpacity={0.12}
              stroke="none"
              data-dessert-part="cut-face"
            />
            {bites.length > 0 && (
              <path
                d={sectionBands}
                fill="currentColor"
                fillOpacity={0.1}
                stroke="none"
                data-dessert-part="new-cut-face"
              />
            )}
            <path d={shape.cutEdge} data-dessert-part="cut-edge" />
            {shape.layers.map((path, index) => (
              <path key={index} d={path} data-dessert-part="layer" />
            ))}
          </g>
          <path d={body} data-dessert-part="body" />
        </>
      ) : null}
      {pose.cherryScale > 0.001 && pose.cherryOpacity > 0.001 && (
        <g
          data-dessert-part="cherry"
          opacity={pose.cherryOpacity}
          transform={`translate(${cherry.cx} ${Number(cherry.cy) + pose.cherryY}) scale(${pose.cherryScale}) translate(${-Number(cherry.cx)} ${-Number(cherry.cy)})`}
        >
          {createElement(icon.nodes[0][0], {
            ...cherry,
            "data-icon-part": `${icon.id}-0`,
          })}
        </g>
      )}
    </g>
  );
};
