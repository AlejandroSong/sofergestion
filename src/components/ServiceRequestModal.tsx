import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Home,
  FileText,
  CheckCircle2,
  Phone,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NeighborService, User } from '../types';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: NeighborService | null;
  currentUser: User;
  buildingName?: string;
  onSuccess?: () => void;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  service,
  currentUser,
  buildingName = 'Comunidad de Propietarios',
  onSuccess,
}) => {
  const { createNeighborRequest } = useApp();

  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'manana' | 'tarde'>('manana');
  const [notes, setNotes] = useState<string>('');
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [unit, setUnit] = useState<string>(currentUser.unitOrArea || 'Planta 4ª Ático B');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen || !service) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullNotes = [
      notes.trim(),
      preferredTimeSlot === 'manana' ? 'Franja horaria preferente: Mañanas (09:00 - 14:00)' : 'Franja horaria preferente: Tardes (15:00 - 19:00)',
      phone ? `Teléfono de contacto: ${phone}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    createNeighborRequest({
      neighborId: currentUser.id,
      neighborName: currentUser.name,
      buildingId: currentUser.buildingId || 'bldg-1',
      unitOrArea: unit,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      scheduledDate: preferredDate,
      notes: fullNotes,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2E6D] to-[#12418C] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Servicio Oficial SOFER Gestión
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Solicitar Servicio Técnico
          </h2>
          <p className="text-xs text-blue-100/90 mt-1">
            Coordinado directamente por la Administración de tu edificio
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#16202E]">
              ¡Solicitud Registrada con Éxito!
            </h3>
            <p className="text-sm text-[#5A6B82] max-w-sm mx-auto">
              Tu administrador ha recibido la petición para <strong>{service.name}</strong>. Un técnico homologado se coordinará contigo para la fecha indicada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Service Summary Box */}
            <div className="bg-[#F4F6FA] border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2E6D] bg-blue-100/70 px-2 py-0.5 rounded">
                  {service.category}
                </span>
                <h4 className="font-bold text-[#16202E] text-sm mt-1">{service.name}</h4>
                <p className="text-xs text-[#5A6B82] line-clamp-1">{service.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-[#5A6B82] block">Tarifa acordada</span>
                <span className="text-xl font-extrabold text-[#0A2E6D]">
                  {service.price.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Resident & Dwelling info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#16202E] mb-1">
                  Vivienda / Inmueble
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#16202E]">
                  <Home className="w-4 h-4 text-[#0A2E6D] shrink-0" />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-transparent font-medium outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#16202E] mb-1">
                  Teléfono de Contacto
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#16202E]">
                  <Phone className="w-4 h-4 text-[#0A2E6D] shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full bg-transparent font-medium outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Preferred Date & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#16202E] mb-1">
                  Fecha Preferente
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#16202E]">
                  <Calendar className="w-4 h-4 text-[#0A2E6D] shrink-0" />
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent font-medium outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#16202E] mb-1">
                  Horario Preferente
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreferredTimeSlot('manana')}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      preferredTimeSlot === 'manana'
                        ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
                        : 'bg-slate-50 text-[#5A6B82] border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredTimeSlot('tarde')}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      preferredTimeSlot === 'tarde'
                        ? 'bg-[#0A2E6D] text-white border-[#0A2E6D]'
                        : 'bg-slate-50 text-[#5A6B82] border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>
            </div>

            {/* Notes / Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-[#16202E] mb-1">
                Detalles adicionales o instrucciones de acceso (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Avisar por teléfono antes de acudir; el timbre de la cancela tiene poca intensidad..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#16202E] outline-hidden focus:border-[#0A2E6D] focus:bg-white transition-colors resize-none"
              />
            </div>

            {/* Guarantees row */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center gap-3 text-xs text-[#0A2E6D]">
              <ShieldCheck className="w-5 h-5 text-[#0A2E6D] shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">Garantía SOFER Gestión:</span> Técnicos verificados con seguro de responsabilidad civil y presupuesto cerrado garantizado.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#5A6B82] hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0A2E6D] hover:bg-[#12418C] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Confirmar Solicitud</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
