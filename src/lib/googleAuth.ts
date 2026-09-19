import { googleClientId, googleRedirectUri, isAndroidWebView } from './authConfig';

export { googleClientId, isAndroidWebView };

const TOKEN_KEY = 'sofer-google-id-token';
const ERROR_KEY = 'sofer-google-id-error';

export function isNativeShell(): boolean {
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

export function googleAuthUrl(clientId: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('redirect_uri', googleRedirectUri());
  url.searchParams.set('nonce', crypto.randomUUID());
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export function startGoogleRedirect(clientId: string) {
  window.location.replace(googleAuthUrl(clientId));
}

export async function requestGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error('Falta el Client ID de Google');
  }
  if (isInAppShell()) {
    startGoogleRedirect(clientId);
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
