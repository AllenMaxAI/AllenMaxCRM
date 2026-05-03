import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robustly parses various date formats (Firestore Timestamp, ISO string, Date object)
 * into a standard JavaScript Date object.
 */
export function parseToDate(date: any): Date | null {
  if (!date) return null;
  
  try {
    // Handle Firestore Timestamp object { seconds, nanoseconds }
    if (typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    
    // Handle serialized Date objects or strings
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (e) {
    return null;
  }
}
