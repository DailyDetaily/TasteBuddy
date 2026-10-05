"""Read web profile snapshots with current Swift Codable types; re-encode to web."""
from pathlib import Path
import subprocess,json,tempfile
root=Path(__file__).resolve().parents[1];native=root/'ios/TasteBuddy'
app=(native/'App/AppModel.swift').read_text();account=(native/'Data/Backend/NativeAccountDataRepository.swift').read_text()
swift='import Foundation\n'+app[app.index('struct UserProfileIdentity:'):app.index('struct PersonalTasteQuestionProgressStatus:')]+account[account.index('struct NativeAccountSnapshot:'):account.index('struct NativeAccountArchive:')]
swift+=r'''
let decoder=JSONDecoder(),encoder=JSONEncoder()
let snapshot=try decoder.decode(NativeAccountSnapshot.self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
let identity=try decoder.decode(UserProfileIdentity.self,from:snapshot.values["tastebuddy.ios.profile-identity.v1"]!)
precondition(identity.displayName=="QA 이름" && identity.nickname=="qa-buddy")
precondition(identity.birthDate=="1990-02-28" && identity.dietaryRestrictions==["vegan"])
let bytes=snapshot.values["tastebuddy.ios.profile-avatar-image-data.v1"]!
precondition(Array(bytes.prefix(4)) == [137,80,78,71])
var next=snapshot;next.values["tastebuddy.ios.profile-identity.v1"]=try encoder.encode(identity)
try encoder.encode(next).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tb-profile-backup-swift-') as directory:
 work=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';const dir=process.argv[2];await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativeProfileIdentity.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:path.join(dir,'web.mjs'),logLevel:'silent'});const m=await import(path.join(dir,'web.mjs'));const s=m.blankSnapshot();const result=m.updateNativeProfileIdentity(s,{displayName:'QA 이름',nickname:'@qa-buddy',birthDate:'1990-02-28',sexContext:'prefer_not_to_say',smokingStatus:'never',dietaryRestrictions:['vegan']},m.profileSignature(s),'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=');await fs.writeFile(path.join(dir,'input.json'),JSON.stringify(result));
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
 (work/'main.swift').write_text(swift);subprocess.run(['xcrun','swiftc',str(work/'main.swift'),'-o',str(work/'check')],check=True);subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'output.json')],check=True)
 node=r'''
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';const d=process.argv[2],m=await import(path.join(d,'web.mjs')),before=JSON.parse(await fs.readFile(path.join(d,'input.json'))),after=JSON.parse(await fs.readFile(path.join(d,'output.json')));assert.deepEqual(m.readNativeProfileIdentity(after).identity,m.readNativeProfileIdentity(before).identity);assert.equal(after.values[m.PROFILE_AVATAR_KEY],before.values[m.PROFILE_AVATAR_KEY]);console.log('CURRENT_SWIFT_PROFILE_BACKUP PASS (web -> Swift Codable -> web, identity and raw avatar Data)');
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
