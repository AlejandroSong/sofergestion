import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Wrench,
  ChevronDown,
  Building2,
  LogOut,
  UserCog,
  Mail,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

interface RoleSwitcherProps {
  onOpenUsers?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ onOpenUsers }) => {
  const { currentUser, allUsers, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-[#0A2E6D]" />,
          label: 'Administrador de fincas',
          bg: 'bg-blue-100 border-blue-200 text-blue-700',
        };
      case 'president':
        return {
          icon: <UserCheck className="w-4 h-4 text-blue-600" />,
          label: 'Presidente de la comunidad',
          bg: 'bg-blue-100 border-blue-200 text-blue-700',
        };
      case 'worker':
        return {
          icon: <Wrench className="w-4 h-4 text-green-600" />,
          label: 'Trabajador / Operario',
          bg: 'bg-green-100 border-green-200 text-green-700',
        };
      case 'neighbor':
        return {
          icon: <Building2 className="w-4 h-4 text-[#128480]" />,
          label: 'Vecino',
          bg: 'bg-[#128480]/10 border-[#128480]/20 text-[#128480]',
        };
      case 'unassigned':
      default:
        return {
          icon: <Shield className="w-4 h-4 text-yellow-600" />,
          label: 'Sin Rol Asignado',
          bg: 'bg-yellow-100 border-yellow-200 text-yellow-700',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer shadow-sm hover:brightness-110 bg-white/10 border-white/20 text-white`}
        >
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-[#E2E8F0]"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <span className="font-semibold block leading-tight truncate max-w-[130px] sm:max-w-[180px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-blue-200 block leading-tight font-normal truncate max-w-[130px] sm:max-w-[180px]">
                {currentUser.role === 'president'
                  ? `Presidente • ${currentUser.buildingName || 'Edificio'}`
                  : currentUser.role === 'worker'
                  ? `Trabajador • ${currentUser.specialty || 'General'}`
                  : currentUser.role === 'admin'
                  ? 'Administrador de fincas'
                  : currentUser.role === 'neighbor'
                  ? `Vecino • ${currentUser.buildingName || 'Edificio'}`
                  : 'Pendiente de Asignación'}
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-blue-200 ml-0.5 shrink-0" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-84 bg-[#F4F6FA] rounded-2xl shadow-2xl border border-[#E2E8F0] py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="px-3.5 py-3 border-b border-[#E2E8F0] mb-2 bg-[#F4F6FA]/60 mx-1.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-[#16202E] truncate">
                        {currentUser.name}
                      </p>
                      {isAdmin && (
                        <span className="text-[9px] bg-[#0A2E6D]/20 text-[#0A2E6D] px-1.5 py-0.2 rounded font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5A6B82] truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#5A6B82]" />
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Role badge details inside user card */}
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                  <span className="text-[#5A6B82]">Rol Activo:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded border text-[10px] uppercase ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {currentUser.role === 'president' && currentUser.buildingName && (
                  <div className="flex items-center justify-between text-[11px] text-blue-600">
                    <span className="text-[#5A6B82]">Edificio:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {currentUser.buildingName}
                    </span>
                  </div>
                )}

                {currentUser.role === 'neighbor' && (
                  <div className="flex items-center justify-between text-[11px] text-[#128480]">
                    <span className="text-[#5A6B82]">Vivienda:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {currentUser.buildingName || 'Edificio'} • {currentUser.unitOrArea || 'Vivienda'}
                    </span>
                  </div>
                )}

                {currentUser.role === 'worker' && currentUser.specialty && (
                  <div className="flex items-center justify-between text-[11px] text-green-700">
                    <span className="text-[#5A6B82]">Especialidad:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {currentUser.specialty}
                    </span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="px-2 pb-2 mb-2 border-b border-[#E2E8F0]">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenUsers?.();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0A2E6D] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-[#0A2E6D]" />
                      Asignar & Editar Roles de Usuarios
                    </span>
                    <span className="text-[10px] bg-blue-200/80 text-[#0A2E6D] px-1.5 py-0.5 rounded font-mono font-bold">
                      {allUsers.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Logout button */}
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] px-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-950/30 hover:text-red-600 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
