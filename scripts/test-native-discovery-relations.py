"""Execute current Foundation Swift discovery builders against browser fixtures.
Uses real PersonalTasteModel, HomeDiscoveryRelations.Builder/Votes/proof and TDDataEngine.
DTO setup replaces iOS persistence/parser/UI; this is not an iOS restore or UI test.
"""
from pathlib import Path
import json, os, subprocess, tempfile
root=Path(__file__).resolve().parents[1]; native=root/'ios/TasteBuddy'
home=(native/'Features/Home/HomeDiscoveryModels.swift').read_text()
relations=home[home.index('private enum HomeDiscoveryRelations'):home.index('\nenum HomeJournalStackItem:')]
relations=relations[:relations.index('        init(sources:')]+relations[relations.index('        func context(_ unit:'):]
relations=relations[:relations.index('    static func cards(sources:')]+'}\n'
models=(native/'Domain/Models/SensoryAnalysisModels.swift').read_text()
swift=models[:models.index('    static func scopeKey(')]+'}\n'
for name in ['PersonalTasteModel.swift','PersonalTasteInsights.swift','PersonalTasteQuestions.swift','PersonalTasteQuestionInstance.swift']:
 swift+=(native/'Domain/Models'/name).read_text()+'\n'
swift+=(native/'Features/Gastronomy/TasteDataModels.swift').read_text()
swift+=home[:home.index('enum HomeDiscoveryEngine')]
swift+='enum HomeDiscoveryEngine {static let version="home-discovery/2"}\n'
swift+=(native/'Features/Gastronomy/TasteDataEngine.swift').read_text()
discoveries=(native/'Features/Gastronomy/TasteDataDiscoveries.swift').read_text()
swift+=discoveries[discoveries.index('extension HomeDiscoveryCard {'):discoveries.index('extension HomeDiscoveryPresentationPolicy')]
swift+=r'''
struct DiningEntry: Decodable {
 let id:UUID;let mealID:UUID;let menu:String;let restaurant:String;let restaurantID:String?;let menuItemID:String?
 let date:Date;let observedAt:Date;let memoryRevision:Int?;let reflectionPhotoFilename:String?;let mealTime:MealTime?;let foodSource:FoodSource?
 struct MealTime:Decodable {let source:String;let start:Date?;let confirmedAt:Date?}
 struct FoodSource:Decodable {let kind:String;let restaurantNamespace:String?;let homeCookingID:String?}
 var memoryRevisionNumber:Int {memoryRevision ?? 0}
 var confirmedMealDate:Date? {mealTime?.source == "user_confirmed" ? mealTime?.start : nil}
}
enum HomeArchiveIdentity {static func hasMenu(_ e:DiningEntry)->Bool {!e.menu.isEmpty}}
struct TDNativeInput {let entries:[DiningEntry]}
enum DiningSensorySelection {
 struct Target {let rawValue:String;var label:String {["broth":"국물","whole_dish":"음식 전체"][rawValue] ?? rawValue}}
 struct Phase {let rawValue:String;var label:String {["during_meal":"먹는 중"][rawValue] ?? rawValue}}
}
'''+relations+r'''
struct Fixture:Decodable {
 let id:String;let entries:[DiningEntry];let records:[PersonalTasteModelRecord];let now:Double;let period:String;let source:String
}
let fixtures=try JSONDecoder().decode([Fixture].self,from:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1])))
var calendar=Calendar(identifier:.gregorian);calendar.timeZone=TimeZone(identifier:"Asia/Seoul")!
var output:[[String:Any]]=[]
for f in fixtures {
 let now=Date(timeIntervalSince1970:f.now/1000)
 let today=calendar.startOfDay(for:now)
 let window:TDWindow
 switch f.period {
 case "thirty":window = .recent(30,now:now,calendar:calendar)
 case "ninety":window = .recent(90,now:now,calendar:calendar)
 case "month":window = .init(label:"이번 달",start:calendar.date(from:calendar.dateComponents([.year,.month],from:today)),end:calendar.date(byAdding:.day,value:1,to:today))
 default:window = .all
 }
 func clean(_ s:String?)->String {(s ?? "").trimmingCharacters(in:.whitespacesAndNewlines).precomposedStringWithCanonicalMapping}
 func menu(_ e:DiningEntry)->TDIdentity? {
  if e.foodSource?.kind == "homeCooked" {return clean(e.foodSource?.homeCookingID).isEmpty ? nil : .init(id:TDDataEngine.key(["homeCooked",clean(e.foodSource?.homeCookingID)]),label:e.menu)}
  guard !clean(e.restaurantID).isEmpty,!clean(e.menu).isEmpty else {return nil}
  let restaurant=TDDataEngine.key([clean(e.foodSource?.restaurantNamespace).isEmpty ? "tastebuddy.restaurant" : clean(e.foodSource?.restaurantNamespace),clean(e.restaurantID)])
  let token=clean(e.menuItemID).isEmpty ? TDDataEngine.key(["name",clean(e.menu)]) : TDDataEngine.key(["id",clean(e.menuItemID)])
  return .init(id:TDDataEngine.key([restaurant,token]),label:e.menu+" · "+e.restaurant)
 }
 let originals=f.entries.map {e in TDRecord(id:e.id.uuidString,mealID:e.mealID.uuidString,date:e.confirmedMealDate,menu:menu(e),restaurant:nil,foodKinds:[],source:e.foodSource?.kind == "restaurant" ? .restaurant : e.foodSource?.kind == "homeCooked" ? .homeCooked : .unknown,revision:e.memoryRevisionNumber)}
 func selection(_ e:SensorySelectionEvidence)->String {TDDataEngine.key([e.type,e.selectionID,e.catalogVersion,e.relatedBubbleID ?? ""])}
 var observations=f.records.compactMap {r -> TDObservation? in
  guard let facet=TDFacet.allCases.first(where:{$0.kind==r.kind}),let e=r.selectionEvidence else {return nil}
  return .init(id:r.observationId,entryID:r.experienceId.uppercased(),facet:facet,attribute:r.attribute ?? "",label:PersonalTasteModelBuilder.label(r),value:facet == .presence ? "present" : r.value.text,target:r.target,phase:r.phase,selection:selection(e),reference:r.reference,scale:r.scale,catalogVersion:e.catalogVersion)
 }
 // Populate parents with the current native adapter's exact sensory/selection scope.
 let nativeByID=Dictionary(uniqueKeysWithValues:f.records.map{($0.observationId,$0)})
 let parents=Dictionary(grouping:observations.filter{$0.facet == .presence && nativeByID[$0.id]?.selectionEvidence?.type == "bubble"}) {row in
  let e=nativeByID[row.id]!.selectionEvidence!
  return TDDataEngine.key([row.entryID,e.selectionID,e.catalogVersion,row.senseKey,row.target,row.phase])
 }
 for index in observations.indices {
  let row=observations[index]
  guard let e=nativeByID[row.id]?.selectionEvidence,let parentID=e.relatedBubbleID else {continue}
  let key=TDDataEngine.key([row.entryID,parentID,e.catalogVersion,row.senseKey,row.target,row.phase])
  let choices=Set((parents[key] ?? []).map(\.selection));if choices.count == 1 {observations[index].parentSelection=choices.first}
 }
 let filter:TDSourceFilter = f.source == "restaurant" ? .restaurant : f.source == "homeCooked" ? .homeCooked : .all
 let state=TDDataEngine.prepare(records:originals,observations:observations,window:window,now:now,calendar:calendar,sourceFilter:filter)
 let index=TDDataEngine.intensityIndex(state.observations)
 let links=Dictionary(uniqueKeysWithValues:state.observations.filter{$0.facet == .liking || $0.facet == .fit}.map{($0.id,Set(TDDataEngine.linkedIntensity($0,index:index,issues:state.issues).map(\.id)))})
 func evidence(selected:Bool)->HomeDiscoveryRelations.Evidence {
  let selectedRows=selected ? state.selected : state.records
  let ids=Set(selectedRows.map(\.id))
  let entries=f.entries.filter{ids.contains($0.id.uuidString)}.sorted{$0.observedAt == $1.observedAt ? $0.id.uuidString < $1.id.uuidString : $0.observedAt > $1.observedAt}
  let records=f.records.filter{ids.contains($0.experienceId.uppercased())}.sorted{$0.observationId < $1.observationId}
  let units=PersonalTasteModelBuilder.buildRecords(records:records,userID:"home-discovery-owner",assessQuestions:false,validatedIntensityLinks:links).units
  let menus=Dictionary(grouping:entries.filter{menu($0) != nil}){menu($0)!.id}
  let dates=Dictionary(grouping:selectedRows,by:{$0.mealID.lowercased()}).compactMapValues{$0.first?.date}
  let overall=Dictionary(grouping:records.filter{$0.kind == "overall_liking"},by: \.experienceId).compactMapValues {rs in Set(rs.map{$0.value.text}).count == 1 ? rs.first : nil}
  return .init(entries:entries,byID:Dictionary(uniqueKeysWithValues:entries.map{($0.id.uuidString.lowercased(),$0)}),menus:menus,menuKeyByEntry:Dictionary(uniqueKeysWithValues:entries.compactMap{e in menu(e).map{(e.id.uuidString.lowercased(),$0.id)}}),dates:dates,records:records,recordsByID:Dictionary(uniqueKeysWithValues:records.map{($0.observationId,$0)}),units:units,overall:overall,referenceDate:now,calendar:calendar,today:today,comparisonWindow:selected || window.isAll ? nil : window,validatedIntensityLinks:links)
 }
 func candidates(_ selected:Bool)->[HomeDiscoveryCard] {
  var builder=HomeDiscoveryRelations.Builder(evidence:evidence(selected:selected))
  builder.sensoryRelations();builder.fitRelations();builder.overallRelations();builder.revisitRelations();builder.periodRelations()
  return builder.candidates
 }
 let temporal:Set<HomeDiscoveryCard.Kind>=[.patternException,.familiarTasteInNewMenu,.revisitComparison,.periodChange]
 var cards=candidates(false).filter{temporal.contains($0.kind) || (window.isAll && filter == .all)}.filter {c in
  if c.kind != .periodChange {return true}
  let ratings=state.observations.filter{c.evidenceIDs.contains($0.id) && $0.facet == .liking}
  return !ratings.isEmpty && ratings.allSatisfy{$0.target != "unspecified" && $0.phase != "unspecified" && !TDDataEngine.linkedIntensity($0,index:index,issues:state.issues).isEmpty}
 }
 if !window.isAll || filter != .all {cards += candidates(true).filter{!temporal.contains($0.kind)}.map{$0.scopedCopy(.selectedPeriod(window),source:filter)}}
 var td=TDDiscoveryBuilder(state:state,input:.init(entries:f.entries),calendar:calendar);td.periodRelations();cards += td.cards
 let mapped:[[String:Any]]=cards.sorted{$0.id < $1.id}.map {c in
  let proof=c.evidenceBundle ?? .init()
  return ["id":c.id,"kind":c.kind.rawValue,"meaningKey":c.meaningKey,"subjectID":c.subjectID,"title":c.title,"detail":c.detail,"relevance":c.relevance,
   "entryIDs":c.entryIDs.map(\.uuidString).sorted(),"evidenceIDs":c.evidenceIDs.sorted(),"numeratorIDs":(proof.roles[.numerator]?.entryIDs ?? []).sorted(),"denominatorIDs":(proof.roles[.denominator]?.entryIDs ?? []).sorted(),
   "numeratorObservations":(proof.roles[.numerator]?.observationIDs ?? []).sorted(),"denominatorObservations":(proof.roles[.denominator]?.observationIDs ?? []).sorted()]
 }
 output.append(["id":f.id,"cards":mapped])
}
try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]).write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
'''
with tempfile.TemporaryDirectory(prefix='tastebuddy-discovery-parity-') as directory:
 work=Path(directory)
 node=r'''
import {build} from 'esbuild';import fs from 'node:fs/promises';import path from 'node:path';import {discoveryFixtures} from './scripts/fixtures/web-native-discovery-cases.mjs';const dir=process.argv[2];
await build({stdin:{contents:"export * from './src/lib/gastronomy/nativeHomeDiscoveries.ts';export * from './src/lib/gastronomy/nativeAnalysis.ts';export * from './src/lib/gastronomy/nativeRecord.ts';",resolveDir:process.cwd()},outfile:path.join(dir,'module.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const m=await import(path.join(dir,'module.mjs')),{cases}=discoveryFixtures(m),input=[],expected=[];
for(const f of cases){const snapshot=m.buildNativeAnalysis(f.entries,'home-discovery-owner');input.push({id:f.id,entries:f.entries,records:snapshot.observations.filter(r=>r.selectionEvidence),now:+f.now,period:f.options.period??'all',source:f.options.source??'all'});
const cards=m.buildNativeHomeDiscoveries(f.entries,snapshot,f.now,f.options).filter(c=>c.evidenceGroups).map(c=>({id:c.id,kind:c.kind,meaningKey:c.meaningKey,subjectID:c.subjectID,title:c.title,detail:c.detail,relevance:c.relevance,entryIDs:c.entryIDs,evidenceIDs:c.evidenceIDs,numeratorIDs:c.numeratorIDs,denominatorIDs:c.denominatorIDs,numeratorObservations:c.evidenceGroups.find(g=>g.label==='해당 근거').observationIDs,denominatorObservations:c.evidenceGroups.find(g=>g.label==='기준 표본').observationIDs})).sort((a,b)=>a.id<b.id?-1:1);expected.push({id:f.id,cards});}
await fs.writeFile(path.join(dir,'input.json'),JSON.stringify(input));await fs.writeFile(path.join(dir,'expected.json'),JSON.stringify(expected));
'''
 env={**os.environ,'TZ':'Asia/Seoul'}
 subprocess.run(['node','--input-type=module','-',str(work)],input=node,text=True,cwd=root,env=env,check=True)
 (work/'main.swift').write_text(swift)
 subprocess.run(['xcrun','swiftc','-Onone',str(work/'main.swift'),'-o',str(work/'check')],check=True)
 subprocess.run([str(work/'check'),str(work/'input.json'),str(work/'actual.json')],check=True)
 expected=json.loads((work/'expected.json').read_text());actual=json.loads((work/'actual.json').read_text())
 failures=[{'expected':e,'actual':a} for e,a in zip(expected,actual) if e!=a]
 out=root/'output/qa/web-native-discovery-relations-20260922';out.mkdir(parents=True,exist_ok=True)
 (out/'swift-parity.json').write_text(json.dumps({'scenarios':len(expected),'failures':failures},ensure_ascii=False,indent=2))
 assert not failures, 'Swift/browser discovery mismatch: '+', '.join(f['expected']['id'] for f in failures)
 print(f'CURRENT_SWIFT_DISCOVERIES {len(expected)} scenarios PASS (10 kinds, semantic IDs, copy, samples, direct observation proof)')
