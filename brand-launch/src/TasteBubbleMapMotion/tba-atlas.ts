// Compatibility entry point. No permanent atlas array is generated or loaded.
// All cells are sampled by the same native-aligned viewport grid.
export {
  GRID_FINAL_ZOOM as TBA_ATLAS_FINAL_ZOOM,
  buildBubbleGrid,
} from "./layout";
