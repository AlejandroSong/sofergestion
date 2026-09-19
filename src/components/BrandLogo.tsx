import React from 'react';
import { SOFER_LOGO_SRC } from '../assets/soferLogoData';

interface BrandLogoProps {
  variant?: 'nav' | 'hero' | 'menu';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'nav' }) => {
  const sizeClass =
    variant === 'hero'
      ? 'h-44 w-auto max-w-[260px] mx-auto'
      : variant === 'menu'
        ? 'h-20 w-auto max-w-[180px]'
        : 'h-14 w-auto max-w-[150px]';

  return (
    <img
      src="/sofer-logo.jpg"
      alt="SOFER Gestión"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = SOFER_LOGO_SRC;
      }}
      className={`${sizeClass} object-contain bg-white rounded-xl p-1 shrink-0 block`}
    />
  );
};
