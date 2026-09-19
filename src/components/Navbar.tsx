import React, { useState } from 'react';
import {
  Building2,
  Bell,
  BarChart3,
  Layers,
  Wrench,
  FileSpreadsheet,
  Plus,
  ShieldAlert,
  Coins,
  Receipt,
  UserCheck,
  Home,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationDrawer } from './NotificationDrawer';

interface NavbarProps {
  onOpenReports: () => void;
  onOpenCreateTicket: () => void;
  onOpenAddBuilding: () => void;
  onOpenSoferServices?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateTicket, onOpenAddBuilding, onOpenReports, onOpenSoferServices }) => {
  const {
    currentUser,
    unreadCount,
    activeTab,
    setActiveTab,
    selectedBuildingId,
    setSelectedBuildingId,
  } = useApp();

  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A2E6D] text-white border-b border-[#0A2E6D] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Title */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => {
                  setSelectedBuildingId(null);
                  setActiveTab('dashboard');
                }}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white text-base sm:text-lg leading-tight tracking-tight flex items-center gap-2">
                    SOFER Gestión
                  </h1>
                  <p className="text-[11px] text-blue-200 hidden sm:block opacity-80">
                    Gestión Integral • Roles • Incidencias • Contabilidad
                  </p>
                </div>
              </div>
            </div>

            {/* Middle / Quick Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => {
                  setSelectedBuildingId(null);
                  setActiveTab('dashboard');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'dashboard' && !selectedBuildingId
                    ? 'bg-white/20 text-white shadow-xs font-semibold'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Panel Principal
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'worker') && (
                <button
                  onClick={() => {
                    setSelectedBuildingId(null);
                    setActiveTab('buildings');
                    window.setTimeout(() => {
                      document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'buildings'
                      ? 'bg-white/20 text-white shadow-xs font-semibold'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Edificios
                </button>
              )}

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setSelectedBuildingId(null);
                    setActiveTab('accounting');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'accounting'
                      ? 'bg-white/20 text-white shadow-xs font-semibold'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Contabilidad & Nóminas
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedBuildingId(null);
                  setActiveTab('tickets');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tickets'
                    ? 'bg-white/20 text-white shadow-xs font-semibold'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                {currentUser.role === 'worker' ? 'Incidencias & Tareas' : currentUser.role === 'president' ? 'Incidencias de Mi Edificio' : 'Mis Incidencias'}
              </button>

              {currentUser.role === 'president' && (
                <button
                  onClick={() => {
                    setSelectedBuildingId(null);
                    setActiveTab('vivienda');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'vivienda'
                      ? 'bg-white/20 text-white shadow-xs font-semibold'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Mi Vivienda & Pagos
                </button>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'president' || currentUser.role === 'neighbor') && (
                <button
                  onClick={() => {
                    setSelectedBuildingId(null);
                    if (currentUser.role === 'admin' && onOpenSoferServices) {
                      onOpenSoferServices();
                      return;
                    }
                    setActiveTab('servicios');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'servicios'
                      ? 'bg-white text-[#0A2E6D] shadow-md font-bold'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Servicios SOFER</span>
                </button>
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'worker') && (
                <button
                  onClick={onOpenReports}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'bg-white/20 text-white shadow-xs font-semibold'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Incidencias & Balances
                </button>
              )}
            </nav>

            {/* Right: Actions, Notification Bell & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Context Action Buttons */}
              

              {currentUser.role === 'admin' && (
                <button
                  onClick={onOpenAddBuilding}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  Nuevo Edificio
                </button>
              )}

              {/* Push Notification Bell */}
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Notificaciones en tiempo real"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Role Switcher Component */}
              <RoleSwitcher />
            </div>
          </div>
        </div>

        {/* Role Scoped Sub-Banner */}
        <div
          className={`px-4 py-1.5 text-xs border-t flex items-center justify-between ${
            currentUser.role === 'admin'
              ? 'bg-[#0A2E6D]/10 border-[#0A2E6D]/30 text-[#0A2E6D]'
              : currentUser.role === 'president'
              ? 'bg-blue-950/30 border-blue-200 text-blue-600'
              : 'bg-green-950/30 border-green-200 text-green-600'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {currentUser.role === 'admin' && (
                  <strong>Permiso Absoluto (Admin):</strong>
                )}
                {currentUser.role === 'president' && (
                  <strong>Presidente & Vecino ({currentUser.buildingName} • {currentUser.unitOrArea || 'Ático 4ª B'}):</strong>
                )}
                {currentUser.role === 'worker' && (
                  <strong>Trabajador / Operario ({currentUser.specialty}):</strong>
                )}
                <span className="ml-1 text-[#5A6B82]">
                  {currentUser.role === 'admin' &&
                    'Acceso total a inmuebles, contabilidad, gestión exclusiva de nóminas a operarioes y incidencias consolidados.'}
                  {currentUser.role === 'president' &&
                    'Supervisión del edificio y caja de reparaciones, gestión de su propia vivienda y cuotas, y catálogo de servicios SOFER.'}
                  {currentUser.role === 'worker' &&
                    'Visualización de cajas de todos los edificios, registro de gastos en caja durante la reparación y cierre de incidencias.'}
                  {currentUser.role === 'neighbor' &&
                    'Acceso a cuotas de tu vivienda, incidencias comunitarias, recibos oficiales y contratación de Servicios SOFER.'}
                </span>
              </span>
            </div>

            <span className="text-[11px] font-mono uppercase bg-[#161616] px-2 py-0.5 rounded border border-[#E2E8F0] text-[#16202E] shrink-0 ml-2 hidden sm:inline-block">
              Rol: {currentUser.role}
            </span>
          </div>
        </div>
      </header>

      {/* Push Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
};
