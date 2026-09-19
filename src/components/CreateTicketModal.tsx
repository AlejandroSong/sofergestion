import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Sparkles, Building2, Upload, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TicketCategory, TicketPriority } from '../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBuildingId?: string;
  initialFloor?: string;
  initialUnitOrArea?: string;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  defaultBuildingId,
  initialFloor,
  initialUnitOrArea,
}) => {
  const { currentUser, buildings, createTicket } = useApp();

  const [buildingId, setBuildingId] = useState(
    defaultBuildingId || currentUser.buildingId || buildings[0]?.id || ''
  );
  const [floor, setFloor] = useState(initialFloor || '');
  const [unitOrArea, setUnitOrArea] = useState(initialUnitOrArea || (currentUser.role === 'neighbor' ? currentUser.unitOrArea || '' : ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialFloor) setFloor(initialFloor);
      if (initialUnitOrArea) setUnitOrArea(initialUnitOrArea);
      if (currentUser.buildingId && (currentUser.role === 'neighbor' || currentUser.role === 'president')) {
        setBuildingId(currentUser.buildingId);
      } else if (defaultBuildingId) {
        setBuildingId(defaultBuildingId);
      }
    }
  }, [isOpen, initialFloor, initialUnitOrArea, defaultBuildingId]);
  const [category, setCategory] = useState<TicketCategory>('puertas_accesos');
  const [categoryOther, setCategoryOther] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('alta');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&auto=format&fit=crop&q=80'
  );

  const quickTemplates = [
    {
      label: '🚪 Puerta defectuosa',
      floor: '3',
      unit: 'Vivienda 3º B (Puerta 2)',
      title: 'La puerta del cuarto 2 del piso 3 no funciona correctamente',
      category: 'puertas_accesos' as TicketCategory,
      priority: 'alta' as TicketPriority,
      desc: 'La cerradura principal del cuarto 2 está trabada y roza contra el suelo al intentar abrirla.',
    },
    {
      label: '💧 Sin agua',
      floor: 'Sótano',
      unit: 'Bomba Presurizadora Principal',
      title: 'No hay agua potable en el edificio por corte en bomba',
      category: 'agua' as TicketCategory,
      priority: 'urgente' as TicketPriority,
      desc: 'La bomba de presión del sótano dejó de operar y las viviendas no tienen suministro de agua.',
    },
    {
      label: '💡 Sin luz en pasillos',
      floor: '4',
      unit: 'Pasillo Común y Salida de Emergencia',
      title: 'No hay luz en las luminarias de pasillo del piso 4',
      category: 'luz' as TicketCategory,
      priority: 'media' as TicketPriority,
      desc: 'Luminarias apagadas por falla en magnetotérmico secundario del piso 4.',
    },
    {
      label: '🛗 Falla de Ascensor',
      floor: '2',
      unit: 'Ascensor Principal #1',
      title: 'Ascensor principal trabado entre piso 2 y 3',
      category: 'ascensor' as TicketCategory,
      priority: 'urgente' as TicketPriority,
      desc: 'El ascensor emitió alerta sonora y se bloqueó en el nivel intermedio.',
    },
  ];

  const applyTemplate = (tpl: typeof quickTemplates[0]) => {
    setFloor(tpl.floor);
    setUnitOrArea(tpl.unit);
    setTitle(tpl.title);
    setCategory(tpl.category);
    setPriority(tpl.priority);
    setDescription(tpl.desc);
  };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !buildingId) return;

    let finalCategory = category;
    let finalPriority = priority;
    let finalFloor = floor;
    let finalUnitOrArea = unitOrArea;

    if (currentUser.role === 'neighbor') {
      finalCategory = 'otros'; // Default category
      finalPriority = 'media'; // Default priority
      
      if (floor === 'En mi vivienda') {
        finalFloor = currentUser.unitOrArea || 'Vivienda';
        finalUnitOrArea = currentUser.unitOrArea || 'Vivienda';
      } else {
        finalFloor = 'Área Común';
        finalUnitOrArea = 'Exterior / Área Común';
      }
    }

    createTicket({
      buildingId,
      floor: finalFloor,
      unitOrArea: finalUnitOrArea,
      title,
      description,
      category: finalCategory,
      categoryOther: finalCategory === 'otros' ? categoryOther || 'Avería (Vecino)' : undefined,
      priority: finalPriority,
      photos: photoUrl ? [photoUrl] : [],
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full p-6 z-10 my-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-yellow-950/40 text-[#0A2E6D] border border-[#0A2E6D]/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#16202E]">
                    Comunicar Incidencia / Solicitud de Mantenimiento
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    Se generará un ticket con notificación push instantánea a los operarioes y al administrador.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentUser.role !== 'neighbor' && (
            <>
              {/* Quick Templates Bar */}
            <div className="my-4 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A2E6D] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Plantillas Rápidas Frecuentes:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="text-xs bg-[#F4F6FA] hover:bg-[#252525] text-[#16202E] border border-[#E2E8F0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
            </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Building selector */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#5A6B82]" />
                  Edificio Afectado
                </label>
                {currentUser.role === 'president' && currentUser.buildingId ? (
                  <div className="px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#16202E] flex items-center justify-between">
                    <span>{currentUser.buildingName || 'Tu Edificio Asignado'}</span>
                    <span className="text-[10px] text-[#0A2E6D] uppercase font-mono">Fijo por Permiso</span>
                  </div>
                ) : currentUser.role === 'neighbor' && currentUser.buildingId ? (
                  <div className="px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#16202E] flex items-center justify-between">
                    <span>{currentUser.buildingName || 'Tu Edificio'}</span>
                    <span className="text-[10px] text-[#0A2E6D] uppercase font-mono">Fijo</span>
                  </div>
                ) : (
                  <select
                    value={buildingId}
                    onChange={(e) => setBuildingId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.totalUnits} Viviendas
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Location: Floor and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.role === 'neighbor' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Mi Vivienda
                      </label>
                      <div className="px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#16202E] flex items-center justify-between">
                        <span>{currentUser.unitOrArea || 'Vivienda Principal'}</span>
                        <span className="text-[10px] text-[#0A2E6D] uppercase font-mono">Fijo</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        ¿Dónde es el problema?
                      </label>
                      <select
                        value={floor} // Using floor as a generic location holder for neighbor
                        onChange={(e) => setFloor(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                      >
                        <option value="">Selecciona ubicación...</option>
                        <option value="En mi vivienda">Dentro de mi vivienda</option>
                        <option value="En área común">En área común / exterior</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Piso / Nivel
                      </label>
                      <input
                        type="text"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="Ej. Piso 3, Sótano, Azotea"
                        required
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Cuarto / Vivienda / Área Común
                      </label>
                      <input
                        type="text"
                        value={unitOrArea}
                        onChange={(e) => setUnitOrArea(e.target.value)}
                        placeholder="Ej. Cuarto 2 (Vivienda 302), Pasillo Norte"
                        required
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Title / Summary */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Breve resumen del Problema
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Fuga de agua en el baño"
                  required
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.role === 'neighbor' ? (
                  <div className="col-span-1 sm:col-span-2 hidden">
                    {/* Neighbors do not select complex categories or priorities, they are auto-mapped or set by workers */}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Categoría del Servicio
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                      >
                        <option value="puertas_accesos">Puertas y Accesos</option>
                        <option value="agua">Agua y Bombas Hidráulicas</option>
                        <option value="luz">Electricidad y Luminarias</option>
                        <option value="ascensor">Ascensores y Elevadores</option>
                        <option value="fontaneria">Fontanería y Desagües</option>
                        <option value="estructural">Estructural y Albañilería</option>
                        <option value="seguridad">Seguridad y Portones</option>
                        <option value="limpieza">Limpieza y Áreas Verdes</option>
                        <option value="otros">Otros</option>
                      </select>
                    </div>

                    {category === 'otros' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                          Especificar Otro *
                        </label>
                        <input
                          type="text"
                          required
                          value={categoryOther}
                          onChange={(e) => setCategoryOther(e.target.value)}
                          placeholder="Ej. Intercomunicador, Buzón..."
                          className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                        Prioridad de Atención
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] font-medium"
                      >
                        <option value="baja">Baja - Mantenimiento rutinario</option>
                        <option value="media">Media - Atención estándar (24-48h)</option>
                        <option value="alta">Alta - Afecta el día a día</option>
                        <option value="urgente">🚨 URGENTE - Riesgo o corte de servicios</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Descripción Detallada del Problema
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explica qué ocurre exactamente para que el trabajador acuda con las herramientas adecuadas..."
                  required
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                />
              </div>

              {/* Photo Evidence simulation */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1 flex items-center justify-between">
                  <span>Evidencia Fotográfica (Opcional)</span>
                  <span className="text-[10px] text-[#5A6B82] font-normal">URL o Foto de muestra</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto-falla.jpg"
                      className="w-full pl-8 pr-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                    />
                    <Upload className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-3" />
                  </div>
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                    />
                  )}
                </div>
              </div>

                            {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                {currentUser.role === 'neighbor' ? (
                  <p className="text-[10px] text-[#5A6B82] max-w-[60%]">
                    * Tus reportes van directamente al <strong>Presidente, Trabajadores y Administradores</strong> para ser evaluados.
                  </p>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#0A2E6D] hover:bg-[#D4B370] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Enviar Reporte
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
