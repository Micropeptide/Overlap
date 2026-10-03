// Optional passwords, turned into keys in the browser so the password itself
// never leaves the device. The key is PBKDF2-SHA-256 of the password, salted
// with the poll and the role, so the same password gives a different key in
// every poll. The server stores only a SHA-256 hash of the key, like the keys
// in private links, and limits how many wrong guesses it accepts.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
const ITERATIONS = 210_000;
const encoder = new TextEncoder();

/** Keys are 43 characters of base64url (256 bits). */
export const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
  return null;
}

/** role: 'organizer' or 'guest'. */
export async function passwordKey(password, pollId, role) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: encoder.encode(`overlap/v1/${role}/${pollId}`) },
    material, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
