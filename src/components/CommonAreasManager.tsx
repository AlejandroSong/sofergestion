import React, { useState } from 'react';
import {
  Car,
  Utensils,
  Footprints,
  Dumbbell,
  Trees,
  Warehouse,
  Sparkles,
  Waves,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search,
  Building2,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Building, CommonArea } from '../types';
import { matchesQuery } from '../utils/safe';

interface CommonAreasManagerProps {
  building: Building;
  onOpenCreateTicketForArea?: (areaName: string, floor: string) => void;
}

export const CommonAreasManager: React.FC<CommonAreasManagerProps> = ({
  building,
  onOpenCreateTicketForArea,
}) => {
  const { currentUser, addCommonArea, updateCommonArea, removeCommonArea } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null);

  // Delete confirmation
  const [areaToDelete, setAreaToDelete] = useState<CommonArea | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CommonArea['category']>('garaje');
  const [categoryOther, setCategoryOther] = useState('');
  const [locationFloor, setLocationFloor] = useState('Planta Baja');
  const [status, setStatus] = useState<CommonArea['status']>('disponible');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState<number | ''>('');

  const commonAreas = building.commonAreas || [];

  const isAdmin = currentUser.role === 'admin';

  const getCategoryIcon = (cat: CommonArea['category']) => {
    switch (cat) {
      case 'garaje':
        return <Car className="w-4 h-4 text-blue-600" />;
      case 'comedor':
        return <Utensils className="w-4 h-4 text-yellow-600" />;
      case 'pasillo':
        return <Footprints className="w-4 h-4 text-green-600" />;
      case 'gimnasio':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      case 'jardin':
        return <Trees className="w-4 h-4 text-green-600" />;
      case 'azotea':
        return <Warehouse className="w-4 h-4 text-orange-400" />;
      case 'lobby':
        return <Sparkles className="w-4 h-4 text-yellow-600" />;
      case 'piscina':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      default:
        return <Building2 className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getCategoryLabel = (area: CommonArea) => {
    if (area.category === 'otro' && area.categoryOther) return area.categoryOther;
    switch (area.category) {
      case 'garaje':
        return 'Garaje / Estacionamiento';
      case 'comedor':
        return 'Comedor / SUM / Salón';
      case 'pasillo':
        return 'Pasillos & Corredores';
      case 'gimnasio':
        return 'Gimnasio & Fitness';
      case 'jardin':
        return 'Jardín & Zonas Verdes';
      case 'azotea':
        return 'Azotea / Terraza';
      case 'lobby':
        return 'Lobby & Recepción';
      case 'piscina':
        return 'Piscina & Solarium';
      default:
        return 'Área Común';
    }
  };

  const openAddModal = () => {
    setEditingArea(null);
    setName('');
    setCategory('garaje');
    setCategoryOther('');
    setLocationFloor('Planta Baja');
    setStatus('disponible');
    setDescription('');
    setCompanyName('');
    setContractDate('');
    setMonthlyAmount('');
    setIsModalOpen(true);
  };

  const openEditModal = (area: CommonArea) => {
    setEditingArea(area);
    setName(area.name);
    setCategory(area.category);
    setCategoryOther(area.categoryOther || '');
    setLocationFloor(area.locationFloor);
    setStatus(area.status);
    setDescription(area.description || '');
    setCompanyName(area.companyName || '');
    setContractDate(area.contractDate || '');
    setMonthlyAmount(area.monthlyAmount || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category,
      categoryOther: category === 'otro' ? categoryOther.trim() : undefined,
      locationFloor: locationFloor.trim(),
      status,
      description: description.trim(),
      companyName: companyName.trim(),
      contractDate,
      monthlyAmount: monthlyAmount ? Number(monthlyAmount) : undefined,
    };

    if (editingArea) {
      updateCommonArea(building.id, editingArea.id, payload);
    } else {
      addCommonArea(building.id, payload);
    }

    setIsModalOpen(false);
    setEditingArea(null);
  };

  const handleDeleteConfirm = () => {
    if (areaToDelete) {
      removeCommonArea(building.id, areaToDelete.id);
      setAreaToDelete(null);
    }
  };

  // Filtered areas
  const filteredAreas = commonAreas.filter((area) => {
    if (categoryFilter !== 'all' && area.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        matchesQuery(q, area.name, area.locationFloor, area.description)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F6FA] p-5 rounded-2xl border border-[#E2E8F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#16202E] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0A2E6D]" />
              Gestión de Áreas Comunes ({commonAreas.length})
            </h3>
            {isAdmin ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2E6D]/15 text-[#0A2E6D] border border-[#0A2E6D]/30">
                Control de Administrador
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/40 text-blue-600 border border-blue-200">
                Vista de Consulta & Incidencias
              </span>
            )}
          </div>
          <p className="text-xs text-[#5A6B82]">
            Administra los espacios comunitarios de {building.name}: garajes, comedores, pasillos, azoteas y zonas de servicio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Agregar Área Común
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-[#E2E8F0]'
            }`}
          >
            Todas ({commonAreas.length})
          </button>
          <button
            onClick={() => setCategoryFilter('garaje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'garaje'
                ? 'bg-blue-50 text-blue-600 border border-blue-800/50'
                : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-[#E2E8F0]'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-blue-600" />
            Garajes
          </button>
          <button
            onClick={() => setCategoryFilter('comedor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'comedor'
                ? 'bg-yellow-50 text-yellow-300 border border-yellow-800/50'
                : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-[#E2E8F0]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-yellow-600" />
            Comedores / SUM
          </button>
          <button
            onClick={() => setCategoryFilter('pasillo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'pasillo'
                ? 'bg-green-50 text-green-600 border border-green-800/50'
                : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E] border border-[#E2E8F0]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-green-600" />
            Pasillos
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar área o nivel..."
            className="w-full pl-8 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] bg-[#F4F6FA] text-[#16202E] placeholder-[#666666]"
          />
          <Search className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-3" />
        </div>
      </div>

      {/* Grid of Common Areas */}
      {filteredAreas.length === 0 ? (
        <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-[#555555] mx-auto" />
          <p className="text-sm font-semibold text-[#5A6B82]">No se encontraron áreas comunes</p>
          <p className="text-xs text-[#5A6B82] max-w-md mx-auto">
            {isAdmin
              ? 'Puedes agregar áreas comunes como garajes, comedores, pasillos o azoteas con el botón superior.'
              : 'El administrador aún no ha registrado áreas comunes con este criterio.'}
          </p>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="mt-2 px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar la Primera Área Común
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-5 shadow-md flex flex-col justify-between hover:border-[#E2E8F0] transition-all group"
            >
              <div className="space-y-3">
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#1D1D1D] border border-[#303030]">
                      {getCategoryIcon(area.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2E6D] block">
                        {getCategoryLabel(area)}
                      </span>
                      <h4 className="text-sm font-bold text-[#16202E] group-hover:text-[#16202E]">
                        {area.name}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      area.status === 'disponible'
                        ? 'bg-green-950/40 text-green-600 border-green-200'
                        : area.status === 'en_mantenimiento'
                        ? 'bg-yellow-950/40 text-yellow-600 border-yellow-200'
                        : 'bg-red-950/40 text-red-600 border-red-800/40'
                    }`}
                  >
                    {area.status === 'disponible'
                      ? 'Disponible'
                      : area.status === 'en_mantenimiento'
                      ? 'En Mantenimiento'
                      : 'Restringido'}
                  </span>
                </div>

                {/* Location Floor */}
                <div className="flex items-center gap-1.5 text-xs text-[#5A6B82] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                  <Layers className="w-3.5 h-3.5 text-[#0A2E6D]" />
                  <span className="font-semibold text-[#D1D5DB]">Nivel / Piso:</span>
                  <span>{area.locationFloor}</span>
                </div>

                {/* Description */}
                {area.description ? (
                  <p className="text-xs text-[#5A6B82] line-clamp-3 leading-relaxed">
                    {area.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#555555] italic">Sin descripción adicional.</p>
                )}
                
                {/* Contract Info */}
                {(area.companyName || area.contractDate || area.monthlyAmount) && (
                  <div className="mt-3 p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl space-y-1.5">
                    {area.companyName && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#5A6B82]">Contrato:</span>
                        <span className="font-semibold text-[#D1D5DB]">{area.companyName}</span>
                      </div>
                    )}
                    {area.contractDate && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#5A6B82]">Fecha de Contrato:</span>
                        <span className="font-semibold text-[#D1D5DB]">{area.contractDate}</span>
                      </div>
                    )}
                    {area.monthlyAmount != null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[#5A6B82]">Importe Mensual:</span>
                        <span className="font-bold text-[#0A2E6D]">{building.currency}{(Number(area.monthlyAmount) || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                {/* If President or has ticket callback */}
                {onOpenCreateTicketForArea ? (
                  <button
                    onClick={() => onOpenCreateTicketForArea(area.name, area.locationFloor)}
                    className="px-2.5 py-1.5 bg-[#F4F6FA] hover:bg-[#E8EFF9] text-[#0A2E6D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E2E8F0]"
                    title="Comunicar problema en esta área"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Comunicar Incidencia
                  </button>
                ) : (
                  <span className="text-[11px] text-[#5A6B82] flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {area.createdAt ? `Alta: ${area.createdAt}` : 'Espacio Comunitario'}
                  </span>
                )}

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(area)}
                      className="p-1.5 text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors cursor-pointer"
                      title="Editar área común"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAreaToDelete(area)}
                      className="p-1.5 text-red-600 hover:text-red-600 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar área común"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add or Edit Common Area (Admin only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 z-10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#0A2E6D]/15 text-[#0A2E6D] border border-[#0A2E6D]/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#16202E]">
                    {editingArea ? 'Editar Área Común' : 'Registrar Nueva Área Común'}
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    {building.name} • Solo el Administrador puede gestionar áreas
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Nombre del Área Común *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Garaje Subterráneo Nivel -1, Comedor / SUM, Pasillo Piso 3"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Tipo / Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CommonArea['category'])}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  >
                    <option value="garaje">🚗 Garaje / Estacionamiento</option>
                    <option value="comedor">🍽️ Comedor / SUM / Salón</option>
                    <option value="pasillo">🚶 Pasillo / Corredores</option>
                    <option value="gimnasio">🏋️ Gimnasio & Fitness</option>
                    <option value="jardin">🌿 Jardín & Áreas Verdes</option>
                    <option value="azotea">🌇 Azotea / Terraza</option>
                    <option value="lobby">🏛️ Lobby & Recepción</option>
                    <option value="piscina">🏊 Piscina</option>
                    <option value="otro">⚙️ Otra Área Común</option>
                  </select>
                </div>

                {category === 'otro' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                      Especificar Otra Área *
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryOther}
                      onChange={(e) => setCategoryOther(e.target.value)}
                      placeholder="Ej. Salón de juegos, Coworking..."
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Piso / Nivel de Ubicación *
                  </label>
                  <input
                    type="text"
                    required
                    value={locationFloor}
                    onChange={(e) => setLocationFloor(e.target.value)}
                    placeholder="Ej. Sótano -1, Planta Baja, Piso 1 al 12"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Estado Operativo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CommonArea['status'])}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                >
                  <option value="disponible">🟢 Disponible y Operativo</option>
                  <option value="en_mantenimiento">🟡 En Mantenimiento</option>
                  <option value="restringido">🔴 Acceso Restringido / En Obras</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Descripción, Dimensiones o Normas de Uso
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre portones automáticos, capacidad de plazas, horarios de uso o equipamiento..."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Empresa / Contrato
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Naturgy"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Fecha de Contrato
                  </label>
                  <input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Importe Mensual ({building.currency})
                  </label>
                  <input
                    type="number"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  {editingArea ? 'Guardar Cambios' : 'Registrar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {areaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full p-6 z-10 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#16202E]">¿Eliminar Área Común?</h4>
            </div>
            <p className="text-xs text-[#5A6B82]">
              ¿Estás seguro de que deseas eliminar <strong>"{areaToDelete.name}"</strong>? Esta acción removerá el área del catálogo del edificio.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setAreaToDelete(null)}
                className="px-3.5 py-1.5 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-[#16202E] rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
