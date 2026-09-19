import React, { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Ticket } from '../types';
import { formatIsoDateEs, todayIso } from '../utils/dates';

interface WorkerVisitCalendarProps {
  tickets: Ticket[];
  onOpenTicket: (id: string) => void;
}

function monthKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const WorkerVisitCalendar: React.FC<WorkerVisitCalendarProps> = ({ tickets, onOpenTicket }) => {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { byDate, unscheduled, agenda } = useMemo(() => {
    const openJobs = tickets.filter((t) => t.status !== 'resuelta' && t.status !== 'rechazada');
    const map = new Map<string, Ticket[]>();
    openJobs.forEach((t) => {
      if (!t.scheduledVisitDate) return;
      const list = map.get(t.scheduledVisitDate) || [];
      list.push(t);
      map.set(t.scheduledVisitDate, list);
    });
    return {
      byDate: map,
      unscheduled: openJobs.filter((t) => !t.scheduledVisitDate),
      agenda: openJobs
        .filter((t) => t.scheduledVisitDate)
        .sort((a, b) => (a.scheduledVisitDate || '').localeCompare(b.scheduledVisitDate || '')),
    };
  }, [tickets]);
  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const startPad = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#16202E] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0A2E6D]" />
          Calendario de visitas
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setCursor((c) =>
                c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
              )
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold capitalize w-36 text-center">{monthLabel}</span>
          <button
            type="button"
            onClick={() =>
              setCursor((c) =>
                c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
              )
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-[#5A6B82]">
        Qué día tienes que ir a qué edificio y a qué trabajo. Los trabajos en proceso o pendientes aparecen aquí.
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#5A6B82] uppercase">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d}>{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = monthKey(cursor.year, cursor.month, day);
          const jobs = byDate.get(key) || [];
          const isToday = key === today;
          return (
            <div
              key={key}
              className={`min-h-14 rounded-lg border p-1 text-left ${
                jobs.length
                  ? 'border-[#0A2E6D] bg-blue-50'
                  : isToday
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-[#E2E8F0] bg-[#F8FAFC]'
              }`}
            >
              <span className={`text-[10px] font-bold ${isToday ? 'text-amber-700' : 'text-[#16202E]'}`}>{day}</span>
              {jobs.slice(0, 2).map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onOpenTicket(job.id)}
                  className="block w-full text-[9px] leading-tight text-[#0A2E6D] font-semibold truncate cursor-pointer text-left"
                  title={`${job.buildingName}: ${job.title}`}
                >
                  {job.buildingName}
                </button>
              ))}
              {jobs.length > 2 && <span className="text-[9px] text-[#5A6B82]">+{jobs.length - 2}</span>}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {agenda.length === 0 && (
          <p className="text-xs text-[#5A6B82]">Aún no hay visitas con día. Pon la fecha en cada incidencia.</p>
        )}
        {agenda.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onOpenTicket(job.id)}
            className="w-full text-left p-3 rounded-xl border border-[#E2E8F0] hover:border-[#0A2E6D]/40 bg-[#F8FAFC] cursor-pointer"
          >
            <p className="text-xs font-bold text-[#0A2E6D]">
              El {formatIsoDateEs(job.scheduledVisitDate)} tienes que ir a {job.buildingName}
            </p>
            <p className="text-sm font-semibold text-[#16202E] mt-0.5">para hacer: {job.title}</p>
            <p className="text-[11px] text-[#5A6B82] mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.ticketNumber} · {job.status === 'en_proceso' ? 'En proceso' : 'Pendiente'} · Piso {job.floor} · {job.unitOrArea}
            </p>
          </button>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="pt-2 border-t border-[#E2E8F0]">
          <p className="text-[11px] font-bold text-amber-800 mb-2">Sin día en el calendario ({unscheduled.length})</p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onOpenTicket(job.id)}
                className="text-[11px] px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer"
              >
                {job.buildingName}: {job.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
