import { logoGridDefs } from "./geometry";

// #808080 at 50% over white rounds to #C0C0C0. Use this lighter color at
// full stroke opacity, retaining the source gradients' transparent endpoints.
export const GRID_LINE_COLOR = "#C0C0C0";

export const getGridLineDefs = (prefix: string) =>
  logoGridDefs
    .replace(/stop-color="#808080"/g, `stop-color="${GRID_LINE_COLOR}"`)
    .replace(/id="/g, `id="${prefix}`);
