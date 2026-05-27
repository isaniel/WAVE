/**
 * Safely convert a Firestore Timestamp-like value to a JavaScript Date.
 * Handles:
 * - Firebase Timestamp objects (from Firestore SDK) with .toDate()
 * - Serialized timestamps from Socket.io: { _seconds, _nanoseconds } or { seconds, nanoseconds }
 * - Date objects
 * - ISO strings
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date();

  // Already a Date
  if (timestamp instanceof Date) return timestamp;

  // Firestore Timestamp with .toDate()
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();

  // Serialized Firebase Admin Timestamp from Socket.io
  if (typeof timestamp._seconds === 'number') {
    return new Date(timestamp._seconds * 1000);
  }
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }

  // ISO string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return new Date();
}
