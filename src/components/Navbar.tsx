import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  BarChart3,
  Layers,
  Wrench,
  FileSpreadsheet,
  Plus,
  Home,
  Sparkles,
  Settings2,
  Menu,
  X,
  LayoutDashboard,
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
  onOpenControlPanel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddBuilding,
  onOpenReports,
  onOpenSoferServices,
  onOpenControlPanel,
}) => {
  const {
    currentUser,
    unreadCount,
    activeTab,
    setActiveTab,
    selectedBuildingId,
    setSelectedBuildingId,
  } = useApp();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const go = (tab: typeof activeTab, after?: () => void) => {
    setSelectedBuildingId(null);
    setActiveTab(tab);
    closeMenu();
    if (after) window.setTimeout(after, 50);
  };

  const itemClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${
      active ? 'bg-[#0A2E6D] text-white' : 'text-[#16202E] hover:bg-slate-100'
    }`;

  const drawer = menuOpen
    ? createPortal(
        <div className="fixed inset-0 z-[120] flex">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={closeMenu}
          />
          <aside className="relative z-10 h-full w-[min(20rem,88vw)] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-[#E2E8F0] bg-[#0A2E6D]">
              <BrandLogo variant="menu" />
              <button
                type="button"
                onClick={closeMenu}
                className="p-2 rounded-lg text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5A6B82]">Navegación</p>
              <button type="button" onClick={() => go('dashboard')} className={itemClass(activeTab === 'dashboard' && !selectedBuildingId)}>
                <LayoutDashboard className="w-4 h-4" />
                Panel principal
              </button>
              {(currentUser.role === 'admin' || currentUser.role === 'worker') && (
                <button
                  type="button"
                  onClick={() => go('buildings', () => document.getElementById('buildings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}
                  className={itemClass(activeTab === 'buildings')}
                >
                  <Layers className="w-4 h-4" />
                  Edificios
                </button>
              )}
              {currentUser.role === 'admin' && (
                <button type="button" onClick={() => go('accounting')} className={itemClass(activeTab === 'accounting')}>
                  <BarChart3 className="w-4 h-4" />
                  Contabilidad y nóminas
                </button>
              )}
              <button type="button" onClick={() => go('tickets')} className={itemClass(activeTab === 'tickets')}>
                <Wrench className="w-4 h-4" />
                {currentUser.role === 'worker'
                  ? 'Incidencias y tareas'
                  : currentUser.role === 'president'
                    ? 'Incidencias de mi edificio'
                    : 'Incidencias'}
              </button>
              {(currentUser.role === 'president' || currentUser.role === 'neighbor') && (
                <button type="button" onClick={() => go('vivienda')} className={itemClass(activeTab === 'vivienda')}>
                  <Home className="w-4 h-4" />
                  {currentUser.role === 'neighbor' ? 'Mi vivienda' : 'Mi vivienda y pagos'}
                </button>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'president' || currentUser.role === 'neighbor') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuildingId(null);
                    closeMenu();
                    if (currentUser.role === 'admin' && onOpenSoferServices) {
                      onOpenSoferServices();
                      return;
                    }
                    setActiveTab('servicios');
                  }}
                  className={itemClass(activeTab === 'servicios')}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Servicios SOFER
                </button>
              )}
              {currentUser.role === 'admin' && (
                <>
                  <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#5A6B82]">Administración</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onOpenControlPanel?.();
                    }}
                    className={itemClass(false)}
                  >
                    <Settings2 className="w-4 h-4" />
                    Precios, roles y fincas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onOpenReports();
                    }}
                    className={itemClass(activeTab === 'reports')}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Incidencias y balances
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onOpenAddBuilding();
                    }}
                    className={itemClass(false)}
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo edificio
                  </button>
                </>
              )}
            </nav>
          </aside>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A2E6D] text-white border-b border-[#0A2E6D] shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[4.75rem] gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBuildingId(null);
                  setActiveTab('dashboard');
                }}
                className="flex items-center gap-2.5 cursor-pointer min-w-0"
              >
                <BrandLogo variant="nav" />
                <div className="min-w-0 hidden sm:block text-left">
                  <h1 className="font-bold text-white text-base leading-tight tracking-tight">SOFER Gestión</h1>
                  <p className="text-[11px] text-blue-200 opacity-80 truncate">Administración de fincas</p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setNotificationOpen(true)}
                className="relative p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <RoleSwitcher />
            </div>
          </div>
        </div>
      </header>

      {drawer}

      <NotificationDrawer isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </>
  );
};
