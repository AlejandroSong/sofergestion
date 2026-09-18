import React, { useState } from 'react';
import { Building2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { googleClientId } from '../lib/googleAuth';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle } = useApp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleGoogleSignInClick = async () => {
    setErrorMessage(null);
    setIsBusy(true);
    const res = await signInWithGoogle();
    setIsBusy(false);
    if (!res.success) {
      setErrorMessage(res.message || 'No se pudo iniciar sesión con Google');
    }
  };

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

          <button
            type="button"
            disabled={isBusy}
            onClick={handleGoogleSignInClick}
            className="w-full py-3.5 px-4 bg-white hover:bg-[#EAF2FB] border border-[#C9DCF2] rounded-2xl text-sm font-semibold text-[#1E3A5F] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isBusy ? 'Conectando con Google…' : 'Continuar con Google'}</span>
          </button>
        </div>

        <p className="text-center text-xs text-[#5E7A99]">
          SOFER Gestión • Acceso con Google y asignación de roles por el administrador
        </p>
      </div>
    </div>
  );
};
