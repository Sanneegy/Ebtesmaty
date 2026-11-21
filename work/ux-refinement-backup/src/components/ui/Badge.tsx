'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock3, Info, CalendarClock } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal' | 'planned';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
  };

  const variantClasses = {
    success: 'bg-[#E9F7F0] text-[#116B48] border border-[#C5E8D5]',
    warning: 'bg-[#FFF5E6] text-[#91580F] border border-[#F3D9AD]',
    danger: 'bg-[#FFF1F1] text-[#B13E3E] border border-[#F1C9C9]',
    info: 'bg-[#EDF4FD] text-[#225C99] border border-[#CEE1F5]',
    neutral: 'bg-[#F2F5F8] text-[#586A7C] border border-[#E3E8EF]',
    teal: 'bg-[#EDF7F7] text-[#267679] border border-[#D3E9E8]',
    planned: 'bg-[#F3EFFF] text-[#6943A4] border border-[#DFD5F4]',
  };

  const DefaultIcon = variant === 'success' ? CheckCircle2 : variant === 'warning' ? Clock3 : variant === 'danger' ? AlertCircle : variant === 'info' ? Info : variant === 'planned' ? CalendarClock : null;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon ? <span className="shrink-0">{icon}</span> : icon === undefined && DefaultIcon ? <DefaultIcon className="w-3 h-3 shrink-0" aria-hidden="true" /> : null}
      <span>{children}</span>
    </span>
  );
}
