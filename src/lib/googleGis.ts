import { googleClientId } from './googleAuth';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
            use_fedcm_for_prompt?: boolean;
            context?: 'signin' | 'signup' | 'use';
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              isDismissedMoment: () => boolean;
            }) => void
          ) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Sign-In'));
    document.head.appendChild(script);
  });
}

export async function initGoogleButton(
  parent: HTMLElement,
  onCredential: (token: string) => void,
  onError: (message: string) => void
) {
  if (!googleClientId) {
    onError('Falta el Client ID de Google');
    return;
  }
  await loadGoogleIdentity();
  if (!window.google?.accounts?.id) {
    onError('Google Sign-In no está disponible');
    return;
  }
  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: (response) => {
      if (response.credential) onCredential(response.credential);
      else onError('Google no devolvió una credencial');
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
    context: 'signin',
  });
  parent.innerHTML = '';
  window.google.accounts.id.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    width: 336,
    logo_alignment: 'left',
  });
}
