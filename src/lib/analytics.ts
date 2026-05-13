type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsValue>;

const GA_MEASUREMENT_ID = 'G-BEMPCQ9MCM';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function cleanAnalyticsParams(params?: AnalyticsParams) {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export function trackEvent(eventName: string, params?: AnalyticsParams) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, cleanAnalyticsParams(params));
}

export function trackPageView(pageTitle: string, pagePath: string, params?: AnalyticsParams) {
  const pageLocation =
    typeof window === 'undefined' ? pagePath : `${window.location.origin}${pagePath}`;

  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    page_path: pagePath,
    send_to: GA_MEASUREMENT_ID,
    ...cleanAnalyticsParams(params),
  });
}
