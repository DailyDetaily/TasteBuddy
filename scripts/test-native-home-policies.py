"""Compare web queue/history policy with the actual current Swift policy source.
Foundation execution on macOS; not an iOS interaction or production account test.
"""
from pathlib import Path
import subprocess,json,tempfile
root=Path(__file__).resolve().parents[1];native=root/'ios/TasteBuddy'
home=(native/'Features/Home/HomeDiscoveryModels.swift').read_text();app=(native/'App/AppModel.swift').read_text();selection=(native/'Domain/Models/DiningSensorySelection.swift').read_text()
policy=home[home.index('enum HomeDiscoveryPresentationPolicy'):home.index('/// 현재 직접 응답만')]
stack=home[home.index('enum HomeJournalStackItem:'):]
progress=app[app.index('struct PersonalTasteQuestionProgressStatus:'):app.index('struct PersonalTasteQuestionResponseContext:')]
protocol=selection[selection.index('protocol DiningSelectionStringValue:'):selection.index('struct DiningSensoryCatalogContract:')]
question_policy=(native/'Domain/Models/PersonalTasteQuestionInstance.swift').read_text().split('struct PersonalTasteQuestionPresentationPolicy')[1]
question_policy='struct PersonalTasteQuestionPresentationPolicy'+question_policy
present=app[app.index('    func shouldPresentPersonalTasteQuestion('):app.index('    func recordPersonalTasteQuestionExposure(')]
swift='''import Foundation
struct HomeDiscoveryCard: Codable, Equatable {
 enum Kind: String, Codable { case timeGap,lastYear,restaurantCollection,repeatedGoodEvaluation }
 let id:String;let revisionKey:String;let meaningKey:String;let subjectID:String;let kind:Kind;let relevance:Int;let sortDate:Date
 var semanticKey:String {meaningKey.isEmpty ? id : meaningKey}
}
struct PersonalTasteNextSelection: Codable {let id:String}
'''+policy+stack+protocol+progress+question_policy+'''\nfinal class ProgressHarness {
 var personalTasteQuestionProgressByUser:[String:[String:PersonalTasteQuestionProgress]]=[:]
 var questionPresentationPolicy=PersonalTasteQuestionPresentationPolicy()
 var now:()->Date={Date()}
'''+present+'''\n}
struct Fixture: Decodable {let id:String;let now:Double;let cards:[HomeDiscoveryCard];let history:[String:Double];let action:String?;let questions:[PersonalTasteNextSelection];let progressData:String}
let decoder=JSONDecoder();decoder.dateDecodingStrategy = .millisecondsSince1970
let fixtures=try decoder.decode([Fixture].self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
var output:[[String:Any]]=[]
for f in fixtures {
 let now=Date(timeIntervalSince1970:f.now/1000)
 var history=f.history.mapValues{Date(timeIntervalSince1970:$0/1000)}
 if let action=f.action,let card=f.cards.first {history=action == "read" ? HomeDiscoveryPresentationPolicy.recordingRead(card,in:history,at:now) : HomeDiscoveryPresentationPolicy.snoozing(card,in:history,at:now)}
 let visible=HomeDiscoveryPresentationPolicy.visible(f.cards,hiddenUntil:history,referenceDate:now)
 let merged=HomeJournalStackItem.merged(questions:f.questions,discoveries:visible)
 let progress=ProgressHarness();progress.now={now};progress.personalTasteQuestionProgressByUser=try JSONDecoder().decode([String:[String:PersonalTasteQuestionProgress]].self,from:Data(f.progressData.utf8))
 let states=Dictionary(uniqueKeysWithValues:(progress.personalTasteQuestionProgressByUser["local-owner"] ?? [:]).keys.sorted().map {($0,progress.shouldPresentPersonalTasteQuestion(id:$0,userID:"local-owner"))})
 output.append(["id":f.id,"history":history.mapValues{$0.timeIntervalSince1970*1000},"visible":visible.map(\\.id),"merged":merged.map(\\.id),"collapsed":HomeJournalStackItem.preview(merged,limit:1).map(\\.id),"expanded":HomeJournalStackItem.preview(merged,limit:3).map(\\.id),"states":states])
}
try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tastebuddy-home-policy-') as directory:
 work=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';const dir=process.argv[2];
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeJournalPolicy.ts';export {swiftTime} from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'web.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(dir,'web.mjs'));const start=new Date('2026-09-22T03:00:00Z'),day=86400000;
const card=(id,subject,kind,relevance)=>({id,subjectID:subject,kind,relevance,revisionKey:'revision:'+id,meaningKey:'meaning:'+id,sortDate:+start});
const cards=[card('a','one','timeGap',80),card('b','one','lastYear',70),card('c','two','timeGap',60),card('d','three','restaurantCollection',50)];
const rows=Object.fromEntries(['active','dismissed','deferred','cannotRecall','resolved','future'].map(status=>[status,{questionID:status,firstExposedAt:m.swiftTime(start),status,statusChangedAt:m.swiftTime(start),suppressedUntil:m.swiftTime(start)+86400}]));
const questions=[{id:'q1'},{id:'q2'},{id:'q3'},{id:'q4'}],base={cards,history:{},questions,progressData:JSON.stringify({'local-owner':rows})};
const read=m.updateDiscoveryHistory({},cards[0],'read',start),snooze=m.updateDiscoveryHistory({},cards[0],'snooze',start);
const cases=[{id:'empty',...base,cards:[],questions:[],now:+start},{id:'diverse',...base,now:+start},{id:'read',...base,action:'read',now:+start},{id:'snooze',...base,action:'snooze',now:+start},{id:'subject-before',...base,history:read,now:+start+day-1},{id:'subject-after',...base,history:read,now:+start+day},{id:'snooze-before',...base,history:snooze,cards:cards.map(c=>({...c,revisionKey:'new:'+c.id,meaningKey:'new:'+c.id})),now:+start+7*day-1},{id:'snooze-after',...base,history:snooze,now:+start+7*day}];
const expected=cases.map(f=>{const now=new Date(f.now),history=f.action?m.updateDiscoveryHistory(f.history,f.cards[0],f.action,now):f.history,visible=m.visibleDiscoveries(f.cards,history,now),merged=m.mergeJournal(f.questions,visible);return {id:f.id,history,visible:visible.map(c=>c.id),merged:merged.map(i=>i.id),collapsed:m.previewJournal(merged,1).map(i=>i.id),expanded:m.previewJournal(merged,3).map(i=>i.id),states:Object.fromEntries(Object.entries(rows).map(([id,p])=>[id,m.shouldPresentQuestion(p,now)]))};});
await fs.writeFile(path.join(dir,'input.json'),JSON.stringify(cases));await fs.writeFile(path.join(dir,'expected.json'),JSON.stringify(expected));
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
 (work/'main.swift').write_text(swift);subprocess.run(['xcrun','swiftc',str(work/'main.swift'),'-o',str(work/'check')],check=True)
 subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'actual.json')],check=True)
 expected=json.loads((work/'expected.json').read_text());actual=json.loads((work/'actual.json').read_text())
 for e,a in zip(expected,actual):assert e==a,f"Native policy mismatch: {e['id']}\n{e}\n{a}"
 print(f'CURRENT_SWIFT_HOME_POLICY {len(expected)} scenarios PASS (ranking, read/snooze, merge, preview, question visibility)')
