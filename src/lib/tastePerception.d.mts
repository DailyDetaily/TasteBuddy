import type {TasteId} from '../constants/designTokens';
import type {TasteSurveySubmission} from '../types/tasteSurvey';
import type {TasteChangeSeries} from '../pages/TasteChangePage';
export const PERCEPTION_VERSION:string;
export const PERCEPTION_AXES:readonly TasteId[];
export const INTENSITY_LEVELS:readonly string[];
export const INTENSITY_LABELS:readonly string[];
export const MIN_PERCEPTION_MEALS:number;
export const PERCEPTION_TARGET_LABELS:Record<string,string>;
export const PERCEPTION_PHASE_LABELS:Record<string,string>;
interface References {evidenceIDs:string[];experienceIDs:string[];mealIDs:string[]}
interface Period extends References {start:number|null;end:number|null}
interface Pattern extends References {id:string;axis:TasteId;foodKey:string;foodName:string;restaurantName:string;target:string;phase:string;currentLevel:number|null;previousLevel:number|null;status:string;counts:number[];conflictCount:number;recent:Period;previous:Period}
export interface PerceptionModel {version:string;axes:Array<{axis:TasteId;current:Pattern|null}>;patterns:Pattern[];changes:Pattern[];contrasts:Array<References&{id:string;axis:TasteId;first:Pattern;second:Pattern}>;evidenceCount:number}
interface SurveyPoint {axis:TasteId;value:number|null;item:TasteSurveySubmission['items'][number]|null;submission:TasteSurveySubmission|null;previous:{value:number|null;submission:TasteSurveySubmission}|null}
export interface SurveyPerception {current:TasteSurveySubmission|null;points:SurveyPoint[];changes:SurveyPoint[]}
export function buildTastePerception(records:readonly unknown[],options?:{asOf?:string|null;userID?:string|null}):PerceptionModel;
export function buildSurveyPerception(submissions:readonly unknown[]):SurveyPerception;
export function buildTasteChangeSeries(model:PerceptionModel,survey:SurveyPerception):TasteChangeSeries[];
export function tasteChangeLabel(points:readonly {id:string;value:number}[]):string;
