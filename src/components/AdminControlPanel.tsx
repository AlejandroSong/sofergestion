import React, { useState } from 'react';
import { Building2, Euro, Plus, Save, Settings2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';

const ROLE_OPTIONS: { id: Role; label: string }[] = [
  { id: 'unassigned', label: 'Sin rol' },
  { id: 'neighbor', label: 'Vecino' },
  { id: 'president', label: 'Presidente' },
  { id: 'worker', label: 'Trabajador' },
  { id: 'admin', label: 'Admin' },
];

export const AdminControlPanel: React.FC = () => {
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
  const [newBuilding, setNewBuilding] = useState({ name: '', address: '', city: '', units: '20', floors: '5', quota: '85' });

  const saveAllPrices = () => {
    neighborServices.forEach((s) => {
      const raw = servicePrices[s.id];
      if (raw === undefined) return;
      const price = Number(raw);
      if (!Number.isNaN(price) && price >= 0 && price !== s.price) {
        updateNeighborService(s.id, { price });
      }
    });
    buildings.forEach((b) => {
      const raw = quotaPrices[b.id];
      if (raw === undefined) return;
      const quota = Number(raw);
      if (!Number.isNaN(quota) && quota >= 0 && quota !== b.monthlyQuotaFee) {
        updateBuilding(b.id, { monthlyQuotaFee: quota });
      }
    });
    allUsers
      .filter((u) => u.role === 'neighbor' || u.role === 'president')
      .forEach((u) => {
        const raw = feePrices[u.id];
        if (raw === undefined) return;
        const fee = Number(raw);
        if (!Number.isNaN(fee) && fee >= 0 && fee !== (u.monthlyFee ?? 0)) {
          updateUser(u.id, { monthlyFee: fee });
        }
      });
    showToast('Precios guardados', 'Cuotas y tarifas SOFER actualizadas para todos.', 'success');
  };

  const addService = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newService.price);
    if (!newService.name.trim() || Number.isNaN(price) || price < 0) return;
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
    showToast('Persona añadida', `${newPerson.name} quedó como ${newPerson.role}.`, 'success');
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
    setNewBuilding({ name: '', address: '', city: '', units: '20', floors: '5', quota: '85' });
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

  return (
    <section id="admin-control-panel" className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#16202E] flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#0A2E6D]" />
          Panel de control
        </h3>
        <div className="flex gap-1.5">
          {tabBtn('precios', 'Precios')}
          {tabBtn('personas', 'Personas y roles')}
          {tabBtn('fincas', 'Fincas')}
        </div>
      </div>
      <p className="text-[11px] text-[#5A6B82]">
        Desde aquí el administrador cambia tarifas, da de alta gente con rol y registra edificios. Se replica a todos.
      </p>

      {tab === 'precios' && (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5 flex items-center gap-1">
              <Euro className="w-3.5 h-3.5" /> Servicios SOFER (€)
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
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
              <button type="submit" className="px-2 py-1.5 bg-[#0A2E6D] text-white rounded-lg cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-bold text-[#0A2E6D] mb-1.5">Cuota de finca (€/mes)</p>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {buildings.length === 0 && <p className="text-[11px] text-[#5A6B82]">Aún no hay fincas.</p>}
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
                {allUsers
                  .filter((u) => u.role === 'neighbor' || u.role === 'president')
                  .map((u) => (
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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0A2E6D] text-white text-xs font-bold rounded-xl cursor-pointer"
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
              className="sm:col-span-1 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              type="email"
              value={newPerson.email}
              onChange={(e) => setNewPerson((p) => ({ ...p, email: e.target.value }))}
              placeholder="Correo"
              className="sm:col-span-1 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
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
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Alta
            </button>
          </form>
          <div className="max-h-52 overflow-y-auto space-y-1.5">
            {allUsers.map((u) => (
              <div key={u.id} className="grid sm:grid-cols-5 gap-2 items-center text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2 py-1.5">
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
                  defaultValue={u.role}
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
                  defaultValue={u.buildingId || ''}
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
                <span className="text-[10px] text-[#5A6B82] truncate">{u.role === 'worker' ? u.specialty : u.unitOrArea || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'fincas' && (
        <div className="space-y-3">
          <form onSubmit={addFinca} className="grid sm:grid-cols-6 gap-2">
            <input
              value={newBuilding.name}
              onChange={(e) => setNewBuilding((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre finca"
              className="sm:col-span-2 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              value={newBuilding.address}
              onChange={(e) => setNewBuilding((p) => ({ ...p, address: e.target.value }))}
              placeholder="Dirección"
              className="sm:col-span-2 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
            />
            <input
              value={newBuilding.city}
              onChange={(e) => setNewBuilding((p) => ({ ...p, city: e.target.value }))}
              placeholder="Ciudad"
              className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-[#0A2E6D] text-white text-xs font-bold rounded-lg cursor-pointer">
              <Building2 className="w-3.5 h-3.5" /> Alta
            </button>
            <input
              type="number"
              min={1}
              value={newBuilding.units}
              onChange={(e) => setNewBuilding((p) => ({ ...p, units: e.target.value }))}
              placeholder="Uds"
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
              placeholder="Cuota €"
              className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs"
            />
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
                <span className="text-[#5A6B82] hidden sm:inline">{b.city}</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={b.monthlyQuotaFee}
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
    </section>
  );
};
