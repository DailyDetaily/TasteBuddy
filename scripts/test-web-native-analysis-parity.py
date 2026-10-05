"""Compare browser model + individual question queue against current Foundation Swift sources.
This executes real model code on macOS, not the iOS app or account backup.
"""
from pathlib import Path
import json, subprocess, tempfile
root=Path(__file__).resolve().parents[1]
native=root/'ios/TasteBuddy/Domain/Models'
models=(native/'SensoryAnalysisModels.swift').read_text()
# Retain actual value/span/evidence and selection identity code; scopeKey needs UI observation models.
swift=models[:models.index('    static func scopeKey(')]+'}\n'
selection=(native/'DiningSensorySelection.swift').read_text()
swift+=selection[selection.index('indirect enum DiningSelectionJSON:'):selection.index('/// 미래 enum값')]
for name in ['PersonalTasteModel.swift','PersonalTasteInsights.swift','PersonalTasteQuestions.swift','PersonalTasteQuestionInstance.swift']:
    swift+=(native/name).read_text()+'\n'
engine=(root/'ios/TasteBuddy/Domain/UseCases/SensoryAnalysisEngine.swift').read_text()
identity=engine[engine.index('    private static func evidenceIdentity'):engine.index('    private static func evidenceText')]
identifier=engine[engine.index('    private static func stableID'):engine.index('    private static func dedupe')]
swift+='enum SourceIdentity {\n'+identity.replace('private static','static')+identifier.replace('private static','static')+'}\n'
swift+=r'''
struct Case: Decodable {let id:String;let owner:String;let records:[PersonalTasteModelRecord];let options:[String:[String:[String]]]}
let cases=try JSONDecoder().decode([Case].self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
let encoder=JSONEncoder();encoder.outputFormatting=[.sortedKeys,.withoutEscapingSlashes]
var output:[[String:Any]]=[]
for item in cases {
 for record in item.records {
  let originalID=record.experienceId.uppercased()
  let field=record.selectionEvidence?.type == "overallEvaluation" ? "overallEvaluation:liking" : record.selectionEvidence.map { "sensorySelections:\($0.type):\($0.selectionID):\($0.facet)" } ?? "note"
  let id=SourceIdentity.stableID([originalID,field,record.kind,record.attribute ?? "",record.value.text,record.target,record.phase,record.phrase,String(record.sourceSpans.first?.start ?? 0),SourceIdentity.evidenceIdentity(record.selectionEvidence)])
  precondition(id==record.observationId,"Native observation identity mismatch")
 }
 let model=PersonalTasteModelBuilder.buildRecords(records:item.records,userID:item.owner,individualQuestions:true,nativeAnswerOptions:{record,facet in item.options[record.observationId]?[facet] ?? []})
 var value=try JSONSerialization.jsonObject(with:encoder.encode(model)) as! [String:Any]
 value["queuedSelections"]=try JSONSerialization.jsonObject(with:encoder.encode(model.queuedSelections))
 output.append(["id":item.id,"model":value])
}
try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tastebuddy-web-analysis-parity-') as tmp:
    work=Path(tmp)
    node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';
const dir=process.argv[2];
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeQuestions.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'web.mjs'),bundle:true,platform:'browser',format:'esm',logLevel:'silent'});
const {nativeAnalysisSources,buildNativeAnalysis,nativeQuestionChoices,newNativeRecord,makeSelection,prepareNativeRecord,overallEvaluation}=await import(path.join(dir,'web.mjs'));
const now=new Date('2026-09-22T01:00:00Z'),owner='parity-owner';
const entry=(choices,note='')=>prepareNativeRecord({...newNativeRecord(undefined,now),menu:'비교 국수',sensorySelections:choices,note,overallEvaluation:overallEvaluation('liked')},undefined,now);
const choice=(extra={})=>({...makeSelection('sour-fresh','bubble'),...extra});
const cases=[['empty',[]],['two-originals',[entry([choice()]),entry([choice()])]],['mixed',[...['liked','liked','liked','disliked'].map(liking=>entry([choice({liking})]))]],['conditions',[...['medium','medium','medium','strong','strong','strong'].map(intensity=>entry([choice({liking:'liked',intensity,preferenceFit:intensity==='medium'?'justRight':'tooStrong',target:'broth'})]))]],['unresolved',[entry([{...makeSelection('sweet-fruit-soft','bubble'),intensity:'strong'}])]],['free-text',[entry([],'산미가 강하고 좋았어요. 겉은 바삭했어요.'),entry([choice()])]],['assessment-limit',Array.from({length:20},()=>entry([choice({liking:'liked'})]))]];
const v2=(id,extra={})=>({...makeSelection('v2.bubble.sour.basic','bubble'),selectionInstanceID:id,...extra});
cases.push(['v2-question-impact',[0,1,2].map(i=>entry([v2(`instance-${i}`,{liking:'liked',...(i<2?{intensity:'light'}:{}),target:'whole_dish',phase:'during_meal'})]))]);
cases.push(['neutral-count',['liked','liked','liked','neutral'].map(liking=>entry([choice({liking})]))]);
const input=[],expected=[];
for(const [id,entries] of cases){const {observations}=nativeAnalysisSources(entries,owner);const options=Object.fromEntries(observations.map(r=>[r.observationId,Object.fromEntries(['liking','intensity','target','phase'].map(facet=>[facet,nativeQuestionChoices(entries.find(e=>e.id.toLowerCase()===r.experienceId),r,facet).map(c=>({liked:'positive',disliked:'negative',light:'weak'}[c.id]??c.id))]))]));input.push({id,owner,records:observations,options});expected.push({id,model:buildNativeAnalysis(entries,owner).model});}
await fs.writeFile(path.join(dir,'input.json'),JSON.stringify(input));await fs.writeFile(path.join(dir,'expected.json'),JSON.stringify(expected));
'''
    # Resolve esbuild from the project rather than the temporary directory.
    subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,check=True)
    (work/'main.swift').write_text(swift)
    subprocess.run(['xcrun','swiftc','-Onone',str(work/'main.swift'),'-o',str(work/'check')],check=True)
    subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'actual.json')],check=True)
    def omit_null(value):
        if isinstance(value,dict): return {k:omit_null(v) for k,v in value.items() if v is not None}
        if isinstance(value,list): return [omit_null(v) for v in value]
        return value
    expected=json.loads((work/'expected.json').read_text()); actual=json.loads((work/'actual.json').read_text())
    for e,a in zip(expected,actual):
        if omit_null(e)!=omit_null(a):
            out=root/'output/qa/web-native-analysis-20260922';out.mkdir(parents=True,exist_ok=True)
            (out/'parity-mismatch.json').write_text(json.dumps({'expected':e,'actual':a},ensure_ascii=False,indent=2))
            raise AssertionError('Swift/browser mismatch: '+e['id'])
    print(f'CURRENT_SWIFT_BROWSER_PARITY {len(expected)} cases PASS (model, IDs, queue, safe-option ranking, impact)')
