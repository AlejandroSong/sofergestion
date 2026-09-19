import React, { useEffect, useState } from 'react';
import { Building2, Home, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { composeHousing, parseHousing } from '../utils/housing';

export const HousingPanel: React.FC<{ title?: string }> = ({ title = 'Mi vivienda' }) => {
  const { currentUser, communityDirectory, updateUser, showToast } = useApp();
  const parsed = parseHousing(currentUser.unitOrArea, currentUser.floor);
  const [buildingId, setBuildingId] = useState(currentUser.buildingId || '');
  const [floor, setFloor] = useState(parsed.floor);
  const [door, setDoor] = useState(parsed.door);

  useEffect(() => {
    const next = parseHousing(currentUser.unitOrArea, currentUser.floor);
    setBuildingId(currentUser.buildingId || '');
    setFloor(next.floor);
    setDoor(next.door);
  }, [currentUser.buildingId, currentUser.unitOrArea, currentUser.floor]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) {
      showToast('Falta la comunidad', 'Selecciona el edificio en el que vives.', 'alert');
      return;
    }
    if (!floor.trim() || !door.trim()) {
      showToast('Falta la vivienda', 'Indica el piso y el número de vivienda.', 'alert');
      return;
    }
    const community = communityDirectory.find((b) => b.id === buildingId);
    updateUser(currentUser.id, {
      buildingId,
      buildingName: community?.name,
      floor: floor.trim(),
      unitOrArea: composeHousing(floor, door),
    });
    showToast('Vivienda guardada', `${community?.name || 'Comunidad'} · ${composeHousing(floor, door)}`, 'success');
  };

  const selected = communityDirectory.find((b) => b.id === buildingId);

  return (
    <form
      onSubmit={handleSave}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div>
        <h3 className="text-base font-bold text-[#16202E] flex items-center gap-2">
          <Home className="w-5 h-5 text-[#0A2E6D]" />
          {title}
        </h3>
        <p className="text-xs text-[#5A6B82] mt-1">
          Elige una comunidad de las dadas de alta por el administrador e indica tu piso y número. El administrador puede corregir estos datos.
        </p>
      </div>

      {communityDirectory.length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Todavía no hay edificios registrados. Cuando el administrador dé de alta una finca, podrás seleccionarla aquí.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="sm:col-span-3 text-xs font-semibold text-[#5A6B82] space-y-1">
            Edificio / comunidad
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#16202E] bg-[#F8FAFC]"
            >
              <option value="">Selecciona tu edificio…</option>
              {communityDirectory.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.address ? ` · ${b.address}` : ''}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <p className="sm:col-span-3 text-[11px] text-[#5A6B82] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {selected.city ? `${selected.city} · ` : ''}
              {selected.floors} plantas
            </p>
          )}
          <label className="text-xs font-semibold text-[#5A6B82] space-y-1">
            Piso
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Ej. 3"
              className="w-full mt-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#16202E]"
            />
          </label>
          <label className="text-xs font-semibold text-[#5A6B82] space-y-1 sm:col-span-2">
            Número de vivienda
            <input
              type="text"
              value={door}
              onChange={(e) => setDoor(e.target.value)}
              placeholder="Ej. 2A / Puerta B"
              className="w-full mt-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#16202E]"
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={communityDirectory.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A2E6D] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        Guardar mi vivienda
      </button>
    </form>
  );
};
