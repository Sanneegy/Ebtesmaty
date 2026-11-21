'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'planned' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled = false,
      icon,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-[10px] border transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs min-h-[34px]',
      md: 'px-4 py-2 text-[13px] min-h-[40px]',
      lg: 'px-5 py-2.5 text-sm min-h-[44px]',
    };

    const variantStyles = {
      primary: 'bg-[#235F9D] text-white border-[#235F9D] hover:bg-[#194E84] focus-visible:ring-[#235F9D]/30',
      secondary: 'bg-[#F2F6FB] text-[#234D75] border-[#D9E5F1] hover:bg-[#E6EFF8] focus-visible:ring-[#235F9D]/25',
      outline: 'bg-white text-[#234D75] border-[#D3DFEA] hover:bg-[#F6F9FC] focus-visible:ring-[#235F9D]/25',
      success: 'bg-[#E8F7F0] text-[#116B48] border-[#BFE7D1] hover:bg-[#D3EFDF] focus-visible:ring-[#15815A]/25',
      warning: 'bg-[#FFF6E8] text-[#995C14] border-[#F1D9AD] hover:bg-[#FFEBCB] focus-visible:ring-[#A96719]/25',
      planned: 'bg-[#F3EFFF] text-[#6943A4] border-[#DFD5F4] hover:bg-[#EDE5FB] focus-visible:ring-[#6943A4]/25',
      danger: 'bg-[#FFF2F2] text-[#AD3434] border-[#F0CDCD] hover:bg-[#FFE3E3] focus-visible:ring-[#C34A4A]/25',
      ghost: 'bg-transparent text-[#234D75] border-transparent hover:bg-[#EDF4FA] focus-visible:ring-[#235F9D]/25',
    };
    const resolvedLeftIcon = leftIcon || icon;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          resolvedLeftIcon
        )}
        <span className="min-w-0">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
