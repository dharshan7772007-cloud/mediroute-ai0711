import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';
import { getGoogleMapsDirectionsUrl } from '../utils/mapLinks';

interface GoogleMapsDirectionsButtonProps {
  destination: { lat: number; lng: number; name?: string; address?: string };
  origin?: { lat: number; lng: number; address?: string; name?: string } | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  label?: string;
  showIcon?: boolean;
  title?: string;
}

export const GoogleMapsDirectionsButton: React.FC<GoogleMapsDirectionsButtonProps> = ({
  destination,
  origin,
  className = '',
  size = 'sm',
  variant = 'primary',
  label = 'Get Directions in Google Maps',
  showIcon = true,
  title = 'Open navigation in Google Maps (new tab)',
}) => {
  const url = getGoogleMapsDirectionsUrl(destination, origin);

  const sizeClasses = {
    xs: 'px-2 py-1 text-[10px] gap-1 rounded-md',
    sm: 'px-2.5 py-1.5 text-[11px] gap-1.5 rounded-lg',
    md: 'px-3.5 py-2 text-xs gap-2 rounded-xl font-bold',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-blue-500/20 border border-blue-400/30',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-cyan-500/30 hover:border-cyan-400/50',
    outline:
      'bg-transparent hover:bg-blue-950/40 text-blue-400 hover:text-blue-300 font-semibold border border-blue-500/40 hover:border-blue-400',
    ghost:
      'bg-transparent text-blue-400 hover:text-blue-300 font-semibold hover:underline p-0 border-0 shadow-none',
  }[variant];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={title}
      className={`inline-flex items-center justify-center transition-all cursor-pointer whitespace-nowrap group ${sizeClasses} ${variantClasses} ${className}`}
    >
      {showIcon && (
        <Navigation className={`${iconSizes} group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-200 shrink-0`} />
      )}
      <span>{label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5" />
    </a>
  );
};
