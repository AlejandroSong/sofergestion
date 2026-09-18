import React, { useEffect, useRef, useState } from 'react';
import { Building2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { initGoogleButton } from '../lib/googleGis';
import { googleClientId } from '../lib/googleAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogleCredential } = useApp();
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const host = buttonHostRef.current;
    if (!host || !isSupabaseConfigured || !googleClientId) return;

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
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#D5E4F5] text-[#3D6FA8] shadow-sm mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E3A5F] flex items-center justify-center gap-2">
            SOFER <span className="text-[#3D6FA8]">Gestión</span>
          </h1>
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
            <div ref={buttonHostRef} className="min-h-[44px] flex justify-center" />
          </div>
        </div>

        <p className="text-center text-xs text-[#5E7A99]">
          SOFER Gestión • Acceso con Google y asignación de roles por el administrador
        </p>
      </div>
    </div>
  );
};
