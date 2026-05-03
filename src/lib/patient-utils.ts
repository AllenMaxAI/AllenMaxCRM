export const findPatientByPhone = (phone: string | undefined | null, patients: any[] = []) => {
  if (!phone) return undefined;
  const cleanTarget = phone.replace(/\D/g, '');
  if (cleanTarget.length < 5) return undefined;

  return patients.find(p => {
    const cleanP = p.phone?.replace(/\D/g, '') || "";
    return cleanP.length >= 5 && (cleanP.endsWith(cleanTarget) || cleanTarget.endsWith(cleanP));
  });
};

export const isGeneric = (n: string | undefined | null) => 
  !n || n.trim().length === 0 || n.includes('+') || /^\d+$/.test(n.replace(/\s/g, "")) || n.toLowerCase() === 'desconocido';

/**
 * Utility to resolve the best name for a patient based on preferences and available data.
 */
export const resolvePatientName = (
  phone: string | undefined | null,
  currentName: string | undefined | null,
  collectedName: string | undefined | null,
  patients: any[] = [],
  mode: 'profile' | 'conversation' = 'profile',
  settings?: any
) => {
  const patient = findPatientByPhone(phone, patients);
  const dbName = patient?.name;
  const chatName = (currentName && currentName.toLowerCase() !== 'desconocido') ? currentName : collectedName;

  // ALWAYS prioritize DB name if it exists and is not generic
  // UNLESS we are in 'conversation' mode and autoUpdateConversationNames is disabled
  const shouldNormalize = mode === 'profile' || settings?.autoUpdateConversationNames;
  
  if (dbName && !isGeneric(dbName) && shouldNormalize) {
    return dbName;
  }

  // Fallback to chat name if it exists and is not generic
  if (chatName && !isGeneric(chatName)) {
    return chatName;
  }

  // If we have a DB name but normalization was disabled, we can still use it as last resort if chatName is generic
  if (dbName && !isGeneric(dbName)) {
    return dbName;
  }

  // Fallback: Use the most complete name available
  const names = [
    dbName,
    currentName,
    collectedName
  ].filter(n => n && !isGeneric(n)) as string[];

  if (names.length === 0) return "Paciente Desconocido";

  // Prioritize the name with more words (usually more complete)
  return names.reduce((prev, curr) => {
    const prevParts = (prev || "").trim().split(/\s+/).length;
    const currParts = (curr || "").trim().split(/\s+/).length;
    return currParts >= prevParts ? curr : prev;
  }, names[0]);
};

/**
 * Utility to get the initial letter for an avatar based on the resolved name.
 */
export const resolvePatientInitial = (name: string) => {
  if (!name || name === "Paciente Desconocido") return "P";
  const firstChar = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]/.test(firstChar) ? firstChar : "P";
};

/**
 * Utility to clean AI-generated summaries from unwanted prefixes.
 */
export const cleanSummary = (summary: string | undefined | null) => {
  if (!summary) return "";
  return summary.replace(/^\[Resumen Automático\]:\s*/i, "").trim();
};
