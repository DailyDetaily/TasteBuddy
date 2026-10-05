import {mkdir,copyFile,readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),out=new URL('public/ocr/v7/',root);
await mkdir(out,{recursive:true});
const files=[['node_modules/tesseract.js/dist/worker.min.js','worker.min.js'],['node_modules/tesseract.js/LICENSE.md','TESSERACT-LICENSE.md']];
for(const name of await readdir(new URL('node_modules/tesseract.js-core/',root)))if(name.endsWith('.wasm.js'))files.push([`node_modules/tesseract.js-core/${name}`,name]);
for(const lang of ['eng','kor'])files.push([`node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,`${lang}.traineddata.gz`]);
const manifest={engine:'tesseract.js@7.0.0',languages:['eng@1.0.0','kor@1.0.0'],source:'https://github.com/naptha/tesseract.js',files:[]};
for(const [source,name] of files){await copyFile(new URL(source,root),new URL(name,out));manifest.files.push({name,sha256:createHash('sha256').update(await readFile(new URL(name,out))).digest('hex')});}
await writeFile(new URL('manifest.json',out),JSON.stringify(manifest,null,2)+'\n');console.log(`Prepared ${files.length} local OCR assets`);
