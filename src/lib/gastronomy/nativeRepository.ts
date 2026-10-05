import {
  blankSnapshot,
  canonical,
  readNativeRecords,
  nativeRecordPhotoFilenames,
  replaceNativeRecord,
  type NativeRecord,
  type NativeSnapshot,
} from "./nativeRecord";
import { readNativeProfileIdentity } from "./nativeProfileIdentity";
import {readNativePreferences} from "./nativePreferences";
import { readNativeBookmarks } from "./nativeBookmarks";
export interface RemoteArchive {
  snapshot: NativeSnapshot;
  revision: number;
}
export interface ArchivePhoto { filename: string; blob: Blob }
export interface LocalArchive extends RemoteArchive {
  owner: string;
  dirty: boolean;
  remoteEnabled?: boolean;
  generation: number;
  pending?: RemoteArchive;
  lastError?: string;
  conflict?: RemoteArchive;
  recoveries?: { snapshot: NativeSnapshot; recordedAt: string }[];
}
export interface ArchiveStorage {
  read(owner: string): Promise<LocalArchive | null>;
  cachePhoto?(owner: string, photo: ArchivePhoto): Promise<void>;
  update(
    owner: string,
    change: (value: LocalArchive | null) => LocalArchive,
    photo?: ArchivePhoto | ArchivePhoto[],
    requiredPhotos?: string[],
  ): Promise<LocalArchive>;
  photo(owner: string, filename: string): Promise<Blob | null>;
}
export interface ArchiveTransport {
  downloadPhoto?(owner: string, filename: string): Promise<Blob>;
  fetch(
    owner: string,
  ): Promise<{ enabled: boolean; remote: RemoteArchive | null }>;
  save(
    owner: string,
    snapshot: NativeSnapshot,
    revision: number,
    photo: (filename: string) => Promise<Blob | null>,
  ): Promise<number>;
}
export function readValidatedNativeRecords(snapshot: NativeSnapshot): NativeRecord[] {
  const entries = readNativeRecords(snapshot);
  for (const entry of entries) {
    for (const filename of nativeRecordPhotoFilenames(entry)) {
      if (typeof filename !== "string" || !/^[A-Za-z0-9_-]{1,251}\.jpg$/.test(filename) || !snapshot.photoFilenames.includes(filename))
        throw new Error("기록 사진의 백업 목록이 일치하지 않아 원본을 유지했어요.");
    }
  }
  readNativeProfileIdentity(snapshot);
  readNativeBookmarks(snapshot);
  readNativePreferences(snapshot);
  return entries;
}
function checked(remote: RemoteArchive): RemoteArchive {
  readValidatedNativeRecords(remote.snapshot);
  if (!Number.isSafeInteger(remote.revision) || remote.revision < 0)
    throw new Error("계정 백업 버전을 확인하지 못했어요.");
  return remote;
}
export class NativeRepository {
  constructor(
    private storage: ArchiveStorage,
    private transport: ArchiveTransport,
  ) {}
  read(owner: string) {
    return this.storage.read(owner);
  }
  photo(owner: string, filename: string) {
    return this.storage.photo(owner, filename);
  }
  private async restoredPhotos(owner: string, snapshot: NativeSnapshot): Promise<ArchivePhoto[]> {
    if (!this.transport.downloadPhoto) return [];
    const photos: ArchivePhoto[] = [];
    for (const filename of new Set(snapshot.photoFilenames)) {
      if (!await this.storage.photo(owner, filename)) {
        const photo = { filename, blob: await this.transport.downloadPhoto(owner, filename) };
        // Keep memory bounded to one original. Staged photos stay account-scoped if a
        // later download fails; the readable source is not replaced until all exist.
        if (this.storage.cachePhoto) await this.storage.cachePhoto(owner, photo);
        else photos.push(photo);
      }
    }
    return photos;
  }
  async changeSnapshot(
    owner: string,
    change: (snapshot: NativeSnapshot) => NativeSnapshot,
  ): Promise<LocalArchive> {
    return this.storage.update(owner, (current) => {
      if (!current) throw new Error("기록을 먼저 불러와 주세요.");
      const snapshot = change(current.snapshot);
      checked({ snapshot, revision: current.revision });
      if (canonical(snapshot) === canonical(current.snapshot)) return current;
      return {
        ...current,
        snapshot,
        dirty: true,
        lastError: undefined,
        generation: current.generation + 1,
      };
    });
  }
  async refresh(owner: string): Promise<LocalArchive> {
    const { remote: raw, enabled } = await this.transport.fetch(owner);
    const remote = checked(raw ?? { snapshot: blankSnapshot(), revision: 0 });
    // Restore every original before adopting the account copy. The final transaction
    // rechecks their availability so a concurrent local deletion cannot break restoration.
    const photos = raw && enabled ? await this.restoredPhotos(owner, remote.snapshot) : [];
    return this.storage.update(owner, (current) => {
      if (!current)
        return {
          ...remote,
          owner,
          dirty: false,
          generation: 0,
          remoteEnabled: enabled,
        };
      current = { ...current, remoteEnabled: enabled };
      try { checked(current); }
      catch (error) {
        // A supported but damaged local source may be recovered only by an explicit
        // account-copy choice. Keep its exact bytes active until that choice is made.
        if (!raw || ![1, 2].includes(current.snapshot?.schemaVersion)) throw error;
        return { ...current, conflict: remote,
          lastError: "기기 원문을 읽지 못했어요. 원본을 보관한 뒤 계정 기록으로 복원할 수 있어요." };
      }
      // Reconcile a response lost after a successful write; never send a duplicate create.
      if (
        current.pending &&
        remote.revision === current.pending.revision + 1 &&
        canonical(remote.snapshot) === canonical(current.pending.snapshot)
      )
        return {
          ...current,
          revision: remote.revision,
          dirty: canonical(current.snapshot) !== canonical(remote.snapshot),
          pending: undefined,
          conflict: undefined,
        };
      if (remote.revision < current.revision) return current;
      if (current.dirty) {
        if (canonical(remote.snapshot) === canonical(current.snapshot))
          return {
            ...current,
            revision: remote.revision,
            dirty: false,
            pending: undefined,
            conflict: undefined,
          };
        if (remote.revision !== current.revision)
          return { ...current, conflict: remote, lastError: undefined };
        return current;
      }
      return {
        ...current,
        ...remote,
        conflict: undefined,
        pending: undefined,
        generation: current.generation + 1,
      };
    }, photos, raw && enabled ? remote.snapshot.photoFilenames : undefined);
  }
  async reconnect(owner: string): Promise<LocalArchive> {
    const current = await this.refresh(owner);
    return current.dirty && current.remoteEnabled && !current.conflict
      ? this.sync(owner) : current;
  }
  async commit(
    owner: string,
    entry: NativeRecord,
    expected: NativeRecord | null,
    photo?: { filename: string; blob: Blob },
    updateMetadata?: (snapshot: NativeSnapshot) => NativeSnapshot,
  ): Promise<LocalArchive> {
    let photoToStore = photo;
    if (photo) {
      const original = await this.photo(owner, photo.filename);
      if (original) {
        const before = new Uint8Array(await original.arrayBuffer());
        const after = new Uint8Array(await photo.blob.arrayBuffer());
        if (before.length !== after.length || before.some((byte, index) => byte !== after[index]))
          throw new Error("같은 이름의 다른 사진이 있어 저장을 멈췄어요. 원본은 유지했어요.");
        photoToStore = undefined;
      }
    }
    return this.storage.update(
      owner,
      (current) => {
        if (!current)
          throw new Error(
            "기록을 먼저 불러와 주세요. 작성한 내용은 그대로 있어요.",
          );
        let snapshot = replaceNativeRecord(current.snapshot, entry, expected);
        if (photo) {
          if (
            entry.reflectionPhotoFilename !== photo.filename ||
            !photo.filename.match(/^[A-Za-z0-9_-]{1,251}\.jpg$/) ||
            photo.blob.type !== "image/jpeg" ||
            photo.blob.size > 6291456
          )
            throw new Error("사진 형식을 확인해 주세요.");
          snapshot.photoFilenames = [
            ...new Set([...snapshot.photoFilenames, photo.filename]),
          ];
        }
        if (updateMetadata) {
          snapshot = updateMetadata(snapshot);
          readNativeRecords(snapshot);
        }
        checked({ snapshot, revision: current.revision });
        return {
          ...current,
          snapshot,
          dirty: true,
          lastError: undefined,
          generation: current.generation + 1,
        };
      },
      photoToStore,
    );
  }
  async sync(owner: string): Promise<LocalArchive> {
    try {
      const result = await this.syncPending(owner);
      return await this.storage.update(owner, (value) => ({
        ...value!,
        lastError: undefined,
      }));
    } catch (error) {
      try {
        await this.storage.update(owner, (value) => {
          if (!value) throw error;
          return {
            ...value,
            lastError:
              error instanceof Error
                ? error.message
                : "백업을 완료하지 못했어요.",
          };
        });
      } catch {}
      throw error;
    }
  }
  private async syncPending(owner: string): Promise<LocalArchive> {
    let current = await this.read(owner);
    if (!current) throw new Error("기록을 먼저 불러와 주세요.");
    if (!current.dirty) return current;
    const remote = await this.transport.fetch(owner);
    if (!remote.enabled) return current;
    // refresh compares the full snapshot revision before admitting any write.
    current = await this.refresh(owner);
    if (current.conflict)
      throw new Error(
        current.lastError ?? "다른 기기의 기록이 변경되었어요. 웹에서 작성한 기록은 보관했고 자동 덮어쓰기를 멈췄어요.",
      );
    if (!current.dirty) return current;
    const sent = { snapshot: current.snapshot, revision: current.revision };
    await this.storage.update(owner, (value) => {
      if (!value) throw new Error("현재 기록이 없어요.");
      return { ...value, pending: sent };
    });
    const revision = await this.transport.save(
      owner,
      sent.snapshot,
      sent.revision,
      (filename) => this.photo(owner, filename),
    );
    if (!Number.isSafeInteger(revision) || revision !== sent.revision + 1)
      throw new Error(
        "백업 결과를 다시 확인해 주세요. 작성한 기록은 보관되어 있어요.",
      );
    return this.storage.update(owner, (value) => {
      if (!value) throw new Error("현재 기록이 없어요.");
      return {
        ...value,
        revision,
        dirty: canonical(value.snapshot) !== canonical(sent.snapshot),
        pending: undefined,
        conflict: undefined,
      };
    });
  }
  async useAccountCopy(owner: string): Promise<LocalArchive> {
    const { remote } = await this.transport.fetch(owner);
    if (!remote) throw new Error("계정 원본을 다시 확인해 주세요.");
    checked(remote);
    const photos = await this.restoredPhotos(owner, remote.snapshot);
    return this.storage.update(owner, (current) => {
      if (!current?.conflict)
        throw new Error("비교할 계정 변경을 먼저 불러와 주세요.");
      if (![1, 2].includes(current.snapshot?.schemaVersion))
        throw new Error("새 버전의 기기 원문을 유지했어요. 앱을 업데이트한 뒤 복원해 주세요.");
      if (remote.revision < current.conflict.revision)
        throw new Error("계정 기록의 버전이 바뀌었어요. 다시 불러와 주세요.");
      return {
        ...current,
        ...remote,
        dirty: false,
        lastError: undefined,
        pending: undefined,
        conflict: undefined,
        generation: current.generation + 1,
        recoveries: [
          ...(current.recoveries ?? []),
          { snapshot: current.snapshot, recordedAt: new Date().toISOString() },
        ],
      };
    }, photos, remote.snapshot.photoFilenames);
  }
}
