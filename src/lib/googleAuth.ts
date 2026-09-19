import { DEFAULT_GOOGLE_CLIENT_ID, googleRedirectUri } from './authConfig';

export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();

const TOKEN_KEY = 'sofer-google-id-token';
const ERROR_KEY = 'sofer-google-id-error';

export function isNativeShell(): boolean {
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
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

export function startGoogleRedirect(clientId: string) {
  window.location.replace(googleAuthUrl(clientId));
}

export function requestGoogleIdToken(clientId: string): Promise<string> {
  if (isNativeShell()) {
    startGoogleRedirect(clientId);
    return new Promise(() => undefined);
  }

  return new Promise((resolve, reject) => {
    const url = googleAuthUrl(clientId);
    const width = 500;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      url,
      'google-oauth',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`
    );
    if (!popup) {
      startGoogleRedirect(clientId);
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado al iniciar sesión con Google.'));
    }, 120000);

    const poll = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Inicio de sesión con Google cancelado.'));
      }
    }, 400);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; idToken?: string | null; error?: string | null };
      if (!data || data.type !== 'sofer-google-id-token') return;
      cleanup();
      if (data.error) {
        reject(new Error(String(data.error)));
        return;
      }
      if (!data.idToken) {
        reject(new Error('Google no devolvió un id_token. Revisa Client ID y las URIs autorizadas.'));
        return;
      }
      resolve(data.idToken);
    };

    function cleanup() {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      if (popup && !popup.closed) popup.close();
    }

    window.addEventListener('message', onMessage);
  });
}
