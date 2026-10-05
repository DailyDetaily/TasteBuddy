from pathlib import Path
import subprocess,tempfile
root=Path(__file__).resolve().parents[1]
model=(root/'ios/TasteBuddy/Domain/Models/PreferenceIntakeContractModels.swift').read_text()
account=(root/'ios/TasteBuddy/Data/Backend/NativeAccountDataRepository.swift').read_text()
swift=model[:model.index('struct PreferenceIntakeEvidenceRecord:')]+account[account.index('struct NativeAccountSnapshot:'):account.index('struct NativeAccountArchive:')]+r'''
let decoder=JSONDecoder(),encoder=JSONEncoder()
var s=try decoder.decode(NativeAccountSnapshot.self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
let key="tastebuddy.ios.preference-profile.v1"
let p=try decoder.decode(PreferenceIntakeProfileContract.self,from:s.values[key]!)
precondition(p.submissions!.count==1 && p.submissions![0].userID=="local-owner")
precondition(p.submissions![0].responses.count==7 && p.submissions![0].source.platform=="web")
s.values[key]=try encoder.encode(p)
try encoder.encode(s).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tb-preferences-swift-') as directory:
 d=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';const d=process.argv[2];await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativePreferences.ts';export * from './src/lib/preferenceIntakeEvidence.mjs';export * from './src/constants/preferenceIntakeData.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:path.join(d,'web.mjs'),logLevel:'silent'});const m=await import(path.join(d,'web.mjs')),s=m.blankSnapshot(),a=Object.fromEntries(m.PREFERENCE_INTAKE_QUESTIONS.map(q=>[q.id,q.selectionMode==='single'?q.options[0].id:[q.noneOptionId??q.options[0].id]]));const p={...m.buildPreferenceIntakeProfile(a),submissions:[m.createPreferenceIntakeSubmission(a)]};await fs.writeFile(path.join(d,'input.json'),JSON.stringify(m.updateNativePreferences(s,p,m.preferenceSignature(s),true)));
'''
 subprocess.run(['node','--input-type=module','-',str(d)],input=node,text=True,cwd=root,check=True)
 (d/'main.swift').write_text(swift);subprocess.run(['xcrun','swiftc',str(d/'main.swift'),'-o',str(d/'check')],check=True);subprocess.run([str(d/'check'),str(d/'input.json'),str(d/'output.json')],check=True)
 node=r'''
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';const d=process.argv[2],m=await import(path.join(d,'web.mjs'));const before=m.readNativePreferences(JSON.parse(await fs.readFile(path.join(d,'input.json')))).profile,after=m.readNativePreferences(JSON.parse(await fs.readFile(path.join(d,'output.json')))).profile;assert.deepEqual(after,before);console.log('SWIFT_PREFERENCE_CODABLE_ROUNDTRIP PASS');
'''
 subprocess.run(['node','--input-type=module','-',str(d)],input=node,text=True,cwd=root,check=True)
