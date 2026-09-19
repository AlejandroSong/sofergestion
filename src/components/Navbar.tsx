import React, { useState } from 'react';
import {
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
import { BrandLogo } from './BrandLogo';

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
          <div className="flex items-center justify-between h-[4.5rem]">
            {/* Left: Brand & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={() => {
                  setSelectedBuildingId(null);
                  setActiveTab('dashboard');
                }}
                className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              >
                <BrandLogo variant="nav" />
                <div className="min-w-0 hidden xs:block sm:block">
                  <h1 className="font-bold text-white text-base sm:text-lg leading-tight tracking-tight">
                    SOFER Gestión
                  </h1>
                  <p className="text-[11px] text-blue-200 hidden sm:block opacity-80 truncate">
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

              {(currentUser.role === 'president' || currentUser.role === 'neighbor') && (
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
                  {currentUser.role === 'neighbor' ? 'Mi Vivienda' : 'Mi Vivienda & Pagos'}
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

              {currentUser.role === 'admin' && (
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
                    {unreadCount > 99 ? '99+' : unreadCount}
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
                {currentUser.role === 'admin' && <strong>Administrador de fincas:</strong>}
                {currentUser.role === 'president' && (
                  <strong>
                    Presidente
                    {currentUser.buildingName ? ` · ${currentUser.buildingName}` : ''}
                    {currentUser.unitOrArea ? ` · ${currentUser.unitOrArea}` : ''}:
                  </strong>
                )}
                {currentUser.role === 'worker' && (
                  <strong>Trabajador{currentUser.specialty ? ` · ${currentUser.specialty}` : ''}:</strong>
                )}
                {currentUser.role === 'neighbor' && (
                  <strong>
                    Vecino
                    {currentUser.buildingName ? ` · ${currentUser.buildingName}` : ''}
                    {currentUser.unitOrArea ? ` · ${currentUser.unitOrArea}` : ''}:
                  </strong>
                )}
                <span className="ml-1 text-[#5A6B82]">
                  {currentUser.role === 'admin' &&
                    'Gestión de inmuebles, contabilidad, nóminas, usuarios e incidencias.'}
                  {currentUser.role === 'president' &&
                    'Supervisión de tu comunidad, caja de reparaciones, vivienda y servicios SOFER.'}
                  {currentUser.role === 'worker' &&
                    'Incidencias asignadas, visitas y cierre de partes de trabajo.'}
                  {currentUser.role === 'neighbor' &&
                    'Cuotas de tu vivienda, incidencias, recibos y servicios SOFER.'}
                </span>
              </span>
            </div>
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
