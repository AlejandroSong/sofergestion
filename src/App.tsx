import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { AuthScreen } from './components/AuthScreen';
import { UnassignedRoleScreen } from './components/UnassignedRoleScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { PresidentDashboard } from './components/PresidentDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { NeighborDashboard } from './components/NeighborDashboard';
import { BuildingDetailView } from './components/BuildingDetailView';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { AddBuildingModal } from './components/AddBuildingModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ReportsModal } from './components/ReportsModal';
import { SoferServicesModal } from './components/SoferServicesModal';
import { UserManagementModal } from './components/UserManagementModal';
import { canOpenBuilding, canOpenReports, canManageBuildings, canPostAccounting, canManageSoferCatalog, canCreateTicket, canManageUsers } from './utils/permissions';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    authReady,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedTicketId,
    setSelectedTicketId,
    getBuildingById,
    adminInboxTarget,
    setAdminInboxTarget,
    setActiveTab,
  } = useApp();

  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [ticketInitialFloor, setTicketInitialFloor] = useState<string | undefined>();
  const [ticketInitialArea, setTicketInitialArea] = useState<string | undefined>();
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isSoferOpen, setIsSoferOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  useEffect(() => {
    if (adminInboxTarget?.type === 'sofer' && canManageSoferCatalog(currentUser)) {
      setIsSoferOpen(true);
    }
    if (adminInboxTarget?.type === 'users' && canManageUsers(currentUser)) {
      setSelectedBuildingId(null);
      setIsUsersOpen(true);
    }
  }, [adminInboxTarget, currentUser, setSelectedBuildingId]);

  useEffect(() => {
    if (!selectedBuildingId) return;
    if (currentUser.role === 'neighbor') {
      setSelectedBuildingId(null);
      setActiveTab('vivienda');
      return;
    }
    if (!canOpenBuilding(currentUser, selectedBuildingId) || !getBuildingById(selectedBuildingId)) {
      setSelectedBuildingId(null);
    }
  }, [selectedBuildingId, currentUser, setSelectedBuildingId, getBuildingById, setActiveTab]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#0A2E6D] text-sm font-semibold">
        Cargando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  if (currentUser.role === 'unassigned') {
    return (
      <>
        <UnassignedRoleScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#16202E] flex flex-col font-sans selection:bg-[#0A2E6D] selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenCreateTicket={() => {
          if (canCreateTicket(currentUser)) setIsCreateTicketOpen(true);
        }}
        onOpenAddBuilding={() => {
          if (canManageBuildings(currentUser)) setIsAddBuildingOpen(true);
        }}
        onOpenReports={() => {
          if (canOpenReports(currentUser)) setIsReportsOpen(true);
        }}
        onOpenSoferServices={() => {
          if (canManageSoferCatalog(currentUser)) setIsSoferOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View Router */}
        {selectedBuildingId && currentUser.role !== 'neighbor' ? (
          <BuildingDetailView
            buildingId={selectedBuildingId}
            onBack={() => setSelectedBuildingId(null)}
            onOpenCreateTicket={() => setIsCreateTicketOpen(true)}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            onOpenAddBuilding={() => setIsAddBuildingOpen(true)}
            onOpenCreateTicket={() => setIsCreateTicketOpen(true)}
            onOpenAddTransaction={() => setIsAddTransactionOpen(true)}
            onOpenReports={() => setIsReportsOpen(true)}
            onOpenSoferServices={() => setIsSoferOpen(true)}
          />
        ) : currentUser.role === 'worker' ? (
          <WorkerDashboard />
        ) : currentUser.role === 'president' ? (
          <PresidentDashboard 
            onOpenCreateTicket={() => {
              setTicketInitialFloor(undefined);
              setTicketInitialArea(undefined);
              setIsCreateTicketOpen(true);
            }} 
            onOpenCreateTicketForArea={(areaName, floor) => {
              setTicketInitialFloor(floor);
              setTicketInitialArea(areaName);
              setIsCreateTicketOpen(true);
            }}
          />
        ) : currentUser.role === 'neighbor' ? (
          <NeighborDashboard onOpenCreateTicket={() => setIsCreateTicketOpen(true)} />
        ) : (
          <div />
        )}
      </main>

      {/* Modals & Drawers */}
      <ToastContainer />

      <CreateTicketModal
        isOpen={isCreateTicketOpen && canCreateTicket(currentUser)}
        onClose={() => {
          setIsCreateTicketOpen(false);
          setTicketInitialFloor(undefined);
          setTicketInitialArea(undefined);
        }}
        initialFloor={ticketInitialFloor}
        initialUnitOrArea={ticketInitialArea}
      />

      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      <AddBuildingModal
        isOpen={isAddBuildingOpen && canManageBuildings(currentUser)}
        onClose={() => setIsAddBuildingOpen(false)}
      />

      <AddTransactionModal
        isOpen={isAddTransactionOpen && canPostAccounting(currentUser)}
        onClose={() => setIsAddTransactionOpen(false)}
        defaultBuildingId={selectedBuildingId || undefined}
      />

      <ReportsModal
        isOpen={isReportsOpen && canOpenReports(currentUser)}
        onClose={() => setIsReportsOpen(false)}
      />

      <SoferServicesModal
        isOpen={isSoferOpen && canManageSoferCatalog(currentUser)}
        onClose={() => {
          setIsSoferOpen(false);
          if (adminInboxTarget?.type === 'sofer') setAdminInboxTarget(null);
        }}
      />

      <UserManagementModal
        isOpen={isUsersOpen && canManageUsers(currentUser)}
        onClose={() => {
          setIsUsersOpen(false);
          if (adminInboxTarget?.type === 'users') setAdminInboxTarget(null);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#F4F6FA] py-4 text-center text-xs text-[#5A6B82]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} SOFER Gestión • Multi-Inmueble RBAC
          </p>
          <div className="flex items-center gap-4 text-[#5A6B82]">
            <span className="text-[#5A6B82]">Admin</span>
            <span>•</span>
            <span className="text-[#5A6B82]">Presidentes de Edificio</span>
            <span>•</span>
            <span className="text-[#5A6B82]">Trabajadores</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
