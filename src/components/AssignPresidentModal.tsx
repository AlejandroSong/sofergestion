import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Building } from '../types';

interface AssignPresidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building | null;
}

export const AssignPresidentModal: React.FC<AssignPresidentModalProps> = ({ isOpen, onClose, building }) => {
  const { allUsers, updateUser, updateUserRole, updateBuilding } = useApp();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');

  useEffect(() => {
    if (!isOpen || !building) return;
    setUserId(building.presidentId || '');
    setName(building.presidentName === 'Sin asignar' ? '' : building.presidentName);
    setEmail(building.presidentEmail || '');
    setPhone(building.presidentPhone || '');
    const unit = building.presidentUnitOrArea || '';
    const match = unit.match(/Piso\s+(.+?)\s+N[ºo°]\s+(.+)/i);
    setFloor(match?.[1] || '');
    setDoor(match?.[2] || unit);
  }, [isOpen, building]);

  if (!isOpen || !building) return null;

  const candidates = allUsers.filter(
    (u) => u.status !== 'suspended' && (u.role === 'unassigned' || u.role === 'neighbor' || u.role === 'president')
  );

  const handlePickUser = (id: string) => {
    setUserId(id);
    const user = allUsers.find((u) => u.id === id);
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setFloor(user.unitOrArea || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = [floor.trim() && `Piso ${floor.trim()}`, door.trim() && `Nº ${door.trim()}`]
      .filter(Boolean)
      .join(' ');
    const selected = allUsers.find((u) => u.id === userId);

    updateBuilding(building.id, {
      presidentId: selected?.id || building.presidentId || '',
      presidentName: name.trim() || selected?.name || 'Sin asignar',
      presidentPhone: phone.trim(),
      presidentEmail: email.trim().toLowerCase(),
      presidentUnitOrArea: unit || undefined,
    });

    if (selected) {
      if (phone.trim()) updateUser(selected.id, { phone: phone.trim(), email: email.trim() || selected.email });
      updateUserRole(selected.id, 'president', {
        buildingId: building.id,
        buildingName: building.name,
        unitOrArea: unit || selected.unitOrArea,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#16202E]">Asignar presidente</h3>
            <p className="text-xs text-[#5A6B82]">{building.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5 text-[#5A6B82]" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-semibold text-[#5A6B82]">Usuario existente (opcional)</label>
          <select
            value={userId}
            onChange={(e) => handlePickUser(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs"
          >
            <option value="">Escribir datos manualmente</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.email}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#5A6B82] flex items-center gap-1 mb-1">
                <User className="w-3 h-3" /> Nombre
              </label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#5A6B82] flex items-center gap-1 mb-1">
                <Mail className="w-3 h-3" /> Correo
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#5A6B82] flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> Teléfono
              </label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-[#5A6B82] mb-1 block">Piso</label>
                <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="4º" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#5A6B82] mb-1 block">Número</label>
                <input value={door} onChange={(e) => setDoor(e.target.value)} placeholder="B" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#5A6B82] flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Si elige un usuario de la lista, también se le asigna el rol de presidente.
          </p>
        </div>
        <div className="px-5 py-4 border-t border-[#E2E8F0] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0]">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0A2E6D] text-white">
            Guardar presidente
          </button>
        </div>
      </form>
    </div>
  );
};
