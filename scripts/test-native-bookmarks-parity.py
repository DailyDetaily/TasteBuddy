"""Round-trip the web bookmark archive through the actual current Swift Codable structs."""
from pathlib import Path
import subprocess,tempfile
root=Path(__file__).resolve().parents[1]
bookmarks=(root/'ios/TasteBuddy/App/RestaurantBookmarks.swift').read_text()
account=(root/'ios/TasteBuddy/Data/Backend/NativeAccountDataRepository.swift').read_text()
models=(root/'ios/TasteBuddy/Models/TasteModels.swift').read_text()
icons=bookmarks[bookmarks.index('enum BookmarkCoverIconID:'):bookmarks.index('    var icon: LucideIconName')]+ '}\n'
taste=models[models.index('enum TasteAxis:'):models.index('    static func fromTasteName')]+'}\n'
swift='import Foundation\n'+icons+taste+bookmarks[bookmarks.index('struct RestaurantBookmarkList:'):bookmarks.index('struct RestaurantBookmarkState:')]+account[account.index('struct NativeAccountSnapshot:'):account.index('struct NativeAccountArchive:')]
swift+=r'''
let decoder=JSONDecoder(),encoder=JSONEncoder()
var snapshot=try decoder.decode(NativeAccountSnapshot.self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
let prefix="tastebuddy.ios."
let lists=try decoder.decode([RestaurantBookmarkList].self,from:snapshot.values[prefix+"restaurant-bookmark-lists.v1"]!)
let records=try decoder.decode([RestaurantBookmarkRecord].self,from:snapshot.values[prefix+"restaurant-bookmarks.v1"]!)
let pending=try decoder.decode([RestaurantBookmarkPendingMutation].self,from:snapshot.values[prefix+"restaurant-bookmark-pending-mutations.v1"]!)
precondition(lists[0].name=="기념일 후보" && lists[0].isPrivate && lists[0].coverIconID == .wine && lists[0].coverTasteID == .sour)
precondition(records.count==1 && records[0].restaurantID=="A" && records[0].listID==lists[0].id)
precondition(abs(records[0].savedAt.timeIntervalSince1970-1790046245.678)<0.001)
precondition(pending.map(\.kind)==[.createList,.saveBookmark,.saveBookmark,.removeBookmark])
snapshot.values[prefix+"restaurant-bookmark-lists.v1"]=try encoder.encode(lists)
snapshot.values[prefix+"restaurant-bookmarks.v1"]=try encoder.encode(records)
snapshot.values[prefix+"restaurant-bookmark-pending-mutations.v1"]=try encoder.encode(pending)
try encoder.encode(snapshot).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tb-bookmarks-swift-') as directory:
 work=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';const d=process.argv[2];await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeRecord.ts';export * from './src/lib/gastronomy/nativeBookmarks.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:path.join(d,'web.mjs'),logLevel:'silent'});const m=await import(path.join(d,'web.mjs')),now=new Date('2026-09-22T03:04:05.678Z');let {snapshot:s,list}=m.createNativeBookmarkList(m.blankSnapshot(),{name:' 기념일 후보 ',isPrivate:true,coverIconID:'wine',coverTasteID:'sour'},now);for(const id of ['A','B'])s=m.saveNativeBookmark(s,{restaurantID:id,restaurantName:'QA '+id,chefName:''},list.id,m.nativeBookmarkSignature(s,id),now);s=m.removeNativeBookmark(s,'B',m.nativeBookmarkSignature(s,'B'),now);await fs.writeFile(path.join(d,'input.json'),JSON.stringify(s));
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
 (work/'main.swift').write_text(swift)
 subprocess.run(['xcrun','swiftc',str(work/'main.swift'),'-o',str(work/'check')],check=True)
 subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'output.json')],check=True)
 node=r'''
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';const d=process.argv[2],m=await import(path.join(d,'web.mjs')),a=JSON.parse(await fs.readFile(path.join(d,'input.json'))),b=JSON.parse(await fs.readFile(path.join(d,'output.json')));assert.deepEqual(m.readNativeBookmarks(b),m.readNativeBookmarks(a));console.log('CURRENT_SWIFT_BOOKMARKS PASS (web -> Swift Codable -> web; lists, records, pending mutations and dates)');
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
