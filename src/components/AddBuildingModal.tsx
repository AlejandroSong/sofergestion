import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, MapPin, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Building } from '../types';

interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building?: Building | null;
}

export const AddBuildingModal: React.FC<AddBuildingModalProps> = ({ isOpen, onClose, building }) => {
  const { addBuilding, updateBuilding } = useApp();
  const isEdit = Boolean(building);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Madrid');
  const [totalUnits, setTotalUnits] = useState(36);
  const [floors, setFloors] = useState(9);
  const [monthlyQuotaFee, setMonthlyQuotaFee] = useState(85);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'
  );

  useEffect(() => {
    if (!isOpen) return;
    if (building) {
      setName(building.name);
      setCode(building.code);
      setAddress(building.address);
      setCity(building.city);
      setTotalUnits(building.totalUnits);
      setFloors(building.floors);
      setMonthlyQuotaFee(building.monthlyQuotaFee);
      setEmergencyContact(building.emergencyContact);
      setBankAccount(building.bankAccount);
      setImage(building.image);
      return;
    }
    setName('');
    setCode('');
    setAddress('');
    setCity('Madrid');
    setTotalUnits(36);
    setFloors(9);
    setMonthlyQuotaFee(85);
    setEmergencyContact('');
    setBankAccount('');
    setImage('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80');
  }, [isOpen, building]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const bldgFloors = Number(floors) || 1;
    const units = Number(totalUnits) || 1;
    const quota = Number(monthlyQuotaFee);
    if (Number.isNaN(quota) || quota < 0) return;

    if (isEdit && building) {
      updateBuilding(building.id, {
        name: name.trim(),
        code: code.trim() || building.code,
        address: address.trim(),
        city: city.trim(),
        totalUnits: units,
        floors: bldgFloors,
        monthlyQuotaFee: quota,
        emergencyContact,
        bankAccount,
        image,
      });
      onClose();
      return;
    }

    const defaultCommonAreas = [
      {
        id: `ca-${Date.now()}-1`,
        name: 'Garaje Principal & Estacionamiento',
        category: 'garaje' as const,
        locationFloor: 'Sótano -1',
        status: 'disponible' as const,
        description: 'Plazas de garaje numeradas con portón eléctrico.',
        createdAt: new Date().toISOString().slice(0, 10),
      },
    ];

    addBuilding({
      name: name.trim(),
      code: code.trim() || `ED-${name.slice(0, 4).toUpperCase()}`,
      address: address.trim(),
      city: city.trim(),
      totalUnits: units,
      floors: bldgFloors,
      presidentId: '',
      presidentName: 'Sin asignar',
      presidentPhone: '',
      presidentEmail: '',
      presidentUnitOrArea: '',
      image,
      monthlyQuotaFee: quota,
      repairFund: 0,
      initialRepairFund: 0,
      currency: '€',
      emergencyContact,
      bankAccount,
      commonAreas: defaultCommonAreas,
      floorUtilityBills: [],
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
                    {isEdit ? 'Editar Edificio' : 'Registrar Nuevo Edificio'}
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    {isEdit
                      ? 'Puedes cambiar unidades, pisos y cuota mensual en cualquier momento.'
                      : 'Registra el inmueble. El presidente se asigna después, con su vivienda y contacto.'}
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
                    step="0.01"
                    value={monthlyQuotaFee}
                    onChange={(e) => setMonthlyQuotaFee(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#0A2E6D] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D] font-semibold"
                  />
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
                    type="text"
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
                  {isEdit ? 'Guardar cambios' : 'Guardar y Dar de Alta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
