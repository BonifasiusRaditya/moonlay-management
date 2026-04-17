const CHARSET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*';

function getRandomValues(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  // Fallback for environments without Web Crypto (should be rare in UI)
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * Generate a random password (default length: 12).
 * Uses Web Crypto when available.
 */
export function generateRandomPassword(length = 12): string {
  const bytes = getRandomValues(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    const idx = bytes[i] % CHARSET.length;
    password += CHARSET[idx];
  }
  return password;
}

