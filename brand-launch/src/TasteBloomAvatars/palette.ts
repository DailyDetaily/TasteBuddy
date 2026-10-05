import type { BloomSvgLayers } from "./generated";

export type BloomLayerColors = {
  outerPetals: string;
  innerPetals: string;
  outerStamens: string;
  innerStamens: string;
  pistil: string;
};

// Recolor only painted attributes. Paths, positions, proportions and shape counts
// stay identical to the original SVG, including the lines in dotted-ray stamens.
export const withBloomColors = (
  source: BloomSvgLayers,
  colors: BloomLayerColors,
): BloomSvgLayers => {
  const recolor = (markup: string, color: string) =>
    markup.replace(
      /(fill|stroke)="#[\da-f]{6}"/gi,
      (_, attribute: string) => `${attribute}="${color}"`,
    );
  return {
    ...source,
    outerPetals: source.outerPetals.map((petal) =>
      recolor(petal, colors.outerPetals),
    ),
    innerPetals: source.innerPetals.map((petal) =>
      recolor(petal, colors.innerPetals),
    ),
    outerStamens: recolor(source.outerStamens, colors.outerStamens),
    innerStamens: recolor(source.innerStamens, colors.innerStamens),
    pistil: recolor(source.pistil, colors.pistil),
  };
};
