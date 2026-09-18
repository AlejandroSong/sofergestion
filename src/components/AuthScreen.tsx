import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ADMIN_USER } from '../data/users';

export const AuthScreen: React.FC = () => {
  const {
    loginWithEmail,
    loginWithGoogle,
    registerUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email) {
      setErrorMessage('Por favor ingresa tu correo electrónico');
      return;
    }
    const res = loginWithEmail(email, password);
    if (!res.success) {
      setErrorMessage(res.message || 'Error al iniciar sesión');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !name) {
      setErrorMessage('Por favor completa todos los campos obligatorios');
      return;
    }

    // A newly registered user begins with unassigned role until the Administrator assigns it
    const res = registerUser({
      name,
      email,
      password,
      phone: phone || '+34 600 000 000',
      role: 'unassigned',
      provider: 'email',
      status: 'active',
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Error al crear la cuenta');
    }
  };

  const handleGoogleSignInClick = () => {
    setGoogleEmail('usuario.nuevo@gmail.com');
    setGoogleName('Usuario Registrado');
    setIsGoogleModalOpen(true);
  };

  const handleGoogleConfirm = () => {
    if (!googleEmail) return;
    loginWithGoogle({
      name: googleName || googleEmail.split('@')[0],
      email: googleEmail,
      role: 'unassigned',
    });
    setIsGoogleModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#16202E] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#0A2E6D] selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0A2E6D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#0A2E6D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F4F6FA] border border-[#E2E8F0] text-[#0A2E6D] shadow-xl mb-1">
            <Building2 className="w-8 h-8 text-[#0A2E6D]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#16202E] flex items-center justify-center gap-2">
            SOFER <span className="text-[#0A2E6D]">Gestión</span>
          </h1>
          <p className="text-xs text-[#5A6B82] max-w-md mx-auto">
            Plataforma Integral con Autenticación Segura y Asignación de Roles por el administrador
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#E8EFF9] text-[#16202E] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#E8EFF9] text-[#16202E] shadow-sm border border-[#E2E8F0]'
                  : 'text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              Registrarse (Crear Cuenta)
            </button>
          </div>

          {/* Security Notice */}
          <div className="mb-5 p-3 bg-[#171717] border border-[#2B2B2B] rounded-2xl flex items-start gap-2.5 text-[11px] text-[#5A6B82]">
            <ShieldAlert className="w-4 h-4 text-[#0A2E6D] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#16202E]">Seguridad de Acceso:</strong> El inicio de sesión es requerido antes de asignar un rol. Los usuarios no pueden elegirse o cambiarse roles entre sí; únicamente el <strong className="text-[#0A2E6D]">administrador de fincas</strong> asigna y edita los permisos.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl text-red-600 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            className="w-full mb-5 py-3 px-4 bg-[#1B1B1B] hover:bg-[#E8EFF9] border border-[#E2E8F0] hover:border-[#E2E8F0] rounded-2xl text-xs font-bold text-[#16202E] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm group"
          >
            {/* Google G SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-[#E2E8F0]" />
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-[#5A6B82] font-medium">
              o con correo electrónico
            </span>
            <div className="flex-grow border-t border-[#E2E8F0]" />
          </div>

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@sofergestion.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#5A6B82]">
                    Contraseña
                  </label>
                  <span className="text-[11px] text-[#5A6B82]">demo / cualquier clave</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2"
              >
                <span>Acceder al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Mariana Santos / Javier Vega"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="w-full pl-10 pr-3.5 py-2 bg-[#F4F6FA] border border-[#E2E8F0] focus:border-[#0A2E6D] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informative Note About Role Assignment */}
              <div className="p-3 bg-[#F4F6FA] border border-[#282828] rounded-xl text-[11px] text-[#5A6B82] space-y-1">
                <p className="text-[#0A2E6D] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Asignación de Rol Centralizada
                </p>
                <p>
                  Tu cuenta será creada inmediatamente. Una vez autenticado, el <strong className="text-[#16202E]">administrador</strong> le asignará tu rol correspondiente (Presidente de la comunidad, Trabajador o Admin).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-3"
              >
                <span>Crear Cuenta e Iniciar Sesión</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick admin access */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
            <p className="text-[11px] font-bold tracking-wider uppercase text-[#5A6B82] mb-2.5 text-center">
              Acceso de administrador
            </p>
            <button
              type="button"
              onClick={() => loginWithEmail(ADMIN_USER.email)}
              className="w-full p-2.5 bg-[#F4F6FA] hover:bg-[#E8EFF9] border border-[#E2E8F0] hover:border-[#0A2E6D]/50 rounded-xl text-left transition-colors cursor-pointer"
            >
              <span className="block text-[10px] font-bold text-[#0A2E6D] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
              <span className="block text-xs font-semibold text-[#16202E] truncate">
                {ADMIN_USER.name}
              </span>
              <span className="block text-[10px] text-[#5A6B82]">{ADMIN_USER.email}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#5A6B82]">
          SOFER Gestión • Sistema Seguro con Validación y Asignación de Permisos RBAC
        </p>
      </div>

      {/* Google Sign-in Interactive Modal */}
      <AnimatePresence>
        {isGoogleModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-md w-full text-[#16202E] shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
                {/* Google G SVG */}
                <div className="w-10 h-10 rounded-2xl bg-[#1E1E1E] border border-[#E2E8F0] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#16202E]">
                    Autenticación con Google
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    Inicia sesión o regístrate con tu cuenta de Google
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Correo de Google
                  </label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="tu.cuenta@gmail.com"
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Tu Nombre"
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] outline-none"
                  />
                </div>

                <div className="p-3 bg-[#F4F6FA] border border-[#282828] rounded-xl text-xs text-[#5A6B82]">
                  <p className="text-[#16202E] font-semibold text-[11px] mb-1">
                    Nota de Asignación de Roles:
                  </p>
                  Si es tu primer acceso con Google, ingresarás con tu cuenta verificada para que el administrador te asigne tu edificio o especialidad de trabajador.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#282828] text-[#5A6B82] hover:text-[#16202E] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGoogleConfirm}
                  className="px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Continuar con Google
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
