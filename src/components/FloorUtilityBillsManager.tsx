import React, { useState, useMemo } from 'react';
import {
  Flame,
  Droplets,
  Wifi,
  Zap,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  TrendingDown,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Building as BuildingType, FloorUtilityBill, UtilityServiceType } from '../types';
import { formatCurrency } from '../utils/exportUtils';

interface FloorUtilityBillsManagerProps {
  building: BuildingType;
}

export const FloorUtilityBillsManager: React.FC<FloorUtilityBillsManagerProps> = ({
  building,
}) => {
  const {
    currentUser,
    addFloorUtilityBill,
    updateFloorUtilityBill,
    removeFloorUtilityBill,
    registerUtilityBillPaymentTransaction,
  } = useApp();

  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<FloorUtilityBill | null>(null);

  // Pay Confirmation Modal
  const [billToPay, setBillToPay] = useState<FloorUtilityBill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo' | 'tarjeta' | 'cheque'>('transferencia');

  // Delete confirmation
  const [billToDelete, setBillToDelete] = useState<FloorUtilityBill | null>(null);

  // Form State
  const [floor, setFloor] = useState('Piso 1');
  const [serviceType, setServiceType] = useState<UtilityServiceType>('gas');
  const [serviceTypeOther, setServiceTypeOther] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState('5');
  const [billingFrequency, setBillingFrequency] = useState<'mensual' | 'bimestral' | 'anual'>('mensual');
  const [status, setStatus] = useState<FloorUtilityBill['status']>('activo');
  const [notes, setNotes] = useState('');

  const bills = building.floorUtilityBills || [];
  const isAdmin = currentUser.role === 'admin';

  // Get distinct floors from existing bills and building floors count
  const availableFloorsList = useMemo(() => {
    const list = new Set<string>();
    list.add('Planta Baja');
    list.add('Sótano / Garaje');
    for (let i = 1; i <= Math.max(building.floors || 1, 5); i++) {
      list.add(`Piso ${i}`);
    }
    list.add('General Edificio');
    bills.forEach((b) => list.add(b.floor));
    return Array.from(list);
  }, [building.floors, bills]);

  const getServiceIcon = (type: UtilityServiceType) => {
    switch (type) {
      case 'gas':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'agua':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'internet':
        return <Wifi className="w-4 h-4 text-cyan-400" />;
      case 'electricidad':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'ascensor':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'limpieza':
        return <Sparkles className="w-4 h-4 text-green-600" />;
      case 'seguridad':
        return <ShieldCheck className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getServiceLabel = (bill: FloorUtilityBill) => {
    if (bill.serviceType === 'otro' && bill.serviceTypeOther) {
      return bill.serviceTypeOther;
    }
    switch (bill.serviceType) {
      case 'gas':
        return 'Gas Natural / Térmico';
      case 'agua':
        return 'Agua Potable / Red';
      case 'internet':
        return 'Internet & Telecomunicaciones';
      case 'electricidad':
        return 'Electricidad / Luz';
      case 'ascensor':
        return 'Mantenimiento de Ascensor';
      case 'limpieza':
        return 'Servicio de Limpieza';
      case 'seguridad':
        return 'Seguridad & Alarmas';
      case 'basuras':
        return 'Tasas de Residuos';
      default:
        return 'Otro Suministro';
    }
  };

  // Financial summary
  const totalMonthlyUtilities = bills
    .filter((b) => b.status === 'activo')
    .reduce((acc, b) => acc + (b.monthlyAmount || 0), 0);

  const gasTotal = bills.filter((b) => b.serviceType === 'gas' && b.status === 'activo').reduce((acc, b) => acc + b.monthlyAmount, 0);
  const aguaTotal = bills.filter((b) => b.serviceType === 'agua' && b.status === 'activo').reduce((acc, b) => acc + b.monthlyAmount, 0);
  const internetTotal = bills.filter((b) => b.serviceType === 'internet' && b.status === 'activo').reduce((acc, b) => acc + b.monthlyAmount, 0);
  const luzTotal = bills.filter((b) => b.serviceType === 'electricidad' && b.status === 'activo').reduce((acc, b) => acc + b.monthlyAmount, 0);

  const openAddModal = () => {
    setEditingBill(null);
    setFloor('Piso 1');
    setServiceType('gas');
    setServiceTypeOther('');
    setCompanyName('');
    setContractNumber(`CTR-${Date.now().toString().slice(-6)}`);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10));
    setMonthlyAmount('');
    setPaymentDayOfMonth('5');
    setBillingFrequency('mensual');
    setStatus('activo');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (bill: FloorUtilityBill) => {
    setEditingBill(bill);
    setFloor(bill.floor);
    setServiceType(bill.serviceType);
    setServiceTypeOther(bill.serviceTypeOther || '');
    setCompanyName(bill.companyName);
    setContractNumber(bill.contractNumber);
    setStartDate(bill.startDate || new Date().toISOString().slice(0, 10));
    setEndDate(bill.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10));
    setMonthlyAmount(String(bill.monthlyAmount));
    setPaymentDayOfMonth(String(bill.paymentDayOfMonth || 5));
    setBillingFrequency(bill.billingFrequency || 'mensual');
    setStatus(bill.status);
    setNotes(bill.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contractNumber.trim() || !monthlyAmount) return;

    const amountNum = parseFloat(monthlyAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (editingBill) {
      updateFloorUtilityBill(building.id, editingBill.id, {
        floor: floor.trim(),
        serviceType,
        serviceTypeOther: serviceType === 'otro' ? serviceTypeOther.trim() : undefined,
        companyName: companyName.trim(),
        contractNumber: contractNumber.trim(),
        startDate,
        endDate,
        monthlyAmount: amountNum,
        paymentDayOfMonth: parseInt(paymentDayOfMonth, 10) || 5,
        billingFrequency,
        status,
        notes: notes.trim(),
      });
    } else {
      addFloorUtilityBill(building.id, {
        floor: floor.trim(),
        serviceType,
        serviceTypeOther: serviceType === 'otro' ? serviceTypeOther.trim() : undefined,
        companyName: companyName.trim(),
        contractNumber: contractNumber.trim(),
        startDate,
        endDate,
        monthlyAmount: amountNum,
        paymentDayOfMonth: parseInt(paymentDayOfMonth, 10) || 5,
        billingFrequency,
        status,
        notes: notes.trim(),
      });
    }

    setIsModalOpen(false);
    setEditingBill(null);
  };

  const handlePayConfirm = () => {
    if (billToPay) {
      registerUtilityBillPaymentTransaction(building.id, billToPay.id, paymentMethod);
      setBillToPay(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (billToDelete) {
      removeFloorUtilityBill(building.id, billToDelete.id);
      setBillToDelete(null);
    }
  };

  // Filtered bills
  const filteredBills = bills.filter((b) => {
    if (selectedFloorFilter !== 'all' && b.floor !== selectedFloorFilter) return false;
    if (selectedServiceFilter !== 'all' && b.serviceType !== selectedServiceFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        b.companyName.toLowerCase().includes(q) ||
        b.contractNumber.toLowerCase().includes(q) ||
        b.floor.toLowerCase().includes(q) ||
        b.serviceType.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
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
              <Flame className="w-5 h-5 text-orange-400" />
              Facturas & Contratos de Suministros por Piso
            </h3>
            {isAdmin ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2E6D]/15 text-[#0A2E6D] border border-[#0A2E6D]/30">
                Gestión Exclusiva de Administrador
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/40 text-blue-600 border border-blue-200">
                Auditoría & Desglose de Gastos
              </span>
            )}
          </div>
          <p className="text-xs text-[#5A6B82]">
            Control por niveles de contratos de gas, agua, internet, luz con nombre de la compañía, número de contrato, fecha e importe mensual a pagar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Agregar Factura / Contrato
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Breakdown for Utilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] sm:col-span-2 lg:col-span-1 shadow-md">
          <span className="text-[10px] uppercase font-bold text-[#5A6B82] tracking-wider block">
            Gasto Fijo Total Mensual
          </span>
          <p className="text-2xl font-bold font-mono text-[#0A2E6D] mt-1">
            {formatCurrency(totalMonthlyUtilities, building.currency)}
            <span className="text-xs font-normal text-[#5A6B82] ml-1">/mes</span>
          </p>
          <span className="text-[11px] text-[#5A6B82] mt-1 block">
            {bills.filter((b) => b.status === 'activo').length} contratos activos
          </span>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5A6B82] tracking-wider block">
              Gas Natural
            </span>
            <p className="text-lg font-bold font-mono text-orange-400 mt-0.5">
              {formatCurrency(gasTotal, building.currency)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-950/40 text-orange-400 border border-orange-800/40">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5A6B82] tracking-wider block">
              Agua Potable
            </span>
            <p className="text-lg font-bold font-mono text-blue-600 mt-0.5">
              {formatCurrency(aguaTotal, building.currency)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-950/40 text-blue-600 border border-blue-200">
            <Droplets className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5A6B82] tracking-wider block">
              Internet / Fibra
            </span>
            <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {formatCurrency(internetTotal, building.currency)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
            <Wifi className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#F4F6FA] p-4 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#5A6B82] tracking-wider block">
              Electricidad
            </span>
            <p className="text-lg font-bold font-mono text-yellow-600 mt-0.5">
              {formatCurrency(luzTotal, building.currency)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-yellow-950/40 text-yellow-600 border border-yellow-200">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and search row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#FFFFFF] p-3 rounded-2xl border border-[#E2E8F0]">
        {/* Floor Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#5A6B82] font-medium mr-1">Nivel/Piso:</span>
          <button
            onClick={() => setSelectedFloorFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedFloorFilter === 'all'
                ? 'bg-[#E8EFF9] text-[#16202E] border border-[#E2E8F0]'
                : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E]'
            }`}
          >
            Todos los Pisos
          </button>
          {availableFloorsList.slice(0, 6).map((fl) => (
            <button
              key={fl}
              onClick={() => setSelectedFloorFilter(fl)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFloorFilter === fl
                  ? 'bg-[#0A2E6D]/20 text-[#0A2E6D] border border-[#0A2E6D]/40'
                  : 'bg-[#F4F6FA] text-[#5A6B82] hover:text-[#16202E]'
              }`}
            >
              {fl}
            </button>
          ))}
        </div>

        {/* Service Type Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedServiceFilter}
            onChange={(e) => setSelectedServiceFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#F4F6FA] text-[#16202E] focus:ring-1 focus:ring-[#C2A05E]"
          >
            <option value="all">Todos los Suministros</option>
            <option value="gas">🔥 Gas</option>
            <option value="agua">💧 Agua</option>
            <option value="internet">🌐 Internet</option>
            <option value="electricidad">⚡ Electricidad</option>
          </select>

          <div className="relative w-full sm:w-48">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por compañía o contrato..."
              className="w-full pl-7 pr-2.5 py-1.5 border border-[#E2E8F0] rounded-xl text-xs bg-[#F4F6FA] text-[#16202E] placeholder-[#666666] focus:ring-1 focus:ring-[#C2A05E]"
            />
            <Search className="w-3 h-3 text-[#5A6B82] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Contracts & Bills List Table */}
      {filteredBills.length === 0 ? (
        <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] p-10 text-center space-y-3">
          <Flame className="w-10 h-10 text-[#555555] mx-auto" />
          <p className="text-sm font-semibold text-[#5A6B82]">No se encontraron facturas o contratos</p>
          <p className="text-xs text-[#5A6B82] max-w-md mx-auto">
            {isAdmin
              ? 'Puedes registrar los suministros de gas, agua, internet o electricidad por piso con el botón superior.'
              : 'No hay contratos de suministros registrados que coincidan con los filtros actuales.'}
          </p>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="mt-2 px-4 py-2 bg-[#0A2E6D] hover:bg-[#D4B370] text-[#0A0A0A] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Primer Contrato
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#F4F6FA] rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#16202E]">
              <thead className="bg-[#FFFFFF] text-[#5A6B82] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3.5">Nivel / Piso</th>
                  <th className="px-4 py-3.5">Suministro & Compañía</th>
                  <th className="px-4 py-3.5">Nº Contrato</th>
                  <th className="px-4 py-3.5">Fecha Contrato</th>
                  <th className="px-4 py-3.5 text-right">Importe Mensual</th>
                  <th className="px-4 py-3.5 text-center">Cobro</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#F4F6FA] transition-colors">
                    {/* Floor Level */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-[#16202E] bg-[#1E1E1E] px-2.5 py-1 rounded-lg border border-[#303030]">
                        {bill.floor}
                      </span>
                    </td>

                    {/* Service & Company */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#F4F6FA] border border-[#E2E8F0] shrink-0">
                          {getServiceIcon(bill.serviceType)}
                        </div>
                        <div>
                          <span className="font-bold text-[#16202E] block text-xs">
                            {bill.companyName}
                          </span>
                          <span className="text-[10px] text-[#5A6B82] block">
                            {getServiceLabel(bill)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contract Number */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-[#0A2E6D] bg-[#0A2E6D]/10 px-2 py-0.5 rounded border border-[#0A2E6D]/20">
                        {bill.contractNumber}
                      </span>
                    </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-[#5A6B82]">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#5A6B82] w-6">In:</span>
                        <span>{bill.startDate || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#5A6B82] w-6">Fin:</span>
                        <span>{bill.endDate || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                    {/* Monthly Amount */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-red-600">
                        {formatCurrency(bill.monthlyAmount, building.currency)}
                      </span>
                      <span className="text-[10px] text-[#5A6B82] block">/mes</span>
                    </td>

                    {/* Payment day of month */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap text-[#5A6B82]">
                      <span className="text-[11px] bg-[#F4F6FA] px-2 py-0.5 rounded">
                        Día {bill.paymentDayOfMonth || 5}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          bill.status === 'activo'
                            ? 'bg-green-950/40 text-green-600 border-green-200'
                            : bill.status === 'en_revision'
                            ? 'bg-yellow-950/40 text-yellow-600 border-yellow-200'
                            : 'bg-red-950/40 text-red-600 border-red-800/40'
                        }`}
                      >
                        {bill.status === 'activo'
                          ? 'Activo'
                          : bill.status === 'en_revision'
                          ? 'En Revisión'
                          : 'Suspendido'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && (
                          <button
                            onClick={() => setBillToPay(bill)}
                            className="px-2 py-1 bg-green-50 hover:bg-green-900/60 text-green-600 border border-green-800/50 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Asentar pago del mes en contabilidad"
                          >
                            <CreditCard className="w-3 h-3" />
                            Asentar Pago
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(bill)}
                            className="p-1.5 text-[#5A6B82] hover:text-[#16202E] hover:bg-[#E8EFF9] rounded-lg transition-colors cursor-pointer"
                            title="Editar contrato"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setBillToDelete(bill)}
                            className="p-1.5 text-red-600 hover:text-red-600 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Dar de baja contrato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Utility Bill (Admin only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 z-10 my-8 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-orange-950/40 text-orange-400 border border-orange-800/40">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#16202E]">
                    {editingBill ? 'Editar Factura / Contrato de Piso' : 'Registrar Factura / Contrato por Piso'}
                  </h3>
                  <p className="text-xs text-[#5A6B82]">
                    {building.name} • Gestión administrativa de suministros
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Nivel / Piso *
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  >
                    <option value="Planta Baja">Planta Baja</option>
                    <option value="Sótano / Garaje">Sótano / Garaje</option>
                    {Array.from({ length: building.floors || 10 }, (_, i) => `Piso ${i + 1}`).map((fl) => (
                      <option key={fl} value={fl}>
                        {fl}
                      </option>
                    ))}
                    <option value="General Edificio">General Edificio (Todos los pisos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Tipo de Suministro *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as UtilityServiceType)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  >
                    <option value="gas">🔥 Gas (Natural / Butano)</option>
                    <option value="agua">💧 Agua Potable</option>
                    <option value="internet">🌐 Internet & Fibra Óptica</option>
                    <option value="electricidad">⚡ Electricidad / Luz</option>
                    <option value="ascensor">🛗 Mantenimiento de Ascensor</option>
                    <option value="limpieza">🧹 Servicio de Limpieza</option>
                    <option value="seguridad">🛡️ Seguridad & Vigilancia</option>
                    <option value="basuras">🗑️ Tasa de Residuos</option>
                    <option value="otro">📋 Otro Suministro</option>
                  </select>
                </div>
                {serviceType === 'otro' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                      Especificar Otro Suministro *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceTypeOther}
                      onChange={(e) => setServiceTypeOther(e.target.value)}
                      placeholder="Ej. Control de plagas, Mantenimiento piscina..."
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Nombre de la Compañía Proveedora *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Naturgy Energía, Canal de Isabel II, Telefónica Movistar, Iberdrola"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Número de Contrato *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ej. CTR-GAS-88410-B"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Fecha de Finalización *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Importe que se debe pagar al mes (€) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#5A6B82] font-bold">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E] font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Día de Cobro (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDayOfMonth}
                    onChange={(e) => setPaymentDayOfMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Frecuencia de Facturación
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                    Estado del Contrato
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                  >
                    <option value="activo">🟢 Activo & Vigente</option>
                    <option value="en_revision">🟡 En Revisión de Tarifa</option>
                    <option value="suspendido">🔴 Suspendido / Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                  Notas / Especificaciones Técnicas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Número de contador, potencia contratada, velocidad de fibra, etc."
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#C2A05E] bg-[#F4F6FA] text-[#16202E]"
                />
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
                  {editingBill ? 'Guardar Cambios' : 'Registrar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Month Modal: One-click accounting register */}
      {billToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-950/40 text-green-600 border border-green-800/50">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#16202E]">Asentar Pago de Suministro</h4>
                <p className="text-xs text-[#5A6B82]">{billToPay.companyName} ({billToPay.floor})</p>
              </div>
            </div>

            <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5A6B82]">Contrato:</span>
                <span className="font-mono text-[#0A2E6D]">{billToPay.contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B82]">Servicio:</span>
                <span className="capitalize text-[#16202E]">{getServiceLabel(billToPay)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6B82]">Importe a Asentar:</span>
                <span className="font-bold font-mono text-green-600 text-sm">
                  {formatCurrency(billToPay.monthlyAmount, building.currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D1D5DB] mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-xs bg-[#F4F6FA] text-[#16202E] focus:ring-1 focus:ring-[#C2A05E]"
              >
                <option value="transferencia">🏦 Domiciliación Bancaria / Transferencia</option>
                <option value="tarjeta">💳 Tarjeta Corporativa</option>
                <option value="efectivo">💵 Efectivo / Caja Chica</option>
                <option value="cheque">📝 Cheque</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setBillToPay(null)}
                className="px-3.5 py-1.5 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayConfirm}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-[#16202E] rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar Asiento Contable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative bg-[#F4F6FA] text-[#16202E] rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full p-6 z-10 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[#16202E]">¿Dar de Baja Contrato?</h4>
            </div>
            <p className="text-xs text-[#5A6B82]">
              ¿Estás seguro de que deseas dar de baja el contrato <strong>"{billToDelete.contractNumber}"</strong> de {billToDelete.companyName} ({billToDelete.floor})?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setBillToDelete(null)}
                className="px-3.5 py-1.5 bg-[#E8EFF9] hover:bg-[#E8EFF9] text-[#5A6B82] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-[#16202E] rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Sí, Dar de Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
