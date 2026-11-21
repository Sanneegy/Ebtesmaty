import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Clock, 
  HelpCircle,
  LucideIcon 
} from 'lucide-react';

export type SemanticVariant = 
  | 'critical'   // Critical / Unsafe / Danger (#B42318)
  | 'warning'    // Warning / Needs Attention (#946200)
  | 'verified'   // Verified / Success / Completed (#18794E)
  | 'action'     // Information / Primary Action / Pending (#174EA6)
  | 'proposed'   // Proposed / Planned / Draft (#6941A5)
  | 'neutral';   // Inactive / Archived / Neutral (#475467)

interface StatusTagProps {
  variant: SemanticVariant;
  label: string;
  icon?: LucideIcon | boolean;
  size?: 'sm' | 'md';
  className?: string;
  count?: number;
}

const variantStyles: Record<SemanticVariant, {
  bg: string;
  text: string;
  border: string;
  iconColor: string;
  defaultIcon: LucideIcon;
}> = {
  critical: {
    bg: 'bg-[#FFF1F1]',
    text: 'text-[#B13E3E]',
    border: 'border-[#F1C9C9]',
    iconColor: 'text-[#B13E3E]',
    defaultIcon: AlertCircle,
  },
  warning: {
    bg: 'bg-[#FFF5E6]',
    text: 'text-[#91580F]',
    border: 'border-[#F3D9AD]',
    iconColor: 'text-[#91580F]',
    defaultIcon: AlertTriangle,
  },
  verified: {
    bg: 'bg-[#E9F7F0]',
    text: 'text-[#116B48]',
    border: 'border-[#C5E8D5]',
    iconColor: 'text-[#116B48]',
    defaultIcon: CheckCircle2,
  },
  action: {
    bg: 'bg-[#EDF4FD]',
    text: 'text-[#225C99]',
    border: 'border-[#CEE1F5]',
    iconColor: 'text-[#225C99]',
    defaultIcon: Info,
  },
  proposed: {
    bg: 'bg-[#F5F0FF]',
    text: 'text-[#6941A5]',
    border: 'border-[#E9D7FE]',
    iconColor: 'text-[#6941A5]',
    defaultIcon: Clock,
  },
  neutral: {
    bg: 'bg-[#F2F4F7]',
    text: 'text-[#475467]',
    border: 'border-[#EAECF0]',
    iconColor: 'text-[#667085]',
    defaultIcon: HelpCircle,
  },
};

export function StatusTag({
  variant,
  label,
  icon = true,
  size = 'md',
  className = '',
  count,
}: StatusTagProps) {
  const config = variantStyles[variant];
  const IconComponent = typeof icon === 'boolean' ? (icon ? config.defaultIcon : null) : icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-xs font-medium px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-sans transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      role="status"
    >
      {IconComponent && (
        <IconComponent className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${config.iconColor} shrink-0`} />
      )}
      <span className="truncate">{label}</span>
      {typeof count === 'number' && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/70 font-bold border border-current/20">
          {count}
        </span>
      )}
    </span>
  );
}

export default StatusTag;
