import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { UserProfile } from '../utils/clubLogic';

interface UserAvatarProps {
  user?: Partial<UserProfile> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  editable?: boolean;
  onPhotoChange?: (photoDataUrl: string) => void;
  showBorder?: boolean;
  borderVariant?: 'amber' | 'slate' | 'sky' | 'white';
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg font-bold',
  xl: 'w-20 h-20 text-2xl font-black',
  '2xl': 'w-24 h-24 text-3xl font-black'
};

const BORDER_CLASSES = {
  amber: 'ring-2 ring-amber-400/80',
  slate: 'ring-2 ring-slate-300',
  sky: 'ring-2 ring-sky-400/80',
  white: 'ring-2 ring-white/80'
};

/**
 * Universelle Avatar-Komponente für Benutzer:
 * Unterstützt echte Profilbilder (Base64, URLs, Dateien)
 * sowie elegante Initialen als Fallback.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  editable = false,
  onPhotoChange,
  showBorder = false,
  borderVariant = 'slate'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarValue = user?.avatar || '';
  const isImage = 
    avatarValue.startsWith('data:image/') || 
    avatarValue.startsWith('http://') || 
    avatarValue.startsWith('https://') || 
    avatarValue.startsWith('/');

  // Fallback initials from user name
  const initials = (() => {
    if (user?.name) {
      return user.name
        .trim()
        .split(/\s+/)
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return !isImage && avatarValue ? avatarValue.slice(0, 2).toUpperCase() : 'NK';
  })();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoChange) return;

    // Check size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Das ausgewählte Bild ist zu groß (maximal 10 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      // Bild skalieren und komprimieren (max 400x400) für schnelle Ladezeiten
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onPhotoChange(compressedDataUrl);
        } else {
          onPhotoChange(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const borderClass = showBorder ? BORDER_CLASSES[borderVariant] : '';
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      <div
        className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden transition-all ${
          isImage 
            ? 'bg-slate-100' 
            : 'bg-gradient-to-br from-slate-900 to-amber-950 text-amber-300 font-bold'
        } ${borderClass}`}
      >
        {isImage ? (
          <img
            src={avatarValue}
            alt={user?.name || 'Benutzer'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Falls das Bild fehlschlägt, auf Initialen zurückfallen
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-full shadow-md border-2 border-white transition-transform cursor-pointer"
          title="Profilbild ändern oder neues Foto hochladen"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
