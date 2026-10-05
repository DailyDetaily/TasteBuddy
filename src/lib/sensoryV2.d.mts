export interface SensoryV2Entry {
  id: string; type: string; label: string; description: string; catalogVersion: string;
  definitionVersion: string; attribute: string; bindingMode: 'independent' | 'modifier' | 'relation';
  axis?: string; familyId?: string; baseRank?: number; fixedAnchor?: boolean;
  intrinsicTarget?: string | null; intrinsicPhase?: string | null; intrinsicIntensity?: string | null;
  intrinsicFit?: string | null; referenceLabel?: string | null; resolution: string;
  semanticFacets: Record<string, unknown>; searchAliases?: string[];
}
export interface SensoryV2Context {
  profileIds: string[]; profileSelection: string[] | null; flagOverrides: Record<string,string>;
  contextFlags: Record<string,string>; contextSource: string; matchedRuleIds: string[];
  suggestedProfileIds: string[]; ambiguous: boolean;
}
export interface SensoryV2Presentation extends SensoryV2Context {
  catalogVersion: string; sourceVersion: string; layoutVersion: string;
  orderedBubbleIDs: string[]; offeredDetailIDs: string[]; viewportVisibility: string; attention: string;
}
export interface SensoryV2ContextInput { menu?: string; dishKindIDs?: string[]; profileSelection?: string[] | null; flagOverrides?: Record<string,string> }
export interface SensoryV2Word { id:string; key:string; label:string; description:string; angleOffset:number; intensity:null; radiusOffset:null }
export interface SensoryV2Axis { id:string; label:string; angle:number; words:SensoryV2Word[] }
export const SENSORY_V2: {
  version:string; sourceVersion:string; layoutVersion:string; entries:SensoryV2Entry[]; archivedEntries:SensoryV2Entry[]; axes:SensoryV2Axis[];
  profiles: {id:string;label:string;detailProfileKind:string;[key:string]:unknown}[];
  contextFlags:{id:string;label:string}[];
  layout:{mapSize:number;bubbleSize:number;selectedBubbleSize:number;gridSpacing:number;slots:{id:string;axis:string;index:number;x:number;y:number}[]};
};
export const SENSORY_V2_VERSION:string;
export function sensoryV2Entry(id:string):SensoryV2Entry|null;
export function sensoryV2DefinitionForSelection(selection:Record<string,any>):SensoryV2Entry|null;
export function sensoryV2MatchesQuery(id:string,query:string):boolean;
export function sensorySelectionKey(selection:Record<string,any>):string;
export function resolveSensoryV2Context(input?:SensoryV2ContextInput):SensoryV2Context;
export function sensoryV2Categories(context:SensoryV2Context):{id:string;label:string;tags:{id:string;label:string}[]}[];
export function sensoryV2OrderedBubbleIDs(context:SensoryV2Context):string[];
export function makeSensoryV2Presentation(input?:SensoryV2ContextInput):SensoryV2Presentation;
export function validSensoryV2Presentation(value:unknown):value is SensoryV2Presentation;
export function sensoryV2Axes(presentation?:unknown,preservingSelections?:readonly Record<string,any>[]):SensoryV2Axis[];
export function makeSensoryV2Selection(id:string, options?:{relatedBubble?:Record<string,any>|null;instanceID?:string|null}):{
  id:string;type:string;catalogVersion:string;definitionVersion:string;selectionInstanceID:string;
  labelSnapshot:string;bindingMode:string;scopeKind:string;target:string;phase:string;
  relatedBubbleID:string|null;relatedBubbleLabelSnapshot:string|null;
};
export const sensoryV2Values:Record<string,Record<string,string>>;
export function parseSensoryV2Selections(selections:unknown[],options?:Record<string,unknown>):any;
