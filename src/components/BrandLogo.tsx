import React from 'react';
import { SOFER_LOGO_SRC } from '../assets/soferLogoData';

interface BrandLogoProps {
  variant?: 'nav' | 'hero';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'nav' }) => {
  const isHero = variant === 'hero';

  return (
    <img
      src={SOFER_LOGO_SRC}
      alt="SOFER Gestión"
      width={isHero ? 280 : 96}
      height={isHero ? 400 : 72}
      className={
        isHero
          ? 'h-44 w-auto max-w-[260px] mx-auto object-contain block'
          : 'h-[3.25rem] w-[4.75rem] object-contain bg-white rounded-xl p-0.5 shrink-0 block'
      }
    />
  );
};
