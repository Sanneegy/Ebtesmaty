'use client';

import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'horizontal' | 'official';
  showSubtitle?: boolean;
  isArabic?: boolean;
  useOfficialImage?: boolean;
}

export function BrandLogo({
  className = '',
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  isArabic = false,
  useOfficialImage = true,
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  const markDimensions = {
    sm: { w: 36, h: 36, font: 'text-sm' },
    md: { w: 46, h: 46, font: 'text-xl' },
    lg: { w: 60, h: 60, font: 'text-2xl' },
    xl: { w: 84, h: 84, font: 'text-3xl' },
  }[size];

  const OfficialImageMark = (
    <div
      className="relative rounded-full overflow-hidden shadow-sm shrink-0 border border-[#F28C28]/50 bg-white"
      style={{
        width: `${markDimensions.w}px`,
        height: `${markDimensions.h}px`,
        maxWidth: `${markDimensions.w}px`,
        maxHeight: `${markDimensions.h}px`,
      }}
    >
      <img
        src="/images/ebtesamty_official_logo.jpg"
        alt="عيادة ابتسامتي لطب وجراحة الفم والأسنان — Ebtesamty Dental Clinics"
        width={markDimensions.w}
        height={markDimensions.h}
        style={{
          width: `${markDimensions.w}px`,
          height: `${markDimensions.h}px`,
          maxWidth: `${markDimensions.w}px`,
          maxHeight: `${markDimensions.h}px`,
          objectFit: 'cover',
          display: 'block',
        }}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );

  const VectorMark = (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 ${markDimensions.font}`}
      style={{
        width: `${markDimensions.w}px`,
        height: `${markDimensions.h}px`,
        background: 'linear-gradient(135deg, #176C5B 0%, #163447 100%)',
      }}
      aria-label="Ebtesamty Dental Logo Mark"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="#F28C28"
          strokeWidth="3.5"
          strokeDasharray="90 190"
          strokeDashoffset="-25"
          strokeLinecap="round"
        />
        <circle cx="82" cy="72" r="3" fill="#F28C28" />
      </svg>
      <span
        className="font-serif font-black text-white select-none leading-none relative -top-[1px]"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        إ
      </span>
    </div>
  );

  const LogoMark = useOfficialImage && !imageError ? OfficialImageMark : VectorMark;

  if (variant === 'official' || variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {LogoMark}
      <div className="flex flex-col text-left rtl:text-right">
        <span
          className={`font-serif font-bold tracking-tight text-[#163447] leading-tight ${
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg'
          }`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {isArabic ? 'عيادات ابتسامتي' : 'Ebtesamty'}
        </span>
        {showSubtitle && (
          <span
            className={`font-sans tracking-wide font-semibold text-[#176C5B] ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xs' : 'text-xs'
            }`}
          >
            {isArabic ? 'لطب وجراحة الفم والأسنان' : 'Dental Clinics • Egypt'}
          </span>
        )}
      </div>
    </div>
  );
}

export default BrandLogo;
