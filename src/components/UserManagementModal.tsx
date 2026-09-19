import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  ShieldCheck,
  UserCog,
  UserMinus,
  Plus,
  Building2,
  Wrench,
  Search,
  Check,
  Edit2,
  Mail,
  Shield,
  Trash2,
  AlertTriangle,
  PowerOff,
  CheckCircle2,
  Unlink,
  Crown,
  Clock,
  Sparkles,
  CreditCard,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isLastActiveAdmin } from '../data/users';
import { Role, User } from '../types';
import { NeighborAccountEditModal } from './NeighborAccountEditModal';
import { formatCurrency } from '../utils/exportUtils';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const {
    allUsers,
    currentUser,
    updateUserRole,
    deleteUser,
    addUser,
    toggleUserStatus,
    revokeBuildingAssignment,
    buildings,
    refreshDirectory,
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | Role | 'suspended'>('all');
  const [neighborDebtFilter, setNeighborDebtFilter] = useState<'all' | 'debtor' | 'non_debtor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Revoke confirmation modal state
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('neighbor');
  const [newBuildingId, setNewBuildingId] = useState<string>(buildings[0]?.id || '');
  const [newUnitOrArea, setNewUnitOrArea] = useState<string>('');
  const [newTaxReturns, setNewTaxReturns] = useState<number>(0);
  const [newSpecialty, setNewSpecialty] = useState('Electricidad y Climatización');
  const [newCustomSpecialty, setNewCustomSpecialty] = useState('');

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>('worker');
  const [editBuildingId, setEditBuildingId] = useState<string>('');
  const [editSpecialty, setEditSpecialty] = useState<string>('');
  const [editCustomSpecialty, setEditCustomSpecialty] = useState<string>('');
  const [editUnitOrArea, setEditUnitOrArea] = useState<string>('');
  const [editMonthlyFee, setEditMonthlyFee] = useState<number>(85);
  const [selectedNeighborForAccountEdit, setSelectedNeighborForAccountEdit] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen) void refreshDirectory();
  }, [isOpen, refreshDirectory]);

  const standardSpecialties = [
    'Electricidad y Climatización',
    'Fontanería y Bombas Hidráulicas',
    'Cerrajería y Mantenimiento General',
    'Pintura y Albañilería',
    'Ascensores y Automatización',
    'Limpieza y Desinfección Integral',
    'Jardinería y Zonas Verdes',
    'Antenas y Porteros Automáticos',
    'Otros (Especificar manualmente)',
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    let assignedBuildingName = undefined;
    if ((newRole === 'president' || newRole === 'neighbor') && newBuildingId) {
      const b = buildings.find((b) => b.id === newBuildingId);
      assignedBuildingName = b?.name;
    }

    let workerSpecialty: string | undefined = undefined;
    if (newRole === 'worker') {
      if (newSpecialty.startsWith('Otro')) {
        workerSpecialty = newCustomSpecialty.trim() || 'Trabajador Especialista';
      } else {
        workerSpecialty = newSpecialty;
      }
    }

    addUser({
      name: newName,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      phone: '+34 600 000 000',
      buildingId: (newRole === 'president' || newRole === 'neighbor') ? newBuildingId : undefined,
      buildingName: assignedBuildingName,
      specialty: workerSpecialty,
      unitOrArea: newRole === 'neighbor' ? newUnitOrArea : undefined,
      taxReturnsRemaining: newRole === 'neighbor' ? newTaxReturns : undefined,
      provider: 'email',
      status: 'active',
    });

    setIsAdding(false);
    setNewName('');
    setNewEmail('');
    setNewCustomSpecialty('');
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const confirmRevokeAssignment = () => {
    if (!userToRevoke) return;
    if (userToRevoke.role === 'president') {
      revokeBuildingAssignment(userToRevoke.id);
    } else if (userToRevoke.role === 'admin') {
      updateUserRole(userToRevoke.id, 'worker', { specialty: 'Mantenimiento General' });
    }
    setUserToRevoke(null);
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    const initialRole = user.role === 'unassigned' ? 'worker' : user.role;
    setEditRole(initialRole);
    setEditBuildingId(user.buildingId || buildings[0]?.id || '');
    setEditUnitOrArea(user.unitOrArea || '');
    setEditMonthlyFee(user.monthlyFee || 85);

    if (user.role === 'worker') {
      const match = standardSpecialties.find(
        (s) => !s.startsWith('Otro') && s.toLowerCase() === (user.specialty || '').toLowerCase()
      );
      if (match) {
        setEditSpecialty(match);
        setEditCustomSpecialty('');
      } else {
        setEditSpecialty('Otros (Especificar manualmente)');
        setEditCustomSpecialty(user.specialty || '');
      }
    } else {
      setEditSpecialty(standardSpecialties[0]);
      setEditCustomSpecialty('');
    }
  };

  const saveEditing = (userId: string) => {
    let assignedBuildingName = undefined;
    if ((editRole === 'president' || editRole === 'neighbor') && editBuildingId) {
      const b = buildings.find((b) => b.id === editBuildingId);
      assignedBuildingName = b?.name;
    }

    let finalSpecialty: string | undefined = undefined;
    if (editRole === 'worker') {
      if (editSpecialty.startsWith('Otro')) {
        finalSpecialty = editCustomSpecialty.trim() || 'Trabajador Especialista';
      } else {
        finalSpecialty = editSpecialty;
      }
    }

    updateUserRole(userId, editRole, {
      buildingId: (editRole === 'president' || editRole === 'neighbor') ? editBuildingId : undefined,
      buildingName: assignedBuildingName,
      specialty: finalSpecialty,
      unitOrArea: editRole === 'neighbor' ? (editUnitOrArea.trim() || 'Vivienda Principal') : undefined,
      monthlyFee: editRole === 'neighbor' ? editMonthlyFee : undefined,
    });

    setEditingUserId(null);
  };

  const filteredUsers = allUsers.filter((u) => {
    const isSuspended = u.status === 'suspended';
    if (filterRole === 'suspended') {
      return isSuspended;
    }
    const matchesRole = filterRole === 'all' || u.role === filterRole;

    if (neighborDebtFilter !== 'all') {
      if (u.role !== 'neighbor') return false;
      const b = u.feeBalance ?? 0;
      if (neighborDebtFilter === 'debtor' && b >= 0) return false;
      if (neighborDebtFilter === 'non_debtor' && b < 0) return false;
    }

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.buildingName && u.buildingName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.specialty && u.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.unitOrArea && u.unitOrArea.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const countNeighbors = allUsers.filter((u) => u.role === 'neighbor').length;
  const countDebtorNeighbors = allUsers.filter((u) => u.role === 'neighbor' && (u.feeBalance ?? 0) < 0).length;
  const countNonDebtorNeighbors = allUsers.filter((u) => u.role === 'neighbor' && (u.feeBalance ?? 0) >= 0).length;
  const countAdmins = allUsers.filter((u) => u.role === 'admin').length;
  const countPresidents = allUsers.filter((u) => u.role === 'president').length;
  const countWorkers = allUsers.filter((u) => u.role === 'worker').length;
  const countUnassigned = allUsers.filter((u) => u.role === 'unassigned').length;
  const countSuspended = allUsers.filter((u) => u.status === 'suspended').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-3xl max-w-4xl w-full text-[#16202E] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#191919] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0A2E6D]/10 border border-[#E2E8F0] flex items-center justify-center text-[#0A2E6D]">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2E6D] bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                      Control de Acceso RBAC
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-800/30">
                      Asignación Exclusiva por Administrador
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#16202E] mt-0.5">
                    Administración, Asignación y Remoción de Roles
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#E8EFF9] rounded-xl text-[#5A6B82] hover:text-[#16202E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Quick Info Banner about removing and assigning roles */}
              <div className="p-3.5 bg-[#F4F6FA] border border-[#282828] rounded-2xl flex items-start gap-3 text-xs text-[#5A6B82]">
                <Shield className="w-4 h-4 text-[#0A2E6D] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#16202E]">Regla de Seguridad:</strong> Los usuarios deben iniciar sesión primero antes de tener un rol. Los usuarios <strong className="text-[#16202E]">no pueden cambiarse roles entre sí</strong>; solo tú como <strong className="text-[#0A2E6D]">Administrador</strong> puedes asignarles su edificio, su especialidad o remover sus permisos.
                </p>
              </div>

              {/* Controls bar: search, role filter & Add button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#5A6B82] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, correo, edificio o especialidad..."
                    className="w-full pl-9 pr-3.5 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] placeholder-[#555555] outline-none"
                  />
                </div>

                {/* Role Filter tabs */}
                <div className="flex items-center bg-[#F4F6FA] p-1 rounded-xl border border-[#E2E8F0] text-xs flex-wrap gap-1">
                  <button
                    onClick={() => setFilterRole('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterRole === 'all'
                        ? 'bg-[#E8EFF9] text-[#16202E]'
                        : 'text-[#5A6B82] hover:text-[#16202E]'
                    }`}
                  >
                    Todos ({allUsers.length})
                  </button>
                  {countUnassigned > 0 && (
                    <button
                      onClick={() => setFilterRole('unassigned')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer animate-pulse ${
                        filterRole === 'unassigned'
                          ? 'bg-yellow-50 text-yellow-300'
                          : 'text-yellow-600/80 hover:text-yellow-300'
                      }`}
                    >
                      ⚡ Sin Rol ({countUnassigned})
                    </button>
                  )}
                  <button
                    onClick={() => setFilterRole('admin')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterRole === 'admin'
                        ? 'bg-[#0A2E6D]/20 text-[#0A2E6D]'
                        : 'text-[#5A6B82] hover:text-[#16202E]'
                    }`}
                  >
                    Admins ({countAdmins})
                  </button>
                  <button
                    onClick={() => setFilterRole('president')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterRole === 'president'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-[#5A6B82] hover:text-[#16202E]'
                    }`}
                  >
                    Presidentes ({countPresidents})
                  </button>
                  <button
                    onClick={() => setFilterRole('worker')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterRole === 'worker'
                        ? 'bg-green-50 text-green-600'
                        : 'text-[#5A6B82] hover:text-[#16202E]'
                    }`}
                  >
                    Trabajadors ({countWorkers})
                  </button>
                  <button
                    onClick={() => {
                      setFilterRole('neighbor');
                      setNeighborDebtFilter('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterRole === 'neighbor'
                        ? 'bg-blue-50 text-[#0A2E6D]'
                        : 'text-[#5A6B82] hover:text-[#16202E]'
                    }`}
                  >
                    Vecinos ({countNeighbors})
                  </button>
                  {countSuspended > 0 && (
                    <button
                      onClick={() => setFilterRole('suspended')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        filterRole === 'suspended'
                          ? 'bg-red-50 text-red-600'
                          : 'text-red-500/70 hover:text-red-600'
                      }`}
                    >
                      Inactivos ({countSuspended})
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-3.5 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {isAdding ? 'Cerrar Formulario' : 'Crear Usuario & Asignar'}
                </button>
              </div>

              {/* Sub-filter for Vecinos: Debt status */}
              {(filterRole === 'neighbor' || neighborDebtFilter !== 'all') && (
                <div className="px-6 py-2 bg-white border-t border-[#E2E8F0] flex items-center justify-between gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[#5A6B82] flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3 text-[#0A2E6D]" />
                      Filtro de Cuentas:
                    </span>
                    <button
                      type="button"
                      onClick={() => setNeighborDebtFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        neighborDebtFilter === 'all'
                          ? 'bg-[#0A2E6D] text-white shadow-xs'
                          : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-[#CBD5E1]'
                      }`}
                    >
                      Todos ({countNeighbors})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (filterRole !== 'neighbor') setFilterRole('neighbor');
                        setNeighborDebtFilter('debtor');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        neighborDebtFilter === 'debtor'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Deudores ({countDebtorNeighbors})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (filterRole !== 'neighbor') setFilterRole('neighbor');
                        setNeighborDebtFilter('non_debtor');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        neighborDebtFilter === 'non_debtor'
                          ? 'bg-green-700 text-white shadow-xs'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>No Deudores / Al Día ({countNonDebtorNeighbors})</span>
                    </button>
                  </div>
                  {neighborDebtFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setNeighborDebtFilter('all')}
                      className="text-[11px] text-[#0A2E6D] hover:underline font-semibold"
                    >
                      Mostrar todos los vecinos
                    </button>
                  )}
                </div>
              )}

              {/* Add User Expanded Section */}
              {isAdding && (
                <form
                  onSubmit={handleAddSubmit}
                  className="p-5 bg-[#1B1B1B] rounded-2xl border border-[#E2E8F0] space-y-4 shadow-lg animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <h4 className="font-bold text-sm text-[#16202E] flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#0A2E6D]" />
                      Dar de Alta Nuevo Usuario y Asignar Rol
                    </h4>
                    <span className="text-[11px] text-[#5A6B82]">
                      Podrá iniciar sesión inmediatamente con su correo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="ej. Mariana Santos"
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="mariana@ejemplo.com"
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Rol a Asignar
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as Role)}
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-xl text-xs text-[#16202E] outline-none"
                      >
                        <option value="admin">👑 Administrador de fincas</option>
                        <option value="president">🏢 Presidente de la comunidad</option>
                        <option value="neighbor">🏠 Vecino / Residente</option>
                        <option value="worker">🛠️ Operario / Mantenimiento</option>
                      </select>
                    </div>
                  </div>

                  {(newRole === 'president' || newRole === 'neighbor') && (
                    <div className="p-3 bg-[#F4F6FA] rounded-xl border border-[#E2E8F0] space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#5A6B82] mb-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          Edificio / Comunidad Asignada
                        </label>
                        <select
                          value={newBuildingId}
                          onChange={(e) => setNewBuildingId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#16202E] outline-none"
                        >
                          {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.address})
                            </option>
                          ))}
                        </select>
                      </div>

                      {newRole === 'neighbor' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                              Vivienda / Área
                            </label>
                            <input
                              type="text"
                              value={newUnitOrArea}
                              onChange={(e) => setNewUnitOrArea(e.target.value)}
                              placeholder="Ej: Planta 2 Puerta A"
                              className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#16202E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                              Declaraciones Renta (Saldo)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={newTaxReturns}
                              onChange={(e) => setNewTaxReturns(Number(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#16202E] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {newRole === 'worker' && (
                    <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] space-y-2.5">
                      <label className="block text-xs font-semibold text-green-700 mb-1 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Especialidad de Trabajo
                      </label>
                      <select
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs text-[#16202E] outline-none"
                      >
                        {standardSpecialties.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {newSpecialty.startsWith('Otro') && (
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                            <span>✏️ Especificar tipo de trabajo / especialidad manualmente:</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newCustomSpecialty}
                            onChange={(e) => setNewCustomSpecialty(e.target.value)}
                            placeholder="Escribe el oficio (ej. Carpintería de aluminio, Cristalería, Desatascos...)"
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 focus:border-emerald-600 rounded-lg text-xs text-[#16202E] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-2 bg-[#E8EFF9] hover:bg-[#2C2C2C] text-[#5A6B82] text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] font-bold text-xs rounded-xl cursor-pointer shadow-md"
                    >
                      Crear y Asignar Rol
                    </button>
                  </div>
                </form>
              )}

              {/* Users List */}
              <div className="space-y-2.5">
                {filteredUsers.map((user) => {
                  const isLastAdmin = isLastActiveAdmin(user, allUsers);
                  const isCurrentUser = currentUser.id === user.id;
                  const isEditingThisUser = editingUserId === user.id;
                  const isSuspended = user.status === 'suspended';
                  const isUnassigned = user.role === 'unassigned';

                  return (
                    <div
                      key={user.id}
                      className={`p-4 bg-[#FFFFFF] rounded-2xl border transition-all ${
                        isLastAdmin
                          ? 'border-[#0A2E6D]/40 bg-gradient-to-r from-[#141414] to-[#1A1812]'
                          : isUnassigned
                          ? 'border-yellow-700/50 bg-yellow-950/15'
                          : isSuspended
                          ? 'border-red-200 bg-[#161010] opacity-80'
                          : 'border-[#E2E8F0] hover:border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* User identity & badge */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className={`w-11 h-11 rounded-full object-cover bg-[#F4F6FA] border ${
                                isSuspended
                                  ? 'border-red-700/50 grayscale'
                                  : isLastAdmin
                                  ? 'border-[#0A2E6D]'
                                  : isUnassigned
                                  ? 'border-yellow-400'
                                  : 'border-[#E2E8F0]'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                            {isSuspended && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 border-2 border-[#141414] flex items-center justify-center text-[9px] text-[#16202E]">
                                ✕
                              </span>
                            )}
                            {isUnassigned && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 border-2 border-[#141414] flex items-center justify-center text-[9px] text-black font-bold">
                                !
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-[#16202E] truncate">
                                {user.name}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-950/40 px-1.5 py-0.5 rounded border border-green-200">
                                  Tú
                                </span>
                              )}
                              {isLastAdmin && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#0A2E6D] bg-[#0A2E6D]/15 px-2 py-0.5 rounded border border-[#0A2E6D]/40">
                                  <ShieldCheck className="w-3 h-3 text-[#0A2E6D]" />
                                  Único administrador
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  user.role === 'admin'
                                    ? 'bg-[#0A2E6D]/15 text-[#0A2E6D] border-[#0A2E6D]/30'
                                    : user.role === 'president'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : user.role === 'worker'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : user.role === 'neighbor'
                                    ? 'bg-[#128480]/15 text-[#128480] border-[#128480]/30'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                }`}
                              >
                                {user.role === 'admin'
                                  ? '👑 Administrador'
                                  : user.role === 'president'
                                  ? '🏢 Presidente'
                                  : user.role === 'worker'
                                  ? '🛠️ Trabajador'
                                  : user.role === 'neighbor'
                                  ? '🏠 Vecino'
                                  : '⚡ Sin Rol Asignado'}
                              </span>

                              {isSuspended ? (
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-red-950/60 text-red-600 border border-red-800/60 flex items-center gap-1">
                                  <PowerOff className="w-2.5 h-2.5" />
                                  Acceso Suspendido
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-950/30 text-green-600 border border-green-800/30">
                                  Activo
                                </span>
                              )}

                              {user.role === 'neighbor' && (
                                <span
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                                    (user.feeBalance ?? 0) < 0
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-green-100 text-green-800 border-green-200'
                                  }`}
                                >
                                  {(user.feeBalance ?? 0) < 0 ? '⚠️ Deudor' : '✅ Al Día'}
                                  <span className="font-semibold">
                                    ({formatCurrency(user.feeBalance ?? 0)})
                                  </span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#5A6B82] mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-[#5A6B82]" />
                                {user.email}
                              </span>
                              {user.role === 'president' && (
                                <span className="flex items-center gap-1 text-blue-600 font-medium">
                                  <Building2 className="w-3 h-3" />
                                  {user.buildingName ? (
                                    user.buildingName
                                  ) : (
                                    <span className="text-yellow-600 italic">
                                      Sin edificio asignado (Rol vacante)
                                    </span>
                                  )}
                                </span>
                              )}
                              {user.role === 'neighbor' && (
                                <span className="flex items-center gap-1 text-[#128480] font-medium">
                                  <Building2 className="w-3 h-3" />
                                  {user.buildingName || 'Edificio'} • {user.unitOrArea || 'Vivienda'}
                                </span>
                              )}
                              {user.role === 'worker' && user.specialty && (
                                <span className="flex items-center gap-1 text-green-700 font-medium">
                                  <Wrench className="w-3 h-3" />
                                  {user.specialty}
                                </span>
                              )}
                              {user.role === 'unassigned' && (
                                <span className="text-yellow-600 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Esperando que el Administrador asigne un rol
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Toolbar for Removing / Modifying Role */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap justify-end">
                          {/* Unassigned quick action: Asignar Rol */}
                          {isUnassigned && !isEditingThisUser && (
                            <button
                              onClick={() => startEditing(user)}
                              className="px-3 py-1.5 bg-[#0A2E6D] hover:bg-[#082456] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                              <span>Asignar Rol</span>
                            </button>
                          )}

                          {/* Revoke building assignment quick button for president */}
                          {!isEditingThisUser && user.role === 'president' && user.buildingId && !isLastAdmin && (
                            <button
                              onClick={() => setUserToRevoke(user)}
                              className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Desvincular edificio asignado sin borrar el usuario"
                            >
                              <Unlink className="w-3.5 h-3.5 text-yellow-600" />
                              <span>Desvincular Edificio</span>
                            </button>
                          )}

                          {/* Neighbor accounts quick edit button */}
                          {!isEditingThisUser && user.role === 'neighbor' && (
                            <button
                              onClick={() => setSelectedNeighborForAccountEdit(user)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs text-[#0A2E6D] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="Editar saldo, cuota mensual o anual, y último pago del vecino"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-[#0A2E6D]" />
                              <span>Cuentas</span>
                            </button>
                          )}

                          {/* Edit / Change Role button - Admin can freely modify any user's role */}
                          {!isEditingThisUser && !isUnassigned && (
                            <button
                              onClick={() => startEditing(user)}
                              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#0A2E6D] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                              title="Cambiar rol o reasignar permisos libremente"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#0A2E6D]" />
                              <span>Modificar Rol</span>
                            </button>
                          )}

                          {/* Toggle active / suspended status */}
                          {!isLastAdmin && (
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                isSuspended
                                  ? 'bg-green-950/40 border-green-200 text-green-600 hover:bg-green-900/50'
                                  : 'bg-[#F4F6FA] border-[#303030] text-[#5A6B82] hover:text-yellow-300 hover:border-yellow-200 hover:bg-yellow-950/30'
                              }`}
                              title={
                                isSuspended
                                  ? 'Reactivar acceso al sistema'
                                  : 'Suspender acceso temporalmente'
                              }
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete / Remove user & role completely */}
                          {!isLastAdmin && (
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 hover:border-red-600/60 rounded-xl text-xs text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Remover permanentemente este usuario y todos sus roles"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span className="hidden sm:inline">Remover</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* In-place role editor form */}
                      {isEditingThisUser && (
                        <div className="mt-3 pt-3 border-t border-[#CBD5E1] bg-[#F8FAFC] p-4 rounded-xl border border-[#CBD5E1] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0A2E6D] flex items-center gap-1.5">
                              <UserCog className="w-4 h-4" />
                              Modificar Rol y Permisos de Acceso
                            </span>
                            <span className="text-[11px] text-[#5A6B82]">
                              Usuario: <strong className="text-[#16202E]">{user.name}</strong>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-start">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                                Asignar / Cambiar Rol
                              </label>
                              <select
                                value={editRole}
                                onChange={(e) => {
                                  const r = e.target.value as Role;
                                  setEditRole(r);
                                  if ((r === 'president' || r === 'neighbor') && !editBuildingId && buildings.length > 0) {
                                    setEditBuildingId(buildings[0].id);
                                  }
                                  if (r === 'worker' && !editSpecialty) {
                                    setEditSpecialty(standardSpecialties[0]);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#16202E] outline-none font-medium"
                              >
                                <option value="admin">👑 Administrador de fincas</option>
                                <option value="president">🏢 Presidente de la comunidad</option>
                                <option value="worker">🛠️ Trabajador / Operario</option>
                                <option value="neighbor">🏠 Vecino / Residente</option>
                                <option value="unassigned">⏳ Sin Rol Asignado</option>
                              </select>
                            </div>

                            {editRole === 'president' && (
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  Edificio que Preside
                                </label>
                                <select
                                  value={editBuildingId}
                                  onChange={(e) => setEditBuildingId(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#16202E] outline-none"
                                >
                                  {buildings.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.name} ({b.address})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {editRole === 'neighbor' && (
                              <>
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#128480] mb-1 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Edificio / Comunidad
                                  </label>
                                  <select
                                    value={editBuildingId}
                                    onChange={(e) => setEditBuildingId(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#16202E] outline-none"
                                  >
                                    {buildings.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-[#128480] mb-1">
                                    Vivienda / Puerta
                                  </label>
                                  <input
                                    type="text"
                                    value={editUnitOrArea}
                                    onChange={(e) => setEditUnitOrArea(e.target.value)}
                                    placeholder="Ej. Planta 3ª Puerta B"
                                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#16202E] outline-none"
                                  />
                                </div>
                              </>
                            )}

                            {editRole === 'worker' && (
                              <div className="sm:col-span-2 space-y-2">
                                <div>
                                  <label className="block text-[11px] font-semibold text-green-700 mb-1 flex items-center gap-1">
                                    <Wrench className="w-3.5 h-3.5" />
                                    Especialidad Técnica / Oficio
                                  </label>
                                  <select
                                    value={editSpecialty}
                                    onChange={(e) => setEditSpecialty(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#16202E] outline-none font-medium"
                                  >
                                    {standardSpecialties.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {editSpecialty.startsWith('Otro') && (
                                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                                      <span>✏️ Escribir tipo de trabajo / especialidad técnica manualmente:</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={editCustomSpecialty}
                                      onChange={(e) => setEditCustomSpecialty(e.target.value)}
                                      placeholder="Escribe el oficio (ej. Carpintería de aluminio, Cristalería, Antenista...)"
                                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-400 focus:border-emerald-600 rounded-lg text-xs text-[#16202E] outline-none"
                                      autoFocus
                                    />
                                    <p className="text-[10px] text-emerald-700 mt-1">
                                      Este oficio se asignará directamente como la especialidad del operario en el sistema.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-[#5A6B82] border border-[#CBD5E1] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditing(user.id)}
                              className="px-4 py-1.5 bg-[#0A2E6D] hover:bg-[#082456] text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Guardar Rol
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-2xl p-6">
                    <Users className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#5A6B82]">
                      No se encontraron usuarios en esta categoría o búsqueda
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#161616] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#5A6B82] flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#0A2E6D]" />
                <span>Control Centralizado de Roles SOFER Gestión</span>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#16202E] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </motion.div>

          {/* Delete User Modal */}
          {userToDelete && (
            <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#F4F6FA] border border-red-900/50 rounded-3xl max-w-md w-full p-6 text-[#16202E] shadow-2xl space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-base font-bold text-[#16202E]">
                    ¿Remover usuario y rol definitivamente?
                  </h4>
                  <p className="text-xs text-[#5A6B82]">
                    Estás a punto de eliminar a{' '}
                    <strong className="text-[#16202E]">{userToDelete.name}</strong> ({userToDelete.email}) con rol de{' '}
                    <strong className="text-red-600 uppercase">{userToDelete.role}</strong>. Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-2.5 bg-[#E8EFF9] hover:bg-[#2E2E2E] text-[#5A6B82] hover:text-[#16202E] text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-[#16202E] text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sí, Remover Usuario
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Revoke Building Assignment Modal */}
          {userToRevoke && (
            <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#F4F6FA] border border-yellow-900/50 rounded-3xl max-w-md w-full p-6 text-[#16202E] shadow-2xl space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-600 mx-auto">
                  <Unlink className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-base font-bold text-[#16202E]">
                    ¿Desvincular edificio de este Presidente?
                  </h4>
                  <p className="text-xs text-[#5A6B82]">
                    Se revocará la asignación del edificio{' '}
                    <strong className="text-blue-600">{userToRevoke.buildingName}</strong> a{' '}
                    <strong className="text-[#16202E]">{userToRevoke.name}</strong>. El usuario mantendrá su cuenta pero sin finca asignada.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setUserToRevoke(null)}
                    className="flex-1 py-2.5 bg-[#E8EFF9] hover:bg-[#2E2E2E] text-[#5A6B82] hover:text-[#16202E] text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRevokeAssignment}
                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Unlink className="w-4 h-4" />
                    Confirmar Desvinculación
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {/* Neighbor Account Edit Modal from User Management */}
          {selectedNeighborForAccountEdit && (
            <NeighborAccountEditModal
              isOpen={!!selectedNeighborForAccountEdit}
              onClose={() => setSelectedNeighborForAccountEdit(null)}
              neighbor={selectedNeighborForAccountEdit}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
