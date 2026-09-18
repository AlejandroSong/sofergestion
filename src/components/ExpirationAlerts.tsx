import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, ShieldAlert, FileWarning } from 'lucide-react';

export const ExpirationAlerts: React.FC = () => {
  const { buildings, currentUser } = useApp();

  // Only show alerts for Admin and Worker
  if (currentUser.role !== 'admin' && currentUser.role !== 'worker') {
    return null;
  }

  const getMonthsUntil = (dateStr: string) => {
    const end = new Date(dateStr);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    // Also consider days to be precise, but simple month difference is usually enough.
    // Let's use precise days to be accurate.
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { type: 'expired', days: diffDays };
    if (diffDays <= 30) return { type: '1_month', days: diffDays };
    if (diffDays <= 60) return { type: '2_months', days: diffDays };
    if (diffDays <= 90) return { type: '3_months', days: diffDays };
    
    return null;
  };

  const alerts: { id: string; buildingName: string; title: string; message: string; urgency: string }[] = [];

  buildings.forEach(bldg => {
    // Check Insurance
    if (bldg.insurance?.endDate) {
      const status = getMonthsUntil(bldg.insurance.endDate);
      if (status) {
        let urgency = 'bg-blue-950/40 text-blue-600 border-blue-200';
        let msg = '';
        if (status.type === 'expired') {
          urgency = 'bg-red-950/40 text-red-600 border-red-800/40';
          msg = 'Seguro expirado';
        } else if (status.type === '1_month') {
          urgency = 'bg-red-950/40 text-red-600 border-red-800/40';
          msg = `Vence en ${status.days} días (menos de 1 mes)`;
        } else if (status.type === '2_months') {
          urgency = 'bg-orange-950/40 text-orange-400 border-orange-800/40';
          msg = `Vence en ${status.days} días (menos de 2 meses)`;
        } else if (status.type === '3_months') {
          urgency = 'bg-yellow-950/40 text-yellow-600 border-yellow-200';
          msg = `Vence en ${status.days} días (menos de 3 meses)`;
        }

        alerts.push({
          id: `ins-${bldg.id}`,
          buildingName: bldg.name,
          title: `Póliza ${bldg.insurance.companyName}`,
          message: msg,
          urgency
        });
      }
    }

    // Check General Contracts (now Floor Utility Bills)
    if (bldg.floorUtilityBills) {
      bldg.floorUtilityBills.forEach(contract => {
        if (contract.endDate) {
          const status = getMonthsUntil(contract.endDate);
          if (status) {
            let urgency = 'bg-blue-950/40 text-blue-600 border-blue-200';
            let msg = '';
            if (status.type === 'expired') {
              urgency = 'bg-red-950/40 text-red-600 border-red-800/40';
              msg = 'Contrato expirado';
            } else if (status.type === '1_month') {
              urgency = 'bg-red-950/40 text-red-600 border-red-800/40';
              msg = `Vence en ${status.days} días (menos de 1 mes)`;
            } else if (status.type === '2_months') {
              urgency = 'bg-orange-950/40 text-orange-400 border-orange-800/40';
              msg = `Vence en ${status.days} días (menos de 2 meses)`;
            } else if (status.type === '3_months') {
              urgency = 'bg-yellow-950/40 text-yellow-600 border-yellow-200';
              msg = `Vence en ${status.days} días (menos de 3 meses)`;
            }
            
            const serviceName = contract.serviceType === 'otro' && contract.serviceTypeOther ? contract.serviceTypeOther : contract.serviceType;

            alerts.push({
              id: `ctr-${bldg.id}-${contract.id}`,
              buildingName: bldg.name,
              title: `Contrato ${serviceName} (${contract.companyName}) - ${contract.floor}`,
              message: msg,
              urgency
            });
          }
        }
      });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <h3 className="text-xs font-bold text-[#5A6B82] uppercase flex items-center gap-1.5 mb-3">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        Alertas de Vencimiento ({alerts.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-3 border rounded-xl flex items-start gap-3 ${alert.urgency}`}>
            {alert.id.startsWith('ins-') ? (
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <FileWarning className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-[10px] uppercase font-bold opacity-80 mb-0.5">{alert.buildingName}</p>
              <h4 className="text-sm font-bold leading-tight">{alert.title}</h4>
              <p className="text-xs font-semibold mt-1 opacity-90">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
