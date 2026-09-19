import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Euro, Plus, Save, Settings2, Shield, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomRole, Role } from '../types';

const SYSTEM_ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'admin', label: 'Admin', hint: 'Control total' },
  { id: 'president', label: 'Presidente', hint: 'Su comunidad' },
  { id: 'worker', label: 'Trabajador', hint: 'Incidencias y visitas' },
  { id: 'neighbor', label: 'Vecino', hint: 'Vivienda y cuotas' },
  { id: 'unassigned', label: 'Sin rol', hint: 'Espera asignación' },
];

const BASE_ROLE_OPTIONS: { id: CustomRole['baseRole']; label: string }[] = [
  { id: 'neighbor', label: 'Permisos de vecino' },
  { id: 'worker', label: 'Permisos de trabajador' },
  { id: 'president', label: 'Permisos de presidente' },
  { id: 'admin', label: 'Permisos de admin' },
];

interface AdminControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({ isOpen, onClose }) => {
  const {
    allUsers,
    buildings,
    neighborServices,
    addBuilding,
    updateBuilding,
    updateUser,
    updateUserRole,
    customRoles,
    addCustomRole,
    renameCustomRole,
    deleteCustomRole,
    addNeighborService,
    updateNeighborService,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'precios' | 'personas' | 'fincas'>('precios');
  const [servicePrices, setServicePrices] = useState<Record<string, string>>({});
  const [quotaPrices, setQuotaPrices] = useState<Record<string, string>>({});
  const [feePrices, setFeePrices] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newRole, setNewRole] = useState({ name: '', baseRole: 'neighbor' as CustomRole['baseRole'] });
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    city: 'Madrid',
    units: '20',
    floors: '5',
    quota: '85',
  });

  const residents = useMemo(
    () => allUsers.filter((u) => u.role === 'neighbor' || u.role === 'president'),
    [allUsers]
  );

  if (!isOpen) return null;

  const priceOf = (id: string, fallback: number, map: Record<string, string>) => {
    const raw = map[id];
    if (raw === undefined || raw === '') return fallback;
    const n = Number(raw);
    return Number.isNaN(n) ? fallback : n;
  };

  const saveAllPrices = () => {
    let changes = 0;
    neighborServices.forEach((s) => {
      const price = priceOf(s.id, s.price, servicePrices);
      if (price !== s.price) {
        updateNeighborService(s.id, { price });
        changes += 1;
      }
    });
    buildings.forEach((b) => {
      const quota = priceOf(b.id, b.monthlyQuotaFee, quotaPrices);
      if (quota !== b.monthlyQuotaFee) {
        updateBuilding(b.id, { monthlyQuotaFee: quota });
        changes += 1;
      }
    });
    residents.forEach((u) => {
      const fee = priceOf(u.id, u.monthlyFee ?? 85, feePrices);
      if (fee !== (u.monthlyFee ?? 85)) {
        updateUser(u.id, { monthlyFee: fee });
        changes += 1;
      }
    });
    showToast(
      changes ? 'Precios guardados' : 'Sin cambios',
      changes ? `Se actualizaron ${changes} importes.` : 'Cambia un importe y vuelve a guardar.',
      changes ? 'success' : 'info'
    );
  };

  const addService = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newService.price);
    if (!newService.name.trim()) {
      showToast('Falta el servicio', 'Escribe el nombre del servicio.', 'alert');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      showToast('Falta el precio', 'Indica un precio en euros.', 'alert');
      return;
    }
    addNeighborService({
      name: newService.name.trim(),
      description: newService.name.trim(),
      price,
      available: true,
      category: 'otros',
    });
    setNewService({ name: '', price: '' });
  };

  const createRole = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomRole(newRole.name, newRole.baseRole);
    setNewRole({ name: '', baseRole: newRole.baseRole });
  };

  const assignedKey = (email: string, role: Role) => {
    const custom = customRoles.find((r) => r.memberEmails.includes(email.trim().toLowerCase()));
    return custom ? `c:${custom.id}` : `s:${role}`;
  };

  const applyRole = (userId: string, value: string, currentBuildingId?: string, currentSpecialty?: string, monthlyFee?: number, unitOrArea?: string, floor?: string) => {
    const extraBase = {
      monthlyFee,
      unitOrArea,
      floor,
      specialty: currentSpecialty,
    };
    if (value.startsWith('c:')) {
      const def = customRoles.find((r) => r.id === value.slice(2));
      if (!def) return;
      const b = buildings.find((x) => x.id === (currentBuildingId || buildings[0]?.id));
      updateUserRole(userId, def.baseRole, {
        ...extraBase,
        customRoleId: def.id,
        buildingId: def.baseRole === 'neighbor' || def.baseRole === 'president' ? b?.id : undefined,
        buildingName: def.baseRole === 'neighbor' || def.baseRole === 'president' ? b?.name : undefined,
      });
      return;
    }
    const role = value.slice(2) as Role;
    const b = buildings.find((x) => x.id === (currentBuildingId || buildings[0]?.id));
    updateUserRole(userId, role, {
      ...extraBase,
      buildingId: role === 'neighbor' || role === 'president' ? b?.id : undefined,
      buildingName: role === 'neighbor' || role === 'president' ? b?.name : undefined,
    });
  };

  const addFinca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding.name.trim()) {
      showToast('Falta el nombre', 'Indica el nombre de la finca.', 'alert');
      return;
    }
    addBuilding({
      name: newBuilding.name.trim(),
      code: `ED-${newBuilding.name.slice(0, 4).toUpperCase()}`,
      address: newBuilding.address.trim(),
      city: newBuilding.city.trim() || 'Madrid',
      totalUnits: Number(newBuilding.units) || 1,
      floors: Number(newBuilding.floors) || 1,
      presidentId: '',
      presidentName: 'Sin asignar',
      presidentPhone: '',
      presidentEmail: '',
      presidentUnitOrArea: '',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
      monthlyQuotaFee: Number(newBuilding.quota) || 0,
      repairFund: 0,
      initialRepairFund: 0,
      currency: '€',
      emergencyContact: '',
      bankAccount: '',
      commonAreas: [],
      floorUtilityBills: [],
    });
    setNewBuilding({ name: '', address: '', city: 'Madrid', units: '20', floors: '5', quota: '85' });
  };

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
        tab === id ? 'bg-[#0A2E6D] text-white' : 'bg-white text-[#5A6B82] border border-[#E2E8F0]'
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E2E8F0] shadow-2xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#16202E] flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#0A2E6D]" />
            Panel de control
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabBtn('precios', 'Precios')}
          {tabBtn('personas', 'Roles')}
          {tabBtn('fincas', 'Fincas')}
        </div>

        {tab === 'precios' && (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5 flex items-center gap-1">
                <Euro className="w-3.5 h-3.5" /> Servicios SOFER (€)
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {neighborServices.length === 0 && (
                  <p className="text-[11px] text-[#5A6B82]">No hay servicios. Añade uno abajo.</p>
                )}
                {neighborServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate text-[#16202E]">{s.name}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={servicePrices[s.id] ?? String(s.price)}
                      onChange={(e) => setServicePrices((p) => ({ ...p, [s.id]: e.target.value }))}
                      className="w-24 px-2 py-1 border border-[#E2E8F0] rounded-lg"
                    />
                  </label>
                ))}
              </div>
              <form onSubmit={addService} className="mt-2 flex gap-2">
                <input
                  value={newService.name}
                  onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nuevo servicio"
                  className="flex-1 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newService.price}
                  onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                  placeholder="€"
                  className="w-20 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
                  Añadir
                </button>
              </form>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5">Cuota de finca (€/mes)</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {buildings.length === 0 && <p className="text-[11px] text-[#5A6B82]">Aún no hay fincas. Crea una en la pestaña Fincas.</p>}
                  {buildings.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate">{b.name}</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={quotaPrices[b.id] ?? String(b.monthlyQuotaFee)}
                        onChange={(e) => setQuotaPrices((p) => ({ ...p, [b.id]: e.target.value }))}
                        className="w-20 px-2 py-1 border border-[#E2E8F0] rounded-lg"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5">Cuota vecino / presidente (€)</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {residents.length === 0 && <p className="text-[11px] text-[#5A6B82]">No hay vecinos ni presidentes todavía.</p>}
                  {residents.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate">{u.name}</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={feePrices[u.id] ?? String(u.monthlyFee ?? 85)}
                        onChange={(e) => setFeePrices((p) => ({ ...p, [u.id]: e.target.value }))}
                        className="w-20 px-2 py-1 border border-[#E2E8F0] rounded-lg"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={saveAllPrices}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2E6D] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Guardar precios
            </button>
          </div>
        )}

        {tab === 'personas' && (
          <div className="space-y-4">
            <form onSubmit={createRole} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={newRole.name}
                onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del nuevo rol"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <select
                value={newRole.baseRole}
                onChange={(e) => setNewRole((p) => ({ ...p, baseRole: e.target.value as CustomRole['baseRole'] }))}
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              >
                {BASE_ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Crear rol
              </button>
            </form>
            <div>
              <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Roles del sistema y creados
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {SYSTEM_ROLES.map((r) => {
                  const count = allUsers.filter((u) => assignedKey(u.email, u.role) === `s:${r.id}`).length;
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-xs border border-[#E2E8F0] rounded-xl px-2 py-1.5 bg-[#F8FAFC]">
                      <span className="flex-1 font-semibold text-[#16202E]">{r.label}</span>
                      <span className="text-[#5A6B82]">{r.hint}</span>
                      <span className="text-[10px] font-bold text-[#0A2E6D]">{count}</span>
                    </div>
                  );
                })}
                {customRoles.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs border border-[#E2E8F0] rounded-xl px-2 py-1.5">
                    <input
                      defaultValue={r.name}
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name && name !== r.name) renameCustomRole(r.id, name);
                      }}
                      className="flex-1 px-2 py-1 border border-[#E2E8F0] rounded-lg bg-white"
                    />
                    <span className="text-[#5A6B82] hidden sm:inline">
                      {BASE_ROLE_OPTIONS.find((b) => b.id === r.baseRole)?.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#0A2E6D]">{r.memberEmails.length}</span>
                    <button type="button" onClick={() => deleteCustomRole(r.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5">Asignar rol a cada persona</p>
              <div className="max-h-52 overflow-y-auto space-y-1.5">
                {allUsers.map((u) => (
                  <div key={u.id} className="grid sm:grid-cols-[1fr_1fr_1fr] gap-2 items-center text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2 py-1.5">
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[#16202E]">{u.name}</p>
                      <p className="truncate text-[#5A6B82]">{u.email}</p>
                    </div>
                    <select
                      value={assignedKey(u.email, u.role)}
                      onChange={(e) => applyRole(u.id, e.target.value, u.buildingId, u.specialty, u.monthlyFee, u.unitOrArea, u.floor)}
                      className="px-2 py-1 border border-[#E2E8F0] rounded-lg bg-white"
                    >
                      {SYSTEM_ROLES.map((r) => (
                        <option key={r.id} value={`s:${r.id}`}>
                          {r.label}
                        </option>
                      ))}
                      {customRoles.map((r) => (
                        <option key={r.id} value={`c:${r.id}`}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={u.buildingId || ''}
                      onChange={(e) => {
                        const b = buildings.find((x) => x.id === e.target.value);
                        if (u.role === 'neighbor' || u.role === 'president') {
                          const custom = customRoles.find((r) => r.memberEmails.includes(u.email.trim().toLowerCase()));
                          updateUserRole(u.id, u.role, {
                            buildingId: b?.id,
                            buildingName: b?.name,
                            monthlyFee: u.monthlyFee,
                            unitOrArea: u.unitOrArea,
                            floor: u.floor,
                            customRoleId: custom?.id,
                          });
                        } else {
                          showToast('Cambia el rol', 'Asigna vecino o presidente para ligar una finca.', 'info');
                        }
                      }}
                      className="px-2 py-1 border border-[#E2E8F0] rounded-lg bg-white"
                    >
                      <option value="">Sin finca</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'fincas' && (
          <div className="space-y-3">
            <form onSubmit={addFinca} className="grid sm:grid-cols-3 gap-2">
              <input
                value={newBuilding.name}
                onChange={(e) => setNewBuilding((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre finca"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                value={newBuilding.address}
                onChange={(e) => setNewBuilding((p) => ({ ...p, address: e.target.value }))}
                placeholder="Dirección"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                value={newBuilding.city}
                onChange={(e) => setNewBuilding((p) => ({ ...p, city: e.target.value }))}
                placeholder="Ciudad"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                type="number"
                min={1}
                value={newBuilding.units}
                onChange={(e) => setNewBuilding((p) => ({ ...p, units: e.target.value }))}
                placeholder="Viviendas"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                type="number"
                min={1}
                value={newBuilding.floors}
                onChange={(e) => setNewBuilding((p) => ({ ...p, floors: e.target.value }))}
                placeholder="Pisos"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={newBuilding.quota}
                onChange={(e) => setNewBuilding((p) => ({ ...p, quota: e.target.value }))}
                placeholder="Cuota €/mes"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <button type="submit" className="sm:col-span-3 inline-flex items-center justify-center gap-1 px-2 py-2 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
                <Building2 className="w-3.5 h-3.5" /> Registrar finca
              </button>
            </form>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {buildings.map((b) => (
                <div key={b.id} className="flex items-center gap-2 text-xs border border-[#E2E8F0] rounded-xl px-2 py-1.5">
                  <input
                    defaultValue={b.name}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== b.name) updateBuilding(b.id, { name });
                    }}
                    className="flex-1 px-2 py-1 border border-[#E2E8F0] rounded-lg"
                  />
                  <input
                    type="number"
                    min={0}
                    value={quotaPrices[b.id] ?? String(b.monthlyQuotaFee)}
                    onChange={(e) => setQuotaPrices((p) => ({ ...p, [b.id]: e.target.value }))}
                    onBlur={(e) => {
                      const quota = Number(e.target.value);
                      if (!Number.isNaN(quota) && quota !== b.monthlyQuotaFee) updateBuilding(b.id, { monthlyQuotaFee: quota });
                    }}
                    className="w-20 px-2 py-1 border border-[#E2E8F0] rounded-lg"
                  />
                  <span className="text-[10px] text-[#5A6B82]">€/mes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
