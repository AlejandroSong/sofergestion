import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useApp } from '../context/AppContext';
import { initGoogleButton } from '../lib/googleGis';
import { consumeGoogleRedirectResult, googleClientId, isWrappedWebView, startGoogleRedirect } from '../lib/googleAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogleCredential } = useApp();
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const pending = consumeGoogleRedirectResult();
    if (pending.error) {
      setErrorMessage(pending.error);
      return;
    }
    if (pending.idToken) {
      setIsBusy(true);
      void signInWithGoogleCredential(pending.idToken).then((res) => {
        setIsBusy(false);
        if (!res.success) setErrorMessage(res.message || 'No se pudo iniciar sesión con Google');
      });
    }
  }, [signInWithGoogleCredential]);

  useEffect(() => {
    const host = buttonHostRef.current;
    if (!host || !isSupabaseConfigured || !googleClientId || isWrappedWebView()) return;

    void initGoogleButton(
      host,
      async (token) => {
        setErrorMessage(null);
        setIsBusy(true);
        const res = await signInWithGoogleCredential(token);
        setIsBusy(false);
        if (!res.success) {
          setErrorMessage(res.message || 'No se pudo iniciar sesión con Google');
        }
      },
      (message) => setErrorMessage(message)
    );
  }, [signInWithGoogleCredential]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1E3A5F] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#C5D9F2] selection:text-[#1E3A5F]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#8FB4E3]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#B7D0EE]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo variant="hero" />
          </div>
          <p className="text-xs text-[#5E7A99] max-w-md mx-auto">
            Acceso con Google. El administrador asigna el rol después del primer ingreso.
          </p>
        </div>

        <div className="bg-white border border-[#D5E4F5] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="mb-5 p-3 bg-[#EAF2FB] border border-[#C9DCF2] rounded-2xl flex items-start gap-2.5 text-[11px] text-[#3D5A78]">
            <ShieldAlert className="w-4 h-4 text-[#3D6FA8] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#1E3A5F]">Solo Google:</strong> las cuentas nuevas se crean al entrar con Google.
              El <strong className="text-[#3D6FA8]">administrador de fincas</strong> asigna y edita los permisos.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800">
              Falta configurar Supabase. El botón de Google no funcionará hasta tener las variables de entorno.
            </div>
          )}
          {isSupabaseConfigured && !googleClientId && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800">
              Falta el Client ID de Google.
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            {isBusy && <p className="text-xs text-[#3D6FA8] font-medium">Entrando…</p>}
            {!isWrappedWebView() && <div ref={buttonHostRef} className="min-h-[44px] flex justify-center" />}
            {isWrappedWebView() && (
              <button
                type="button"
                disabled={isBusy || !isSupabaseConfigured || !googleClientId}
                onClick={() => {
                  setErrorMessage(null);
                  setIsBusy(true);
                  startGoogleRedirect(googleClientId);
                }}
                className="w-full max-w-[336px] py-2.5 px-4 rounded-full border border-[#D5E4F5] bg-white text-sm font-semibold text-[#1E3A5F] cursor-pointer disabled:opacity-50"
              >
                Continuar con Google
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#5E7A99]">
          SOFER Gestión • Acceso con Google y asignación de roles por el administrador
        </p>
      </div>
    </div>
  );
};
