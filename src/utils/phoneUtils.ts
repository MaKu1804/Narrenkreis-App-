/**
 * Phone and WhatsApp utilities for 1-click calling and chatting
 */

/**
 * Sanitizes phone number for WhatsApp wa.me links
 * e.g. "+49 171 1234567" -> "491711234567"
 * "0171 1234567" -> "491711234567" (German standard)
 */
export function sanitizePhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return '';
  // If combined with "und" or multiple parts, take the first valid part
  let target = phone.split(/\s+(?:und|&|\/)\s+|[,;/]+/i)[0].trim();
  // Remove non-digit characters except leading plus
  let cleaned = target.replace(/[\s\-\/\(\)\.]/g, '');
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    // German national number -> add 49 country code
    cleaned = '49' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Returns full WhatsApp link
 */
export function getWhatsAppUrl(phone?: string | null, message?: string): string {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  if (!sanitized) return '';
  const baseUrl = `https://wa.me/${sanitized}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Returns standard tel: link
 */
export function getTelUrl(phone?: string | null): string {
  if (!phone) return '';
  return `tel:${phone.replace(/[\s\-\/\(\)]/g, '')}`;
}
