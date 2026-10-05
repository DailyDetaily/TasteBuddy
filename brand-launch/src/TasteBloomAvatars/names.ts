// Short form/flower names follow the original nine avatars' naming style.
// The original nine names stay attached to their original shape combinations.
const names = {
  roundPetal: {
    thinStamen: {
      solidPistil: "Round",
      diamondPistil: "Clover",
      seedCluster: "Blossom",
    },
    roundedSpokeStamen: {
      solidPistil: "Poppy",
      diamondPistil: "Camellia",
      seedCluster: "Rosette",
    },
    dottedRayStamen: {
      solidPistil: "Button",
      diamondPistil: "Daisy",
      seedCluster: "Marigold",
    },
  },
  capsulePetal: {
    thinStamen: {
      solidPistil: "Oval",
      diamondPistil: "Capsule",
      seedCluster: "Spoon",
    },
    roundedSpokeStamen: {
      solidPistil: "Cosmos",
      diamondPistil: "Marguerite",
      seedCluster: "Gerbera",
    },
    dottedRayStamen: {
      solidPistil: "Aster",
      diamondPistil: "Anemone",
      seedCluster: "Echinacea",
    },
  },
  softDiamondPetal: {
    thinStamen: {
      solidPistil: "Lily",
      diamondPistil: "Lotus",
      seedCluster: "Dahlia",
    },
    roundedSpokeStamen: {
      solidPistil: "Iris",
      diamondPistil: "Ruby",
      seedCluster: "Orchid",
    },
    dottedRayStamen: {
      solidPistil: "Jasmine",
      diamondPistil: "Prism",
      seedCluster: "Diamond",
    },
  },
  serratedTipPetal: {
    thinStamen: {
      solidPistil: "Star",
      diamondPistil: "Garnet",
      seedCluster: "Fringe",
    },
    roundedSpokeStamen: {
      solidPistil: "Cornflower",
      diamondPistil: "Crown",
      seedCluster: "Peony",
    },
    dottedRayStamen: {
      solidPistil: "Zinnia",
      diamondPistil: "Calendula",
      seedCluster: "Carnation",
    },
  },
} as const;

export const bloomName = (shape: {
  petalShape: keyof typeof names;
  stamenShape: keyof typeof names.roundPetal;
  pistilShape: keyof typeof names.roundPetal.thinStamen;
}) => names[shape.petalShape][shape.stamenShape][shape.pistilShape];
