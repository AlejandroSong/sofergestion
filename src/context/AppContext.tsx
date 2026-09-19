import React, { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_NEIGHBOR_SERVICES,
  INITIAL_USERS,
  stripDemoBuildings,
  stripDemoNotifications,
  stripDemoPayouts,
  stripDemoRequests,
  stripDemoTickets,
  stripDemoTransactions,
} from '../data/initialData';
import { ADMIN_USER, ACCOUNTS_RESET_KEY, ACCOUNTS_RESET_VALUE, isDemoAccount, isLastActiveAdmin, withSingleAdmin } from '../data/users';
import { googleClientId, requestGoogleIdToken } from '../lib/googleAuth';
import { fetchInbox, insertInbox, markInboxRead, markInboxReadMany, remoteToNotification } from '../lib/inbox';
import { fetchSharedMap, saveShared, subscribeShared, stableJson, SHARED_KEYS, type SharedKey } from '../lib/sharedStore';
import { applyRoleDirectory, clearRevocation, ensureSelfAdmin, fetchProfiles, isEmailRevoked, mergeUsersByEmail, persistProfile, revokeAccess, toRoleDirectory, upsertProfile, type RoleDirectoryEntry } from '../lib/profiles';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { nextMonthFifthIso, todayIso } from '../utils/dates';
import { parseHousing } from '../utils/housing';
import {
  isNotificationForUser,
  loadReadNotificationIds,
  mergeNotificationLists,
  saveReadNotificationIds,
  ticketNoticeAudience,
  withLocalReads,
} from '../utils/notifications';
import {
  canAssignWorkers,
  canChargeRepairFund,
  canCreateTicket,
  canEditNeighborFees,
  canManageBuildings,
  canManagePayouts,
  canManageSoferCatalog,
  canManageUsers,
  canPostAccounting,
  canRequestSoferService,
  canResetFinances,
  canDeleteTickets,
  canSetTicketPriority,
  isTicketFinished,
  canUpdateTicketStatus,
  canScheduleTicketVisit,
  canNotifyAdmin,
  ticketBuildingForUser,
} from '../utils/permissions';
import type { Session } from '@supabase/supabase-js';
import {
  Building,
  CommonArea,
  ExceptionalExpense,
  FloorUtilityBill,
  PushNotification,
  Role,
  Ticket,
  TicketPriority,
  TicketRepairExpense,
  TicketStatus,
  Transaction,
  User,
  WorkerPayout,
  NeighborService,
  NeighborServiceRequest,
  AdminInboxTarget,
  CustomRole,
} from '../types';
import {
  playNotificationSound,
  requestBrowserNotificationPermission,
  sendBrowserPushNotification,
} from '../utils/audioNotification';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'alert' | 'info';
}

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  refreshDirectory: () => Promise<void>;
  isAuthenticated: boolean;
  authReady: boolean;
  setCurrentUser: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  updateUserRole: (
    id: string,
    newRole: Role,
    extra?: {
      buildingId?: string;
      buildingName?: string;
      specialty?: string;
      unitOrArea?: string;
      floor?: string;
      monthlyFee?: number;
      feeBalance?: number;
      customRoleId?: string;
    }
  ) => void;
  customRoles: CustomRole[];
  addCustomRole: (name: string, baseRole: CustomRole['baseRole']) => void;
  renameCustomRole: (id: string, name: string) => void;
  deleteCustomRole: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  revokeBuildingAssignment: (userId: string) => void;
  deleteUser: (id: string) => void;
  restoreAccess: (email: string) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleData: { id?: string; name: string; email: string; avatar?: string; role?: Role; buildingId?: string; specialty?: string }) => { success: boolean; message?: string };
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  signInWithGoogleCredential: (token: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (userData: { name: string; email: string; password?: string; role: Role; phone?: string; buildingId?: string; specialty?: string; provider?: 'email' | 'google'; status?: 'active' | 'suspended' }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  buildings: Building[];
  addBuilding: (buildingData: Omit<Building, 'id' | 'createdAt'>) => Building;
  updateBuilding: (id: string, buildingData: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;
  resetBuildingOperations: (buildingId: string) => void;
  resetAllOperations: () => void;
  getBuildingById: (id: string) => Building | undefined;
  adjustBuildingRepairFund: (buildingId: string, newAmount: number, reason: string) => void;

  // Common Areas Actions (Admin only management)
  addCommonArea: (buildingId: string, areaData: Omit<CommonArea, 'id' | 'createdAt'>) => void;
  updateCommonArea: (buildingId: string, areaId: string, updates: Partial<CommonArea>) => void;
  removeCommonArea: (buildingId: string, areaId: string) => void;

  // Floor Utility Bills Actions (Gas, Water, Internet, etc. - Admin only management)
  addFloorUtilityBill: (buildingId: string, billData: Omit<FloorUtilityBill, 'id' | 'createdAt'>) => void;
  updateFloorUtilityBill: (buildingId: string, billId: string, updates: Partial<FloorUtilityBill>) => void;
  removeFloorUtilityBill: (buildingId: string, billId: string) => void;
  registerUtilityBillPaymentTransaction: (
    buildingId: string,
    billId: string,
    paymentMethod?: Transaction['paymentMethod']
  ) => void;

  // Exceptional Expenses Actions
  addExceptionalExpense: (buildingId: string, expenseData: Omit<ExceptionalExpense, 'id' | 'createdAt' | 'status'>) => void;
  markExceptionalExpenseAsPaid: (buildingId: string, expenseId: string, paymentMethod?: Transaction['paymentMethod']) => void;
  removeExceptionalExpense: (buildingId: string, expenseId: string) => void;

  tickets: Ticket[];
  createTicket: (data: {
    buildingId: string;
    floor: string;
    unitOrArea: string;
    title: string;
    description: string;
    category: Ticket['category'];
    categoryOther?: string;
    priority: TicketPriority;
    photos?: string[];
  }) => Ticket;
  updateTicketStatus: (
    ticketId: string,
    newStatus: TicketStatus,
    notes?: string,
    photoUrl?: string,
    scheduledVisitDate?: string
  ) => void;
  assignWorkerToTicket: (ticketId: string, workerId: string) => void;
  scheduleTicketVisit: (ticketId: string, date: string) => void;
  notifyAdmin: (message: string) => void;
  updateTicketDetails: (ticketId: string, updates: Partial<Ticket>) => void;
  setTicketPriority: (ticketId: string, priority: TicketPriority) => void;
  setTicketsPriority: (ticketIds: string[], priority: TicketPriority) => void;
  deleteTicket: (ticketId: string) => void;
  registerServiceAccounting: (data: {
    ticketId: string;
    serviceCost: number;
    materialsCost: number;
    notes?: string;
    paymentMethod: Transaction['paymentMethod'];
    referenceNumber?: string;
  }) => void;
  addRepairExpenseToTicket: (data: {
    ticketId: string;
    concept: string;
    amount: number;
    category?: 'materiales' | 'repuestos' | 'mano_obra' | 'emergencia' | 'otro';
    categoryOther?: string;
    notes?: string;
    markAsResolved?: boolean;
    resolutionNotes?: string;
  }) => void;

  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'code'>) => Transaction;
  deleteTransaction: (id: string) => void;

  workerPayouts: WorkerPayout[];
  addWorkerPayout: (data: Omit<WorkerPayout, 'id' | 'code'>) => WorkerPayout;
  updateWorkerPayoutStatus: (id: string, status: 'pagado' | 'pendiente', notes?: string) => void;
  deleteWorkerPayout: (id: string) => void;

  neighborServices: NeighborService[];
  addNeighborService: (service: Omit<NeighborService, 'id'>) => void;
  updateNeighborService: (id: string, updates: Partial<NeighborService>) => void;
  removeNeighborService: (id: string) => void;

  neighborRequests: NeighborServiceRequest[];
  createNeighborRequest: (data: Omit<NeighborServiceRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateNeighborRequest: (id: string, status: NeighborServiceRequest['status'], scheduledDate?: string) => void;
  deleteNeighborRequest: (id: string) => void;

  notifications: PushNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;

  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Role-scoped data views
  accessibleBuildings: Building[];
  accessibleTickets: Ticket[];
  accessibleTransactions: Transaction[];
  communityDirectory: Array<{ id: string; name: string; address: string; city: string; floors: number }>;

  // Active navigation / drilldown state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  adminInboxTarget: AdminInboxTarget;
  setAdminInboxTarget: (target: AdminInboxTarget) => void;
  applyRequestHousingToUser: (requestId: string) => void;

  // In-app interactive Toast notifications
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'alert' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function omitUndefined<T extends object>(obj: T): Partial<T> {
  const next: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    if (obj[key] !== undefined) next[key] = obj[key];
  });
  return next;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial defaults
  const [users, setUsers] = useState<User[]>(() => {
    const alreadyReset = localStorage.getItem(ACCOUNTS_RESET_KEY) === ACCOUNTS_RESET_VALUE;
    if (!alreadyReset) {
      localStorage.setItem('gest_v2_users', JSON.stringify([ADMIN_USER]));
      localStorage.setItem('gest_v2_current_user', JSON.stringify(ADMIN_USER));
      localStorage.setItem('gest_v2_is_authenticated', isSupabaseConfigured ? 'false' : 'true');
      localStorage.setItem(ACCOUNTS_RESET_KEY, ACCOUNTS_RESET_VALUE);
      return [ADMIN_USER];
    }

    const saved = localStorage.getItem('gest_v2_users');
    const loaded: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return withSingleAdmin(loaded);
  });

  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isSupabaseConfigured) return false;
    const saved = localStorage.getItem('gest_v2_is_authenticated');
    return saved !== null ? saved === 'true' : true;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('gest_v2_current_user');
    if (!saved) return ADMIN_USER;
    const u: User = JSON.parse(saved);
    if (isDemoAccount(u)) {
      return ADMIN_USER;
    }
    return {
      ...u,
      name: u.name || u.email?.split('@')[0] || 'Vecino',
      email: u.email || '',
      role: u.role || 'unassigned',
      avatar: u.avatar || ADMIN_USER.avatar,
      phone: u.phone || '+34 600 000 000',
    };
  });
  const usersRef = useRef(users);
  usersRef.current = users;
  const roleDirectoryRef = useRef<RoleDirectoryEntry[]>([]);
  const withDirectory = (list: User[]) =>
    withSingleAdmin(applyRoleDirectory(list, roleDirectoryRef.current));

  // Drop leftover demo accounts without forcing David back as admin
  useEffect(() => {
    const nextUsers = withSingleAdmin(users);
    const usersChanged =
      nextUsers.length !== users.length ||
      nextUsers.some((u, i) => u.id !== users[i]?.id || u.email !== users[i]?.email || u.name !== users[i]?.name || u.role !== users[i]?.role);

    if (usersChanged) {
      setUsers(nextUsers);
      localStorage.setItem('gest_v2_users', JSON.stringify(nextUsers));
    }
  }, [users, currentUser]);

  const addUser = (userData: Omit<User, 'id'>): User => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede dar de alta usuarios.');
      return currentUser;
    }
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    void persistProfile(newUser);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    if (!canEditNeighborFees(currentUser, target)) {
      const isSelf =
        currentUser.id === id ||
        currentUser.email.trim().toLowerCase() === target.email.trim().toLowerCase();
      if (!isSelf) {
        deny('No puedes modificar la cuenta de otro usuario.');
        return;
      }
      const canSetHousing =
        currentUser.role === 'neighbor' ||
        currentUser.role === 'president' ||
        currentUser.role === 'unassigned';
      const housing: Partial<User> = {};
      if (canSetHousing) {
        if (updates.buildingId) {
          const community = buildings.find((b) => b.id === updates.buildingId);
          if (!community) {
            deny('Ese edificio no está registrado.');
            return;
          }
          housing.buildingId = community.id;
          housing.buildingName = community.name;
        }
        if (updates.floor !== undefined) housing.floor = updates.floor;
        if (updates.unitOrArea !== undefined) housing.unitOrArea = updates.unitOrArea;
      }
      updates = omitUndefined({
        phone: updates.phone,
        name: updates.name,
        avatar: updates.avatar,
        ...housing,
      });
      if (canSetHousing && (housing.buildingId || housing.unitOrArea)) {
        publishNotification({
          id: crypto.randomUUID(),
          title: 'Vivienda indicada',
          message: `${currentUser.name} pide ${housing.buildingName || currentUser.buildingName || 'comunidad'} · ${housing.unitOrArea || 'sin número'}. Confírmalo o corrígelo en Usuarios.`,
          type: 'system',
          timestamp: new Date().toISOString(),
          read: false,
          buildingId: housing.buildingId || currentUser.buildingId,
          userId: currentUser.id,
          targetRoles: ['admin'],
        });
      }
    }

    const newUsers = users.map((u) =>
      u.id === id || (target && u.email === target.email) ? { ...u, ...omitUndefined(updates) } : u
    );
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    const persisted = newUsers.find((u) => u.id === id) || newUsers.find((u) => target && u.email === target.email);
    if (
      persisted &&
      (currentUser.id === id ||
        currentUser.email.trim().toLowerCase() === persisted.email.trim().toLowerCase())
    ) {
      setCurrentUser(persisted);
      localStorage.setItem('gest_v2_current_user', JSON.stringify(persisted));
    }
    if (persisted) {
      void persistProfile(persisted).then((result) => {
        if (!result.ok) {
          showToast('No se guardó la cuenta', result.message || 'No se pudo escribir el saldo en el servidor.', 'alert');
        }
      });
    }

    const housingTouched =
      updates.buildingId !== undefined || updates.unitOrArea !== undefined || updates.floor !== undefined;
    if (
      currentUser.role === 'admin' &&
      persisted &&
      persisted.id !== currentUser.id &&
      (persisted.role === 'neighbor' || persisted.role === 'president') &&
      housingTouched &&
      (persisted.buildingId || persisted.unitOrArea)
    ) {
      publishNotification({
        id: crypto.randomUUID(),
        title: 'Tu vivienda está asignada',
        message: `El administrador confirmó tu vivienda: ${persisted.buildingName || 'comunidad'} · ${persisted.unitOrArea || 'sin número'}. Ya aparece en Mi Vivienda.`,
        type: 'system',
        timestamp: new Date().toISOString(),
        read: false,
        buildingId: persisted.buildingId,
        buildingName: persisted.buildingName,
        userId: persisted.id,
        targetRoles: [persisted.role],
      });
    }
  };

  const updateUserRole = (
    id: string,
    newRole: Role,
    extra?: {
      buildingId?: string;
      buildingName?: string;
      specialty?: string;
      unitOrArea?: string;
      floor?: string;
      monthlyFee?: number;
      feeBalance?: number;
      customRoleId?: string;
    }
  ) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede asignar o cambiar roles.');
      return;
    }
    const targetUser = users.find((u) => u.id === id);
    const activeAdmins = users.filter((u) => u.role === 'admin' && u.status !== 'suspended');

    // Protect against having 0 active admins in the system
    if (targetUser?.role === 'admin' && newRole !== 'admin' && activeAdmins.length <= 1) {
      showToast(
        'Acción Requerida',
        'Debe existir al menos un Administrador activo en el sistema. Asigna otro administrador antes de modificar este rol.',
        'alert'
      );
      return;
    }

    const newUsers = users.map((u) => {
      if (u.id === id) {
        const isBuildingRole = newRole === 'president' || newRole === 'neighbor';
        const updated: User = {
          ...u,
          role: newRole,
          buildingId: isBuildingRole ? (extra?.buildingId ?? u.buildingId) : undefined,
          buildingName: isBuildingRole ? (extra?.buildingName ?? u.buildingName) : undefined,
          unitOrArea: isBuildingRole ? (extra?.unitOrArea ?? u.unitOrArea) : undefined,
          floor: isBuildingRole ? (extra?.floor ?? u.floor) : undefined,
          monthlyFee: isBuildingRole ? (extra?.monthlyFee ?? u.monthlyFee ?? (newRole === 'president' ? 95 : 85)) : undefined,
          feeBalance: isBuildingRole ? (extra?.feeBalance ?? u.feeBalance ?? 0) : undefined,
          feeFrequency: isBuildingRole ? (u.feeFrequency || 'mensual') : undefined,
          lastPaymentAmount: isBuildingRole ? (u.lastPaymentAmount ?? (newRole === 'president' ? 95 : 85)) : undefined,
          lastPaymentDate: isBuildingRole ? (u.lastPaymentDate || todayIso()) : undefined,
          lastPaymentConcept: isBuildingRole ? (u.lastPaymentConcept || 'Cuota de comunidad') : undefined,
          nextDueDate: isBuildingRole ? (u.nextDueDate || nextMonthFifthIso()) : undefined,
          taxReturnsRemaining: isBuildingRole ? (u.taxReturnsRemaining ?? 2) : undefined,
          specialty: newRole === 'worker' ? (extra?.specialty || u.specialty || 'Mantenimiento General') : undefined,
        };
        return updated;
      }
      return u;
    });

    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    roleDirectoryRef.current = toRoleDirectory(newUsers);
    void saveShared('role_directory', roleDirectoryRef.current);

    const persisted = newUsers.find((u) => u.id === id);
    const assignedEmail = (persisted || targetUser)?.email.trim().toLowerCase();
    if (assignedEmail) {
      setCustomRoles((prev) =>
        prev.map((r) => {
          const without = r.memberEmails.filter((e) => e !== assignedEmail);
          if (extra?.customRoleId && r.id === extra.customRoleId) {
            return { ...r, memberEmails: [...without, assignedEmail] };
          }
          return { ...r, memberEmails: without };
        })
      );
    }
    if (persisted?.role === 'president' && persisted.buildingId) {
      setBuildings((prev) =>
        prev.map((b) => {
          if (b.id === persisted.buildingId) {
            return {
              ...b,
              presidentId: persisted.id,
              presidentName: persisted.name,
              presidentPhone: persisted.phone,
              presidentEmail: persisted.email,
              presidentUnitOrArea: persisted.unitOrArea,
            };
          }
          if (b.presidentId === persisted.id && b.id !== persisted.buildingId) {
            return {
              ...b,
              presidentId: '',
              presidentName: 'Sin asignar',
              presidentPhone: '',
              presidentEmail: '',
              presidentUnitOrArea: '',
            };
          }
          return b;
        })
      );
    }
    if (
      persisted &&
      (currentUser.id === id ||
        currentUser.email.trim().toLowerCase() === persisted.email.trim().toLowerCase())
    ) {
      setCurrentUser(persisted);
      localStorage.setItem('gest_v2_current_user', JSON.stringify(persisted));
    }
    if (persisted) {
      void clearRevocation(persisted.email);
      void persistProfile(persisted).then((result) => {
        if (!result.ok) {
          showToast(
            'Rol actualizado en el panel',
            'La asignación ya vale para entrar. Si el perfil de Supabase no se guardó, ejecuta supabase/profiles.sql.',
            'info'
          );
          return;
        }
        showToast('Rol Actualizado', `${persisted.name} ahora es ${persisted.role}.`, 'success');
        if (persisted.role === 'neighbor' || persisted.role === 'president') {
          publishNotification({
            id: crypto.randomUUID(),
            title: persisted.unitOrArea ? 'Rol y vivienda asignados' : 'Tu rol ha sido asignado',
            message: persisted.unitOrArea
              ? `Ya eres ${persisted.role === 'president' ? 'presidente' : 'vecino'} de ${persisted.buildingName || 'tu comunidad'} · ${persisted.unitOrArea}.`
              : `El administrador te asignó el rol de ${persisted.role === 'president' ? 'presidente' : 'vecino'}. Completa tu vivienda en el panel.`,
            type: 'system',
            timestamp: new Date().toISOString(),
            read: false,
            buildingId: persisted.buildingId,
            buildingName: persisted.buildingName,
            userId: persisted.id,
            targetRoles: [persisted.role],
          });
        }
        if (persisted.role === 'worker') {
          publishNotification({
            id: crypto.randomUUID(),
            title: 'Ya eres operario',
            message: `El administrador te asignó como trabajador${persisted.specialty ? ` (${persisted.specialty})` : ''}. Te llegarán las visitas e incidencias.`,
            type: 'system',
            timestamp: new Date().toISOString(),
            read: false,
            userId: persisted.id,
            targetRoles: ['worker'],
          });
        }
      });
      return;
    }
    showToast('Rol Actualizado', 'Se han actualizado libremente los permisos del usuario', 'success');
  };

  const toggleUserStatus = (id: string) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede activar o suspender cuentas.');
      return;
    }
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    if (isLastActiveAdmin(targetUser, users)) {
      showToast('Acción Bloqueada', 'No puedes suspender al único administrador activo.', 'alert');
      return;
    }

    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    const newUsers = users.map(u => u.id === id ? { ...u, status: newStatus } : u);
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    const updated = newUsers.find((u) => u.id === id);
    if (updated) {
      void persistProfile(updated);
    }

    if (currentUser.id === id && newStatus === 'suspended') {
      setIsAuthenticated(false);
      localStorage.setItem('gest_v2_is_authenticated', 'false');
      showToast('Acceso Suspendido', 'Tu cuenta ha sido desactivada.', 'alert');
      return;
    }

    showToast(
      newStatus === 'suspended' ? 'Usuario Desactivado' : 'Usuario Activado',
      `La cuenta de ${targetUser.name} ahora está ${newStatus === 'suspended' ? 'suspendida/inactiva' : 'activa'}`,
      newStatus === 'suspended' ? 'alert' : 'success'
    );
  };

  const revokeBuildingAssignment = (userId: string) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede revocar asignaciones.');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const newUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          buildingId: undefined,
          buildingName: undefined,
        };
      }
      return u;
    });
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));

    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, buildingId: undefined, buildingName: undefined }));
    }

    showToast('Asignación Revocada', `Se desvinculó el edificio asignado a ${targetUser.name}`, 'info');
  };

  const deleteUser = (id: string) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede eliminar cuentas.');
      return;
    }
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) return;
    if (isLastActiveAdmin(userToDelete, users)) {
      showToast(
        'Acción Bloqueada',
        'No puedes eliminar al único administrador. Asigna otro admin antes de quitar este acceso.',
        'alert'
      );
      return;
    }
    const newUsers = users.filter((u) => u.id !== id);
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    void revokeAccess(userToDelete.email);
    if (supabase && /^[0-9a-f-]{36}$/i.test(userToDelete.id)) {
      void supabase.from('profiles').delete().eq('id', userToDelete.id);
    }

    const deletedIsSelf =
      currentUser.id === id ||
      currentUser.email.trim().toLowerCase() === userToDelete.email.trim().toLowerCase();
    if (deletedIsSelf) {
      void supabase?.auth.signOut();
      setIsAuthenticated(false);
      localStorage.setItem('gest_v2_is_authenticated', 'false');
      showToast('Acceso eliminado', 'Esta cuenta ya no tiene acceso a SOFER Gestión.', 'alert');
      return;
    }
    showToast('Usuario Eliminado', `${userToDelete.name} perdió todo el acceso al sistema.`, 'info');
  };

  const restoreAccess = async (email: string) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede reactivar cuentas.');
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    await clearRevocation(normalized);
    showToast(
      'Cuenta reactivada',
      `${normalized} ya puede iniciar sesión otra vez con Google. Entrará sin rol hasta que se lo asignes.`,
      'success'
    );
  };

  const loginWithEmail = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    if (supabase) {
      if (!password) {
        return { success: false, message: 'Introduce tu contraseña.' };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true };
    }

    const cleanEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (!foundUser) {
      return {
        success: false,
        message: 'No existe ninguna cuenta registrada con este correo electrónico. Por favor regístrate.',
      };
    }

    if (foundUser.status === 'suspended') {
      return {
        success: false,
        message: 'Esta cuenta ha sido desactivada/suspendida por el Administrador. Contacta a soporte.',
      };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    localStorage.setItem('gest_v2_is_authenticated', 'true');
    localStorage.setItem('gest_v2_current_user', JSON.stringify(foundUser));
    showToast('Sesión Iniciada', `¡Bienvenido de nuevo, ${foundUser.name}!`, 'success');
    return { success: true };
  };

  const loginWithGoogle = (
    googleData: {
      id?: string;
      name: string;
      email: string;
      avatar?: string;
      role?: Role;
      buildingId?: string;
      specialty?: string;
      provider?: 'email' | 'google';
    },
    silent = false
  ): { success: boolean; message?: string } => {
    const cleanEmail = googleData.email.trim().toLowerCase();
    const latestUsers = usersRef.current;
    const existing = latestUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.status === 'suspended') {
        return {
          success: false,
          message: 'Esta cuenta de Google está suspendida en el sistema.',
        };
      }
      const nextId =
        googleData.id && /^[0-9a-f-]{36}$/i.test(googleData.id) ? googleData.id : existing.id;
      const nextUser = {
        ...existing,
        id: nextId,
        name: googleData.name || existing.name,
        avatar: googleData.avatar || existing.avatar,
        provider: googleData.provider || existing.provider || 'google',
        role: googleData.role || existing.role,
        buildingId: googleData.buildingId ?? existing.buildingId,
        specialty: googleData.specialty || existing.specialty,
      };
      if (nextId !== existing.id || nextUser.role !== existing.role) {
        const synced = latestUsers.map((u) => (u.id === existing.id ? nextUser : u));
        setUsers(synced);
        localStorage.setItem('gest_v2_users', JSON.stringify(synced));
      }
      setCurrentUser(nextUser);
      setIsAuthenticated(true);
      localStorage.setItem('gest_v2_is_authenticated', 'true');
      localStorage.setItem('gest_v2_current_user', JSON.stringify(nextUser));
      if (!silent) {
        showToast('Google Sign-In', `¡Bienvenido de vuelta con Google, ${nextUser.name}!`, 'success');
      }
      return { success: true };
    }

    let assignedBuildingName: string | undefined = undefined;
    if (googleData.buildingId) {
      const b = buildings.find(b => b.id === googleData.buildingId);
      assignedBuildingName = b?.name;
    }

    const hasActiveAdmin = latestUsers.some((u) => u.role === 'admin' && u.status !== 'suspended');
    const bootstrapAdmin = !hasActiveAdmin && cleanEmail === ADMIN_USER.email.toLowerCase();
    const newUser: User = {
      id: googleData.id && /^[0-9a-f-]{36}$/i.test(googleData.id) ? googleData.id : `user-google-${Date.now()}`,
      name: googleData.name || (bootstrapAdmin ? ADMIN_USER.name : cleanEmail.split('@')[0]),
      email: cleanEmail,
      role: bootstrapAdmin ? 'admin' : googleData.role || 'unassigned',
      avatar: googleData.avatar || ADMIN_USER.avatar,
      phone: '+34 600 000 000',
      buildingId: googleData.buildingId,
      buildingName: assignedBuildingName,
      specialty: googleData.specialty,
      provider: googleData.provider || 'google',
      status: 'active',
    };

    const newUsers = [...latestUsers.filter((u) => u.email.trim().toLowerCase() !== cleanEmail), newUser];
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('gest_v2_is_authenticated', 'true');
    localStorage.setItem('gest_v2_current_user', JSON.stringify(newUser));
    if (!silent) {
      showToast(
        bootstrapAdmin ? 'Sesión Iniciada' : 'Cuenta Creada con Google',
        bootstrapAdmin ? `¡Bienvenido, ${newUser.name}!` : `Cuenta de ${newUser.name} registrada. El administrador asignará tu rol.`,
        'success'
      );
    }
    return { success: true };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) {
      return {
        success: false,
        message: 'Falta configurar Supabase. Crea .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY y reinicia Vite.',
      };
    }
    if (!googleClientId) {
      return {
        success: false,
        message: 'Falta VITE_GOOGLE_CLIENT_ID. El login no usará el callback de Supabase.',
      };
    }
    try {
      const token = await requestGoogleIdToken(googleClientId);
      return signInWithGoogleCredential(token);
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google',
      };
    }
  };

  const signInWithGoogleCredential = async (
    token: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!supabase) {
      return { success: false, message: 'Falta configurar Supabase.' };
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  };

  const registerUser = async (userData: {
    name: string;
    email: string;
    password?: string;
    role: Role;
    phone?: string;
    buildingId?: string;
    specialty?: string;
    provider?: 'email' | 'google';
    status?: 'active' | 'suspended';
  }): Promise<{ success: boolean; message?: string }> => {
    if (supabase) {
      if (!userData.password || userData.password.length < 6) {
        return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            phone: userData.phone,
          },
        },
      });
      if (error) {
        return { success: false, message: error.message };
      }
      if (!data.session) {
        return {
          success: true,
          message: 'Cuenta creada. Si Supabase pide confirmación, revisa tu correo antes de entrar.',
        };
      }
      return { success: true };
    }

    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'Ya existe un usuario registrado con este correo electrónico.',
      };
    }

    let assignedBuildingName: string | undefined = undefined;
    if (userData.buildingId) {
      const b = buildings.find(b => b.id === userData.buildingId);
      assignedBuildingName = b?.name;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: cleanEmail,
      role: userData.role,
      avatar: userData.provider === 'google'
        ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
        : `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      phone: userData.phone || '+34 600 000 000',
      buildingId: userData.buildingId,
      buildingName: assignedBuildingName,
      specialty: userData.specialty || (userData.role === 'worker' ? 'Mantenimiento General' : undefined),
      provider: userData.provider || 'email',
      status: userData.status || 'active',
    };

    const newUsers = [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('gest_v2_is_authenticated', 'true');
    localStorage.setItem('gest_v2_current_user', JSON.stringify(newUser));
    showToast('Registro Completado', `¡Cuenta de ${newUser.name} creada correctamente!`, 'success');
    return { success: true };
  };

  const logout = () => {
    clearWelcomeShown();
    void supabase?.auth.signOut();
    setIsAuthenticated(false);
    localStorage.setItem('gest_v2_is_authenticated', 'false');
    showToast('Sesión Cerrada', 'Has salido de tu cuenta de SOFER Gestión', 'info');
  };

  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem('gest_v2_buildings');
    if (saved) {
      try {
        const parsed: Building[] = JSON.parse(saved);
        return stripDemoBuildings(parsed).map((b) => ({
          ...b,
          commonAreas: b.commonAreas || [],
          floorUtilityBills: b.floorUtilityBills || [],
        }));
      } catch (e) {
        console.error('Error parsing buildings from localStorage', e);
      }
    }
    return [];
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('gest_v2_tickets');
    return saved ? stripDemoTickets(JSON.parse(saved)) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gest_v2_transactions');
    return saved ? stripDemoTransactions(JSON.parse(saved)) : [];
  });

  const [workerPayouts, setWorkerPayouts] = useState<WorkerPayout[]>(() => {
    const saved = localStorage.getItem('gest_v2_worker_payouts');
    return saved ? stripDemoPayouts(JSON.parse(saved)) : [];
  });

  const [neighborServices, setNeighborServices] = useState<NeighborService[]>(() => {
    const saved = localStorage.getItem('gest_v2_neighbor_services');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_NEIGHBOR_SERVICES.length) {
          return parsed;
        }
        const existingIds = new Set(parsed.map((s: any) => s.id));
        const newOnes = INITIAL_NEIGHBOR_SERVICES.filter((s) => !existingIds.has(s.id));
        return [...parsed, ...newOnes];
      } catch (e) {
        return INITIAL_NEIGHBOR_SERVICES;
      }
    }
    return INITIAL_NEIGHBOR_SERVICES;
  });

  const [neighborRequests, setNeighborRequests] = useState<NeighborServiceRequest[]>(() => {
    const saved = localStorage.getItem('gest_v2_neighbor_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? stripDemoRequests(parsed) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('gest_v2_custom_roles');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('gest_v2_notifications');
    const parsed: PushNotification[] = saved ? JSON.parse(saved) : [];
    const seed = stripDemoNotifications(parsed);
    const current = (() => {
      try {
        const raw = localStorage.getItem('gest_v2_current_user');
        return raw ? (JSON.parse(raw) as { email?: string }) : null;
      } catch {
        return null;
      }
    })();
    return withLocalReads(seed, loadReadNotificationIds(current?.email || ''));
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gest_v2_notif_sound') !== 'off';
    } catch {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminInboxTarget, setAdminInboxTarget] = useState<AdminInboxTarget>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const currentRoleRef = useRef(currentUser.role);
  currentRoleRef.current = currentUser.role;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const sharedReadyRef = useRef(false);
  const lastSharedJsonRef = useRef<Partial<Record<SharedKey, string>>>({});
  const buildingsRef = useRef(buildings);
  buildingsRef.current = buildings;
  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const workerPayoutsRef = useRef(workerPayouts);
  workerPayoutsRef.current = workerPayouts;
  const neighborServicesRef = useRef(neighborServices);
  neighborServicesRef.current = neighborServices;
  const neighborRequestsRef = useRef(neighborRequests);
  neighborRequestsRef.current = neighborRequests;
  const customRolesRef = useRef(customRoles);
  customRolesRef.current = customRoles;


  const applySharedPayload = (key: SharedKey, payload: unknown[]) => {
    const json = stableJson(payload);
    if (lastSharedJsonRef.current[key] === json) return;
    lastSharedJsonRef.current[key] = json;
    switch (key) {
      case 'buildings':
        setBuildings(stripDemoBuildings(payload as Building[]));
        break;
      case 'tickets':
        setTickets(stripDemoTickets(payload as Ticket[]));
        break;
      case 'transactions':
        setTransactions(stripDemoTransactions(payload as Transaction[]));
        break;
      case 'worker_payouts':
        setWorkerPayouts(stripDemoPayouts(payload as WorkerPayout[]));
        break;
      case 'neighbor_services':
        setNeighborServices(payload as NeighborService[]);
        break;
      case 'neighbor_requests':
        setNeighborRequests(stripDemoRequests(payload as NeighborServiceRequest[]));
        break;
      case 'custom_roles':
        setCustomRoles(
          (payload as CustomRole[]).map((r) => ({
            ...r,
            memberEmails: Array.isArray(r.memberEmails) ? r.memberEmails : [],
          }))
        );
        break;
      case 'role_directory': {
        const directory = payload as RoleDirectoryEntry[];
        roleDirectoryRef.current = directory;
        setUsers((prev) => {
          const merged = withDirectory(prev);
          localStorage.setItem('gest_v2_users', JSON.stringify(merged));
          return merged;
        });
        setCurrentUser((prev) => {
          const entry = directory.find((row) => row.email === prev.email.trim().toLowerCase());
          if (!entry || entry.role === prev.role) return prev;
          const synced = {
            ...prev,
            role: entry.role,
            name: entry.name || prev.name,
            buildingId: entry.buildingId ?? prev.buildingId,
            buildingName: entry.buildingName ?? prev.buildingName,
            specialty: entry.specialty ?? prev.specialty,
            unitOrArea: entry.unitOrArea ?? prev.unitOrArea,
            floor: entry.floor ?? prev.floor,
            status: entry.status ?? prev.status,
          };
          localStorage.setItem('gest_v2_current_user', JSON.stringify(synced));
          return synced;
        });
        break;
      }
    }
  };

  const pushSharedPayload = (key: SharedKey, payload: unknown[]) => {
    const json = stableJson(payload);
    if (lastSharedJsonRef.current[key] === json) return;
    if (payload.length === 0 && lastSharedJsonRef.current[key] === undefined) return;
    lastSharedJsonRef.current[key] = json;
    void saveShared(key, payload);
  };

  const flushSharedNow = (key: SharedKey, payload: unknown[]) => {
    lastSharedJsonRef.current[key] = stableJson(payload);
    void saveShared(key, payload);
  };

  const localSharedFor = (key: SharedKey): unknown[] => {
    switch (key) {
      case 'buildings':
        return buildingsRef.current;
      case 'tickets':
        return ticketsRef.current;
      case 'transactions':
        return transactionsRef.current;
      case 'worker_payouts':
        return workerPayoutsRef.current;
      case 'neighbor_services':
        return neighborServicesRef.current;
      case 'neighbor_requests':
        return neighborRequestsRef.current;
      case 'custom_roles':
        return customRolesRef.current;
      case 'role_directory':
        return toRoleDirectory(usersRef.current);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gest_v2_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('gest_v2_buildings', JSON.stringify(buildings));
    pushSharedPayload('buildings', buildings);
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem('gest_v2_tickets', JSON.stringify(tickets));
    pushSharedPayload('tickets', tickets);
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('gest_v2_transactions', JSON.stringify(transactions));
    pushSharedPayload('transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gest_v2_worker_payouts', JSON.stringify(workerPayouts));
    pushSharedPayload('worker_payouts', workerPayouts);
  }, [workerPayouts]);

  useEffect(() => {
    localStorage.setItem('gest_v2_neighbor_services', JSON.stringify(neighborServices));
    pushSharedPayload('neighbor_services', neighborServices);
  }, [neighborServices]);

  useEffect(() => {
    localStorage.setItem('gest_v2_neighbor_requests', JSON.stringify(neighborRequests));
    pushSharedPayload('neighbor_requests', neighborRequests);
  }, [neighborRequests]);

  useEffect(() => {
    localStorage.setItem('gest_v2_custom_roles', JSON.stringify(customRoles));
    pushSharedPayload('custom_roles', customRoles);
  }, [customRoles]);

  useEffect(() => {
    const directory = toRoleDirectory(users);
    roleDirectoryRef.current = directory;
    localStorage.setItem('gest_v2_users', JSON.stringify(users));
    pushSharedPayload('role_directory', directory);
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gest_v2_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('gest_v2_notif_sound', soundEnabled ? 'on' : 'off');
  }, [soundEnabled]);

  // Request browser notification permissions on mount
  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  const welcomeUserIdRef = useRef<string | null>(null);

  const markWelcomeShown = (userId: string) => {
    welcomeUserIdRef.current = userId;
    try {
      sessionStorage.setItem('sofer_welcome_user', userId);
    } catch {
      /* ignore */
    }
  };

  const wasWelcomeShown = (userId: string) => {
    if (welcomeUserIdRef.current === userId) return true;
    try {
      return sessionStorage.getItem('sofer_welcome_user') === userId;
    } catch {
      return false;
    }
  };

  const clearWelcomeShown = () => {
    welcomeUserIdRef.current = null;
    try {
      sessionStorage.removeItem('sofer_welcome_user');
    } catch {
      /* ignore */
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }].slice(-4));

    if (soundEnabled) {
      playNotificationSound(type);
    }
    sendBrowserPushNotification(title, message);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const deny = (message: string) => {
    showToast('Permiso denegado', message, 'alert');
    return true;
  };

  const publishNotification = (notif: PushNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 120);
    });
    void insertInbox(notif);
  };

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    const applySession = (session: Session | null, silent: boolean) => {
      if (!session?.user?.email) {
        return;
      }
      const meta = session.user.user_metadata || {};
      const provider = session.user.app_metadata?.provider === 'google' ? 'google' : 'email';
      const email = session.user.email;
      void (async () => {
        if (await isEmailRevoked(email)) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          localStorage.setItem('gest_v2_is_authenticated', 'false');
          showToast('Acceso denegado', 'Esta cuenta fue eliminada y ya no tiene acceso a SOFER Gestión.', 'alert');
          return;
        }
        await ensureSelfAdmin();
        let remote = await fetchProfiles();
        const selfRemote = remote.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
        loginWithGoogle(
          {
            id: session.user.id,
            name: meta.full_name || meta.name || email,
            email,
            avatar: meta.avatar_url || meta.picture,
            provider,
            role: selfRemote?.role,
            buildingId: selfRemote?.buildingId,
            specialty: selfRemote?.specialty,
          },
          silent
        );
        const pendingUser: User = {
          id: session.user.id,
          name: selfRemote?.name || meta.full_name || meta.name || email,
          email,
          role: selfRemote?.role || 'unassigned',
          avatar: meta.avatar_url || meta.picture || selfRemote?.avatar || ADMIN_USER.avatar,
          phone: selfRemote?.phone || '+34 600 000 000',
          provider,
          status: selfRemote?.status || 'active',
          buildingId: selfRemote?.buildingId,
          buildingName: selfRemote?.buildingName,
          specialty: selfRemote?.specialty,
          unitOrArea: selfRemote?.unitOrArea,
          floor: selfRemote?.floor,
        };
        const result = await upsertProfile(pendingUser, session.user.id);
        if (result.created) {
          publishNotification({
            id: crypto.randomUUID(),
            title: 'Nueva solicitud de acceso',
            message: `${pendingUser.name} (${email}) espera un rol. Ábrelo en Usuarios para asignarle vecino/presidente y su vivienda.`,
            type: 'system',
            timestamp: new Date().toISOString(),
            read: false,
            userId: pendingUser.id,
            targetRoles: ['admin'],
          });
        }
        remote = await fetchProfiles();
        if (!remote.length) {
          setCurrentUser((prev) => withDirectory([prev])[0] || prev);
          return;
        }
        setUsers((prev) => {
          const merged = withDirectory(mergeUsersByEmail(prev, remote));
          localStorage.setItem('gest_v2_users', JSON.stringify(merged));
          const self = merged.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
          if (self) {
            setCurrentUser(self);
            localStorage.setItem('gest_v2_current_user', JSON.stringify(self));
          }
          return merged;
        });
      })();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user?.id) markWelcomeShown(session.user.id);
        if (session) applySession(session, true);
        setAuthReady(true);
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        const alreadyWelcomed = Boolean(session.user.id && wasWelcomeShown(session.user.id));
        if (session.user.id) markWelcomeShown(session.user.id);
        applySession(session, alreadyWelcomed);
        return;
      }
      if (event === 'SIGNED_OUT') {
        clearWelcomeShown();
        setIsAuthenticated(false);
        localStorage.setItem('gest_v2_is_authenticated', 'false');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        const row = payload.new as { role?: string; name?: string; email?: string } | undefined;
        if (
          payload.eventType === 'INSERT' &&
          row?.role === 'unassigned' &&
          currentRoleRef.current === 'admin'
        ) {
          showToast(
            'Nueva solicitud de acceso',
            `${row.name || row.email} espera que le asignes un rol.`,
            'info'
          );
        }
        void fetchProfiles().then((remote) => {
          if (!remote.length) return;
          setUsers((prev) => {
            const merged = withDirectory(mergeUsersByEmail(prev, remote));
            localStorage.setItem('gest_v2_users', JSON.stringify(merged));
            return merged;
          });
          setCurrentUser((prev) => {
            const next = remote.find((u) => u.email.trim().toLowerCase() === prev.email.trim().toLowerCase());
            const fromDir = roleDirectoryRef.current.find(
              (row) => row.email === prev.email.trim().toLowerCase()
            );
            if (!next && !fromDir) return prev;
            const synced = withDirectory([
              {
                ...prev,
                ...(next || {}),
                id: prev.id || next?.id,
                role: fromDir?.role || next?.role || prev.role,
              },
            ])[0];
            if (!synced || (synced.role === prev.role && synced.buildingId === prev.buildingId && synced.name === prev.name)) {
              return prev;
            }
            localStorage.setItem('gest_v2_current_user', JSON.stringify(synced));
            return synced;
          });
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const pullInbox = () => {
      void fetchInbox().then((items) => {
        if (!items.length) return;
        const readIds = loadReadNotificationIds(currentUser.email);
        setNotifications((prev) => mergeNotificationLists(prev, items, readIds));
      });
    };

    pullInbox();
    const inboxChannel = supabase
      .channel('inbox-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_notifications' }, (payload) => {
        const notif = remoteToNotification(payload.new as Parameters<typeof remoteToNotification>[0]);
        const readIds = loadReadNotificationIds(currentUserRef.current.email);
        let added = false;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id || (n.title === notif.title && n.message === notif.message))) {
            return prev;
          }
          added = true;
          return withLocalReads([notif, ...prev], readIds);
        });
        if (added && isNotificationForUser(notif, currentUserRef.current)) {
          showToast(notif.title, notif.message, 'info');
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(inboxChannel);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!supabase || !isAuthenticated) {
      sharedReadyRef.current = false;
      return;
    }
    let cancelled = false;
    const hydrate = async () => {
      const remote = await fetchSharedMap();
      if (cancelled) return;
      for (const key of SHARED_KEYS) {
        const remotePayload = remote[key];
        if (remotePayload) {
          applySharedPayload(key, remotePayload);
        } else {
          const local = localSharedFor(key);
          if (local.length > 0) {
            lastSharedJsonRef.current[key] = stableJson(local);
            void saveShared(key, local);
          }
        }
      }
      sharedReadyRef.current = true;
    };
    void hydrate();
    const stop = subscribeShared((key, payload) => {
      if (!cancelled) applySharedPayload(key, payload);
    });
    return () => {
      cancelled = true;
      sharedReadyRef.current = false;
      stop();
    };
  }, [isAuthenticated]);

  const refreshDirectory = useCallback(async () => {
    const remote = await fetchProfiles();
    setUsers((prev) => {
      const merged = withDirectory(remote.length ? mergeUsersByEmail(prev, remote) : prev);
      localStorage.setItem('gest_v2_users', JSON.stringify(merged));
      return merged;
    });
    setCurrentUser((prev) => {
      const next = remote.find((u) => u.email.trim().toLowerCase() === prev.email.trim().toLowerCase());
      const synced = withDirectory([{ ...prev, ...(next || {}), id: prev.id || next?.id }])[0];
      if (!synced) return prev;
      if (synced.role === prev.role && synced.buildingId === prev.buildingId && synced.name === prev.name) return prev;
      localStorage.setItem('gest_v2_current_user', JSON.stringify(synced));
      return synced;
    });
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshDirectory();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const tick = () => {
      if (currentUser.role === 'admin' || currentUser.role === 'unassigned') {
        void refreshDirectory();
      }
      void fetchInbox().then((items) => {
        if (!items.length) return;
        const readIds = loadReadNotificationIds(currentUser.email);
        setNotifications((prev) => mergeNotificationLists(prev, items, readIds));
      });
      void fetchSharedMap().then((remote) => {
        SHARED_KEYS.forEach((key) => {
          const payload = remote[key];
          if (payload) applySharedPayload(key, payload);
        });
      });
    };
    tick();
    const id = window.setInterval(tick, currentUser.role === 'unassigned' ? 4000 : 15000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, currentUser.role, currentUser.email, refreshDirectory]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Building Actions
  const addBuilding = (buildingData: Omit<Building, 'id' | 'createdAt'>): Building => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede registrar edificios.');
      return { ...buildingData, id: '', createdAt: '' };
    }
    const id = `bldg-${Date.now()}`;
    const newBuilding: Building = {
      ...buildingData,
      id,
      createdAt: new Date().toISOString().slice(0, 10),
      repairFund: buildingData.repairFund ?? 0,
      initialRepairFund: buildingData.initialRepairFund ?? 0,
      presidentName: buildingData.presidentName?.trim() || 'Sin asignar',
      presidentPhone: buildingData.presidentPhone || '',
      presidentEmail: buildingData.presidentEmail || '',
      presidentId: buildingData.presidentId || '',
    };

    setBuildings((prev) => {
      const next = [newBuilding, ...prev];
      buildingsRef.current = next;
      flushSharedNow('buildings', next);
      return next;
    });

    // Aviso a todos los roles: la finca ya está en el listado compartido.
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: '🏢 Nuevo Edificio Añadido',
      message: `Se ha dado de alta el edificio "${newBuilding.name}" con ${newBuilding.totalUnits} viviendas.`,
      type: 'system',
      buildingId: newBuilding.id,
      buildingName: newBuilding.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president', 'worker', 'neighbor'],
    };
    publishNotification(notif);
    showToast('Edificio Registrado', `Se agregó exitosamente "${newBuilding.name}" al catálogo.`, 'success');

    return newBuilding;
  };

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede editar edificios.');
      return;
    }
    setBuildings((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      buildingsRef.current = next;
      flushSharedNow('buildings', next);
      return next;
    });
    showToast('Edificio Actualizado', 'Los datos del inmueble han sido guardados.', 'success');
  };

  const deleteBuilding = (id: string) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede eliminar edificios.');
      return;
    }
    const bldg = buildings.find((b) => b.id === id);
    if (!bldg) return;

    setBuildings((prev) => prev.filter((b) => b.id !== id));
    // Also remove tickets and transactions or keep them isolated
    showToast('Edificio Removido', `El edificio "${bldg.name}" ha sido eliminado del sistema.`, 'alert');
  };

  const resetBuildingOperations = (buildingId: string) => {
    if (!canResetFinances(currentUser)) {
      deny('Solo el administrador puede poner a cero los balances.');
      return;
    }
    const bldg = buildings.find((b) => b.id === buildingId);
    if (!bldg) return;
    setTransactions((prev) => prev.filter((t) => t.buildingId !== buildingId));
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId ? { ...b, repairFund: 0, initialRepairFund: 0, exceptionalExpenses: [] } : b
      )
    );
    setUsers((prev) =>
      prev.map((u) => (u.buildingId === buildingId ? { ...u, feeBalance: 0 } : u))
    );
    showToast(
      'Balances reiniciados',
      `Se eliminaron los movimientos y se pusieron a cero las cajas y cuotas de ${bldg.name}. Las incidencias abiertas se mantienen.`,
      'alert'
    );
  };

  const resetAllOperations = () => {
    if (!canResetFinances(currentUser)) {
      deny('Solo el administrador puede vaciar todos los balances.');
      return;
    }
    setTransactions([]);
    setBuildings((prev) =>
      prev.map((b) => ({ ...b, repairFund: 0, initialRepairFund: 0, exceptionalExpenses: [] }))
    );
    setUsers((prev) => prev.map((u) => ({ ...u, feeBalance: 0 })));
    showToast(
      'Balances en limpio',
      'Se eliminaron los balances generales, movimientos, cajas de reparación y saldos de cuota. Las incidencias no se borran: elimina las resueltas una a una.',
      'alert'
    );
  };

  const getBuildingById = (id: string) => {
    const bldg = buildings.find((b) => b.id === id);
    if (!bldg) return undefined;
    if (currentUser.role === 'admin' || currentUser.role === 'worker') return bldg;
    if (currentUser.role === 'president' && (bldg.id === currentUser.buildingId || bldg.presidentId === currentUser.id)) {
      return bldg;
    }
    if (currentUser.role === 'neighbor' && bldg.id === currentUser.buildingId) return bldg;
    return undefined;
  };

  const adjustBuildingRepairFund = (buildingId: string, newAmount: number, reason: string) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede ajustar la caja de reparaciones desde el panel.');
      return;
    }
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, repairFund: newAmount } : b))
    );
    const bldg = buildings.find((b) => b.id === buildingId);
    showToast(
      'Incidencias Generales Ajustada',
      `Fondo de ${bldg?.name || 'Edificio'} actualizado a €${(Number(newAmount) || 0).toLocaleString()}. Motivo: ${reason}`,
      'info'
    );
  };

  // Common Areas Actions (Admin Only Management)
  const addCommonArea = (buildingId: string, areaData: Omit<CommonArea, 'id' | 'createdAt'>) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede agregar áreas comunes.', 'alert');
      return;
    }

    const newArea: CommonArea = {
      ...areaData,
      id: `ca-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          const currentAreas = b.commonAreas || [];
          return { ...b, commonAreas: [...currentAreas, newArea] };
        }
        return b;
      })
    );

    const bldg = buildings.find((b) => b.id === buildingId);
    showToast('Área Común Agregada', `Se registró "${newArea.name}" en ${bldg?.name || 'el edificio'}.`, 'success');
  };

  const updateCommonArea = (buildingId: string, areaId: string, updates: Partial<CommonArea>) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede modificar áreas comunes.', 'alert');
      return;
    }

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          const updatedAreas = (b.commonAreas || []).map((area) =>
            area.id === areaId ? { ...area, ...updates } : area
          );
          return { ...b, commonAreas: updatedAreas };
        }
        return b;
      })
    );

    showToast('Área Común Actualizada', 'Los cambios en el área común fueron guardados.', 'info');
  };

  const removeCommonArea = (buildingId: string, areaId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede eliminar áreas comunes.', 'alert');
      return;
    }

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          return {
            ...b,
            commonAreas: (b.commonAreas || []).filter((a) => a.id !== areaId),
          };
        }
        return b;
      })
    );

    showToast('Área Común Eliminada', 'El área común ha sido removida del edificio.', 'alert');
  };

  // Floor Utility Bills Actions (Gas, Agua, Internet, etc. - Admin Only Management)
  const addFloorUtilityBill = (
    buildingId: string,
    billData: Omit<FloorUtilityBill, 'id' | 'createdAt'>
  ) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede registrar contratos de suministros.', 'alert');
      return;
    }

    const newBill: FloorUtilityBill = {
      ...billData,
      id: `fub-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          const currentBills = b.floorUtilityBills || [];
          return { ...b, floorUtilityBills: [...currentBills, newBill] };
        }
        return b;
      })
    );

    const bldg = buildings.find((b) => b.id === buildingId);
    // Push notification
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: `⚡ Factura de Suministro: ${newBill.serviceType.toUpperCase()} (${newBill.floor})`,
      message: `Contrato ${newBill.contractNumber} con ${newBill.companyName} por €${newBill.monthlyAmount}/mes en ${bldg?.name || 'el edificio'}.`,
      type: 'system',
      buildingId,
      buildingName: bldg?.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    publishNotification(notif);

    showToast(
      'Factura de Suministro Registrada',
      `Contrato de ${newBill.serviceType.toUpperCase()} (${newBill.floor}) con ${newBill.companyName} registrado con éxito (€${newBill.monthlyAmount}/mes).`,
      'success'
    );
  };

  const updateFloorUtilityBill = (
    buildingId: string,
    billId: string,
    updates: Partial<FloorUtilityBill>
  ) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede editar facturas de suministros.', 'alert');
      return;
    }

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          const updatedBills = (b.floorUtilityBills || []).map((bill) =>
            bill.id === billId ? { ...bill, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : bill
          );
          return { ...b, floorUtilityBills: updatedBills };
        }
        return b;
      })
    );

    showToast('Contrato de Suministro Actualizado', 'Los datos de la factura/contrato han sido actualizados.', 'info');
  };

  const removeFloorUtilityBill = (buildingId: string, billId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede eliminar contratos de suministros.', 'alert');
      return;
    }

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === buildingId) {
          return {
            ...b,
            floorUtilityBills: (b.floorUtilityBills || []).filter((bill) => bill.id !== billId),
          };
        }
        return b;
      })
    );

    showToast('Factura / Contrato Eliminado', 'Se ha dado de baja el contrato de suministro del piso.', 'alert');
  };

  const registerUtilityBillPaymentTransaction = (
    buildingId: string,
    billId: string,
    paymentMethod: Transaction['paymentMethod'] = 'transferencia'
  ) => {
    if (currentUser.role !== 'admin') {
      showToast('Permiso Denegado', 'Solo el administrador puede asentar pagos en contabilidad.', 'alert');
      return;
    }

    const bldg = buildings.find((b) => b.id === buildingId);
    if (!bldg) return;
    const bill = (bldg.floorUtilityBills || []).find((b) => b.id === billId);
    if (!bill) return;

    // Create a transaction expense
    const count = transactions.length + 1;
    const code = `TX-SUM-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      code,
      buildingId,
      buildingName: bldg.name,
      type: 'gasto',
      category: 'pago_servicios_publicos',
      description: `Pago mensual ${bill.serviceType.toUpperCase()} - ${bill.companyName} (${bill.floor} - Contrato ${bill.contractNumber})`,
      amount: bill.monthlyAmount,
      date: new Date().toISOString().slice(0, 10),
      registeredBy: currentUser.name,
      registeredByRole: currentUser.role,
      paymentMethod,
      referenceNumber: `REC-${bill.contractNumber.slice(-6)}-${new Date().getMonth() + 1}`,
      status: 'completado',
    };

    setTransactions((prev) => [tx, ...prev]);

    // Push notification
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: `💳 Pago de Suministro Asentado: €${bill.monthlyAmount}`,
      message: `Se registró el pago de ${bill.serviceType.toUpperCase()} (${bill.floor}) en ${bldg.name}.`,
      type: 'accounting_expense',
      buildingId,
      buildingName: bldg.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    publishNotification(notif);

    showToast(
      'Pago Asentado en Contabilidad',
      `Se registró el egreso de €${bill.monthlyAmount} en el libro diario de ${bldg.name}.`,
      'success'
    );
  };

  // Exceptional Expenses Actions
  const addExceptionalExpense = (
    buildingId: string,
    expenseData: Omit<ExceptionalExpense, 'id' | 'createdAt' | 'status'>
  ) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede registrar gastos excepcionales.');
      return;
    }
    const newExpense: ExceptionalExpense = {
      ...expenseData,
      id: `exe-${Date.now()}`,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== buildingId) return b;
        const expenses = b.exceptionalExpenses || [];
        return { ...b, exceptionalExpenses: [newExpense, ...expenses] };
      })
    );

    showToast('Gasto Excepcional Agregado', `Se registró el gasto: ${expenseData.name}`, 'success');
  };

  const markExceptionalExpenseAsPaid = (
    buildingId: string,
    expenseId: string,
    paymentMethod: Transaction['paymentMethod'] = 'transferencia'
  ) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede marcar gastos excepcionales como pagados.');
      return;
    }
    const bldg = buildings.find((b) => b.id === buildingId);
    if (!bldg) return;
    const expense = (bldg.exceptionalExpenses || []).find((e) => e.id === expenseId);
    if (!expense) return;

    if (expense.status === 'pagado') {
      showToast('Gasto ya pagado', 'Este gasto ya fue marcado como pagado.', 'info');
      return;
    }

    // Mark as paid
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== buildingId) return b;
        const updated = (b.exceptionalExpenses || []).map((e) =>
          e.id === expenseId ? { ...e, status: 'pagado' as const } : e
        );
        return { ...b, exceptionalExpenses: updated };
      })
    );

    // Register transaction
    const count = transactions.length + 1;
    const code = `TX-EXC-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      code,
      buildingId,
      buildingName: bldg.name,
      type: 'gasto',
      category: 'otros',
      categoryOther: expense.name,
      description: `Gasto Excepcional: ${expense.name} - ${expense.reason}`,
      amount: expense.amount,
      date: new Date().toISOString().slice(0, 10),
      registeredBy: currentUser.name,
      registeredByRole: currentUser.role,
      paymentMethod,
      referenceNumber: `EXC-${expense.id.slice(-6)}`,
      status: 'completado',
    };

    setTransactions((prev) => [tx, ...prev]);
    showToast('Gasto Pagado', `El gasto excepcional se ha pagado y asentado en contabilidad.`, 'success');
  };

  const removeExceptionalExpense = (buildingId: string, expenseId: string) => {
    if (!canManageBuildings(currentUser)) {
      deny('Solo el administrador puede eliminar gastos excepcionales.');
      return;
    }
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id !== buildingId) return b;
        const updated = (b.exceptionalExpenses || []).filter((e) => e.id !== expenseId);
        return { ...b, exceptionalExpenses: updated };
      })
    );
    showToast('Gasto Eliminado', 'Se eliminó el gasto excepcional.', 'alert');
  };

  // Ticket Actions
  const createTicket = (data: {
    buildingId: string;
    floor: string;
    unitOrArea: string;
    title: string;
    description: string;
    category: Ticket['category'];
    categoryOther?: string;
    priority: TicketPriority;
    photos?: string[];
  }): Ticket => {
    if (!canCreateTicket(currentUser)) {
      deny('Tu rol no puede crear incidencias.');
      return tickets[0] as Ticket;
    }
    if ((currentUser.role === 'neighbor' || currentUser.role === 'president') && !currentUser.buildingId) {
      deny('No tienes un edificio asignado.');
      return tickets[0] as Ticket;
    }
    data = { ...data, buildingId: ticketBuildingForUser(currentUser, data.buildingId) };
    const bldg = buildings.find((b) => b.id === data.buildingId);
    const count = tickets.length + 1;
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      buildingId: data.buildingId,
      buildingName: bldg ? bldg.name : 'Edificio General',
      floor: data.floor,
      unitOrArea: data.unitOrArea,
      title: data.title,
      description: data.description,
      category: data.category,
      categoryOther: data.category === 'otros' ? data.categoryOther : undefined,
      priority: data.priority,
      status: 'pendiente',
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: data.photos || [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          action: `Incidencia reportada por ${currentUser.name}`,
          notes: data.description,
          statusFrom: undefined,
          statusTo: 'pendiente',
        },
      ],
    };

    setTickets((prev) => {
      const next = [newTicket, ...prev];
      ticketsRef.current = next;
      flushSharedNow('tickets', next);
      return next;
    });

    // Real-time Push Notification
    const notifTitle = data.priority === 'urgente' ? '🚨 INCIDENCIA URGENTE' : '📋 Nueva incidencia';
    const fromPresident = currentUser.role === 'president';
    const notifMsg = fromPresident
      ? `El presidente ${currentUser.name} pide atención en ${newTicket.buildingName} (Piso ${newTicket.floor}, ${newTicket.unitOrArea}): "${newTicket.title}"`
      : `En ${newTicket.buildingName} (Piso ${newTicket.floor}, ${newTicket.unitOrArea}): "${newTicket.title}"`;

    const audience = ticketNoticeAudience(newTicket);
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: notifTitle,
      message: notifMsg,
      type: 'ticket_created',
      buildingId: newTicket.buildingId,
      buildingName: newTicket.buildingName,
      ticketId: newTicket.id,
      userId: audience.userId,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: audience.targetRoles,
    };

    publishNotification(notif);
    showToast(notifTitle, notifMsg, data.priority === 'urgente' ? 'alert' : 'info');

    return newTicket;
  };

  const updateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    notes?: string,
    photoUrl?: string,
    scheduledVisitDate?: string
  ) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;
    if (!canUpdateTicketStatus(currentUser, targetTicket)) {
      deny('No puedes cambiar el estado de esta incidencia.');
      return;
    }

    const oldStatus = targetTicket.status;
    const now = new Date().toISOString();

    const timelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: now,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      action: `Estado actualizado a "${newStatus.replace('_', ' ').toUpperCase()}"`,
      notes: notes || undefined,
      statusFrom: oldStatus,
      statusTo: newStatus,
      photoUrl: photoUrl || undefined,
    };

    const isResolving = newStatus === 'resuelta' && oldStatus !== 'resuelta';

    if (isResolving) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            updatedAt: now,
            resolvedAt: isResolving ? now : t.resolvedAt,
            resolutionNotes: isResolving ? notes || t.resolutionNotes : t.resolutionNotes,
            scheduledVisitDate: scheduledVisitDate || t.scheduledVisitDate,
            timeline: [...t.timeline, timelineEvent],
          };
        }
        return t;
      })
    );

    const visitBit =
      (scheduledVisitDate || targetTicket.scheduledVisitDate)
        ? ` Visita: ${scheduledVisitDate || targetTicket.scheduledVisitDate} en ${targetTicket.buildingName} para "${targetTicket.title}".`
        : ` Trabajo: "${targetTicket.title}" en ${targetTicket.buildingName}.`;
    const notifTitle =
      newStatus === 'resuelta'
        ? '✅ Trabajo terminado'
        : newStatus === 'en_proceso'
        ? '🔄 Trabajo en proceso'
        : '🔄 Actualización de solicitud';
    const notifMsg = `${currentUser.name} marcó ${targetTicket.ticketNumber} como "${newStatus.replace('_', ' ')}".${visitBit}`;

    const audience = ticketNoticeAudience(targetTicket);
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: notifTitle,
      message: notifMsg,
      type: 'ticket_status',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      userId: audience.userId,
      timestamp: now,
      read: false,
      targetRoles: audience.targetRoles,
    };

    publishNotification(notif);
    showToast(notifTitle, notifMsg, newStatus === 'resuelta' ? 'success' : 'info');
  };

  const assignWorkerToTicket = (ticketId: string, workerId: string) => {
    if (!canAssignWorkers(currentUser)) {
      deny('Solo el administrador puede asignar operarios.');
      return;
    }
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;
    const workerUser = users.find((u) => u.id === workerId);
    const payoutWorker = workerPayouts.find((p) => p.workerId === workerId || p.workerName === workerId);
    const name = workerUser?.name || payoutWorker?.workerName;
    if (!name) return;
    const specialty = workerUser?.specialty || payoutWorker?.workerSpecialty;
    const assignedId = workerUser?.id || payoutWorker?.workerId || workerId;

    const now = new Date().toISOString();
    const timelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: now,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      action: `Ticket asignado al operario ${name}${specialty ? ` (${specialty})` : ''}`,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedWorkerId: assignedId,
              assignedWorkerName: name,
              assignedWorkerSpecialty: specialty,
              updatedAt: now,
              timeline: [...t.timeline, timelineEvent],
            }
          : t
      )
    );

    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: '🛠️ Trabajo asignado',
      message: `${name} debe atender ${targetTicket.ticketNumber} en ${targetTicket.buildingName}: "${targetTicket.title}".`,
      type: 'ticket_status',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      userId: assignedId,
      timestamp: now,
      read: false,
      targetRoles: ['admin', 'worker', 'president', 'neighbor'],
    };
    publishNotification(notif);
    showToast('Trabajador Asignado', `${name} ha sido asignado a la incidencia ${targetTicket.ticketNumber}.`, 'success');
  };

  const scheduleTicketVisit = (ticketId: string, date: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;
    if (!canScheduleTicketVisit(currentUser, target)) {
      deny('No puedes programar la visita de esta incidencia.');
      return;
    }
    const visitDate = date.trim();
    if (!visitDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      deny('Indica un día válido para la visita.');
      return;
    }
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              scheduledVisitDate: visitDate,
              updatedAt: now,
              timeline: [
                ...t.timeline,
                {
                  id: `tl-${Date.now()}`,
                  timestamp: now,
                  authorId: currentUser.id,
                  authorName: currentUser.name,
                  authorRole: currentUser.role,
                  action: `Visita programada el ${visitDate} en ${t.buildingName} para "${t.title}"`,
                },
              ],
            }
          : t
      )
    );
    const audience = ticketNoticeAudience(target);
    publishNotification({
      id: crypto.randomUUID(),
      title: '📅 Visita de trabajo programada',
      message: `El ${visitDate} hay que ir a ${target.buildingName} a hacer "${target.title}" (${target.ticketNumber}).`,
      type: 'ticket_status',
      buildingId: target.buildingId,
      buildingName: target.buildingName,
      ticketId: target.id,
      userId: target.assignedWorkerId || audience.userId,
      timestamp: now,
      read: false,
      targetRoles: audience.targetRoles,
    });
    showToast('Visita en el calendario', `El ${visitDate}: ${target.buildingName} · ${target.title}`, 'success');
  };

  const notifyAdmin = (message: string) => {
    if (!canNotifyAdmin(currentUser)) {
      deny('Solo el presidente o un vecino pueden avisar al administrador.');
      return;
    }
    const text = message.trim();
    if (!text) {
      deny('Escribe qué necesita el administrador.');
      return;
    }
    const community = currentUser.buildingName || buildings.find((b) => b.id === currentUser.buildingId)?.name;
    publishNotification({
      id: crypto.randomUUID(),
      title: currentUser.role === 'president' ? 'Aviso del presidente' : 'Aviso de un vecino',
      message: `${currentUser.name}${community ? ` (${community})` : ''}: ${text}`,
      type: 'system',
      buildingId: currentUser.buildingId,
      buildingName: community,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin'],
    });
    showToast('Aviso enviado', 'El administrador ha recibido tu mensaje en la campana.', 'success');
  };

  const updateTicketDetails = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const applyPriority = (ticket: Ticket, priority: TicketPriority): Ticket => {
    if (ticket.priority === priority) return ticket;
    const now = new Date().toISOString();
    return {
      ...ticket,
      priority,
      updatedAt: now,
      timeline: [
        ...(ticket.timeline || []),
        {
          id: crypto.randomUUID(),
          timestamp: now,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          action: `Prioridad cambiada a ${priority.toUpperCase()}`,
        },
      ],
    };
  };

  const setTicketPriority = (ticketId: string, priority: TicketPriority) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;
    if (!canSetTicketPriority(currentUser, target)) {
      deny('No puedes cambiar la prioridad de esta incidencia.');
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? applyPriority(t, priority) : t)));
    if (priority === 'urgente' && target.priority !== 'urgente') {
      publishNotification({
        id: crypto.randomUUID(),
        title: '🚨 INCIDENCIA URGENTE',
        message: `${currentUser.name} marcó como urgente ${target.ticketNumber} en ${target.buildingName}: "${target.title}"`,
        type: 'ticket_status',
        buildingId: target.buildingId,
        buildingName: target.buildingName,
        ticketId: target.id,
        userId: target.createdBy?.id,
        timestamp: new Date().toISOString(),
        read: false,
        targetRoles: ['admin', 'worker', 'president', 'neighbor'],
      });
    }
    showToast(
      priority === 'urgente' ? 'Marcada urgente' : 'Prioridad actualizada',
      `${target.ticketNumber} ahora es ${priority}.`,
      priority === 'urgente' ? 'alert' : 'info'
    );
  };

  const setTicketsPriority = (ticketIds: string[], priority: TicketPriority) => {
    const allowed = tickets.filter((t) => ticketIds.includes(t.id) && canSetTicketPriority(currentUser, t));
    if (!allowed.length) {
      deny('No hay incidencias que puedas priorizar.');
      return;
    }
    const idSet = new Set(allowed.map((t) => t.id));
    setTickets((prev) => prev.map((t) => (idSet.has(t.id) ? applyPriority(t, priority) : t)));
    if (priority === 'urgente') {
      const buildingsNamed = [...new Set(allowed.map((t) => t.buildingName))].join(', ');
      publishNotification({
        id: crypto.randomUUID(),
        title: '🚨 Varias incidencias urgentes',
        message: `${currentUser.name} marcó ${allowed.length} partes como urgentes (${buildingsNamed}).`,
        type: 'ticket_status',
        timestamp: new Date().toISOString(),
        read: false,
        targetRoles: ['admin', 'worker', 'president'],
      });
    }
    showToast(
      'Prioridad actualizada',
      `${allowed.length} incidencias en ${[...new Set(allowed.map((t) => t.buildingName))].length} fincas → ${priority}.`,
      priority === 'urgente' ? 'alert' : 'info'
    );
  };

  const deleteTicket = (ticketId: string) => {
    if (!canDeleteTickets(currentUser)) {
      deny('Solo el administrador puede eliminar incidencias.');
      return;
    }
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;
    if (!isTicketFinished(target)) {
      deny('Solo puedes borrar incidencias cuando ya están resueltas o rechazadas.');
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    if (selectedTicketId === ticketId) setSelectedTicketId(null);
    showToast('Incidencia eliminada', `Se eliminó el reporte ${target.ticketNumber}.`, 'alert');
  };

  const registerServiceAccounting = (data: {
    ticketId: string;
    serviceCost: number;
    materialsCost: number;
    notes?: string;
    paymentMethod: Transaction['paymentMethod'];
    referenceNumber?: string;
  }) => {
    const targetTicket = tickets.find((t) => t.id === data.ticketId);
    if (!targetTicket) return;
    if (!canChargeRepairFund(currentUser, targetTicket)) {
      deny('No puedes registrar costes en esta incidencia.');
      return;
    }

    const totalCharged = Number(data.serviceCost) + Number(data.materialsCost);
    const now = new Date().toISOString();

    // 1. Update ticket with costs
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          return {
            ...t,
            serviceCost: data.serviceCost,
            materialsCost: data.materialsCost,
            totalCharged,
            serviceIncomeRegistered: true,
            updatedAt: now,
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: now,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                action: `Liquidación contable registrada: €${totalCharged} (€${data.serviceCost} mano de obra, €${data.materialsCost} materiales)`,
                notes: data.notes,
              },
            ],
          };
        }
        return t;
      })
    );

    // 2. Add Transaction to Building Ledger (Gasto de mantenimiento / servicio para el edificio)
    const code = `GST-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      code,
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      type: 'gasto',
      category: 'servicio_reparacion',
      description: `Mantenimiento: ${targetTicket.title} (Ticket ${targetTicket.ticketNumber})`,
      amount: totalCharged,
      date: now.slice(0, 10),
      registeredBy: currentUser.name,
      registeredByRole: currentUser.role,
      ticketId: targetTicket.id,
      ticketNumber: targetTicket.ticketNumber,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber || `REC-${Date.now().toString().slice(-4)}`,
      status: 'completado',
    };

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      transactionsRef.current = next;
      flushSharedNow('transactions', next);
      return next;
    });

    // 3. Real-time Notification for Admin & President
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: '💵 Gasto de Mantenimiento Registrado',
      message: `${currentUser.name} asentó €${totalCharged} por reparación del ticket ${targetTicket.ticketNumber} en ${targetTicket.buildingName}.`,
      type: 'accounting_expense',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      timestamp: now,
      read: false,
      targetRoles: ['admin', 'president'],
    };

    publishNotification(notif);
    showToast(
      'Contabilidad Actualizada',
      `Se registraron €${totalCharged} correspondientes al ticket ${targetTicket.ticketNumber} en ${targetTicket.buildingName}.`,
      'success'
    );
  };

  const addRepairExpenseToTicket = (data: {
    ticketId: string;
    concept: string;
    amount: number;
    category?: 'materiales' | 'repuestos' | 'mano_obra' | 'emergencia' | 'otro';
    categoryOther?: string;
    notes?: string;
    markAsResolved?: boolean;
    resolutionNotes?: string;
  }) => {
    const targetTicket = tickets.find((t) => t.id === data.ticketId);
    if (!targetTicket) return;
    if (!canChargeRepairFund(currentUser, targetTicket)) {
      deny('No puedes cargar gastos a la caja de esta incidencia.');
      return;
    }

    const bldg = buildings.find((b) => b.id === targetTicket.buildingId);
    const now = new Date().toISOString();
    const expenseId = `exp-${Date.now()}`;

    const newExpense: TicketRepairExpense = {
      id: expenseId,
      concept: data.concept,
      amount: Number(data.amount),
      date: now.slice(0, 10),
      workerId: currentUser.id,
      workerName: currentUser.name,
      category: data.category || 'repuestos',
      categoryOther: data.category === 'otro' ? data.categoryOther : undefined,
      notes: data.notes,
    };

    const isResolving = !!data.markAsResolved;

    if (isResolving) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }

    // 1. Update ticket with new expense and optionally resolve
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === data.ticketId) {
          const currentExpenses = t.repairExpenses || [];
          const updatedExpenses = [...currentExpenses, newExpense];
          const newTotalExpenses = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);

          return {
            ...t,
            repairExpenses: updatedExpenses,
            materialsCost: newTotalExpenses,
            totalCharged: (t.serviceCost || 0) + newTotalExpenses,
            status: isResolving ? 'resuelta' : t.status,
            updatedAt: now,
            resolvedAt: isResolving ? now : t.resolvedAt,
            resolutionNotes: isResolving
              ? data.resolutionNotes || data.notes || 'Incidencia resuelta satisfactoriamente por el trabajador.'
              : t.resolutionNotes,
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                timestamp: now,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorRole: currentUser.role,
                action: isResolving
                  ? `Gasto de reparación añadido: €${data.amount} ("${data.concept}") e incidencia RESUELTA`
                  : `Gasto de reparación añadido a la caja: €${data.amount} ("${data.concept}")`,
                notes: data.notes,
                statusFrom: isResolving ? t.status : undefined,
                statusTo: isResolving ? 'resuelta' : undefined,
              },
            ],
          };
        }
        return t;
      })
    );

    // 2. Automatically deduct from the Building's repairFund (Incidencias Generales)
    setBuildings((prev) =>
      prev.map((b) => {
        if (b.id === targetTicket.buildingId) {
          const updatedFund = Math.max(0, b.repairFund - Number(data.amount));
          return {
            ...b,
            repairFund: updatedFund,
          };
        }
        return b;
      })
    );

    // 3. Register transaction in building accounting
    const code = `GST-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      code,
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      type: 'gasto',
      category: 'servicio_reparacion',
      description: `Gasto Reparación [Caja]: ${data.concept} (Ticket ${targetTicket.ticketNumber})`,
      amount: Number(data.amount),
      date: now.slice(0, 10),
      registeredBy: currentUser.name,
      registeredByRole: currentUser.role,
      ticketId: targetTicket.id,
      ticketNumber: targetTicket.ticketNumber,
      paymentMethod: 'efectivo',
      referenceNumber: `CAJA-${Date.now().toString().slice(-4)}`,
      status: 'completado',
    };
    setTransactions((prev) => {
      const next = [newTx, ...prev];
      transactionsRef.current = next;
      flushSharedNow('transactions', next);
      return next;
    });

    // 4. Send Push Notification to Admin & President
    const notifTitle = isResolving ? '✅ Incidencia Resuelto y Caja Actualizada' : '🔧 Gasto de Reparación en Caja';
    const notifMsg = `${currentUser.name} añadió €${data.amount} (${data.concept}) a la fondo de incidencias de ${targetTicket.buildingName} para el ticket ${targetTicket.ticketNumber}.`;

    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: notifTitle,
      message: notifMsg,
      type: isResolving ? 'ticket_status' : 'accounting_expense',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      timestamp: now,
      read: false,
      targetRoles: ['admin', 'president'],
    };
    publishNotification(notif);

    showToast(
      isResolving ? 'Incidencia Resuelto con Éxito' : 'Gasto Registrado en Caja',
      `Se descontaron €${data.amount} de la fondo de incidencias de ${bldg?.name || 'Edificio'} por concepto: "${data.concept}".`,
      isResolving ? 'success' : 'info'
    );
  };

  // Worker Payout Actions (Admin Exclusive)
  const addWorkerPayout = (data: Omit<WorkerPayout, 'id' | 'code'>): WorkerPayout => {
    if (!canManagePayouts(currentUser)) {
      deny('Solo el administrador puede registrar nóminas.');
      return workerPayouts[0] as WorkerPayout;
    }
    const code = `PAY-${new Date().getFullYear()}-${String(workerPayouts.length + 1).padStart(3, '0')}`;
    const newPayout: WorkerPayout = {
      ...data,
      id: `pay-${Date.now()}`,
      code,
    };

    setWorkerPayouts((prev) => [newPayout, ...prev]);

    // Also register general expense transaction if completed
    if (data.status === 'pagado') {
      const codeTx = `GST-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        code: codeTx,
        buildingId: buildings[0]?.id || 'bldg-1',
        buildingName: 'Nómina Central Trabajadores',
        type: 'gasto',
        category: 'honorarios_tecnicos',
        description: `Pago de Honorarios a ${data.workerName} - ${data.period}`,
        amount: data.amount,
        date: data.date,
        registeredBy: currentUser.name,
        registeredByRole: currentUser.role,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        status: 'completado',
      };
      setTransactions((prev) => {
      const next = [newTx, ...prev];
      transactionsRef.current = next;
      flushSharedNow('transactions', next);
      return next;
    });
    }

    // Push notification
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: '💵 Pago de Honorarios a Operario',
      message: `Admin ${currentUser.name} registró pago de €${(Number(data.amount) || 0).toLocaleString()} a ${data.workerName} (${data.period}).`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      userId: data.workerId,
      targetRoles: ['admin', 'worker'],
    };
    publishNotification(notif);

    showToast(
      'Pago Registrado',
      `Se registró pago de €${(Number(data.amount) || 0).toLocaleString()} a ${data.workerName}.`,
      'success'
    );

    return newPayout;
  };

  const updateWorkerPayoutStatus = (id: string, status: 'pagado' | 'pendiente', notes?: string) => {
    if (!canManagePayouts(currentUser)) {
      deny('Solo el administrador puede cambiar el estado de una nómina.');
      return;
    }
    setWorkerPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, notes: notes || p.notes } : p))
    );
    showToast(
      'Estado de Pago Actualizado',
      `El pago ha sido marcado como ${status.toUpperCase()}.`,
      'success'
    );
  };

  const deleteWorkerPayout = (id: string) => {
    if (!canManagePayouts(currentUser)) {
      deny('Solo el administrador puede eliminar nóminas.');
      return;
    }
    const target = workerPayouts.find((p) => p.id === id);
    setWorkerPayouts((prev) => prev.filter((p) => p.id !== id));
    showToast(
      'Nómina eliminada',
      target ? `Se eliminó ${target.code} de ${target.workerName}.` : 'El pago fue eliminado.',
      'alert'
    );
  };

  // Neighbor Services Actions
  const addNeighborService = (data: Omit<NeighborService, 'id'>) => {
    if (!canManageSoferCatalog(currentUser)) {
      deny('Solo el administrador puede añadir servicios SOFER.');
      return;
    }
    const newService: NeighborService = {
      ...data,
      id: `ns-${Date.now()}`,
    };
    setNeighborServices((prev) => {
      const next = [...prev, newService];
      neighborServicesRef.current = next;
      flushSharedNow('neighbor_services', next);
      return next;
    });
    showToast('Servicio añadido', `${newService.name} · ${newService.price} €`, 'success');
  };

  const addCustomRole = (name: string, baseRole: CustomRole['baseRole']) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede crear roles.');
      return;
    }
    const label = name.trim();
    if (!label) {
      showToast('Falta el nombre', 'Escribe el nombre del nuevo rol.', 'alert');
      return;
    }
    if (customRoles.some((r) => r.name.toLowerCase() === label.toLowerCase())) {
      showToast('Rol duplicado', 'Ya existe un rol con ese nombre.', 'alert');
      return;
    }
    const next: CustomRole[] = [
      ...customRoles,
      { id: `role-${Date.now()}`, name: label, baseRole, memberEmails: [] },
    ];
    customRolesRef.current = next;
    setCustomRoles(next);
    flushSharedNow('custom_roles', next);
    showToast('Rol creado', `${label} ya se puede asignar.`, 'success');
  };

  const renameCustomRole = (id: string, name: string) => {
    if (!canManageUsers(currentUser)) return;
    const label = name.trim();
    if (!label) return;
    const next = customRoles.map((r) => (r.id === id ? { ...r, name: label } : r));
    customRolesRef.current = next;
    setCustomRoles(next);
    flushSharedNow('custom_roles', next);
  };

  const deleteCustomRole = (id: string) => {
    if (!canManageUsers(currentUser)) return;
    const target = customRoles.find((r) => r.id === id);
    const next = customRoles.filter((r) => r.id !== id);
    customRolesRef.current = next;
    setCustomRoles(next);
    flushSharedNow('custom_roles', next);
    showToast('Rol eliminado', target ? `Se quitó ${target.name}.` : 'Rol borrado.', 'info');
  };

  const updateNeighborService = (id: string, updates: Partial<NeighborService>) => {
    if (!canManageSoferCatalog(currentUser)) {
      deny('Solo el administrador puede modificar el catálogo SOFER.');
      return;
    }
    setNeighborServices((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      neighborServicesRef.current = next;
      flushSharedNow('neighbor_services', next);
      return next;
    });
  };

  const removeNeighborService = (id: string) => {
    if (!canManageSoferCatalog(currentUser)) {
      deny('Solo el administrador puede eliminar servicios SOFER.');
      return;
    }
    setNeighborServices((prev) => prev.filter((s) => s.id !== id));
  };

  const createNeighborRequest = (data: Omit<NeighborServiceRequest, 'id' | 'createdAt' | 'status'>) => {
    if (!canRequestSoferService(currentUser)) {
      deny('Solo vecinos y presidentes pueden solicitar servicios SOFER.');
      return;
    }
    const requestedUnit = (data.unitOrArea || '').trim() || currentUser.unitOrArea || '';
    const requestedBuildingId = currentUser.buildingId || data.buildingId;
    data = {
      ...data,
      neighborId: currentUser.id,
      neighborName: currentUser.name,
      buildingId: requestedBuildingId,
      unitOrArea: requestedUnit,
    };
    const newRequest: NeighborServiceRequest = {
      ...data,
      id: `nsr-${Date.now()}`,
      status: 'solicitado',
      createdAt: new Date().toISOString(),
    };
    setNeighborRequests((prev) => {
      const next = [...prev, newRequest];
      neighborRequestsRef.current = next;
      flushSharedNow('neighbor_requests', next);
      return next;
    });

    const community = buildings.find((b) => b.id === requestedBuildingId);
    publishNotification({
      id: crypto.randomUUID(),
      title: 'Nueva solicitud de servicio',
      message: `${data.neighborName} pide "${data.serviceName}" en ${community?.name || 'comunidad'} · ${requestedUnit || 'sin vivienda'}. Pulsa para abrirla y guardar la vivienda en su cuenta.`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      buildingId: requestedBuildingId,
      requestId: newRequest.id,
      userId: currentUser.id,
      targetRoles: ['admin', 'president'],
    });
  };

  const applyRequestHousingToUser = (requestId: string) => {
    if (!canManageUsers(currentUser)) {
      deny('Solo el administrador puede asignar la vivienda a la cuenta.');
      return;
    }
    const request = neighborRequests.find((r) => r.id === requestId);
    if (!request) {
      deny('No se encontró esa solicitud.');
      return;
    }
    const community = buildings.find((b) => b.id === request.buildingId);
    if (!community) {
      deny('El edificio de la solicitud no está registrado.');
      return;
    }
    const parsed = parseHousing(request.unitOrArea);
    updateUser(request.neighborId, {
      buildingId: community.id,
      buildingName: community.name,
      floor: parsed.floor,
      unitOrArea: request.unitOrArea,
    });
    showToast(
      'Vivienda asignada',
      `Se guardó ${community.name} · ${request.unitOrArea} en la cuenta de ${request.neighborName}.`,
      'success'
    );
  };

  const updateNeighborRequest = (id: string, status: NeighborServiceRequest['status'], scheduledDate?: string) => {
    setNeighborRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status };
          if (scheduledDate) updated.scheduledDate = scheduledDate;
          
          if (status === 'completado' || status === 'en_proceso' || status === 'cancelado') {
            const notif: PushNotification = {
              id: crypto.randomUUID(),
              title:
                status === 'completado'
                  ? 'Tu servicio SOFER está listo'
                  : status === 'en_proceso'
                  ? 'Tu servicio SOFER está en proceso'
                  : 'Servicio SOFER cancelado',
              message: `La solicitud "${r.serviceName}" (${r.unitOrArea}) pasó a ${status.replace('_', ' ')}.`,
              type: 'system',
              timestamp: new Date().toISOString(),
              read: false,
              buildingId: r.buildingId,
              userId: r.neighborId,
              targetRoles: ['neighbor', 'president'],
            };
            publishNotification(notif);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const deleteNeighborRequest = (id: string) => {
    if (!canManageSoferCatalog(currentUser)) {
      deny('Solo el administrador puede eliminar solicitudes de servicio.');
      return;
    }
    setNeighborRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Solicitud eliminada', 'La solicitud de servicio fue borrada.', 'alert');
  };

  // Transaction Actions
  const addTransaction = (data: Omit<Transaction, 'id' | 'code'>): Transaction => {
    if (!canPostAccounting(currentUser)) {
      deny('Solo el administrador puede asentar movimientos contables.');
      return { ...data, id: '', code: '' };
    }
    const codePrefix = data.type === 'ingreso' ? 'ING' : 'GST';
    const code = `${codePrefix}-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      code,
    };

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      transactionsRef.current = next;
      flushSharedNow('transactions', next);
      return next;
    });

    // Notification
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title: data.type === 'ingreso' ? '💰 Nuevo Ingreso Asentado' : '💳 Nuevo Gasto Registrado',
      message: `${data.description} por €${(Number(data.amount) || 0).toLocaleString()} en ${data.buildingName}.`,
      type: data.type === 'ingreso' ? 'accounting_income' : 'accounting_expense',
      buildingId: data.buildingId,
      buildingName: data.buildingName,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    publishNotification(notif);
    showToast('Movimiento Guardado', `Se registró ${data.type.toUpperCase()}: €${(Number(data.amount) || 0).toLocaleString()} en ${data.buildingName}`, 'success');

    return newTx;
  };

  const deleteTransaction = (id: string) => {
    if (!canPostAccounting(currentUser)) {
      deny('Solo el administrador puede eliminar asientos.');
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Movimiento Eliminado', 'La transacción fue eliminada del libro contable.', 'info');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const ids = [...loadReadNotificationIds(currentUser.email), id];
    saveReadNotificationIds(currentUser.email, ids);
    void markInboxRead(id, true);
  };

  const markAllNotificationsAsRead = () => {
    const visible = notifications.filter((n) => isNotificationForUser(n, currentUser));
    const ids = visible.map((n) => n.id);
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    saveReadNotificationIds(currentUser.email, [...loadReadNotificationIds(currentUser.email), ...ids]);
    void markInboxReadMany(ids);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && isNotificationForUser(n, currentUser)).length;
  }, [notifications, currentUser]);

  // Role-Scoped Data Filtering
  const accessibleBuildings = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'worker') {
      return buildings;
    }
    if (currentUser.role === 'president' || currentUser.role === 'neighbor') {
      return buildings.filter((b) => b.id === currentUser.buildingId || b.presidentId === currentUser.id);
    }
    return [];
  }, [currentUser, buildings]);

  const accessibleTickets = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'worker') {
      return tickets;
    }
    if (currentUser.role === 'president' || currentUser.role === 'neighbor') {
      return tickets.filter((t) => t.buildingId === currentUser.buildingId || t.createdBy?.id === currentUser.id);
    }
    return [];
  }, [currentUser, tickets]);

  const accessibleTransactions = useMemo(() => {
    if (currentUser.role === 'admin') {
      return transactions;
    }
    if (currentUser.role === 'president') {
      return transactions.filter((t) => t.buildingId === currentUser.buildingId);
    }
    if (currentUser.role === 'worker') {
      return transactions.filter(
        (t) =>
          t.registeredBy === currentUser.name ||
          t.category === 'servicio_reparacion'
      );
    }
    return [];
  }, [currentUser, transactions]);

  const communityDirectory = useMemo(
    () =>
      buildings.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        floors: b.floors,
      })),
    [buildings]
  );

  const visibleUsers = useMemo(() => {
    if (currentUser.role === 'admin') return users;
    if (currentUser.role === 'president') {
      return users.filter(
        (u) =>
          u.id === currentUser.id ||
          u.buildingId === currentUser.buildingId ||
          u.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
      );
    }
    return users.filter(
      (u) =>
        u.id === currentUser.id ||
        u.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
    );
  }, [currentUser, users]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers: visibleUsers,
        refreshDirectory,
        isAuthenticated,
        authReady,
        setCurrentUser,
        addUser,
        updateUser,
        updateUserRole,
        customRoles,
        addCustomRole,
        renameCustomRole,
        deleteCustomRole,
        toggleUserStatus,
        revokeBuildingAssignment,
        deleteUser,
        restoreAccess,
        loginWithEmail,
        loginWithGoogle,
        signInWithGoogle,
        signInWithGoogleCredential,
        registerUser,
        logout,
        buildings: accessibleBuildings,
        addBuilding,
        updateBuilding,
        deleteBuilding,
        resetBuildingOperations,
        resetAllOperations,
        getBuildingById,
        adjustBuildingRepairFund,
        addCommonArea,
        updateCommonArea,
        removeCommonArea,
        addFloorUtilityBill,
        updateFloorUtilityBill,
        removeFloorUtilityBill,
        registerUtilityBillPaymentTransaction,
        addExceptionalExpense,
        markExceptionalExpenseAsPaid,
        removeExceptionalExpense,
        tickets: accessibleTickets,
        createTicket,
        updateTicketStatus,
        assignWorkerToTicket,
        scheduleTicketVisit,
        notifyAdmin,
        updateTicketDetails,
        setTicketPriority,
        setTicketsPriority,
        deleteTicket,
        registerServiceAccounting,
        addRepairExpenseToTicket,
        transactions: accessibleTransactions,
        addTransaction,
        deleteTransaction,
        workerPayouts,
        addWorkerPayout,
        updateWorkerPayoutStatus,
        deleteWorkerPayout,
        neighborServices,
        addNeighborService,
        updateNeighborService,
        removeNeighborService,
        neighborRequests,
        createNeighborRequest,
        updateNeighborRequest,
        deleteNeighborRequest,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        accessibleBuildings,
        accessibleTickets,
        accessibleTransactions,
        communityDirectory,
        activeTab,
        setActiveTab,
        selectedBuildingId,
        setSelectedBuildingId,
        selectedTicketId,
        setSelectedTicketId,
        adminInboxTarget,
        setAdminInboxTarget,
        applyRequestHousingToUser,
        toasts,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
