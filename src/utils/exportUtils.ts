import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Building, Ticket, Transaction, User } from '../types';

export function formatCurrency(amount: number | undefined | null, currency: string = '€'): string {
  const numAmount = Number(amount) || 0;
  return `${numAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// ---------------- EXCEL EXPORTS ----------------

export function exportAccountingToExcel(
  transactions: Transaction[],
  buildingName: string = 'Todos los Edificios',
  periodName: string = 'Historico'
) {
  const data = transactions.map((t) => ({
    'Código': t.code,
    'Fecha': t.date,
    'Edificio': t.buildingName,
    'Tipo': t.type === 'ingreso' ? 'Ingreso (+)' : 'Gasto (-)',
    'Categoría': t.category.replace(/_/g, ' ').toUpperCase(),
    'Descripción': t.description,
    'Importe (€)': t.amount,
    'Método Pago': t.paymentMethod,
    'Registrado Por': `${t.registeredBy} (${t.registeredByRole})`,
    'Ticket Vinculado': t.ticketNumber || 'N/A',
    'Estado': t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contabilidad');

  // Summary sheet
  const totalIngresos = transactions.filter((t) => t.type === 'ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const totalGastos = transactions.filter((t) => t.type === 'gasto').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIngresos - totalGastos;

  const summaryData = [
    { 'Métrica': 'Edificio / Alcance', 'Valor': buildingName },
    { 'Métrica': 'Período', 'Valor': periodName },
    { 'Métrica': 'Total Transacciones', 'Valor': transactions.length },
    { 'Métrica': 'Total Ingresos (€)', 'Valor': totalIngresos },
    { 'Métrica': 'Total Gastos (€)', 'Valor': totalGastos },
    { 'Métrica': 'Balance Neto (€)', 'Valor': balance },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Financiero');

  const fileName = `Incidencias_Financiero_${buildingName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportTicketsToExcel(tickets: Ticket[], buildingName: string = 'General') {
  const data = tickets.map((t) => ({
    'N° Ticket': t.ticketNumber,
    'Fecha Creación': new Date(t.createdAt).toLocaleDateString('es-ES'),
    'Edificio': t.buildingName,
    'Ubicación': `Piso ${t.floor} - ${t.unitOrArea}`,
    'Categoría': t.category.toUpperCase(),
    'Prioridad': t.priority.toUpperCase(),
    'Estado': t.status.replace('_', ' ').toUpperCase(),
    'Título': t.title,
    'Descripción': t.description,
    'Creado Por': `${t.createdBy.name} (${t.createdBy.role})`,
    'Trabajador Asignado': t.assignedWorkerName || 'Sin asignar',
    'Costo Mano Obra (€)': t.serviceCost || 0,
    'Costo Materiales (€)': t.materialsCost || 0,
    'Total Facturado (€)': t.totalCharged || 0,
    'Fecha Resolución': t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('es-ES') : 'En curso',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidencias');

  const fileName = `Exportacion_Incidencias_${buildingName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// ---------------- PDF EXPORTS ----------------

export function exportBuildingFinancialStatementPDF(
  building: Building,
  transactions: Transaction[],
  tickets: Ticket[],
  period: string = 'Mensual Actual'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE CUENTA Y BALANCE FINANCIERO', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Edificio: ${building.name} (${building.code}) | Período: ${period}`, 14, 26);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 14, 33);

  // Building Info Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL INMUEBLE Y ADMINISTRACIÓN', 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dirección: ${building.address}, ${building.city}`, 14, 55);
  doc.text(`Presidente del Edificio: ${building.presidentName} (Tel: ${building.presidentPhone})`, 14, 61);
  doc.text(`Unidades / Viviendas: ${building.totalUnits} | Pisos: ${building.floors}`, 14, 67);
  doc.text(`Cuota Mensual Mantenimiento: ${formatCurrency(building.monthlyQuotaFee, building.currency)}`, 14, 73);

  // Financial KPI boxes
  const totalIngresos = transactions.filter((t) => t.type === 'ingreso').reduce((a, b) => a + b.amount, 0);
  const totalGastos = transactions.filter((t) => t.type === 'gasto').reduce((a, b) => a + b.amount, 0);
  const balance = totalIngresos - totalGastos;

  // KPI 1: Ingresos
  doc.setFillColor(240, 253, 244); // Green-50
  doc.roundedRect(14, 80, 56, 22, 2, 2, 'F');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.text('TOTAL INGRESOS', 18, 86);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalIngresos, building.currency), 18, 95);

  // KPI 2: Gastos
  doc.setFillColor(254, 242, 242); // Red-50
  doc.roundedRect(77, 80, 56, 22, 2, 2, 'F');
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL GASTOS MTTO.', 81, 86);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalGastos, building.currency), 81, 95);

  // KPI 3: Balance
  doc.setFillColor(balance >= 0 ? 239 : 254, balance >= 0 ? 246 : 242, balance >= 0 ? 255 : 242);
  doc.roundedRect(140, 80, 56, 22, 2, 2, 'F');
  doc.setTextColor(balance >= 0 ? 30 : 153, balance >= 0 ? 58 : 27, balance >= 0 ? 138 : 27);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BALANCE DISPONIBLE', 144, 86);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(balance, building.currency), 144, 95);

  // Transactions Table
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE MOVIMIENTOS CONTABLES', 14, 112);

  const tableRows = transactions.map((t) => [
    t.date,
    t.code,
    t.category.replace(/_/g, ' ').toUpperCase(),
    t.description,
    t.type === 'ingreso' ? `+${formatCurrency(t.amount, building.currency)}` : `-${formatCurrency(t.amount, building.currency)}`,
    t.paymentMethod.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 116,
    head: [['Fecha', 'Cód.', 'Categoría', 'Descripción', 'Importe', 'Método']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'Sin movimientos registrados', '-', '0,00 €', '-']],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 65 },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 24 },
    },
  });

  // Next: Summary of Maintenance Incidents in this building
  // @ts-expect-error - jspdf-autotable extends jsPDF instance with lastAutoTable
  const finalY = doc.lastAutoTable.finalY + 12;

  if (finalY < 240) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`RESUMEN DE TICKETS Y MANTENIMIENTO (${tickets.length} Incidencias)`, 14, finalY);

    const ticketRows = tickets.slice(0, 8).map((t) => [
      t.ticketNumber,
      `Piso ${t.floor} - ${t.unitOrArea}`,
      t.title,
      t.priority.toUpperCase(),
      t.status.replace('_', ' ').toUpperCase(),
      t.assignedWorkerName || 'Sin asignar',
      formatCurrency(t.totalCharged || 0, building.currency),
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Ticket', 'Ubicación', 'Problema', 'Prioridad', 'Estado', 'Trabajador', 'Costo']],
      body: ticketRows.length > 0 ? ticketRows : [['-', '-', 'No hay incidencias reportadas', '-', '-', '-', '0,00 €']],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
    });
  }

  // Footer / Signatures on bottom
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento oficial emitido automáticamente por el SOFER Gestión.', 14, pageHeight - 10);
  doc.text(`Página 1 de 1`, pageWidth - 35, pageHeight - 10);

  doc.save(`Estado_Cuenta_${building.name.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
}

export function exportTicketDetailPDF(ticket: Ticket) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`HOJA DE INCIDENCIA: TICKET ${ticket.ticketNumber}`, 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Edificio: ${ticket.buildingName} | Ubicación: Piso ${ticket.floor}, ${ticket.unitOrArea}`, 14, 25);

  // Status & Priority Badge
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN GENERAL DEL TICKET', 14, 45);

  const infoRows = [
    ['Título del Problema:', ticket.title],
    ['Categoría:', ticket.category.replace(/_/g, ' ').toUpperCase()],
    ['Prioridad:', ticket.priority.toUpperCase()],
    ['Estado Actual:', ticket.status.replace(/_/g, ' ').toUpperCase()],
    ['Reportado Por (Presidente):', `${ticket.createdBy.name} (${new Date(ticket.createdAt).toLocaleString('es-ES')})`],
    ['Trabajador Asignado:', ticket.assignedWorkerName ? `${ticket.assignedWorkerName} (${ticket.assignedWorkerSpecialty || 'Mantenimiento'})` : 'Pendiente de Asignación'],
    ['Costos Registrados:', `Mano de Obra: $${ticket.serviceCost || 0} | Materiales: $${ticket.materialsCost || 0} | Total: $${ticket.totalCharged || 0}`],
    ['Contabilidad:', ticket.serviceIncomeRegistered ? 'Registrado en Libro Diario de Ingresos/Gastos' : 'Pendiente de Asentamiento Contable'],
  ];

  autoTable(doc, {
    startY: 49,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [71, 85, 105] },
      1: { cellWidth: 130, textColor: [30, 41, 59] },
    },
  });

  // Description box
  // @ts-expect-error - jspdf-autotable extends jsPDF
  let currentY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPCIÓN DETALLADA:', 14, currentY);

  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(ticket.description, pageWidth - 36), 18, currentY + 7);

  // Timeline / Seguimiento de Incidencia
  currentY += 28;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('HISTORIAL COMPLETO DE SEGUIMIENTO (AUDIT TRAIL)', 14, currentY);

  const timelineRows = ticket.timeline.map((evt) => [
    new Date(evt.timestamp).toLocaleString('es-ES'),
    `${evt.authorName} (${evt.authorRole.toUpperCase()})`,
    evt.action,
    evt.notes || '-',
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Fecha y Hora', 'Responsable', 'Acción Realizada', 'Notas / Observaciones']],
    body: timelineRows,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  doc.save(`Ticket_${ticket.ticketNumber}_${ticket.buildingName.replace(/\s+/g, '_')}.pdf`);
}

export function exportWorkerExpenseReportPDF(
  worker: User,
  tickets: Ticket[],
  transactions: Transaction[],
  period: string = 'Mes Actual'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME MENSUAL DE GASTOS Y SERVICIOS DE MANTENIMIENTO', 14, 16);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Trabajador / Operario: ${worker.name} | Especialidad: ${worker.specialty || 'General'}`, 14, 25);
  doc.text(`Período Liquidado: ${period} | Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);

  // Worker metrics
  const completedTickets = tickets.filter((t) => t.status === 'resuelta');
  const totalManoObra = tickets.reduce((acc, t) => acc + (t.serviceCost || 0), 0);
  const totalMateriales = tickets.reduce((acc, t) => acc + (t.materialsCost || 0), 0);
  const granTotal = totalManoObra + totalMateriales;

  // KPI boxes
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 44, 42, 18, 2, 2, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.text('TICKETS ATENDIDOS', 18, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${tickets.length} (${completedTickets.length} resueltos)`, 18, 58);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(60, 44, 42, 18, 2, 2, 'F');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL MANO DE OBRA', 64, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`$ ${totalManoObra.toFixed(2)}`, 64, 58);

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(106, 44, 42, 18, 2, 2, 'F');
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('GASTOS MATERIALES', 110, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`$ ${totalMateriales.toFixed(2)}`, 110, 58);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(152, 44, 44, 18, 2, 2, 'F');
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('IMPORTE TOTAL', 156, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`$ ${granTotal.toFixed(2)}`, 156, 58);

  // Table of completed jobs
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE SERVICIOS Y TICKETS EJECUTADOS', 14, 70);

  const jobsTable = tickets.map((t) => [
    t.ticketNumber,
    t.buildingName,
    `Piso ${t.floor} - ${t.unitOrArea}`,
    t.title,
    t.status.toUpperCase(),
    `$${(t.serviceCost || 0).toFixed(2)}`,
    `$${(t.materialsCost || 0).toFixed(2)}`,
    `$${(t.totalCharged || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 74,
    head: [['Ticket', 'Edificio', 'Ubicación', 'Descripción Trabajo', 'Estado', 'M. Obra', 'Mat.', 'Total']],
    body: jobsTable.length > 0 ? jobsTable : [['-', '-', '-', 'No hay trabajos registrados en este período', '-', '0,00 €', '0,00 €', '0,00 €']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
  });

  doc.save(`Informe_Mantenimiento_${worker.name.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`);
}

export function exportNeighborReceiptPDF(
  user: User,
  buildingName: string = 'Comunidad de Propietarios',
  periodLabel: string = 'Agosto 2026',
  amount: number = 95.0
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header Banner
  doc.setFillColor(10, 46, 109); // SOFER Navy #0A2E6D
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SOFER GESTIÓN • ADMINISTRACIÓN DE FINCAS', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO OFICIAL DE CUOTA COMUNITARIA Y SERVICIOS', 14, 27);
  doc.text(`Ref: REC-${Date.now().toString().slice(-6)}`, pageWidth - 45, 27);

  // Community and Resident info boxes
  doc.setFillColor(244, 246, 250);
  doc.roundedRect(14, 46, pageWidth - 28, 52, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL TITULAR Y VIVIENDA', 20, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Titular: ${user.name}`, 20, 65);
  doc.text(`Inmueble: ${buildingName}`, 20, 73);
  doc.text(`Vivienda / Coeficiente: ${user.unitOrArea || 'Vivienda principal'}`, 20, 81);
  doc.text(`Rol en Comunidad: ${user.role === 'president' ? 'Presidente de la Comunidad (Vecino Residente)' : 'Propietario / Vecino'}`, 20, 89);

  // Right column inside box
  doc.setFont('helvetica', 'bold');
  doc.text('LIQUIDACIÓN', 125, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${periodLabel}`, 125, 65);
  doc.text(`Fecha de Cargo: ${user.lastPaymentDate || new Date().toISOString().split('T')[0]}`, 125, 73);
  doc.text(`Modalidad: ${user.feeFrequency === 'anual' ? 'Cuota Anual' : 'Cuota Mensual'}`, 125, 81);
  doc.text(`Estado: PAGADO / CONCILIADO`, 125, 89);

  // Details Table
  autoTable(doc, {
    startY: 106,
    head: [['Concepto Liquidado', 'Periodo', 'Modalidad Pago', 'Base Imponible', 'Total Abonado']],
    body: [
      [
        user.lastPaymentConcept || 'Cuota ordinaria de mantenimiento y conservación comunitaria',
        periodLabel,
        'Domiciliación Bancaria SEPA',
        formatCurrency(amount),
        formatCurrency(amount)
      ],
      [
        'Servicios de gestión integral, seguro del edificio y mantenimiento',
        periodLabel,
        'Incluido en cuota',
        '0,00 €',
        '0,00 €'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [10, 46, 109], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 4 },
  });

  // Total summary card
  // @ts-ignore
  const tableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
  
  doc.setFillColor(241, 245, 249);
  doc.rect(pageWidth - 85, tableY, 71, 28, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - 85, tableY, 71, 28, 'D');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('IMPORTE TOTAL PAGADO', pageWidth - 80, tableY + 9);

  doc.setTextColor(10, 46, 109);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(amount), pageWidth - 80, tableY + 21);

  // Stamp / Validation text
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFICACIÓN Y CONCILIACIÓN BANCARIA:', 14, tableY + 12);
  doc.text('Este recibo justifica el pago de las cuotas comunitarias imputadas a la vivienda indicada.', 14, tableY + 18);
  doc.text('Emitido electrónicamente conforme a la Ley de Propiedad Horizontal vigente.', 14, tableY + 24);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SOFER Gestión de Fincas e Inmuebles • www.sofergestion.es • Documento expedido digitalmente', 14, pageHeight - 12);

  doc.save(`Recibo_Comunidad_${user.name.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}.pdf`);
}
