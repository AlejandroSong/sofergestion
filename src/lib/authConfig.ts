export const GOOGLE_CALLBACK_PATH = '/google-callback.html';

export const PRODUCTION_ORIGIN = 'https://sofergestion-8za0q407m.vercel.app';
export const PRODUCTION_HOST = 'sofergestion-8za0q407m.vercel.app';

export const DEFAULT_SUPABASE_URL = 'https://wqejnlkquytobynefgij.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_UyqriemBbZISFZZMBu0qdw_o8ACXjib';
export const DEFAULT_GOOGLE_CLIENT_ID =
  '1052739078825-5sl9asj7lhiiz3is38aeolog37dm14.apps.googleusercontent.com';

export function googleRedirectUri(): string {
  return `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;
}

export function supabaseRedirectTo(): string {
  return `${window.location.origin}/`;
}

export function redirectPreviewToProduction(): boolean {
  const host = window.location.hostname;
  if (!host.endsWith('.vercel.app') || host === PRODUCTION_HOST) return false;
  window.location.replace(
    `${PRODUCTION_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
  return true;
}

export const DEFAULT_SUPABASE_URL = 'https://wqejnlkquytobynefgij.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_UyqriemBbZISFZZMBu0qdw_o8ACXjib';
export const DEFAULT_GOOGLE_CLIENT_ID =
  '1052739078825-5sl9asj7lhiiz3is38aeolog37dm14.apps.googleusercontent.com';

export function googleRedirectUri(): string {
  return `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;
}

export function supabaseRedirectTo(): string {
  return `${window.location.origin}/`;
}
