import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { SOFER_LOGO_SRC } from '../assets/soferLogoData';

export const ResidentAdBanner: React.FC = () => {
  const { setActiveTab } = useApp();

  return createPortal(
    <button
      type="button"
      onClick={() => setActiveTab('servicios')}
      className="fixed bottom-0 inset-x-0 z-20 h-20 sm:h-24 border-t border-[#C2A05E]/40 bg-[#0A2E6D] cursor-pointer overflow-hidden"
      aria-label="Publicidad SOFER Servicios"
    >
      <img
        src="/sofer-logo.jpg"
        alt=""
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = SOFER_LOGO_SRC;
        }}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-25 pointer-events-none select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A2E6D] via-[#0A2E6D]/80 to-[#0A2E6D]/70 pointer-events-none" />
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3 sm:gap-5">
        <img
          src="/sofer-logo.jpg"
          alt="SOFER"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = SOFER_LOGO_SRC;
          }}
          className="h-14 sm:h-[4.5rem] w-auto object-contain bg-white rounded-lg p-0.5 shrink-0"
        />
        <div className="min-w-0 text-left">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A05E]">Publicidad</p>
          <p className="text-sm sm:text-lg font-bold text-white leading-tight truncate">SOFER · Servicios para tu comunidad</p>
          <p className="text-[11px] sm:text-xs text-blue-100 truncate">Mantenimiento, gestoría y atención. Pulsa para ver el catálogo.</p>
        </div>
      </div>
    </button>,
    document.body
  );
};
