import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  Clock,
  LogOut,
  Building2,
  Mail,
  User,
  Phone,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UnassignedRoleScreen: React.FC = () => {
  const { currentUser, logout, showToast } = useApp();

  const handleRefresh = () => {
    // Read from localStorage to check if admin assigned a role
    const savedUsers = localStorage.getItem('gest_v2_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      const updated = parsed.find((u: any) => u.id === currentUser.id);
      if (updated && updated.role !== 'unassigned') {
        window.location.reload();
        return;
      }
    }
    showToast('Estado Verificado', 'Tu cuenta aún está pendiente de asignación por el Administrador.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#16202E] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#0A2E6D] selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#0A2E6D]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F4F6FA] border border-[#E2E8F0] text-[#0A2E6D] shadow-xl mb-1">
            <Building2 className="w-8 h-8 text-[#0A2E6D]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#16202E] flex items-center justify-center gap-2">
            SOFER <span className="text-[#0A2E6D]">Gestión</span>
          </h1>
          <p className="text-xs text-[#5A6B82]">
            Sistema Centralizado de Edificios & Mantenimiento
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3 p-4 bg-yellow-950/25 border border-yellow-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-yellow-900/40 border border-yellow-700/50 flex items-center justify-center text-yellow-300 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-yellow-200">
                Sesión Iniciada • Pendiente de Asignación de Rol
              </h3>
              <p className="text-xs text-yellow-300/80 mt-0.5">
                Tu cuenta ha sido verificada. El Administrador de fincas debe asignarte tu rol y permisos.
              </p>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-3 bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5A6B82]">
              Datos de tu Cuenta
            </p>
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#16202E]">{currentUser.name}</p>
                <p className="text-xs text-[#5A6B82] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#555555]" />
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C1C1C] text-xs">
              <div>
                <span className="text-[#5A6B82] block text-[10px] uppercase">Estado:</span>
                <span className="text-yellow-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  Sin Rol Asignado
                </span>
              </div>
              <div>
                <span className="text-[#5A6B82] block text-[10px] uppercase">Seguridad:</span>
                <span className="text-[#5A6B82] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#0A2E6D]" />
                  Control RBAC Activo
                </span>
              </div>
            </div>
          </div>

          {/* Explanation banner */}
          <div className="p-4 bg-[#F4F6FA] border border-[#282828] rounded-2xl text-xs text-[#5A6B82] space-y-2">
            <p className="font-semibold text-[#16202E] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#0A2E6D]" />
              ¿Por qué no puedo elegir mi rol directamente?
            </p>
            <p className="leading-relaxed">
              Por normativa de seguridad y control financiero de los inmuebles, los usuarios no pueden asignarse roles ni cambiarse entre sí. El <strong className="text-[#16202E]">Administrador de fincas</strong> configurará si actúas como:
            </p>
            <ul className="space-y-1 pl-4 list-disc text-[11px] text-[#5A6B82]">
              <li><strong className="text-blue-600">Presidente de la comunidad:</strong> Administrando una finca específica y sus incidencias.</li>
              <li><strong className="text-green-600">Trabajador / Operario:</strong> Asignado a tu especialidad de mantenimiento y reparaciones.</li>
              <li><strong className="text-[#0A2E6D]">Administrador de fincas:</strong> Con control total contable y multiedificio.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 py-2.5 px-4 bg-[#F4F6FA] hover:bg-[#E8EFF9] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#16202E] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#0A2E6D]" />
              <span>Comprobar Asignación</span>
            </button>
            <button
              onClick={logout}
              className="flex-1 py-2.5 px-4 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 rounded-xl text-xs font-bold text-red-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
