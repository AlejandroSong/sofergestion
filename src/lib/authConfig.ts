export const GOOGLE_CALLBACK_PATH = '/google-callback.html';

export const PRODUCTION_ORIGIN =
  'https://sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app';
export const PRODUCTION_HOST =
  'sofergestion-davidalejandroroblesmarquez-5406s-projects.vercel.app';

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
