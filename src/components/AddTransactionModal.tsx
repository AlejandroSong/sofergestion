import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Euro, Building2, PlusCircle, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TransactionCategory, TransactionType } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBuildingId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultBuildingId,
}) => {
  const { currentUser, buildings, addTransaction } = useApp();

  const [buildingId, setBuildingId] = useState(
    defaultBuildingId || currentUser.buildingId || buildings[0]?.id || ''
  );
  const [type, setType] = useState<TransactionType>('ingreso');
  const [category, setCategory] = useState<TransactionCategory>('cuota_mantenimiento');
  const [categoryOther, setCategoryOther] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(1850);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo' | 'tarjeta'>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState(`REF-${Math.floor(10000 + Math.random() * 90000)}`);

  useEffect(() => {
    if (!isOpen) return;
    setBuildingId(defaultBuildingId || currentUser.buildingId || buildings[0]?.id || '');
    setReferenceNumber(`REF-${Math.floor(10000 + Math.random() * 90000)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the modal opens
  }, [isOpen, defaultBuildingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0 || !buildingId) return;

    const bldg = buildings.find((b) => b.id === buildingId);

    addTransaction({
      buildingId,
      buildingName: bldg ? bldg.name : 'Edificio General',
      type,
      category,
      categoryOther: category === 'otros' ? categoryOther.trim() : undefined,
      description,
      amount: Number(amount),
      date,
      registeredBy: currentUser.name,
      registeredByRole: currentUser.role,
      paymentMethod,
      referenceNumber,
      status: 'completado',
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
            className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 z-10 my-8 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    type === 'ingreso'
                      ? 'bg-green-950/40 text-green-600 border-green-200'
                      : 'bg-red-950/40 text-red-600 border-red-800/40'
                  }`}
                >
                  <Euro className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#16202E]">
                    Registrar Movimiento Contable
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    Asentar ingreso o egreso en el libro diario de caja y banco.
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setType('ingreso');
                    setCategory('cuota_mantenimiento');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'ingreso'
                      ? 'bg-green-600 text-[#16202E] shadow-xs'
                      : 'text-[#5A6B82] hover:text-[#16202E]'
                  }`}
                >
                  + Ingreso (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('gasto');
                    setCategory('pago_servicios_publicos');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'gasto'
                      ? 'bg-red-600 text-[#16202E] shadow-xs'
                      : 'text-[#5A6B82] hover:text-[#16202E]'
                  }`}
                >
                  - Gasto / Egreso (Salida)
                </button>
              </div>

              {/* Building selector */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#5A6B82]" />
                  Edificio
                </label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category and Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  >
                    {type === 'ingreso' ? (
                      <>
                        <option value="cuota_mantenimiento">Cuota Ordinaria Mantenimiento</option>
                        <option value="servicio_reparacion">Cobro de Reparación / Extra</option>
                        <option value="fondo_reserva">Aportación Fondo Reserva</option>
                        <option value="otros">Otros Ingresos</option>
                      </>
                    ) : (
                      <>
                        <option value="pago_servicios_publicos">Servicios Públicos (Luz/Agua/Gas)</option>
                        <option value="servicio_reparacion">Reparación & Mantenimiento Trabajador</option>
                        <option value="seguridad_vigilancia">Seguridad Privada & Vigilancia</option>
                        <option value="limpieza_conserjeria">Limpieza & Conserjería</option>
                        <option value="compra_materiales">Materiales & Repuestos</option>
                        <option value="honorarios_tecnicos">Honorarios Trabajadors / Mano de Obra</option>
                        <option value="otros">Otros Gastos</option>
                      </>
                    )}
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
                      placeholder="Especificar el tipo..."
                      className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Importe (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                      className="w-full pl-7 pr-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#16202E] focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                    />
                    <Euro className="w-3.5 h-3.5 text-[#5A6B82] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  Concepto / Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    type === 'ingreso'
                      ? 'Ej. Pago cuota vivienda 4º B correspondiente a Agosto'
                      : 'Ej. Factura Iberdrola electricidad zonas comunes'
                  }
                  required
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                />
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Fecha de Operación
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as 'transferencia' | 'efectivo' | 'tarjeta')
                    }
                    className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                  >
                    <option value="transferencia">Transferencia Electrónica</option>
                    <option value="efectivo">Efectivo / Caja de la Comunidad</option>
                    <option value="tarjeta">Tarjeta Bancaria</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-[#5A6B82] mb-1">
                  N° Comprobante / Referencia Fiscal
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej. IBERDROLA-REC-9941, TRANSF-ES21-0182-1122"
                  className="w-full px-3 py-2 bg-[#F4F6FA] border border-[#E2E8F0] text-[#16202E] placeholder-[#666666] rounded-lg text-xs focus:ring-2 focus:ring-[#C2A05E] focus:border-[#0A2E6D]"
                />
              </div>

              {/* Footer */}
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
                  Asentar en Contabilidad
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
