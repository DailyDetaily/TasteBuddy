import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../../',import.meta.url));
const modules=new Map();
function visit(file){
 const id=path.relative(root,file).replaceAll('\\','/');
 if(modules.has(id))return id;
 modules.set(id,'');
 let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2019,module:ts.ModuleKind.CommonJS}}).outputText;
 code=code.replace(/require\(["']([^"']+)["']\)/g,(_,name)=>{
  if(!name.startsWith('.'))throw Error('Unexpected dependency '+name);
  const dependency=path.resolve(path.dirname(file),name+'.ts');
  return 'require('+JSON.stringify(visit(dependency))+')';
 });
 modules.set(id,code);return id;
}
const entry=visit(path.join(root,'brand-launch/src/TasteDataCategoryMotion/geometry.ts'));
const output=`// Generated from the shared web motion geometry. No fixtures, network or persisted data.\n(function(){\nconst factories={${[...modules].map(([id,code])=>JSON.stringify(id)+':function(module,exports,require){\n'+code+'\n}').join(',\n')}};\nconst cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;factories[id](m,m.exports,require);return m.exports;}\nconst geometry=require(${JSON.stringify(entry)});let payload=null;\nglobalThis.TasteBuddyCategoryMotion={configure:function(json){payload=JSON.parse(json);},frame:function(time,optionsJSON){if(!payload)throw Error('Missing category data');const options=JSON.parse(optionsJSON);if(payload.selected)options.selected=payload.selected;const f=geometry.categoryFrame(payload.data,time,options);if(payload.title)f.title=payload.title;return JSON.stringify(f);}};\n})();\n`;
const destination=path.join(root,'ios/TasteBuddy/Resources/CategoryMotion/TasteDataCategoryMotion.js');
fs.writeFileSync(destination,output);
console.log(JSON.stringify({destination,modules:modules.size,bytes:Buffer.byteLength(output)}));
