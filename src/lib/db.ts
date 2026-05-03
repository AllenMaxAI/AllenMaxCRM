// VERSION 4 - FORCE CACHE CLEAR
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  getFirestore
} from 'firebase/firestore';
import { db as webDb } from './firebase';

// Helper para detectar si estamos en el servidor
const isServer = typeof window === 'undefined';

// Usar Admin SDK en el servidor para saltarse las reglas de Firestore (necesario para webhooks)
// y el Web SDK en el cliente.
async function getDb() {
  if (isServer) {
    const { adminDb } = await import('./firebase-admin');
    return adminDb as any;
  }
  return webDb;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  channel: string;
  contact_identifier: string;
  last_message: string;
  updated_at: any;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'paciente' | 'IA';
  message: string;
  timestamp: any;
}

// Utility to get user document reference
const getUserRef = (clinicId: string) => doc(db, "users", clinicId);

export async function getClinicSettings(clinicId: string = "OkfqLr3tVyRgAEBGAqlgBbatOGU2") {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }
  const settingsSnap = await getDoc(doc(db, "users", clinicId, "settings", "global"));
  const defaultSettings = { 
    autoSaveProfile: true,
    preferredDisplayName: 'profile',
    openingHour: 9,
    closingHour: 18,
    appointmentInterval: 30,
    showWeekends: true,
    allowBookingAtClosingHour: false
  };

  if (!settingsSnap.exists()) return defaultSettings;
  return { ...defaultSettings, ...settingsSnap.data() };
}

export async function validatePatientOwnership(phone: string, name: string, currentPatientId?: string, clinicId: string = "OkfqLr3tVyRgAEBGAqlgBbatOGU2") {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }
  const userRef = getUserRef(clinicId);
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  const q = query(collection(userRef, "patients"), where("phone", "==", cleanPhone));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return { ok: true, isOwner: false, message: 'New patient' };
  }
  
  const patientDoc = snapshot.docs[0];
  const patientData = patientDoc.data();
  
  // Basic name similarity check
  const existingName = patientData.name.toLowerCase();
  const inputName = name.toLowerCase();
  
  const isOwner = existingName.includes(inputName) || inputName.includes(existingName);
  
  return { 
    ok: true, 
    isOwner, 
    patientId: patientDoc.id,
    message: isOwner ? 'Ownership confirmed' : 'Phone already registered to another name'
  };
}

export async function getConversations(clinicId: string = "OkfqLr3tVyRgAEBGAqlgBbatOGU2") {
  const q = query(collection(getUserRef(clinicId), "conversations"), orderBy("updated_at", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      updated_at: (() => {
        const t = data.updated_at;
        if (!t) return new Date().toISOString();
        if (typeof t.toDate === 'function') return t.toDate().toISOString();
        if (t.seconds) return new Date(t.seconds * 1000).toISOString();
        if (typeof t === 'string') return t;
        return new Date(t).toISOString();
      })()
    } as Conversation;
  });
}

export async function getMessages(conversationId: string, clinicId: string = "OkfqLr3tVyRgAEBGAqlgBbatOGU2") {
  const q = query(
    collection(getUserRef(clinicId), "messages"), 
    where("conversation_id", "==", conversationId),
    orderBy("timestamp", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      timestamp: (() => {
        const t = data.timestamp;
        if (!t) return new Date().toISOString();
        if (typeof t.toDate === 'function') return t.toDate().toISOString();
        if (t.seconds) return new Date(t.seconds * 1000).toISOString();
        if (typeof t === 'string') return t;
        return new Date(t).toISOString();
      })()
    } as Message;
  });
}

export async function addMessage(
  clinicId: string,
  conversationId: string,
  sender: 'paciente' | 'IA',
  text: string,
  patientName: string = "Paciente Desconocido",
  channel: string = "Chatbot Web",
  patientPhone?: string
) {
  const timestamp = Timestamp.now();

  // Asegurar login si estamos en el servidor para operaciones de escritura
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }

  const userRef = getUserRef(clinicId);
  
  // 0. Get global settings to check if we should auto-save
  const settings = await getClinicSettings(clinicId);

  // 1. Find or create patient if phone is provided and valid
  let patientId = `p_${conversationId}`; // Fallback
  let isInvalidPhone = !patientPhone || patientPhone === "No proporcionado" || patientPhone === "Sin teléfono";
  
  let cleanPhone = patientPhone;
  if (!isInvalidPhone && patientPhone) {
    cleanPhone = patientPhone.replace(/[\s\-\(\)]/g, '');
  }

  if (!isInvalidPhone && cleanPhone) {
    const q = query(collection(userRef, "patients"), where("phone", "==", cleanPhone));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const patientDoc = snapshot.docs[0];
      patientId = patientDoc.id;
      
      if (settings.autoUpdatePatientName && 
          patientName && 
          !["Paciente Desconocido", "Desconocido", "Paciente"].includes(patientName) &&
          patientDoc.data().name !== patientName) {
        await updateDoc(doc(userRef, "patients", patientId), { name: patientName });
      }
    } else if (settings.autoSaveProfile) {
      patientId = cleanPhone;
      await setDoc(doc(userRef, "patients", patientId), {
        name: patientName,
        phone: cleanPhone,
        clinic_id: clinicId,
        created_at: timestamp,
        first_contact_channel: channel,
        notes: 'Paciente auto-guardado desde chat.'
      }, { merge: true });
    }
  }

  // 2. Update/Create conversation
  const convRef = doc(userRef, "conversations", conversationId);
  const convSnap = await getDoc(convRef);
  
  const convData: any = {
    clinic_id: clinicId,
    patient_id: patientId,
    patient_name: patientName,
    channel: channel,
    contact_identifier: conversationId,
    last_message: text,
    updated_at: timestamp
  };
  if (cleanPhone && !isInvalidPhone) convData.patient_phone = cleanPhone;

  if (!convSnap.exists()) {
    await setDoc(convRef, convData);
    const welcomeMessage = "¡Hola! Bienvenido a AllenMax. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";
    const welcomeTimestamp = Timestamp.fromMillis(timestamp.toMillis() - 1000);
    
    await addDoc(collection(userRef, "messages"), {
      conversation_id: conversationId,
      sender: 'IA',
      message: welcomeMessage,
      timestamp: welcomeTimestamp
    });
  } else {
    const updates: any = {
      last_message: text,
      updated_at: timestamp,
      patient_id: patientId
    };
    if (patientName && !["Paciente Desconocido", "Desconocido", "Paciente"].includes(patientName)) {
      updates.patient_name = patientName;
    }
    if (cleanPhone && !isInvalidPhone) {
      updates.patient_phone = cleanPhone;
    }
    await updateDoc(convRef, updates);
  }

  // 2.5 Auto-update past conversations
  if (settings.autoUpdateConversationNames && cleanPhone && !isInvalidPhone && patientName && !["Paciente Desconocido", "Desconocido", "Paciente"].includes(patientName)) {
    const qPastConvs = query(collection(userRef, "conversations"), where("patient_phone", "==", cleanPhone));
    const pastConvsSnap = await getDocs(qPastConvs);
    const batch = writeBatch(db);
    let count = 0;
    pastConvsSnap.docs.forEach(d => {
      if (d.id !== conversationId && d.data().patient_name !== patientName) {
        batch.update(d.ref, { patient_name: patientName });
        count++;
      }
    });
    if (count > 0) await batch.commit();
  }

  // 3. Add message
  if (isServer) {
    // Autenticar al servidor si es necesario (para saltarse las reglas de Firestore sin Service Account Key)
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'servidor@allenmax.com';
      const password = process.env.SERVER_AUTH_PASSWORD;
      if (email && password) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          console.log('--- Server authenticated as Demo User ---');
        } catch (authErr) {
          console.error('--- Server authentication failed ---', authErr);
        }
      }
    }

    const msgRef = await addDoc(collection(getUserRef(clinicId), "messages"), {
      conversation_id: conversationId,
      sender: sender,
      message: text,
      timestamp: timestamp
    });
    return { conversationId, messageId: msgRef.id, patientId };
  } else {
    const msgRef = await addDoc(collection(getUserRef(clinicId), "messages"), {
      conversation_id: conversationId,
      sender: sender,
      message: text,
      timestamp: timestamp
    });
    return { conversationId, messageId: msgRef.id, patientId };
  }
}





export async function deleteConversation(clinicId: string, conversationId: string) {
  const userRef = getUserRef(clinicId);
  await deleteDoc(doc(userRef, "conversations", conversationId));
  const q = query(collection(userRef, "messages"), where("conversation_id", "==", conversationId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(m => deleteDoc(m.ref));
  await Promise.all(deletePromises);
}

export async function getAppointments(clinicId: string, date?: string, phone?: string) {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }
  const userRef = getUserRef(clinicId);
  let q;
  if (date) {
    // Usar un rango que cubra tanto "YYYY-MM-DD " como "YYYY-MM-DD T"
    const startRange = `${date}`;
    const endRange = `${date}\uf8ff`; // \uf8ff es el carácter más alto en Unicode, cubre todo el día
    q = query(
      collection(userRef, "appointments"), 
      where("start_time", ">=", startRange),
      where("start_time", "<=", endRange),
      orderBy("start_time", "asc")
    );
  } else {
    // Si no hay fecha, buscamos desde hoy en adelante para no saturar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Formato local ajustado para evitar problemas de timezone
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, -1);
    const todayStr = localISOTime.split('T')[0] + " 00:00";
    q = query(
      collection(userRef, "appointments"), 
      where("start_time", ">=", todayStr),
      orderBy("start_time", "asc")
    );
  }
  
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  if (phone) {
    const cleanSearchPhone = phone.replace(/\D/g, '');
    results = results.filter(app => {
      if (!app.patient_phone) return false;
      const cleanAppPhone = app.patient_phone.replace(/\D/g, '');
      return cleanAppPhone.endsWith(cleanSearchPhone) || cleanSearchPhone.endsWith(cleanAppPhone);
    });
  }

  return results;
}

export async function addAppointment(clinicId: string, data: any) {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }

  const userRef = getUserRef(clinicId);
  
  // Clean phone number if present
  const cleanedData = { ...data };
  if (cleanedData.patient_phone) {
    cleanedData.patient_phone = cleanedData.patient_phone.replace(/[\s\-\(\)]/g, '');
  }

  const docRef = await addDoc(collection(userRef, "appointments"), {
    ...cleanedData,
    clinic_id: clinicId,
    created_at: Timestamp.now()
  });
  return { id: docRef.id, ...cleanedData };
}

export async function updateAppointment(clinicId: string, id: string, updates: any) {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }
  const docRef = doc(db, "users", clinicId, "appointments", id);
  await updateDoc(docRef, updates);
  return { id, ...updates };
}




export async function deleteAppointment(clinicId: string, id: string) {
  // Asegurar login si estamos en el servidor
  if (isServer) {
    const { auth } = await import('./firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    if (!auth.currentUser) {
      const email = process.env.SERVER_AUTH_EMAIL || 'topdentist@demo.com';
      const password = process.env.SERVER_AUTH_PASSWORD || 'topdentistdemo123!';
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        console.error("Auth server error:", e);
      }
    }
  }
  await deleteDoc(doc(db, "users", clinicId, "appointments", id));
  return { id, deleted: true };
}

