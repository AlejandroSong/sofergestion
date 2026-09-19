import React, { useEffect, useState } from 'react';
import { Home, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/exportUtils';
import { NeighborService } from '../types';

interface SoferServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoferServicesModal: React.FC<SoferServicesModalProps> = ({ isOpen, onClose }) => {
  const {
    neighborServices,
    addNeighborService,
    updateNeighborService,
    removeNeighborService,
    neighborRequests,
    updateNeighborRequest,
    deleteNeighborRequest,
    applyRequestHousingToUser,
    buildings,
    adminInboxTarget,
    currentUser,
  } = useApp();

  const [tab, setTab] = useState<'catalog' | 'requests'>('catalog');
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'mantenimiento' as NeighborService['category'],
    available: true,
  });

  useEffect(() => {
    if (isOpen && adminInboxTarget?.type === 'sofer') {
      setTab('requests');
    }
  }, [isOpen, adminInboxTarget]);

  if (!isOpen || currentUser.role !== 'admin') return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim() || newService.price < 0) return;
    addNeighborService({
      name: newService.name.trim(),
      description: newService.description.trim(),
      price: Number(newService.price),
      category: newService.category,
      available: true,
    });
    setNewService({ name: '', description: '', price: 0, category: 'mantenimiento', available: true });
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-[#16202E]">Servicios SOFER</h3>
              <p className="text-xs text-[#5A6B82]">Solo el administrador puede añadir o modificar el catálogo.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5 text-[#5A6B82]" />
          </button>
        </div>
        <div className="px-5 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${tab === 'catalog' ? 'bg-[#0A2E6D] text-white' : 'bg-slate-100 text-[#5A6B82]'}`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${tab === 'requests' ? 'bg-[#0A2E6D] text-white' : 'bg-slate-100 text-[#5A6B82]'}`}
          >
            Solicitudes ({neighborRequests.length})
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'catalog' ? (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdding((v) => !v)}
                  className="px-4 py-2 bg-[#0A2E6D] text-white rounded-xl text-xs font-bold"
                >
                  {isAdding ? 'Cancelar' : 'Añadir servicio'}
                </button>
              </div>
              {isAdding && (
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4">
                  <input
                    required
                    placeholder="Nombre"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                  />
                  <input
                    placeholder="Descripción"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                  />
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value as NeighborService['category'] })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                  >
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="gestoria">Gestoría</option>
                    <option value="otros">Otros</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#128480] text-white rounded-xl text-xs font-bold">
                      Guardar
                    </button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {neighborServices.map((s) => (
                  <div key={s.id} className="border border-[#E2E8F0] rounded-2xl p-4">
                    <div className="flex justify-between gap-2">
                      <h4 className="font-bold text-sm text-[#16202E]">{s.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-[#0A2E6D]">{s.category}</span>
                    </div>
                    <p className="text-xs text-[#5A6B82] mt-1">{s.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2E8F0]">
                      <span className="font-bold text-sm">{formatCurrency(s.price)}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateNeighborService(s.id, { available: !s.available })}
                          className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100"
                        >
                          {s.available ? 'Pausar' : 'Activar'}
                        </button>
                        <button type="button" onClick={() => removeNeighborService(s.id)} className="text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {neighborRequests.length === 0 && <p className="text-sm text-[#5A6B82]">No hay solicitudes.</p>}
              {neighborRequests.map((r) => {
                const community = buildings.find((b) => b.id === r.buildingId);
                const highlight = adminInboxTarget?.requestId === r.id;
                return (
                <div
                  key={r.id}
                  className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    highlight ? 'border-[#0A2E6D] bg-blue-50' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{r.serviceName}</p>
                    <p className="text-xs text-[#5A6B82]">
                      {r.neighborName} · {community?.name || 'Comunidad'} · {r.unitOrArea || 'Sin vivienda'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyRequestHousingToUser(r.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-[#0A2E6D] text-white"
                      title="Guardar este piso y número en la cuenta del vecino"
                    >
                      <Home className="w-3.5 h-3.5" />
                      Asignar vivienda
                    </button>
                    <select
                      value={r.status}
                      onChange={(e) => updateNeighborRequest(r.id, e.target.value as typeof r.status)}
                      className="text-xs border rounded-lg px-2 py-1"
                    >
                      <option value="solicitado">Solicitado</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <button type="button" onClick={() => deleteNeighborRequest(r.id)} className="text-red-600 p-1" title="Eliminar solicitud">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
