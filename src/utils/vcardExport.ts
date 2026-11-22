import { Club, UserProfile, extractPhoneNumbers } from './clubLogic';

/**
 * Erstellt eine standardkonforme vCard 3.0 (.vcf Datei), die von iOS (Apple Kontakte)
 * und Android (Google Kontakte / Telefonbuch) nativ per Klick importiert werden kann.
 */
export function generateVCardString(user: UserProfile, club?: Club | null): string {
  const nameParts = (user.name || '').trim().split(/\s+/);
  let firstName = '';
  let lastName = '';

  if (nameParts.length === 1) {
    lastName = nameParts[0];
  } else if (nameParts.length > 1) {
    firstName = nameParts.slice(0, -1).join(' ');
    lastName = nameParts[nameParts.length - 1];
  }

  const clubName = club?.name || 'Narrenkreis Bruchsal';
  const roleTitle = [user.positionInClub, user.praesidiumRole].filter(Boolean).join(' - ') || 'Mitglied';

  let street = '';
  let postalCode = '';
  let locality = '';
  const country = 'Deutschland';

  if (user.address) {
    const parts = user.address.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      street = parts[0];
      const cityPart = parts[1];
      const zipMatch = cityPart.match(/^(\d{4,5})\s+(.*)$/);
      if (zipMatch) {
        postalCode = zipMatch[1];
        locality = zipMatch[2];
      } else {
        locality = cityPart;
      }
    } else {
      street = user.address;
    }
  }

  const notes: string[] = [];
  if (user.praesidiumRole) {
    notes.push(`Präsidium: ${user.praesidiumRole}`);
  }
  if (club?.name) {
    notes.push(`Verein: ${club.name}`);
  }
  if (user.positionInClub) {
    notes.push(`Vereinsfunktion: ${user.positionInClub}`);
  }
  if (user.joinedDate) {
    notes.push(`Mitglied seit: ${user.joinedDate}`);
  }
  if (user.bio) {
    notes.push(`Notiz: ${user.bio}`);
  }
  notes.push('Exportiert aus dem Narrenkreis Bruchsal Portal');

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${user.name}`,
    `N:${lastName};${firstName};;;`,
    `ORG:${clubName};Narrenkreis Bruchsal`,
    `TITLE:${roleTitle}`
  ];

  if (user.email) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${user.email}`);
  }

  const mobileNumbers = extractPhoneNumbers(user.mobile, user.secondaryMobile);
  if (mobileNumbers.length > 0) {
    mobileNumbers.forEach((num, idx) => {
      lines.push(`TEL;TYPE=CELL,VOICE${idx === 0 ? ',PREF' : ''}:${num}`);
    });
  } else if (user.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${user.phone}`);
  }

  const fixedPhone = user.landline || (user.phone && !mobileNumbers.includes(user.phone) ? user.phone : undefined);
  if (fixedPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${fixedPhone}`);
  }

  if (street || locality || postalCode) {
    lines.push(`ADR;TYPE=HOME:;;${street};${locality};;${postalCode};${country}`);
  }

  if (club?.website) {
    lines.push(`URL:${club.website}`);
  }

  if (notes.length > 0) {
    const escapedNotes = notes.join('\\n').replace(/,/g, '\\,');
    lines.push(`NOTE:${escapedNotes}`);
  }

  if (user.avatar && user.avatar.startsWith('data:image/')) {
    try {
      const match = user.avatar.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
      if (match) {
        const imgType = match[1].toUpperCase() === 'JPG' ? 'JPEG' : match[1].toUpperCase();
        const base64Data = match[2];
        lines.push(`PHOTO;TYPE=${imgType};ENCODING=b:${base64Data}`);
      }
    } catch (e) {
      console.warn('Could not embed photo into vCard:', e);
    }
  }

  lines.push('REV:' + new Date().toISOString());
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export async function downloadContactVCard(user: UserProfile, club?: Club | null): Promise<boolean> {
  const vcardContent = generateVCardString(user, club);
  const safeName = (user.name || 'kontakt').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_');
  const fileName = `${safeName}.vcf`;

  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });

  // Falls Web Share API verfügbar ist (Android / iOS)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: user.name,
          text: `Kontakt von ${user.name}`
        });
        return true;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return true;
      }
    }
  }

  // Direkter Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}
