const PUBLIC_MEDIA_BASE_URL = import.meta.env.VITE_PUBLIC_MEDIA_BASE_URL;
const R2_PUBLIC_MEDIA_BASE_URL = import.meta.env.VITE_R2_PUBLIC_MEDIA_BASE_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ASSET_BUCKET =
  import.meta.env.VITE_SUPABASE_PUBLIC_ASSET_BUCKET ?? 'taste-buddy-assets';

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

  const encodedPath = encodeStoragePath(mediaPath);
  if (!encodedPath) {
    return null;
  }

  const mediaBaseUrl = R2_PUBLIC_MEDIA_BASE_URL ?? PUBLIC_MEDIA_BASE_URL;
  if (mediaBaseUrl) {
    return `${mediaBaseUrl.replace(/\/$/, '')}/${encodedPath}`;
  }

  if (!SUPABASE_URL) {
    return null;
  }

  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_ASSET_BUCKET}/${encodedPath}`;
}
