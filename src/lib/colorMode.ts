import { useSyncExternalStore } from 'react';
import type { ColorMode } from '../constants/designTokens';

const eventName = 'tb-color-mode-change';
export type ColorModePreference = 'system' | ColorMode;
export const COLOR_MODE_PREFERENCE_KEY = 'tb-color-mode-preference';
export const COLOR_MODE_OPTIONS = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
] as const;

function readPreference(): ColorModePreference {
  try {
    const value = window.localStorage.getItem(COLOR_MODE_PREFERENCE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch { return 'system'; }
}

let preference = readPreference();
let installedMedia: MediaQueryList | undefined;
const subscribe = (listener: () => void) => {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
};

function applyPreference() {
  if (installedMedia) {
    const mode = preference === 'system' ? (installedMedia.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.tbTheme = mode;
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }
  window.dispatchEvent(new Event(eventName));
}

export function colorModePreference(): ColorModePreference { return preference; }
export function useColorModePreference(): ColorModePreference {
  return useSyncExternalStore(subscribe, colorModePreference, () => 'system');
}

export function setColorModePreference(value: ColorModePreference) {
  preference = value;
  try { window.localStorage.setItem(COLOR_MODE_PREFERENCE_KEY, value); } catch { /* Apply for this session when storage is unavailable. */ }
  applyPreference();
}

export function productColorMode(): ColorMode {
  return typeof document !== 'undefined' && document.documentElement.dataset.tbTheme === 'dark' ? 'dark' : 'light';
}

export function useProductColorMode(): ColorMode {
  return useSyncExternalStore(subscribe, productColorMode, () => 'light');
}

/** Install only for the product app. Plating controls each specimen's mode itself. */
export function installSystemColorMode(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  installedMedia = media;
  preference = readPreference();
  const syncStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== COLOR_MODE_PREFERENCE_KEY) return;
    preference = readPreference();
    applyPreference();
  };
  applyPreference();
  media.addEventListener('change', applyPreference);
  window.addEventListener('storage', syncStorage);
  return () => {
    media.removeEventListener('change', applyPreference);
    window.removeEventListener('storage', syncStorage);
    if (installedMedia === media) installedMedia = undefined;
  };
}
