export function explainAuthError(raw: unknown): string {
  const text = String(
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && 'message' in raw
        ? (raw as { message?: string }).message
        : raw ?? ''
  ).trim();
  const lower = text.toLowerCase();

  if (!text || lower === 'timeout' || lower.includes('timed out') || lower.includes('tiempo')) {
    return 'Google no respondió a tiempo. Comprueba la red y vuelve a intentarlo.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('cors') || lower.includes('load failed')) {
    return 'No se pudo contactar con el servidor (red o CORS). En el móvil el origen debe ser https://www.sofergestion.es.';
  }
  if (lower.includes('audience') || lower.includes('invalid jwt') || lower.includes('unacceptable')) {
    return 'El Client ID de Google no coincide con el de Supabase. Revisa el cliente Web en Google Cloud y el proveedor Google en Supabase.';
  }
  if (lower.includes('provider') && (lower.includes('not enabled') || lower.includes('unsupported'))) {
    return 'El proveedor Google no está activo en Supabase Authentication.';
  }
  if (lower.includes('redirect') || lower.includes('redirect_uri') || lower.includes('invalid origin')) {
    return 'La URI de redirección no está autorizada. En Google Cloud añade https://www.sofergestion.es/google-callback.html';
  }
  if (lower.includes('popup') || lower.includes('disallowed_useragent') || lower.includes('403')) {
    return 'Google bloqueó este navegador embebido. Instala el APK 2.0.3 o posterior.';
  }
  if (lower.includes('access_denied') || lower.includes('cancelled') || lower.includes('canceled')) {
    return 'El acceso con Google se canceló.';
  }
  return text || 'No se pudo iniciar sesión con Google.';
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}
