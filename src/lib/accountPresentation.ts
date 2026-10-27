/** Local display-cache ownership; this never changes original account records. */
export function normalizePresentationOwner(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function canReuseAccountPresentation({
  savedOwner,
  currentPresentationOwner,
  restoredOwner,
}: {
  savedOwner: string | null;
  currentPresentationOwner: string | null;
  restoredOwner: string;
}) {
  // The persisted cache is relevant only before this runtime has resolved an owner.
  return (currentPresentationOwner ?? savedOwner) === restoredOwner;
}

export function canPersistAccountPresentation({
  hydrated,
  presentationOwner,
  sessionOwner,
}: {
  hydrated: boolean;
  presentationOwner: string | null;
  sessionOwner: string;
}) {
  return hydrated && presentationOwner !== null && presentationOwner === sessionOwner;
}
