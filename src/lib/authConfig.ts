export const GOOGLE_CALLBACK_PATH = '/google-callback.html';

export const PRODUCTION_ORIGIN = 'https://sofergestion.es';
export const PRODUCTION_HOST = 'sofergestion.es';
export const PRODUCTION_WWW_HOST = 'www.sofergestion.es';
export const PRODUCTION_VERCEL_HOST =
  'sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app';

export const DEFAULT_SUPABASE_URL = 'https://wqejnlkquytobynefgij.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_UyqriemBbZISFZZMBu0qdw_o8ACXjib';
export const DEFAULT_GOOGLE_CLIENT_ID =
  '1052739078382-vhbkiscvgt7otbeksk7v4sdast7ldr5t.apps.googleusercontent.com';

export const googleClientId = DEFAULT_GOOGLE_CLIENT_ID;

export function googleRedirectUri(): string {
  const origin =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? PRODUCTION_ORIGIN
      : window.location.origin.replace(/\/$/, '');
  return `${origin}${GOOGLE_CALLBACK_PATH}`;
}

export function isAndroidWebView(): boolean {
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) && /;\s*wv\)/i.test(ua);
}

export function redirectPreviewToProduction(): boolean {
  const host = window.location.hostname;
  if (
    host === PRODUCTION_HOST ||
    host === PRODUCTION_WWW_HOST ||
    host === PRODUCTION_VERCEL_HOST ||
    host === 'localhost' ||
    host === '127.0.0.1'
  ) {
    return false;
  }
  if (!host.endsWith('.vercel.app')) return false;
  window.location.replace(
    `${PRODUCTION_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
  return true;
}
