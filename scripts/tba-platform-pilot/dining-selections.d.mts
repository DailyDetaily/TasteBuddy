export interface SelectionCatalogEntry { id: string; type: string; label: string; catalogVersion: string; attribute: string; resolution: string; }
export interface SelectionAtom {
  kind: string; attribute?: string | null; value: string | boolean | number | null;
  reference?: string; target?: string; phase?: string; scale?: string;
  selectionEvidence?: { type?: string; selectionID?: string; catalogVersion?: string; relatedBubbleID?: string | null; selectionInstanceID?: string|null; definitionVersion?:string|null; bindingMode?:string|null; semanticFacets?:Record<string,unknown>|null };
  [key: string]: unknown;
}
export interface SelectionParseResult { observations: SelectionAtom[]; unresolved: unknown[]; needsAI: boolean; decisionReasons: string[]; }
export const DINING_SELECTION_VERSION: string;
export const DINING_SELECTION_CATALOG: readonly SelectionCatalogEntry[];
export const ALL_DINING_SELECTION_CATALOG: readonly SelectionCatalogEntry[];
export function parseStructuredSelections(selections: unknown[], options?: Record<string, unknown>): SelectionParseResult;
export function validateStructuredSelectionAtom(atom: unknown, answer: unknown): { valid: boolean; errors: string[] };
