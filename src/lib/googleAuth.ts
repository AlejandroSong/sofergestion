import { DEFAULT_GOOGLE_CLIENT_ID, googleRedirectUri } from './authConfig';

export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim();

export function requestGoogleIdToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const redirectUri = googleRedirectUri();
    const nonce = crypto.randomUUID();
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'id_token');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('prompt', 'select_account');

    const width = 500;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      url.toString(),
      'google-oauth',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`
    );
    if (!popup) {
      reject(new Error('El navegador bloqueó la ventana de Google. Permite ventanas emergentes.'));
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
