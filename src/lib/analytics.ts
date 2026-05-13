type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsValue>;

const PRODUCTION_GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const LOCAL_GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID_LOCAL;
const PRODUCTION_CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;
const LOCAL_CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID_LOCAL;

let hasInitializedAnalytics = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

function isLocalAnalyticsHost() {
  if (typeof window === 'undefined') {
    return import.meta.env.DEV;
  }

  return ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
}

function getCurrentGaMeasurementId() {
  return isLocalAnalyticsHost() ? LOCAL_GA_MEASUREMENT_ID : PRODUCTION_GA_MEASUREMENT_ID;
}

function getCurrentClarityProjectId() {
  return isLocalAnalyticsHost() ? LOCAL_CLARITY_PROJECT_ID : PRODUCTION_CLARITY_PROJECT_ID;
}

function cleanAnalyticsParams(params?: AnalyticsParams) {
  if (!params) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );
}

function appendScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function initializeAnalytics() {
  if (hasInitializedAnalytics || typeof window === 'undefined') {
    return;
  }

  hasInitializedAnalytics = true;

  const gaMeasurementId = getCurrentGaMeasurementId();
  const clarityProjectId = getCurrentClarityProjectId();
  const analyticsEnvironment = isLocalAnalyticsHost() ? 'local' : 'production';

  if (gaMeasurementId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

    appendScript(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`);
    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId, {
      analytics_environment: analyticsEnvironment,
      send_page_view: false,
    });
  }

  if (clarityProjectId) {
    window.clarity =
      window.clarity ||
      function clarity(...args: unknown[]) {
        (window.clarity as { q?: unknown[] }).q =
          (window.clarity as { q?: unknown[] }).q || [];
        (window.clarity as { q?: unknown[] }).q?.push(args);
      };

    appendScript(`https://www.clarity.ms/tag/${clarityProjectId}`);
    window.clarity('set', 'analytics_environment', analyticsEnvironment);
  }
}

export function trackEvent(eventName: string, params?: AnalyticsParams) {
  initializeAnalytics();

  if (
    typeof window === 'undefined' ||
    typeof window.gtag !== 'function' ||
    !getCurrentGaMeasurementId()
  ) {
    return;
  }

  window.gtag('event', eventName, {
    analytics_environment: isLocalAnalyticsHost() ? 'local' : 'production',
    ...cleanAnalyticsParams(params),
  });
}

export function trackPageView(pageTitle: string, pagePath: string, params?: AnalyticsParams) {
  const pageLocation =
    typeof window === 'undefined' ? pagePath : `${window.location.origin}${pagePath}`;

  trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    page_path: pagePath,
    send_to: getCurrentGaMeasurementId(),
    ...cleanAnalyticsParams(params),
  });
}
