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

export function consumeGoogleRedirectResult(): { idToken?: string; error?: string } {
  try {
    const idToken = sessionStorage.getItem(TOKEN_KEY) || undefined;
    const error = sessionStorage.getItem(ERROR_KEY) || undefined;
    if (idToken) sessionStorage.removeItem(TOKEN_KEY);
    if (error) sessionStorage.removeItem(ERROR_KEY);
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
  const parsed = new URL(url);
  const raw = parsed.hash ? parsed.hash.slice(1) : parsed.search.slice(1);
  const params = new URLSearchParams(raw);
  return {
    idToken: params.get('id_token') || undefined,
    error: params.get('error_description') || params.get('error') || undefined,
  };
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
  url.searchParams.set('nonce', crypto.randomUUID());
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
  const authUrl = googleAuthUrl(clientId);
  if (isNativeShell()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: authUrl });
      return;
    } catch {
      window.location.replace(authUrl);
      return;
    }
  }
  window.location.replace(authUrl);
}

export function listenForGoogleRedirect(
  onToken: (idToken: string) => void,
  onError: (message: string) => void
) {
  if (!isNativeShell()) {
    return Promise.resolve({ remove: async () => undefined });
  }
  return import('@capacitor/app')
    .then(({ App }) =>
      App.addListener('appUrlOpen', ({ url }) => {
        if (!url || !isGoogleReturnUrl(url)) return;
        void closeBrowser();
        try {
          const { idToken, error } = parseGoogleCallbackUrl(url);
          if (idToken) onToken(idToken);
          else if (error) onError(error);
        } catch {
          onError('No se pudo procesar la respuesta de Google');
        }
      })
    )
    .catch(() => ({ remove: async () => undefined }));
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
