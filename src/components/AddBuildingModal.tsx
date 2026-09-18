import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, User, Euro, MapPin, Phone, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBuildingModal: React.FC<AddBuildingModalProps> = ({ isOpen, onClose }) => {
  const { addBuilding, allUsers } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Madrid');
  const [totalUnits, setTotalUnits] = useState(36);
  const [floors, setFloors] = useState(9);
  const [presidentName, setPresidentName] = useState('Alejandro Cordero');
  const [presidentPhone, setPresidentPhone] = useState('+34 688 997 711');
  const [presidentEmail, setPresidentEmail] = useState('alejandro.cordero@edificio.com');
  const [monthlyQuotaFee, setMonthlyQuotaFee] = useState(85);
  const [emergencyContact, setEmergencyContact] = useState('+34 912 345 678 (Conserjería 24h)');
  const [bankAccount, setBankAccount] = useState('BBVA IBAN: ES21 0182 5544 3322 1100 9988');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const bldgFloors = Number(floors) || 5;

    // Generate initial common areas
    const defaultCommonAreas = [
      {
        id: `ca-${Date.now()}-1`,
        name: `Garaje Principal & Estacionamiento`,
        category: 'garaje' as const,
        locationFloor: 'Sótano -1',
        status: 'disponible' as const,
        description: 'Plazas de garaje numeradas con portón eléctrico.',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: `ca-${Date.now()}-2`,
        name: `Comedor Comunitario / Salón de Eventos`,
        category: 'comedor' as const,
        locationFloor: 'Planta Baja',
        status: 'disponible' as const,
        description: 'Equipado con mesas, cocina de apoyo y climatización.',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: `ca-${Date.now()}-3`,
        name: `Pasillos y Corredores Principales`,
        category: 'pasillo' as const,
        locationFloor: `Pisos 1 al ${bldgFloors}`,
        status: 'disponible' as const,
        description: 'Iluminación con sensores de presencia y extintores certificados.',
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];

    // Generate initial floor utility bills
    const defaultUtilityBills = [
      {
        id: `fub-${Date.now()}-1`,
        floor: 'Piso 1',
        serviceType: 'gas' as const,
        companyName: 'Naturgy Energía',
        contractNumber: `CTR-GAS-${name.slice(0, 3).toUpperCase()}-01`,
        contractDate: new Date().toISOString().slice(0, 10),
        monthlyAmount: 260.0,
        paymentDayOfMonth: 5,
        billingFrequency: 'mensual' as const,
        status: 'activo' as const,
        notes: 'Calefacción central y agua caliente para el nivel.',
      },
      {
        id: `fub-${Date.now()}-2`,
        floor: 'Piso 1',
        serviceType: 'agua' as const,
        companyName: 'Canal de Isabel II',
        contractNumber: `CTR-AGUA-${name.slice(0, 3).toUpperCase()}-01`,
        contractDate: new Date().toISOString().slice(0, 10),
        monthlyAmount: 140.0,
        paymentDayOfMonth: 10,
        billingFrequency: 'mensual' as const,
        status: 'activo' as const,
        notes: 'Acometida y contadores individuales.',
      },
      {
        id: `fub-${Date.now()}-3`,
        floor: 'Piso 1',
        serviceType: 'internet' as const,
        companyName: 'Telefónica Movistar',
        contractNumber: `CTR-NET-${name.slice(0, 3).toUpperCase()}-01`,
        contractDate: new Date().toISOString().slice(0, 10),
        monthlyAmount: 65.0,
        paymentDayOfMonth: 1,
        billingFrequency: 'mensual' as const,
        status: 'activo' as const,
        notes: 'Fibra óptica 1Gbps simétrica para áreas y sistemas.',
      },
    ];

    addBuilding({
      name,
      code: code.trim() || `ED-${name.slice(0, 4).toUpperCase()}`,
      address,
      city,
      totalUnits: Number(totalUnits),
      floors: bldgFloors,
      presidentId: `user-pres-${Date.now()}`,
      presidentName,
      presidentPhone,
      presidentEmail,
      image,
      monthlyQuotaFee: Number(monthlyQuotaFee),
      currency: '€',
      emergencyContact,
      bankAccount,
      commonAreas: defaultCommonAreas,
      floorUtilityBills: defaultUtilityBills,
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full p-6 z-10 my-8 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#E8EFF9] text-[#0A2E6D] border border-[#E2E8F0]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#16202E]">
                    Registrar Nuevo Edificio
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    Añade un inmueble al portafolio de administración con su presidente y cuota.
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

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Nombre del Edificio / Comunidad *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!code) {
                        setCode(`ED-${e.target.value.replace(/\s+/g, '').slice(0, 6).toUpperCase()}`);
                      }
                    }}
                    placeholder="Ej. Torre Altavista Residences"
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Código de Identificación
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. TR-ALTA"
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#5A6B82]" />
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. C/ Mayor 15, Getafe, Madrid"
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Ciudad / Estado
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Total Unidades
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    N° de Pisos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Cuota Mensual (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlyQuotaFee}
                    onChange={(e) => setMonthlyQuotaFee(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#0A2E6D] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] font-semibold"
                  />
                </div>
              </div>

              {/* President Information */}
              <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] space-y-3">
                <h4 className="text-xs font-bold text-[#0A2E6D] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0A2E6D]" />
                  Presidente / Responsable del Edificio
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={presidentName}
                      onChange={(e) => setPresidentName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="text"
                      value={presidentPhone}
                      onChange={(e) => setPresidentPhone(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A6B82] mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={presidentEmail}
                      onChange={(e) => setPresidentEmail(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Emergency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Cuenta Bancaria / IBAN para Cuotas
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Ej. Santander IBAN: ES76 0049 1234 5678 9012 3456"
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Contacto de Emergencias 24/7
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Ej. +34 912 345 678 (Conserjería 24h)"
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Foto / Fachada del Edificio (URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E]"
                  />
                  {image && (
                    <img
                      src={image}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#0A0A0A] bg-[#0A2E6D] hover:bg-[#D4B370] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Guardar y Dar de Alta
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
