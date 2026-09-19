import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Euro, Plus, Save, Settings2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

const ROLE_OPTIONS: { id: Role; label: string }[] = [
  { id: 'unassigned', label: 'Sin rol' },
  { id: 'neighbor', label: 'Vecino' },
  { id: 'president', label: 'Presidente' },
  { id: 'worker', label: 'Trabajador' },
  { id: 'admin', label: 'Admin' },
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
    addUser,
    updateUser,
    updateUserRole,
    addNeighborService,
    updateNeighborService,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'precios' | 'personas' | 'fincas'>('precios');
  const [servicePrices, setServicePrices] = useState<Record<string, string>>({});
  const [quotaPrices, setQuotaPrices] = useState<Record<string, string>>({});
  const [feePrices, setFeePrices] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newPerson, setNewPerson] = useState({ name: '', email: '', role: 'neighbor' as Role, buildingId: '' });
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

  const addPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.name.trim() || !newPerson.email.trim()) {
      showToast('Faltan datos', 'Indica nombre y correo.', 'alert');
      return;
    }
    const community = buildings.find((b) => b.id === newPerson.buildingId);
    const isBuildingRole = newPerson.role === 'neighbor' || newPerson.role === 'president';
    addUser({
      name: newPerson.name.trim(),
      email: newPerson.email.trim().toLowerCase(),
      role: newPerson.role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: '',
      buildingId: isBuildingRole ? community?.id : undefined,
      buildingName: isBuildingRole ? community?.name : undefined,
      monthlyFee: isBuildingRole ? (newPerson.role === 'president' ? 95 : 85) : undefined,
      specialty: newPerson.role === 'worker' ? 'Mantenimiento General' : undefined,
      provider: 'email',
      status: 'active',
    });
    showToast('Persona añadida', `${newPerson.name.trim()} quedó como ${newPerson.role}.`, 'success');
    setNewPerson({ name: '', email: '', role: 'neighbor', buildingId: '' });
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
          {tabBtn('personas', 'Personas y roles')}
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
          <div className="space-y-3">
            <form onSubmit={addPerson} className="grid sm:grid-cols-5 gap-2">
              <input
                value={newPerson.name}
                onChange={(e) => setNewPerson((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <input
                type="email"
                value={newPerson.email}
                onChange={(e) => setNewPerson((p) => ({ ...p, email: e.target.value }))}
                placeholder="Correo"
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              />
              <select
                value={newPerson.role}
                onChange={(e) => setNewPerson((p) => ({ ...p, role: e.target.value as Role }))}
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <select
                value={newPerson.buildingId}
                onChange={(e) => setNewPerson((p) => ({ ...p, buildingId: e.target.value }))}
                className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
              >
                <option value="">Finca (opcional)</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="px-2 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
                Dar de alta
              </button>
            </form>
            <div className="max-h-52 overflow-y-auto space-y-1.5">
              {allUsers.map((u) => (
                <div key={u.id} className="grid sm:grid-cols-4 gap-2 items-center text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2 py-1.5">
                  <input
                    defaultValue={u.name}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== u.name) updateUser(u.id, { name });
                    }}
                    className="px-2 py-1 border border-[#E2E8F0] rounded-lg bg-white"
                  />
                  <span className="truncate text-[#5A6B82]">{u.email}</span>
                  <select
                    value={u.role}
                    onChange={(e) => {
                      const role = e.target.value as Role;
                      const b = buildings.find((x) => x.id === (u.buildingId || buildings[0]?.id));
                      updateUserRole(u.id, role, {
                        buildingId: role === 'neighbor' || role === 'president' ? b?.id : undefined,
                        buildingName: role === 'neighbor' || role === 'president' ? b?.name : undefined,
                        specialty: role === 'worker' ? u.specialty || 'Mantenimiento General' : undefined,
                        monthlyFee: u.monthlyFee,
                        unitOrArea: u.unitOrArea,
                        floor: u.floor,
                      });
                    }}
                    className="px-2 py-1 border border-[#E2E8F0] rounded-lg bg-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={u.buildingId || ''}
                    onChange={(e) => {
                      const b = buildings.find((x) => x.id === e.target.value);
                      if (u.role === 'neighbor' || u.role === 'president') {
                        updateUserRole(u.id, u.role, {
                          buildingId: b?.id,
                          buildingName: b?.name,
                          monthlyFee: u.monthlyFee,
                          unitOrArea: u.unitOrArea,
                          floor: u.floor,
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
