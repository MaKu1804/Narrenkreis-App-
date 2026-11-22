import React from 'react';
import { Shield } from 'lucide-react';
import { Club } from '../utils/clubLogic';

interface ClubLogoProps {
  club?: Club | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
  showCategory?: boolean;
}

export const ClubLogo: React.FC<ClubLogoProps> = ({
  club,
  size = 'md',
  className = '',
  showName = false,
  showCategory = false
}) => {
  if (!club) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
          <Shield className="w-4 h-4" />
        </div>
        {showName && <span className="text-xs text-slate-400">Kein Verein</span>}
      </div>
    );
  }

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className={`${sizeClasses[size]} shrink-0 rounded-full overflow-hidden shadow-xs border border-slate-200/80 flex items-center justify-center bg-white`}
        title={`${club.name} (${club.category})`}
      >
        {club.logo ? (
          club.logo.startsWith('data:') || club.logo.startsWith('http') || club.logo.startsWith('/') || !club.logo.includes('<') ? (
            <img 
              src={club.logo} 
              alt={club.shortName || club.name} 
              className="w-full h-full object-contain p-0.5" 
            />
          ) : (
            <div 
              className="w-full h-full p-0.5 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: club.logo }} 
            />
          )
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white text-xs font-bold relative overflow-hidden"
            style={{ 
              background: club.secondaryColor 
                ? `linear-gradient(135deg, ${club.color || '#0284c7'} 50%, ${club.secondaryColor} 50%)` 
                : (club.color || '#0284c7') 
            }}
          >
            <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
              {club.shortName?.slice(0, 2).toUpperCase() || 'V'}
            </span>
          </div>
        )}
      </div>

      {(showName || showCategory) && (
        <div className="flex flex-col min-w-0 text-left">
          {showName && (
            <span className="text-sm font-semibold text-slate-900 truncate">
              {club.shortName || club.name}
            </span>
          )}
          {showCategory && (
            <span className="text-xs text-slate-500 truncate">
              {club.category}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
