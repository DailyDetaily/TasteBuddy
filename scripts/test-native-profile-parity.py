"""Foundation execution of the current sensory-insight and profile summary rules."""
from pathlib import Path
import subprocess,tempfile,json
root=Path(__file__).resolve().parents[1];native=root/'ios/TasteBuddy'
models=(native/'Domain/Models/SensoryAnalysisModels.swift').read_text()
engine=(native/'Domain/UseCases/SensoryAnalysisEngine.swift').read_text()
shell=(native/'Components/Shell/AppShellView.swift').read_text()
rules=engine[engine.index('    private static func evidenceText('):engine.index('    private static func buildProfile(')].replace('private static','static')
source_count=engine.split('sourceExperienceCount: ')[1].split(', actualApiCalls:')[0]
summary=shell[shell.index('    private func profileSummaryLabel('):shell.index('    private func close()',shell.index('    private func profileSummaryLabel('))].replace('private func','func')
swift='import CryptoKit\n'+models[:models.index('struct SensoryAnalysisSnapshot:')]+ '\nenum Rules {\n'+rules+'}\n'
swift+=r'''
struct UserProfileIdentity:Decodable {let birthDate:String?;let sexContext:String?;let smokingStatus:String?;let dietaryRestrictions:[String]}
'''+summary+r'''
struct Row:Decodable {let observationId:String;let experienceId:String;let mealId:String;let foodName:String;let sourceField:String;let kind:String;let attribute:String?;let attributeLabel:String;let reference:String?;let value:SensoryValue;let scale:String;let target:String;let phase:String;let phrase:String;let selectionEvidence:SensorySelectionEvidence?;let sourceSpans:[SensorySourceSpan]}
struct Case:Decodable {let id:String;let rows:[Row];let context:UserProfileIdentity}
let cases=try JSONDecoder().decode([Case].self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
let output=cases.map {c -> [String:Any] in
 let observations=c.rows.map {r in SensoryObservation(id:r.observationId,experienceID:UUID(uuidString:r.experienceId)!,foodName:r.foodName,recordedAt:Date(),sourceField:r.sourceField,kind:r.kind,attribute:r.attribute,attributeLabel:r.attributeLabel,value:r.value,scale:r.scale,target:r.target,phase:r.phase,phrase:r.phrase,sourceSpans:r.sourceSpans,reference:r.reference,combinationComponents:[],selectionEvidence:r.selectionEvidence,mealID:UUID(uuidString:r.mealId))}
 let sourceCount='''+source_count+r'''
 return ["id":c.id,"sourceExperienceCount":sourceCount,"insightIDs":Rules.buildInsights(observations).map{$0.id}.sorted(),"summary":profileSummaryLabel(identity:c.context)]
}
try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tb-profile-parity-') as directory:
 work=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';const dir=process.argv[2];
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeProfile.ts';export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeSensoryInsights.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:path.join(dir,'web.mjs'),logLevel:'silent'});
const m=await import(path.join(dir,'web.mjs')),now=new Date('2026-09-22T03:00:00Z');
const choice=(x={})=>({...m.makeSelection('sour-fresh','bubble'),...x});const entry=(sensorySelections=[],note='')=>m.prepareNativeRecord({...m.newNativeRecord(undefined,now),menu:'검증 국수',sensorySelections,note},undefined,now);
const cases=[['empty',[]],['presence',[entry([choice()])]],['fit',[entry([choice({preferenceFit:'justRight'})])]],['mixed',['liked','disliked'].map(liking=>entry([choice({liking})]))],['intensity',[entry([choice({intensity:'strong',liking:'liked'})])]],['phase',[entry([choice({phase:'first_bite',liking:'liked'}),{...m.makeSelection('sour-clean-finish','bubble'),phase:'after_swallow',liking:'disliked'}])]],['unresolved',[entry([{...m.makeSelection('sweet-fruit-soft','bubble'),intensity:'strong'}])]],['note',[entry([],'산미가 좋았어요. 겉은 바삭했어요.')]]];
const input=[],expected=[];for(const [id,entries] of cases){const snapshot=m.buildNativeAnalysis(entries,'local-owner'),context={birthDate:id==='empty'?null:'1990-01-01',sexContext:null,smokingStatus:null,dietaryRestrictions:id==='empty'?[]:['a']};input.push({id,rows:snapshot.observations,context});expected.push({id,sourceExperienceCount:m.nativeProfileActivity(snapshot).sourceExperienceCount,insightIDs:m.nativeSensoryInsights(snapshot.observations).map(i=>i.id).sort(),summary:m.nativeProfileSummary(context,context.dietaryRestrictions)});}
await fs.writeFile(path.join(dir,'input.json'),JSON.stringify(input));await fs.writeFile(path.join(dir,'expected.json'),JSON.stringify(expected));
'''
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
 (work/'main.swift').write_text(swift);subprocess.run(['xcrun','swiftc',str(work/'main.swift'),'-o',str(work/'check')],check=True)
 subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'actual.json')],check=True)
 expected=json.loads((work/'expected.json').read_text());actual=json.loads((work/'actual.json').read_text())
 for e,a in zip(expected,actual):assert e==a,f'Profile parity mismatch: {e} != {a}'
 print(f'CURRENT_SWIFT_PROFILE {len(expected)} cases PASS (source count, insight IDs, summary)')
