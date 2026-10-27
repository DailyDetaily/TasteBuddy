import { useEffect, useState } from 'react';
import { nativeRepository } from '../../lib/gastronomy/nativeRuntime';
import { nativeRecordPhotoFilenames, type NativeRecord } from '../../lib/gastronomy/nativeRecord';
import { getCurrentSupabaseSession, supabase } from '../../lib/supabase';

/** The same account-scoped local/remote photo path used by the record editor. */
export default function useNativeRecordPhotos(owner: string, entry: NativeRecord) {
  const filenames = nativeRecordPhotoFilenames(entry);
  const key = JSON.stringify([owner, filenames]);
  const [value, setValue] = useState<{ key: string; urls: string[] } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const objectURLs: string[] = [];
    void (async () => {
      const urls = await Promise.all(filenames.map(async (filename) => {
        try {
          const blob = await nativeRepository.photo(owner, filename);
          if (cancelled) return null;
          if (blob) {
            const url = URL.createObjectURL(blob);
            objectURLs.push(url);
            return url;
          }
          const session = await getCurrentSupabaseSession();
          if (cancelled || !supabase || session?.user.id !== owner || session.user.is_anonymous) return null;
          const { data } = await supabase.storage.from('native-dining-photos')
            .createSignedUrl(`${owner.toLowerCase()}/${filename}`, 120);
          return data?.signedUrl ?? null;
        } catch { return null; }
      }));
      if (!cancelled) setValue({ key, urls: urls.filter((url): url is string => url !== null) });
    })();
    return () => {
      cancelled = true;
      objectURLs.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [key, owner, revision]);
  const urls = value?.key === key ? value.urls : [];
  return {
    urls,
    loading: filenames.length > 0 && value?.key !== key,
    unavailable: value?.key === key && urls.length < filenames.length,
    retry: () => { setValue(null); setRevision((current) => current + 1); },
  };
}
