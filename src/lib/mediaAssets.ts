const SUPABASE_ASSET_BUCKET =
  import.meta.env.VITE_SUPABASE_PUBLIC_ASSET_BUCKET ?? 'taste-buddy-assets';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function encodeStoragePath(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function resolvePublicMediaPath(path?: string | null) {
  const mediaPath = path?.trim();

  if (!mediaPath) {
    return null;
  }

  if (/^(https?:|data:|blob:|\/)/.test(mediaPath)) {
    return mediaPath;
  }

  if (!SUPABASE_URL) {
    return null;
  }

  const encodedPath = encodeStoragePath(mediaPath);
  if (!encodedPath) {
    return null;
  }

  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_ASSET_BUCKET}/${encodedPath}`;
}
