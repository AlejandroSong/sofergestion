import { Capacitor } from '@capacitor/core';
import {
  GOOGLE_CALLBACK_PATH,
  PRODUCTION_ORIGIN,
  googleClientId,
  googleRedirectUri,
  isAndroidWebView,
} from './authConfig';

export { googleClientId, isAndroidWebView };

const TOKEN_KEY = 'sofer-google-id-token';
const ERROR_KEY = 'sofer-google-id-error';
const APP_CALLBACK = 'es.sofergestion.app://google-callback';
const OAUTH_EVENT = 'sofer-google-oauth';

export function isNativeShell(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
    if (Capacitor.getPlatform() !== 'web') return true;
  } catch {
    // ignore
  }
  const cap = (window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  if (cap?.getPlatform && cap.getPlatform() !== 'web') return true;
  return false;
}

export function isInAppShell(): boolean {
  return isNativeShell() || isAndroidWebView();
}

function stashGoogleResult(idToken?: string, error?: string) {
  try {
    if (idToken) {
      sessionStorage.setItem(TOKEN_KEY, idToken);
      localStorage.setItem(TOKEN_KEY, idToken);
    }
    if (error) {
      sessionStorage.setItem(ERROR_KEY, error);
      localStorage.setItem(ERROR_KEY, error);
    }
  } catch {
    // ignore
  }
}

function emitGoogleOAuth(idToken?: string, error?: string) {
  window.dispatchEvent(new CustomEvent(OAUTH_EVENT, { detail: { idToken, error } }));
}

export function onGoogleOAuthResult(
  handler: (result: { idToken?: string; error?: string }) => void
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<{ idToken?: string; error?: string }>).detail || {});
  };
  window.addEventListener(OAUTH_EVENT, listener);
  return () => window.removeEventListener(OAUTH_EVENT, listener);
}

let deepLinkBridge: Promise<{ remove: () => Promise<void> }> | null = null;

export function ensureGoogleDeepLinkBridge() {
  if (!isNativeShell()) {
    return Promise.resolve({ remove: async () => undefined });
  }
  if (deepLinkBridge) return deepLinkBridge;
  deepLinkBridge = import('@capacitor/app')
    .then(({ App }) =>
      App.addListener('appUrlOpen', ({ url }) => {
        if (!url || !isGoogleReturnUrl(url)) return;
        void closeBrowser();
        try {
          const { idToken, error } = parseGoogleCallbackUrl(url);
          stashGoogleResult(idToken, error);
          emitGoogleOAuth(idToken, error);
        } catch {
          stashGoogleResult(undefined, 'No se pudo procesar la respuesta de Google');
          emitGoogleOAuth(undefined, 'No se pudo procesar la respuesta de Google');
        }
      })
    )
    .catch(() => ({ remove: async () => undefined }));
  return deepLinkBridge;
}

void ensureGoogleDeepLinkBridge();

export function consumeGoogleRedirectResult(): { idToken?: string; error?: string } {
  try {
    const fromHash = parseGoogleCallbackUrl(window.location.href);
    const idToken =
      sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || fromHash.idToken || undefined;
    const error =
      sessionStorage.getItem(ERROR_KEY) || localStorage.getItem(ERROR_KEY) || fromHash.error || undefined;
    if (idToken) {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    if (error) {
      sessionStorage.removeItem(ERROR_KEY);
      localStorage.removeItem(ERROR_KEY);
    }
    if (fromHash.idToken || fromHash.error) {
      const clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
    return { idToken, error };
  } catch {
    return {};
  }
}

function isGoogleReturnUrl(url: string): boolean {
  if (url.startsWith(APP_CALLBACK)) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'sofergestion.es' || parsed.hostname === 'www.sofergestion.es') &&
      parsed.pathname.startsWith('/google-callback')
    );
  } catch {
    return false;
  }
}

function parseGoogleCallbackUrl(url: string): { idToken?: string; error?: string } {
  try {
    const parsed = new URL(url);
    const raw = parsed.hash ? parsed.hash.slice(1) : parsed.search.slice(1);
    const params = new URLSearchParams(raw);
    return {
      idToken: params.get('id_token') || undefined,
      error: params.get('error_description') || params.get('error') || undefined,
    };
  } catch {
    const raw = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
    const params = new URLSearchParams(raw);
    return {
      idToken: params.get('id_token') || undefined,
      error: params.get('error_description') || params.get('error') || undefined,
    };
  }
}

export function googleAuthUrl(clientId: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('scope', 'openid email profile');
  const redirect = isNativeShell()
    ? `${PRODUCTION_ORIGIN}${GOOGLE_CALLBACK_PATH}`
    : googleRedirectUri();
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('nonce', (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}`);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

async function closeBrowser() {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch {
    // Plugin ausente en este APK: el login sigue en el WebView.
  }
}

export async function startGoogleRedirect(clientId: string) {
  const url = googleAuthUrl(clientId);
  if (isNativeShell()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, toolbarColor: '#0A2E6D' });
    return;
  }
  window.location.replace(url);
}

export function listenForGoogleRedirect(
  onToken: (idToken: string) => void,
  onError: (message: string) => void
) {
  void ensureGoogleDeepLinkBridge();
  return Promise.resolve({
    remove: async () => undefined,
  }).then(() => {
    const stop = onGoogleOAuthResult(({ idToken, error }) => {
      if (idToken) onToken(idToken);
      else if (error) onError(error);
    });
    return { remove: async () => stop() };
  });
}

export async function requestGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error('Falta el Client ID de Google');
  }
  if (isInAppShell()) {
    await startGoogleRedirect(clientId);
    return new Promise(() => undefined);
  }

  const { loadGoogleIdentity } = await import('./googleGis');
  await loadGoogleIdentity();
  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error('Google Sign-In no está disponible en este dispositivo.');
  }

  return new Promise((resolve, reject) => {
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error('Google no devolvió una credencial'));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
      context: 'signin',
    });
    googleId.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error('Pulsa el botón de Google para entrar.'));
      }
    });
  });
}
