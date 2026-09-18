import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_BUILDINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
  INITIAL_WORKER_PAYOUTS,
  INITIAL_NEIGHBOR_SERVICES,
  INITIAL_NEIGHBOR_REQUESTS,
} from '../data/initialData';
import { ADMIN_USER, ACCOUNTS_RESET_KEY, ACCOUNTS_RESET_VALUE, isDemoAccount, isPrimaryAdmin, withSingleAdmin } from '../data/users';
import { googleClientId, requestGoogleIdToken } from '../lib/googleAuth';
import { fetchProfiles, mergeUsersByEmail, persistProfile, upsertProfile } from '../lib/profiles';
import { supabaseRedirectTo } from '../lib/authConfig';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
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
      monthlyFee?: number;
      feeBalance?: number;
    }
  ) => void;
  toggleUserStatus: (id: string) => void;
  revokeBuildingAssignment: (userId: string) => void;
  deleteUser: (id: string) => void;
  switchRole: (role: Role, userId?: string) => void;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleData: { name: string; email: string; avatar?: string; role?: Role; buildingId?: string; specialty?: string }) => { success: boolean; message?: string };
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  registerUser: (userData: { name: string; email: string; password?: string; role: Role; phone?: string; buildingId?: string; specialty?: string; provider?: 'email' | 'google'; status?: 'active' | 'suspended' }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  buildings: Building[];
  addBuilding: (buildingData: Omit<Building, 'id' | 'createdAt'>) => Building;
  updateBuilding: (id: string, buildingData: Partial<Building>) => void;
  deleteBuilding: (id: string) => void;
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
    photoUrl?: string
  ) => void;
  assignWorkerToTicket: (ticketId: string, workerId: string) => void;
  updateTicketDetails: (ticketId: string, updates: Partial<Ticket>) => void;
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

  neighborServices: NeighborService[];
  addNeighborService: (service: Omit<NeighborService, 'id'>) => void;
  updateNeighborService: (id: string, updates: Partial<NeighborService>) => void;
  removeNeighborService: (id: string) => void;

  neighborRequests: NeighborServiceRequest[];
  createNeighborRequest: (data: Omit<NeighborServiceRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateNeighborRequest: (id: string, status: NeighborServiceRequest['status'], scheduledDate?: string) => void;

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

  // Active navigation / drilldown state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;

  // In-app interactive Toast notifications
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    if (isDemoAccount(u) || isPrimaryAdmin(u)) {
      return ADMIN_USER;
    }
    return u;
  });

  // Keep David as the seeded admin and drop leftover demo accounts
  useEffect(() => {
    const nextUsers = withSingleAdmin(users);
    const usersChanged =
      nextUsers.length !== users.length ||
      nextUsers.some((u, i) => u.id !== users[i]?.id || u.email !== users[i]?.email || u.name !== users[i]?.name);

    if (usersChanged) {
      setUsers(nextUsers);
      localStorage.setItem('gest_v2_users', JSON.stringify(nextUsers));
    }

    if (isDemoAccount(currentUser) || isPrimaryAdmin(currentUser)) {
      const needsAdminSync =
        currentUser.id !== ADMIN_USER.id ||
        currentUser.email !== ADMIN_USER.email ||
        currentUser.name !== ADMIN_USER.name ||
        currentUser.role !== 'admin';
      if (needsAdminSync) {
        setCurrentUser(ADMIN_USER);
        localStorage.setItem('gest_v2_current_user', JSON.stringify(ADMIN_USER));
      }
    }
  }, [users, currentUser]);

  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const newUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
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
      monthlyFee?: number;
      feeBalance?: number;
    }
  ) => {
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
          unitOrArea: isBuildingRole ? (extra?.unitOrArea ?? u.unitOrArea ?? (newRole === 'president' ? 'Planta 4ª Ático B' : 'Vivienda')) : undefined,
          monthlyFee: isBuildingRole ? (extra?.monthlyFee ?? u.monthlyFee ?? (newRole === 'president' ? 95 : 85)) : undefined,
          feeBalance: isBuildingRole ? (extra?.feeBalance ?? u.feeBalance ?? 0) : undefined,
          feeFrequency: isBuildingRole ? (u.feeFrequency || 'mensual') : undefined,
          lastPaymentAmount: isBuildingRole ? (u.lastPaymentAmount ?? (newRole === 'president' ? 95 : 85)) : undefined,
          lastPaymentDate: isBuildingRole ? (u.lastPaymentDate || '2026-08-05') : undefined,
          lastPaymentConcept: isBuildingRole ? (u.lastPaymentConcept || 'Cuota de comunidad - Agosto 2026') : undefined,
          nextDueDate: isBuildingRole ? (u.nextDueDate || '2026-09-05') : undefined,
          taxReturnsRemaining: isBuildingRole ? (u.taxReturnsRemaining ?? 2) : undefined,
          specialty: newRole === 'worker' ? (extra?.specialty || u.specialty || 'Mantenimiento General') : undefined,
        };
        return updated;
      }
      return u;
    });

    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));

    if (currentUser.id === id) {
      const updatedUser = newUsers.find((u) => u.id === id);
      if (updatedUser) setCurrentUser(updatedUser);
    }
    const persisted = newUsers.find((u) => u.id === id);
    if (persisted) {
      void supabase?.auth.getUser().then(({ data }) => {
        void persistProfile(persisted, data.user?.id);
      });
    }
    showToast('Rol Actualizado', 'Se han actualizado libremente los permisos del usuario', 'success');
  };

  const toggleUserStatus = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    if (isPrimaryAdmin(targetUser)) {
      showToast('Acción Bloqueada', 'El Administrador Principal no puede ser suspendido.', 'alert');
      return;
    }

    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    const newUsers = users.map(u => u.id === id ? { ...u, status: newStatus } : u);
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    const updated = newUsers.find((u) => u.id === id);
    if (updated) {
      void supabase?.auth.getUser().then(({ data }) => {
        void persistProfile(updated, data.user?.id);
      });
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
    if (isPrimaryAdmin({ ...ADMIN_USER, id })) {
      showToast('Acción Bloqueada', 'No se puede eliminar la cuenta del Administrador Principal.', 'alert');
      return;
    }
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete && isPrimaryAdmin(userToDelete)) {
      showToast('Acción Bloqueada', 'No se puede eliminar la cuenta del Administrador Principal.', 'alert');
      return;
    }
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    if (supabase && userToDelete && /^[0-9a-f-]{36}$/i.test(userToDelete.id)) {
      void supabase.from('profiles').delete().eq('id', userToDelete.id);
    }

    if (currentUser.id === id) {
      // Fallback to first admin
      setCurrentUser(newUsers[0] || INITIAL_USERS[0]);
    }
    showToast('Usuario Eliminado', `El usuario ${userToDelete?.name || ''} y sus roles fueron removidos del sistema`, 'info');
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
    const existing = users.find(u => u.email.trim().toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.status === 'suspended') {
        return {
          success: false,
          message: 'Esta cuenta de Google está suspendida en el sistema.',
        };
      }
      const nextUser = {
        ...existing,
        name: googleData.name || existing.name,
        avatar: googleData.avatar || existing.avatar,
        provider: googleData.provider || existing.provider || 'google',
      };
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

    const isAdminEmail = cleanEmail === ADMIN_USER.email.toLowerCase();
    const newUser: User = isAdminEmail
      ? { ...ADMIN_USER, avatar: googleData.avatar || ADMIN_USER.avatar, provider: googleData.provider || 'google' }
      : {
          id: `user-google-${Date.now()}`,
          name: googleData.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: googleData.role || 'unassigned',
          avatar: googleData.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          phone: '+34 600 000 000',
          buildingId: googleData.buildingId,
          buildingName: assignedBuildingName,
          specialty: googleData.specialty,
          provider: googleData.provider || 'google',
          status: 'active',
        };

    const newUsers = isAdminEmail ? withSingleAdmin(users) : [...users, newUser];
    setUsers(newUsers);
    localStorage.setItem('gest_v2_users', JSON.stringify(newUsers));
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('gest_v2_is_authenticated', 'true');
    localStorage.setItem('gest_v2_current_user', JSON.stringify(newUser));
    if (!silent) {
      showToast(
        isAdminEmail ? 'Sesión Iniciada' : 'Cuenta Creada con Google',
        isAdminEmail ? `¡Bienvenido, ${newUser.name}!` : `Cuenta de ${newUser.name} registrada. El administrador asignará tu rol.`,
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
    if (googleClientId) {
      try {
        const token = await requestGoogleIdToken(googleClientId);
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token,
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google',
        };
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: supabaseRedirectTo(),
        scopes: 'openid email profile',
      },
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
        return parsed.map((b) => {
          const initB = INITIAL_BUILDINGS.find((ib) => ib.id === b.id);
          return {
            ...b,
            commonAreas:
              b.commonAreas && b.commonAreas.length > 0 ? b.commonAreas : initB?.commonAreas || [],
            floorUtilityBills:
              b.floorUtilityBills && b.floorUtilityBills.length > 0
                ? b.floorUtilityBills
                : initB?.floorUtilityBills || [],
          };
        });
      } catch (e) {
        console.error('Error parsing buildings from localStorage', e);
      }
    }
    return INITIAL_BUILDINGS;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('gest_v2_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gest_v2_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [workerPayouts, setWorkerPayouts] = useState<WorkerPayout[]>(() => {
    const saved = localStorage.getItem('gest_v2_worker_payouts');
    return saved ? JSON.parse(saved) : INITIAL_WORKER_PAYOUTS;
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((r: any) => r.id));
          const newOnes = INITIAL_NEIGHBOR_REQUESTS.filter((r) => !existingIds.has(r.id));
          return [...parsed, ...newOnes];
        }
      } catch (e) {
        return INITIAL_NEIGHBOR_REQUESTS;
      }
    }
    return INITIAL_NEIGHBOR_REQUESTS;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('gest_v2_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('gest_v2_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('gest_v2_buildings', JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem('gest_v2_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('gest_v2_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gest_v2_worker_payouts', JSON.stringify(workerPayouts));
  }, [workerPayouts]);

  useEffect(() => {
    localStorage.setItem('gest_v2_neighbor_services', JSON.stringify(neighborServices));
  }, [neighborServices]);

  useEffect(() => {
    localStorage.setItem('gest_v2_neighbor_requests', JSON.stringify(neighborRequests));
  }, [neighborRequests]);

  useEffect(() => {
    localStorage.setItem('gest_v2_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (soundEnabled) {
      playNotificationSound(type);
    }
    sendBrowserPushNotification(title, message);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
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
      loginWithGoogle(
        {
          name: meta.full_name || meta.name || email,
          email,
          avatar: meta.avatar_url || meta.picture,
          role: email.toLowerCase() === ADMIN_USER.email.toLowerCase() ? 'admin' : 'unassigned',
          provider,
        },
        silent
      );
      const pendingUser: User = {
        id: session.user.id,
        name: meta.full_name || meta.name || email,
        email,
        role: email.toLowerCase() === ADMIN_USER.email.toLowerCase() ? 'admin' : 'unassigned',
        avatar: meta.avatar_url || meta.picture || ADMIN_USER.avatar,
        phone: '+34 600 000 000',
        provider,
        status: 'active',
      };
      void upsertProfile(pendingUser, session.user.id).then(async () => {
        const remote = await fetchProfiles();
        if (!remote.length) return;
        setUsers((prev) => {
          const newcomers = remote.filter(
            (r) =>
              r.role === 'unassigned' &&
              !prev.some((p) => p.email.trim().toLowerCase() === r.email.trim().toLowerCase())
          );
          const merged = withSingleAdmin(mergeUsersByEmail(prev, remote));
          localStorage.setItem('gest_v2_users', JSON.stringify(merged));
          if (newcomers.length && email.toLowerCase() === ADMIN_USER.email.toLowerCase()) {
            showToast(
              'Nuevo registro',
              newcomers.map((n) => n.email).join(', ') + ' esperan asignación de rol.',
              'info'
            );
          }
          return merged;
        });
      });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        void fetchProfiles().then((remote) => {
          if (!remote.length) return;
          setUsers((prev) => {
            const merged = withSingleAdmin(mergeUsersByEmail(prev, remote));
            localStorage.setItem('gest_v2_users', JSON.stringify(merged));
            return merged;
          });
        });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch role handler
  const switchRole = (role: Role, userId?: string) => {
    let targetUser: User | undefined;
    if (userId) {
      targetUser = users.find((u) => u.id === userId);
    } else {
      targetUser = users.find((u) => u.role === role);
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      setSelectedBuildingId(null);
      setSelectedTicketId(null);
      setActiveTab('dashboard');
      showToast('Perfil Cambiado', `Ahora estás navegando como ${targetUser.name} (${targetUser.role.toUpperCase()})`, 'info');
    }
  };

  // Building Actions
  const addBuilding = (buildingData: Omit<Building, 'id' | 'createdAt'>): Building => {
    const id = `bldg-${Date.now()}`;
    const newBuilding: Building = {
      ...buildingData,
      id,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setBuildings((prev) => [newBuilding, ...prev]);

    // Push notification for Admin
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '🏢 Nuevo Edificio Añadido',
      message: `Se ha dado de alta el edificio "${newBuilding.name}" con ${newBuilding.totalUnits} viviendas.`,
      type: 'system',
      buildingId: newBuilding.id,
      buildingName: newBuilding.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin'],
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Edificio Registrado', `Se agregó exitosamente "${newBuilding.name}" al catálogo.`, 'success');

    return newBuilding;
  };

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    showToast('Edificio Actualizado', 'Los datos del inmueble han sido guardados.', 'success');
  };

  const deleteBuilding = (id: string) => {
    const bldg = buildings.find((b) => b.id === id);
    if (!bldg) return;

    setBuildings((prev) => prev.filter((b) => b.id !== id));
    // Also remove tickets and transactions or keep them isolated
    showToast('Edificio Removido', `El edificio "${bldg.name}" ha sido eliminado del sistema.`, 'alert');
  };

  const getBuildingById = (id: string) => buildings.find((b) => b.id === id);

  const adjustBuildingRepairFund = (buildingId: string, newAmount: number, reason: string) => {
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
      id: `notif-${Date.now()}`,
      title: `⚡ Factura de Suministro: ${newBill.serviceType.toUpperCase()} (${newBill.floor})`,
      message: `Contrato ${newBill.contractNumber} con ${newBill.companyName} por €${newBill.monthlyAmount}/mes en ${bldg?.name || 'el edificio'}.`,
      type: 'system',
      buildingId,
      buildingName: bldg?.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    setNotifications((prev) => [notif, ...prev]);

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
      id: `notif-${Date.now()}`,
      title: `💳 Pago de Suministro Asentado: €${bill.monthlyAmount}`,
      message: `Se registró el pago de ${bill.serviceType.toUpperCase()} (${bill.floor}) en ${bldg.name}.`,
      type: 'accounting_expense',
      buildingId,
      buildingName: bldg.name,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    setNotifications((prev) => [notif, ...prev]);

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
          action: `Incidencia reportada por ${currentUser.name} (Presidente)`,
          notes: data.description,
          statusFrom: undefined,
          statusTo: 'pendiente',
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);

    // Real-time Push Notification
    const notifTitle = data.priority === 'urgente' ? '🚨 INCIDENCIA URGENTE' : '📋 Nuevo Incidencia de Incidencia';
    const notifMsg = `En ${newTicket.buildingName} (Piso ${newTicket.floor}, ${newTicket.unitOrArea}): "${newTicket.title}"`;

    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: notifTitle,
      message: notifMsg,
      type: 'ticket_created',
      buildingId: newTicket.buildingId,
      buildingName: newTicket.buildingName,
      ticketId: newTicket.id,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'worker'],
    };

    setNotifications((prev) => [notif, ...prev]);
    showToast(notifTitle, notifMsg, data.priority === 'urgente' ? 'alert' : 'info');

    return newTicket;
  };

  const updateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    notes?: string,
    photoUrl?: string
  ) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

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
            timeline: [...t.timeline, timelineEvent],
          };
        }
        return t;
      })
    );

    const notifTitle = newStatus === 'resuelta' ? '✅ Ticket Resuelto' : '🔄 Actualización de Solicitud';
    const notifMsg = `${currentUser.name} (${currentUser.role}) actualizó ${targetTicket.ticketNumber} a "${newStatus.toUpperCase()}" en ${targetTicket.buildingName}.`;

    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: notifTitle,
      message: notifMsg,
      type: 'ticket_status',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      timestamp: now,
      read: false,
      targetRoles: ['admin', 'president'],
    };

    setNotifications((prev) => [notif, ...prev]);
    showToast(notifTitle, notifMsg, newStatus === 'resuelta' ? 'success' : 'info');
  };

  const assignWorkerToTicket = (ticketId: string, workerId: string) => {
    const worker = users.find((u) => u.id === workerId);
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!worker || !targetTicket) return;

    const now = new Date().toISOString();
    const timelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: now,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      action: `Ticket asignado al operario ${worker.name} (${worker.specialty || 'Trabajador'})`,
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedWorkerId: worker.id,
              assignedWorkerName: worker.name,
              assignedWorkerSpecialty: worker.specialty,
              updatedAt: now,
              timeline: [...t.timeline, timelineEvent],
            }
          : t
      )
    );

    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '🛠️ Ticket Asignado a Trabajador',
      message: `Se asignó el ticket ${targetTicket.ticketNumber} a ${worker.name}.`,
      type: 'ticket_status',
      buildingId: targetTicket.buildingId,
      buildingName: targetTicket.buildingName,
      ticketId: targetTicket.id,
      timestamp: now,
      read: false,
      targetRoles: ['admin', 'worker', 'president'],
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Trabajador Asignado', `${worker.name} ha sido asignado a la incidencia ${targetTicket.ticketNumber}.`, 'success');
  };

  const updateTicketDetails = (ticketId: string, updates: Partial<Ticket>) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
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

    setTransactions((prev) => [newTx, ...prev]);

    // 3. Real-time Notification for Admin & President
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
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

    setNotifications((prev) => [notif, ...prev]);
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
    setTransactions((prev) => [newTx, ...prev]);

    // 4. Send Push Notification to Admin & President
    const notifTitle = isResolving ? '✅ Incidencia Resuelto y Caja Actualizada' : '🔧 Gasto de Reparación en Caja';
    const notifMsg = `${currentUser.name} añadió €${data.amount} (${data.concept}) a la fondo de incidencias de ${targetTicket.buildingName} para el ticket ${targetTicket.ticketNumber}.`;

    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
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
    setNotifications((prev) => [notif, ...prev]);

    showToast(
      isResolving ? 'Incidencia Resuelto con Éxito' : 'Gasto Registrado en Caja',
      `Se descontaron €${data.amount} de la fondo de incidencias de ${bldg?.name || 'Edificio'} por concepto: "${data.concept}".`,
      isResolving ? 'success' : 'info'
    );
  };

  // Worker Payout Actions (Admin Exclusive)
  const addWorkerPayout = (data: Omit<WorkerPayout, 'id' | 'code'>): WorkerPayout => {
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
      setTransactions((prev) => [newTx, ...prev]);
    }

    // Push notification
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '💵 Pago de Honorarios a Operario',
      message: `Admin ${currentUser.name} registró pago de €${(Number(data.amount) || 0).toLocaleString()} a ${data.workerName} (${data.period}).`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'worker'],
    };
    setNotifications((prev) => [notif, ...prev]);

    showToast(
      'Pago Registrado',
      `Se registró pago de €${(Number(data.amount) || 0).toLocaleString()} a ${data.workerName}.`,
      'success'
    );

    return newPayout;
  };

  const updateWorkerPayoutStatus = (id: string, status: 'pagado' | 'pendiente', notes?: string) => {
    setWorkerPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, notes: notes || p.notes } : p))
    );
    showToast(
      'Estado de Pago Actualizado',
      `El pago ha sido marcado como ${status.toUpperCase()}.`,
      'success'
    );
  };

  // Neighbor Services Actions
  const addNeighborService = (data: Omit<NeighborService, 'id'>) => {
    const newService: NeighborService = {
      ...data,
      id: `ns-${Date.now()}`,
    };
    setNeighborServices((prev) => [...prev, newService]);
  };

  const updateNeighborService = (id: string, updates: Partial<NeighborService>) => {
    setNeighborServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeNeighborService = (id: string) => {
    setNeighborServices((prev) => prev.filter((s) => s.id !== id));
  };

  const createNeighborRequest = (data: Omit<NeighborServiceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: NeighborServiceRequest = {
      ...data,
      id: `nsr-${Date.now()}`,
      status: 'solicitado',
      createdAt: new Date().toISOString(),
    };
    setNeighborRequests((prev) => [...prev, newRequest]);
    
    // Notify admin & president
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: '🔔 Nueva Solicitud de Servicio',
      message: `El vecino ${data.neighborName} ha solicitado el servicio "${data.serviceName}".`,
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      buildingId: data.buildingId,
      targetRoles: ['admin', 'president']
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const updateNeighborRequest = (id: string, status: NeighborServiceRequest['status'], scheduledDate?: string) => {
    setNeighborRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status };
          if (scheduledDate) updated.scheduledDate = scheduledDate;
          
          if (status === 'completado') {
            const notif: PushNotification = {
              id: `notif-${Date.now()}`,
              title: '✅ Servicio Completado',
              message: `El servicio "${r.serviceName}" para ${r.neighborName} ha sido marcado como completado.`,
              type: 'system',
              timestamp: new Date().toISOString(),
              read: false,
              buildingId: r.buildingId,
              targetRoles: ['neighbor']
            };
            setNotifications(p => [notif, ...p]);
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Transaction Actions
  const addTransaction = (data: Omit<Transaction, 'id' | 'code'>): Transaction => {
    const codePrefix = data.type === 'ingreso' ? 'ING' : 'GST';
    const code = `${codePrefix}-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`;
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      code,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Notification
    const notif: PushNotification = {
      id: `notif-${Date.now()}`,
      title: data.type === 'ingreso' ? '💰 Nuevo Ingreso Asentado' : '💳 Nuevo Gasto Registrado',
      message: `${data.description} por €${(Number(data.amount) || 0).toLocaleString()} en ${data.buildingName}.`,
      type: data.type === 'ingreso' ? 'accounting_income' : 'accounting_expense',
      buildingId: data.buildingId,
      buildingName: data.buildingName,
      timestamp: new Date().toISOString(),
      read: false,
      targetRoles: ['admin', 'president'],
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast('Movimiento Guardado', `Se registró ${data.type.toUpperCase()}: €${(Number(data.amount) || 0).toLocaleString()} en ${data.buildingName}`, 'success');

    return newTx;
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Movimiento Eliminado', 'La transacción fue eliminada del libro contable.', 'info');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...{ read: true } } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && n.targetRoles.includes(currentUser.role)).length;
  }, [notifications, currentUser.role]);

  // Role-Scoped Data Filtering
  const accessibleBuildings = useMemo(() => {
    if (currentUser.role === 'admin') {
      return buildings;
    }
    if (currentUser.role === 'president') {
      return buildings.filter((b) => b.id === currentUser.buildingId || b.presidentId === currentUser.id);
    }
    // Worker can see all buildings to know locations
    return buildings;
  }, [currentUser, buildings]);

  const accessibleTickets = useMemo(() => {
    if (currentUser.role === 'admin') {
      return tickets;
    }
    if (currentUser.role === 'president') {
      return tickets.filter((t) => t.buildingId === currentUser.buildingId || t.createdBy.id === currentUser.id);
    }
    if (currentUser.role === 'worker') {
      // Worker sees tickets assigned to them or unassigned/open in general
      return tickets;
    }
    return tickets;
  }, [currentUser, tickets]);

  const accessibleTransactions = useMemo(() => {
    if (currentUser.role === 'admin') {
      return transactions;
    }
    if (currentUser.role === 'president') {
      return transactions.filter((t) => t.buildingId === currentUser.buildingId);
    }
    if (currentUser.role === 'worker') {
      return transactions.filter((t) => t.registeredBy === currentUser.name || t.category === 'servicio_reparacion' || t.category === 'honorarios_tecnicos');
    }
    return transactions;
  }, [currentUser, transactions]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers: users,
        isAuthenticated,
        authReady,
        setCurrentUser,
        addUser,
        updateUser,
        updateUserRole,
        toggleUserStatus,
        revokeBuildingAssignment,
        deleteUser,
        switchRole,
        loginWithEmail,
        loginWithGoogle,
        signInWithGoogle,
        registerUser,
        logout,
        buildings,
        addBuilding,
        updateBuilding,
        deleteBuilding,
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
        tickets,
        createTicket,
        updateTicketStatus,
        assignWorkerToTicket,
        updateTicketDetails,
        registerServiceAccounting,
        addRepairExpenseToTicket,
        transactions,
        addTransaction,
        deleteTransaction,
        workerPayouts,
        addWorkerPayout,
        updateWorkerPayoutStatus,
        neighborServices,
        addNeighborService,
        updateNeighborService,
        removeNeighborService,
        neighborRequests,
        createNeighborRequest,
        updateNeighborRequest,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        accessibleBuildings,
        accessibleTickets,
        accessibleTransactions,
        activeTab,
        setActiveTab,
        selectedBuildingId,
        setSelectedBuildingId,
        selectedTicketId,
        setSelectedTicketId,
        toasts,
        dismissToast,
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
