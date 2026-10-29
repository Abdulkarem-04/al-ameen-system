import React from 'react';

export interface AmanaHQLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  withContainer?: boolean;
}

export const AmanaHQLogo: React.FC<AmanaHQLogoProps> = ({
  size = 36,
  primaryColor = '#38BDF8',
  secondaryColor,
  accentColor = '#94A3B8',
  withContainer = true,
  className = '',
  ...props
}) => {
  const svgElement = (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Right Leg (Adapts automatically in dark mode if secondaryColor is not forced) */}
      <path
        d="M 50 16 L 68 84 L 54 84 L 42 40 Z"
        fill={secondaryColor || 'currentColor'}
        className={!secondaryColor ? 'text-[#0F172A] dark:text-[#334155]' : ''}
      />
      {/* Left Ribbon Ascending */}
      <path d="M 20 84 L 50 16 L 62 16 L 34 84 Z" fill={primaryColor} />
      {/* Apex Fold */}
      <path d="M 44 26 L 50 16 L 62 16 L 56 26 Z" fill={accentColor} />
    </svg>
  );

  if (!withContainer) return svgElement;

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl bg-white dark:bg-[#14171F] border border-slate-200/90 dark:border-slate-800 flex items-center justify-center shadow-xs shrink-0 p-1"
    >
      {svgElement}
    </div>
  );
};

export default AmanaHQLogo;
