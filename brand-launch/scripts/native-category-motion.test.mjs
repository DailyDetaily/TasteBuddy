import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=name=>{
 const url=new URL('../src/TasteDataCategoryMotion/'+name+'.ts',import.meta.url);
 let code=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/['"]\.\.\/taste-motion['"]/g,JSON.stringify(new URL('../src/taste-motion.ts',import.meta.url).href));
 code=code.replace(/['"]\.\.\/\.\.\/\.\.\/src\/constants\/designTokens['"]/g,JSON.stringify(new URL('../../src/constants/designTokens.ts',import.meta.url).href));
 code=code.replace(/['"]\.\/(experience-physics|experience|sensory|context-entry|context|change|colors)['"]/g,(_,name)=>JSON.stringify(compile(name)));
 return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
};
const {fixture}=await import(compile('fixtures'));
const {categoryFrame}=await import(compile('geometry'));
const source=fs.readFileSync(new URL('../../ios/TasteBuddy/Resources/CategoryMotion/TasteDataCategoryMotion.js',import.meta.url),'utf8');
const engine=vm.createContext({});vm.runInContext(source,engine);const api=engine.TasteBuddyCategoryMotion;
test('bundled native geometry matches the web for all five categories and reduced motion',()=>{
 for(const kind of ['experienceCluster','sensoryRays','preferenceFocus','contextLayers','changeRipples']) for(const scenario of ['standard','held']){
  const data=fixture(kind,scenario);api.configure(JSON.stringify({data}));
  for(const [time,options] of [[0,{playback:'reduced'}],[1.2,{playback:'intro'}],[5,{playback:'idle'}]]){
   const actual=JSON.parse(api.frame(time,JSON.stringify(options)));
   const expected=JSON.parse(JSON.stringify(categoryFrame(data,time,options)));
   assert.deepEqual(actual,expected,kind+' '+time);
  }
 }
});
test('native configuration can replace actual data without retaining a previous category or count',()=>{
 api.configure(JSON.stringify({data:fixture('changeRipples','empty')}));
 assert.equal(JSON.parse(api.frame(0,'{"playback":"reduced"}')).value,'— → —');
 api.configure(JSON.stringify({data:fixture('experienceCluster','zero')}));
 assert.equal(JSON.parse(api.frame(0,'{"playback":"reduced"}')).value,'0');
 assert(!source.includes('function fixture('));
});
