// The old command name is kept for existing project workflows.
// No thousands-of-rows TypeScript atlas is emitted anymore: buildBubbleGrid()
// reads the current native catalog and samples the current viewport directly.
import fs from 'node:fs';
import path from 'node:path';
import {root,layout,motion,settings,visible} from './bubble-grid-test-helpers.mjs';
const output=path.join(root,'output/taste-bubble-map/viewport-grid-audit.json');
const samples=[52,153,246,345,435,510,573].map(frame=>{
  const state=motion.bubbleMapFrame(frame,settings.bubbleMapDefaults);
  return {
    frame,
    active:state.activeCellCount,
    native:layout.BASE_BUBBLES.length,
    added:state.addedCellCount,
    visible:visible(state).length,
    physics:state.physicsCellCount,
  };
});
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({mode:'viewport-local-native-grid',samples},null,2)+'\n');
console.log(JSON.stringify({output,mode:'viewport-local-native-grid',samples},null,2));
