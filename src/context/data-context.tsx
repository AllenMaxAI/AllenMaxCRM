"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { 
  Patient, 
  Appointment, 
  Conversation,
  VoiceCall
} from "@/lib/mock-data"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { 
  collection, 
  doc, 
  getDoc,
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  getDocs,
  writeBatch,
  limit
} from "firebase/firestore"
import { findPatientByPhone, isGeneric } from "@/lib/patient-utils"
import { parseToDate } from "@/lib/utils"

export interface ClinicProfile {
  name: string;
  fiscalId: string;
  address: string;
  email: string;
  phone: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  color: string;
}

export interface AppSettings {
  autoSaveProfile: boolean;
  autoSaveFromDate?: string | null;
  autoUpdatePatientName?: boolean;
  autoUpdateConversationNames?: boolean;
  availableTags: { name: string; color: string }[];
  clinicProfile?: ClinicProfile;
  team?: TeamMember[];
  openingHour?: number;
  closingHour?: number;
  allowBookingAtClosingHour?: boolean;
  appointmentInterval?: number;
  showWeekends?: boolean;
}

export interface TrashItem {
  id: string;
  type: 'patient' | 'appointment' | 'conversation' | 'call';
  deleted_at: string;
  patient_id?: string; // Root field for fast querying
  data: {
    // Patient trash
    patient?: Patient;
    appointments: Appointment[];
    conversations: Conversation[];
    // Individual appointment/conversation/call trash
    appointment?: Appointment;
    conversation?: Conversation;
    call?: VoiceCall;
    calls?: VoiceCall[];
  };
}

interface DataContextType {
  patients: Patient[]
  appointments: Appointment[]
  conversations: Conversation[]
  calls: VoiceCall[]
  trash: TrashItem[]
  logs: SystemLog[]
  settings: AppSettings
  adminViewUid: string | null
  effectiveUid: string | null
  switchClinic: (uid: string | null) => void
  addAppointment: (appointment: Omit<Appointment, "id" | "clinic_id" | "created_at">) => Promise<string>
  addPatient: (patient: Omit<Patient, "id" | "clinic_id" | "created_at">) => Promise<string>
  logActivity: (action: string, type: 'info' | 'error' | 'success', details?: any) => Promise<void>
  updatePatient: (id: string, updates: Partial<Patient>) => void
  deletePatient: (id: string, options?: { deleteAppointments?: boolean, deleteConversations?: boolean, deleteCalls?: boolean }) => void
  deletePatients: (ids: string[], options?: { deleteAppointments?: boolean, deleteConversations?: boolean, deleteCalls?: boolean }) => void
  trashPatient: (id: string) => Promise<string>
  restorePatient: (trashId: string, options?: { restoreAppointments: boolean, restoreConversations: boolean }) => Promise<void>
  trashAppointment: (id: string) => Promise<string>
  restoreAppointment: (trashId: string) => Promise<void>
  trashConversation: (id: string) => Promise<string>
  restoreConversation: (trashId: string) => Promise<void>
  trashCall: (id: string) => Promise<string>
  restoreCall: (trashId: string) => Promise<void>
  deletePermanently: (trashId: string) => Promise<void>
  clearTrash: (type: 'patient' | 'appointment' | 'conversation' | 'all') => Promise<void>
  updateSettings: (newSettings: Partial<AppSettings>) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>
  updateCall: (id: string, updates: Partial<VoiceCall>) => Promise<void>
  addTeamMember: (member: Omit<TeamMember, "id">) => Promise<void>
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (id: string) => Promise<void>
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  getClinics: () => Promise<{uid: string, name: string, email: string}[]>
  triggerHistorySync: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [calls, setCalls] = useState<VoiceCall[]>([])
  const [trash, setTrash] = useState<TrashItem[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    autoSaveProfile: true,
    autoUpdatePatientName: false,
    autoUpdateConversationNames: false,
    availableTags: [
      { name: 'URGENCIA', color: '#EF4444' },
      { name: 'NUEVO PACIENTE', color: '#3B82F6' },
      { name: 'REVISIÓN', color: '#22C55E' },
      { name: 'ORTODONCIA', color: '#A855F7' },
      { name: 'ESTÉTICA', color: '#EC4899' },
      { name: 'REGULAR', color: '#64748B' },
      { name: 'AUTOGUARDADO', color: '#F59E0B' },
      { name: 'MANUAL', color: '#3B82F6' }
    ],
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [adminViewUid, setAdminViewUid] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const migrationInProgress = useRef(false)

  const effectiveUid = (isAdmin && adminViewUid) ? adminViewUid : user?.uid;

  const switchClinic = (uid: string | null) => {
    if (!isAdmin) return;
    setAdminViewUid(uid);
    setIsLoaded(false);
  };

  // 1. Sincronización Realtime con Firestore (Aislada por Usuario)
  useEffect(() => {
    if (!user) {
      setPatients([]);
      setAppointments([]);
      setConversations([]);
      setTrash([]);
      setCalls([]);
      setIsLoaded(true);
      return;
    }

    const targetUid = effectiveUid!;
    const userDocRef = doc(db, "users", targetUid);
    const patientsRef = collection(userDocRef, "patients");
    const appointmentsRef = collection(userDocRef, "appointments");
    const conversationsRef = collection(userDocRef, "conversations");
    const trashRef = collection(userDocRef, "trash");
    const callsRef = collection(userDocRef, "calls");
    const logsRef = collection(userDocRef, "logs");
    const settingsRef = doc(userDocRef, "settings", "global");

    const unsubPatients = onSnapshot(patientsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      setPatients(data);
    });

    const unsubAppointments = onSnapshot(appointmentsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    });

    const unsubConversations = onSnapshot(conversationsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(data);
    });

    const unsubTrash = onSnapshot(trashRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrashItem));
      setTrash(data);
    });

    const unsubCalls = onSnapshot(query(callsRef, orderBy("timestamp", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoiceCall));
      setCalls(data);
    });

    const unsubLogs = onSnapshot(query(logsRef, orderBy("timestamp", "desc"), limit(50)), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          ...d,
          date: d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleString('es-ES', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
          }) : 'Reciente'
        } as SystemLog;
      });
      setLogs(data);
    });

    const unsubSettings = onSnapshot(settingsRef, (docSnapshot) => {
      const initialSettings: AppSettings = {
        autoSaveProfile: true,
        availableTags: [
          { name: 'URGENCIA', color: '#EF4444' },
          { name: 'NUEVO PACIENTE', color: '#3B82F6' },
          { name: 'REVISIÓN', color: '#22C55E' },
          { name: 'ORTODONCIA', color: '#A855F7' },
          { name: 'ESTÉTICA', color: '#EC4899' },
          { name: 'REGULAR', color: '#64748B' },
          { name: 'AUTOGUARDADO', color: '#F59E0B' },
          { name: 'MANUAL', color: '#3B82F6' }
        ],
        clinicProfile: {
          name: "Clínica DentalFlow Pro",
          fiscalId: "DF-PRO-2024-X1",
          address: "Paseo de la Castellana 256, Madrid",
          email: user.email || "admin@dentalflowpro.com",
          phone: "+34 600 000 000"
        },
        team: [
          { id: "1", name: "Gestor de Equipo", role: "Director", email: "juan.p@dentalflow.com", color: "bg-blue-600" },
          { id: "2", name: "Administración", role: "Gestión", email: "emily.s@dentalflow.com", color: "bg-emerald-500" },
          { id: "3", name: "Laura Martínez", role: "Recepción", email: "laura.m@dentalflow.com", color: "bg-amber-500" },
        ],
        openingHour: 9,
        closingHour: 18,
        allowBookingAtClosingHour: false,
        appointmentInterval: 30,
        showWeekends: true
      };

      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as AppSettings;
        // Merge existing data with initialSettings to fill gaps
        setSettings({ ...initialSettings, ...data });
      } else {
        setDoc(settingsRef, initialSettings);
      }
      setIsLoaded(true);
    });

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubConversations();
      unsubTrash();
      unsubSettings();
      unsubCalls();
      unsubLogs();
    }
  }, [effectiveUid]);

  // 1.1 Limpiar papelera (30 días)
  useEffect(() => {
    if (!user || !trash.length) return;
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    const cleanTrash = async () => {
      const toDelete = trash.filter(item => {
        const deletedAt = new Date(item.deleted_at).getTime();
        return (now - deletedAt) > thirtyDaysMs;
      });

      if (toDelete.length > 0) {
        const batch = writeBatch(db);
        toDelete.forEach(item => {
          batch.delete(doc(db, "users", effectiveUid!, "trash", item.id));
        });
        await batch.commit();
      }
    };

    cleanTrash();
  }, [trash, user]);

  // 2. Lógica de Migración a Espacio Privado (One-time)
  useEffect(() => {
    const runMigration = async () => {
      if (!user || migrationInProgress.current) return;
      
      const migrationKey = `migrated_to_user_${user.uid}`;
      if (localStorage.getItem(migrationKey)) return;

      migrationInProgress.current = true;
      console.log(`Verificando migración de datos globales para el usuario ${user.uid}...`);
      
      try {
        // Check if global data exists
        const globalSettingsSnap = await getDoc(doc(db, "settings", "global"));
        if (!globalSettingsSnap.exists()) {
          localStorage.setItem(migrationKey, 'true');
          return;
        }

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);

        // Move Settings
        batch.set(doc(userDocRef, "settings", "global"), globalSettingsSnap.data());

        // Move Patients
        const patientsSnap = await getDocs(collection(db, "patients"));
        patientsSnap.docs.forEach(d => {
          batch.set(doc(userDocRef, "patients", d.id), d.data());
        });

        // Move Appointments
        const appointmentsSnap = await getDocs(collection(db, "appointments"));
        appointmentsSnap.docs.forEach(d => {
          batch.set(doc(userDocRef, "appointments", d.id), d.data());
        });

        // Move Conversations
        const conversationsSnap = await getDocs(collection(db, "conversations"));
        conversationsSnap.docs.forEach(d => {
          batch.set(doc(userDocRef, "conversations", d.id), d.data());
        });

        // Move Calls
        const callsSnap = await getDocs(collection(db, "calls"));
        callsSnap.docs.forEach(d => {
          batch.set(doc(userDocRef, "calls", d.id), d.data());
        });

        await batch.commit();
        localStorage.setItem(migrationKey, 'true');
        console.log("Migración a espacio privado completada con éxito.");
      } catch (e) {
        console.error("Error en la migración privada:", e);
      } finally {
        migrationInProgress.current = false;
      }
    };

    runMigration();
  }, [user]);
  
  // 3. Global Autosave Logic
  useEffect(() => {
    if (!settings.autoSaveProfile || !isLoaded || !effectiveUid) return;

    const processAutoSave = async () => {
      const pendingPatients: Omit<Patient, "id" | "clinic_id" | "created_at">[] = [];

      // Process Conversations
      conversations.forEach(conv => {
        if (conv.patient_id) return;
        if (isGeneric(conv.patient_name)) return;

        // Date filter
        if (settings.autoSaveFromDate) {
          const updateDate = parseToDate(conv.updated_at);
          const filterDate = parseToDate(settings.autoSaveFromDate);
          if (updateDate && filterDate && updateDate < filterDate) return;
        }

        const phone = conv.channel.includes('WhatsApp') || conv.channel.includes('Voz')
          ? conv.contact_identifier
          : '';

        const exists = findPatientByPhone(phone || conv.contact_identifier, patients);
        if (!exists) {
          pendingPatients.push({
            name: conv.patient_name,
            phone: phone || conv.contact_identifier,
            email: '',
            first_contact_channel: conv.channel,
            notes: 'Paciente auto-guardado desde chat.',
            tags: ['AUTOGUARDADO']
          });
        }
      });

      // Process Calls
      calls.forEach(call => {
        if (call.patient_id) return;
        if (!call.patient_name || isGeneric(call.patient_name)) return;

        // Date filter
        if (settings.autoSaveFromDate) {
          const callDate = parseToDate(call.timestamp);
          const filterDate = parseToDate(settings.autoSaveFromDate);
          if (callDate && filterDate && callDate < filterDate) return;
        }

        const exists = findPatientByPhone(call.phone_number, patients);
        if (!exists) {
          pendingPatients.push({
            name: call.patient_name,
            phone: call.phone_number,
            email: '',
            first_contact_channel: 'Agente de voz',
            notes: 'Paciente auto-guardado desde llamada.',
            tags: ['AUTOGUARDADO']
          });
        }
      });

      // Deduplicate pending patients by phone
      const uniquePending = Array.from(new Map(pendingPatients.map(p => [p.phone, p])).values());

      for (const p of uniquePending) {
        await addPatient(p);
      }
    };

    processAutoSave();
  }, [conversations, calls, settings.autoSaveProfile, settings.autoSaveFromDate, isLoaded]);

  const logActivity = async (action: string, type: 'info' | 'error' | 'success', details?: any) => {
    if (!effectiveUid) return;
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, "users", effectiveUid, "logs", logId), {
      action,
      type,
      details: details || null,
      timestamp: Timestamp.now()
    });
  }

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!effectiveUid) return;
    const updated = { ...settings, ...newSettings };
    await setDoc(doc(db, "users", effectiveUid, "settings", "global"), updated);
  }

  const addAppointment = async (newApp: Omit<Appointment, "id" | "clinic_id" | "created_at">) => {
    if (!user) return "";
    const id = `a${Date.now()}`;
    let patient_id = newApp.patient_id;
    let patient_name = newApp.patient_name;

    // Auto-link by phone if ID is missing
    if (!patient_id) {
      const phoneMatch = patients.find(p => p.phone === (newApp as any).patient_phone);
      if (phoneMatch) {
        patient_id = phoneMatch.id;
        patient_name = phoneMatch.name;
      }
    }

    const appointment = {
      ...newApp,
      patient_id,
      patient_name,
      clinic_id: effectiveUid,
      created_at: new Date().toISOString(),
    }
    await setDoc(doc(db, "users", effectiveUid, "appointments", id), appointment);
    return id;
  }

  const addPatient = async (newPatient: Omit<Patient, "id" | "clinic_id" | "created_at">) => {
    if (!user) return "";
    const id = `p${Date.now()}`;
    const batch = writeBatch(db);
    const userRef = doc(db, "users", effectiveUid);

    const patient = {
      ...newPatient,
      clinic_id: effectiveUid,
      created_at: new Date().toISOString(),
    }
    
    // 1. Create Patient
    batch.set(doc(userRef, "patients", id), patient);

    // 2. Sync all matching conversations
    const cleanNewPhone = newPatient.phone?.replace(/\D/g, '') || "";
    if (cleanNewPhone.length >= 7) {
      // Find matching conversations
      conversations.forEach(conv => {
        const cleanConvId = conv.contact_identifier?.replace(/\D/g, '') || "";
        const cleanConvPhone = conv.patient_phone?.replace(/\D/g, '') || "";
        
        const matchesId = cleanConvId.length >= 7 && (cleanConvId.endsWith(cleanNewPhone) || cleanNewPhone.endsWith(cleanConvId));
        const matchesPhone = cleanConvPhone.length >= 7 && (cleanConvPhone.endsWith(cleanNewPhone) || cleanNewPhone.endsWith(cleanConvPhone));

        if (matchesId || matchesPhone) {
          const convUpdates: any = {
            patient_id: id
          };
          
          // Only update name if normalization is enabled
          if (settings.autoUpdateConversationNames) {
            convUpdates.patient_name = newPatient.name;
          }
          
          batch.update(doc(userRef, "conversations", conv.id), convUpdates);
        }
      });

      // Find matching calls
      calls.forEach(call => {
        const cleanCallPhone = call.phone_number?.replace(/\D/g, '') || "";
        if (cleanCallPhone.length >= 7 && (cleanCallPhone.endsWith(cleanNewPhone) || cleanNewPhone.endsWith(cleanCallPhone))) {
          batch.update(doc(userRef, "calls", call.id), {
            patient_id: id
          });
        }
      });
    }

    await batch.commit();
    return id;
  }

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", effectiveUid, "conversations", id), updates);
  }

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    if (!user) return;
    const batch = writeBatch(db);
    const userRef = doc(db, "users", effectiveUid);
    
    // 1. Update Patient document
    batch.update(doc(userRef, "patients", id), updates);

    // 2. If name or phone changed, update all associated appointments
    if (updates.name || updates.phone) {
      const cleanPhone = (updates.phone || patients.find(p => p.id === id)?.phone)?.replace(/\D/g, '') || "";

      // Update appointments
      const relatedApps = appointments.filter(a => a.patient_id === id);
      relatedApps.forEach(app => {
        const appUpdates: any = {};
        if (updates.name) appUpdates.patient_name = updates.name;
        if (updates.phone) appUpdates.patient_phone = updates.phone;
        batch.update(doc(userRef, "appointments", app.id), appUpdates);
      });

      // Update conversations (by ID or by matching phone)
      conversations.forEach(conv => {
        const isLinked = conv.patient_id === id;
        const cleanConvId = conv.contact_identifier?.replace(/\D/g, '') || "";
        const cleanConvPhone = conv.patient_phone?.replace(/\D/g, '') || "";
        
        const idMatches = cleanPhone.length >= 7 && cleanConvId.length >= 7 && 
                         (cleanConvId.endsWith(cleanPhone) || cleanPhone.endsWith(cleanConvId));
        const phoneMatches = cleanPhone.length >= 7 && cleanConvPhone.length >= 7 && 
                           (cleanConvPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanConvPhone));

        if (isLinked || idMatches || phoneMatches) {
          const convUpdates: any = {};
          if (updates.name) convUpdates.patient_name = updates.name;
          if (isLinked === false && (idMatches || phoneMatches)) convUpdates.patient_id = id; // Link if not linked
          
          if (Object.keys(convUpdates).length > 0) {
            // Only update name if normalization is enabled
            if (updates.name && !settings.autoUpdateConversationNames) {
              delete convUpdates.patient_name;
            }
            
            if (Object.keys(convUpdates).length > 0) {
              batch.update(doc(userRef, "conversations", conv.id), convUpdates);
            }
          }
        }
      });

      // Update calls (by ID or by matching phone)
      calls.forEach(call => {
        const isLinked = call.patient_id === id;
        const cleanCallPhone = call.phone_number?.replace(/\D/g, '') || "";
        const phoneMatches = cleanPhone.length >= 7 && cleanCallPhone.length >= 7 && 
                           (cleanCallPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanCallPhone));

        if (isLinked || phoneMatches) {
          const callUpdates: any = {};
          if (updates.name) callUpdates.patient_name = updates.name;
          if (isLinked === false && phoneMatches) callUpdates.patient_id = id; // Link if not linked
          
          if (Object.keys(callUpdates).length > 0) {
            batch.update(doc(userRef, "calls", call.id), callUpdates);
          }
        }
      });
    }

    await batch.commit();
  }

  const updateCall = async (id: string, updates: Partial<VoiceCall>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", effectiveUid, "calls", id), updates);
  }

  const deletePatient = async (id: string, options = { deleteAppointments: true, deleteConversations: true }) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    await deleteDoc(doc(userRef, "patients", id));
    if (options.deleteAppointments) {
      const q = query(collection(userRef, "appointments"), where("patient_id", "==", id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    if (options.deleteConversations) {
      const q = query(collection(userRef, "conversations"), where("patient_id", "==", id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    // New: delete calls
    const deleteCalls = (options as any).deleteCalls ?? true;
    if (deleteCalls) {
      const patient = patients.find(p => p.id === id);
      const q = query(collection(userRef, "calls"), where("patient_id", "==", id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      
      // Also delete by phone
      if (patient?.phone) {
        const qPhone = query(collection(userRef, "calls"), where("phone_number", "==", patient.phone));
        const snapPhone = await getDocs(qPhone);
        snapPhone.docs.forEach(d => batch.delete(d.ref));
      }
      
      await batch.commit();
    }
  }

  const deletePatients = async (ids: string[], options = { deleteAppointments: true, deleteConversations: true }) => {
    if (!user) return;
    const batch = writeBatch(db);
    const userRef = doc(db, "users", effectiveUid);
    for (const id of ids) {
      batch.delete(doc(userRef, "patients", id));
      
      if (options.deleteAppointments) {
        const q = query(collection(userRef, "appointments"), where("patient_id", "==", id));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
      }

      if (options.deleteConversations) {
        const q = query(collection(userRef, "conversations"), where("patient_id", "==", id));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
      }

      const deleteCalls = (options as any).deleteCalls ?? true;
      if (deleteCalls) {
        const patient = patients.find(p => p.id === id);
        const q = query(collection(userRef, "calls"), where("patient_id", "==", id));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
        
        if (patient?.phone) {
          const qPhone = query(collection(userRef, "calls"), where("phone_number", "==", patient.phone));
          const snapPhone = await getDocs(qPhone);
          snapPhone.docs.forEach(d => batch.delete(d.ref));
        }
      }
    }
    await batch.commit();
  }

  // ── PATIENT TRASH ─────────────────────────────────────────────
  const trashPatient = async (id: string, options = { deleteAppointments: true, deleteConversations: true, deleteCalls: true }) => {
    if (!user) return "";
    const trashId = `t${Date.now()}`;
    const patient = patients.find(p => p.id === id);
    if (!patient) return "";

    const userRef = doc(db, "users", effectiveUid);
    const relatedApps = options.deleteAppointments ? appointments.filter(a => a.patient_id === id) : [];
    const relatedConvs = options.deleteConversations ? conversations.filter(c => c.patient_id === id) : [];
    const relatedCalls = options.deleteCalls ? calls.filter(c => c.patient_id === id || (patient.phone && c.phone_number === patient.phone)) : [];

    // Also include items that were ALREADY in the trash for this patient
    const trashedConvs = trash.filter(t => t.type === 'conversation' && t.data.conversation?.patient_id === id).map(t => t.data.conversation);
    const trashedCalls = trash.filter(t => t.type === 'call' && (t.data.call?.patient_id === id || (patient.phone && t.data.call?.phone_number === patient.phone))).map(t => t.data.call);
    const trashedApps = trash.filter(t => t.type === 'appointment' && t.data.appointment?.patient_id === id).map(t => t.data.appointment);

    const batch = writeBatch(db);

    // 1. Create Patient Trash Item (Container)
    const trashItem: TrashItem = {
      id: trashId,
      type: 'patient',
      patient_id: id,
      deleted_at: new Date().toISOString(),
      data: {
        patient,
        appointments: [...relatedApps, ...trashedApps] as Appointment[],
        conversations: [...relatedConvs, ...trashedConvs] as Conversation[],
        calls: [...relatedCalls, ...trashedCalls] as VoiceCall[]
      }
    };
    batch.set(doc(userRef, "trash", trashId), trashItem);

    // 2. Create Individual Trash Items for Citas
    if (options.deleteAppointments) {
      relatedApps.forEach(a => {
        const tId = `t_app_${a.id}_${Date.now()}`;
        const appTrash: TrashItem = {
          id: tId,
          type: 'appointment',
          patient_id: a.patient_id,
          deleted_at: new Date().toISOString(),
          data: {
            appointment: a,
            appointments: [a],
            conversations: []
          }
        };
        batch.set(doc(userRef, "trash", tId), appTrash);
        batch.delete(doc(userRef, "appointments", a.id));
      });
    }

    // 3. Create Individual Trash Items for Conversations
    if (options.deleteConversations) {
      relatedConvs.forEach(c => {
        const tId = `t_conv_${c.id}_${Date.now()}`;
        const convTrash: TrashItem = {
          id: tId,
          type: 'conversation',
          patient_id: c.patient_id,
          deleted_at: new Date().toISOString(),
          data: {
            conversation: c,
            appointments: [],
            conversations: [c]
          }
        };
        batch.set(doc(userRef, "trash", tId), convTrash);
        batch.delete(doc(userRef, "conversations", c.id));
      });
    }

    // 4. Create Individual Trash Items for Calls
    if (options.deleteCalls) {
      relatedCalls.forEach(c => {
        const tId = `t_call_${c.id}_${Date.now()}`;
        const callTrash: TrashItem = {
          id: tId,
          type: 'call',
          patient_id: c.patient_id,
          deleted_at: new Date().toISOString(),
          data: {
            call: c,
            appointments: [],
            conversations: []
          }
        };
        batch.set(doc(userRef, "trash", tId), callTrash);
        batch.delete(doc(userRef, "calls", c.id));
      });
    }

    batch.delete(doc(userRef, "patients", id));
    
    await batch.commit();
    return trashId;
  }

  const restorePatient = async (trashId: string, options = { restoreAppointments: true, restoreConversations: true, restoreCalls: true }) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const trashDoc = await getDoc(doc(userRef, "trash", trashId));
    if (!trashDoc.exists()) return;
    const item = trashDoc.data() as TrashItem;
    if (item.type !== 'patient' || !item.data.patient) return;

    const patientId = item.data.patient.id;
    const batch = writeBatch(db);
    
    // Restore the patient
    batch.set(doc(userRef, "patients", patientId), item.data.patient);
    
    // Use local trash state instead of fetching everything from Firestore (Slow!)
    const linkedItems = trash;

    if (options.restoreAppointments && item.data.appointments) {
      item.data.appointments.forEach(a => batch.set(doc(userRef, "appointments", a.id), a));
      // Delete individual appointment trash items
      linkedItems.filter(t => t.type === 'appointment' && t.data.appointment?.patient_id === patientId)
        .forEach(t => batch.delete(doc(userRef, "trash", t.id)));
    }

    if (options.restoreConversations && item.data.conversations) {
      item.data.conversations.forEach(c => batch.set(doc(userRef, "conversations", c.id), c));
      // Delete individual conversation trash items
      linkedItems.filter(t => t.type === 'conversation' && t.data.conversation?.patient_id === patientId)
        .forEach(t => batch.delete(doc(userRef, "trash", t.id)));
    }

    // @ts-ignore
    if (options.restoreCalls && item.data.calls) {
      // @ts-ignore
      item.data.calls.forEach(c => batch.set(doc(userRef, "calls", c.id), c));
      // Delete individual call trash items
      linkedItems.filter(t => t.type === 'call' && t.data.call?.patient_id === patientId)
        .forEach(t => batch.delete(doc(userRef, "trash", t.id)));
    }
    
    batch.delete(doc(userRef, "trash", trashId));
    await batch.commit();
  }

  // ── APPOINTMENT TRASH ─────────────────────────────────────────
  const trashAppointment = async (id: string) => {
    if (!user) return "";
    const trashId = `t${Date.now()}`;
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return "";

    const userRef = doc(db, "users", effectiveUid);
    const trashItem: TrashItem = {
      id: trashId,
      type: 'appointment',
      patient_id: appointment.patient_id,
      deleted_at: new Date().toISOString(),
      data: {
        appointment,
        appointments: [appointment],
        conversations: []
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(userRef, "trash", trashId), trashItem);
    batch.delete(doc(userRef, "appointments", id));
    await batch.commit();
    return trashId;
  }

  const restoreAppointment = async (trashId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const trashDoc = await getDoc(doc(userRef, "trash", trashId));
    if (!trashDoc.exists()) return;
    const item = trashDoc.data() as TrashItem;
    if (item.type !== 'appointment' || !item.data.appointment) return;

    const batch = writeBatch(db);
    batch.set(doc(userRef, "appointments", item.data.appointment.id), item.data.appointment);
    batch.delete(doc(userRef, "trash", trashId));
    await batch.commit();
  }

  // ── CONVERSATION TRASH ────────────────────────────────────────
  const trashConversation = async (id: string) => {
    if (!user) return "";
    const trashId = `t${Date.now()}`;
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return "";

    const userRef = doc(db, "users", effectiveUid);
    const trashItem: TrashItem = {
      id: trashId,
      type: 'conversation',
      patient_id: conversation.patient_id,
      deleted_at: new Date().toISOString(),
      data: {
        conversation: conversation,
        appointments: [],
        conversations: [conversation]
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(userRef, "trash", trashId), trashItem);
    batch.delete(doc(userRef, "conversations", id));
    await batch.commit();
    return trashId;
  }

  const restoreConversation = async (trashId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const trashDoc = await getDoc(doc(userRef, "trash", trashId));
    if (!trashDoc.exists()) return;
    const item = trashDoc.data() as TrashItem;
    if (item.type !== 'conversation' || !item.data.conversation) return;

    const batch = writeBatch(db);
    batch.set(doc(userRef, "conversations", item.data.conversation.id), item.data.conversation);
    batch.delete(doc(userRef, "trash", trashId));
    await batch.commit();
  }

  // ── DELETE PERMANENTLY ────────────────────────────────────────
  const deletePermanently = async (trashId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const trashDoc = await getDoc(doc(userRef, "trash", trashId));
    if (!trashDoc.exists()) return;
    
    const item = trashDoc.data() as TrashItem;
    
    const deleteMessages = async (convId: string) => {
      const q = query(collection(userRef, "messages"), where("conversation_id", "==", convId));
      const snap = await getDocs(q);
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
    };

    if (item.data.conversations && item.data.conversations.length > 0) {
      for (const conv of item.data.conversations) {
        await deleteMessages(conv.id);
      }
    }

    if (item.type === 'patient' && item.data.patient) {
      const pId = item.data.patient.id;
      const orphanTrashItems = trash.filter(t => 
        (t.type === 'appointment' && t.data.appointment?.patient_id === pId) ||
        (t.type === 'conversation' && t.data.conversation?.patient_id === pId)
      );

      for (const orphan of orphanTrashItems) {
        if (orphan.type === 'conversation' && orphan.data.conversation) {
          await deleteMessages(orphan.data.conversation.id);
        }
        await deleteDoc(doc(userRef, "trash", orphan.id));
      }
    }

    await deleteDoc(doc(userRef, "trash", trashId));
  }

  // ── CALL TRASH ────────────────────────────────────────────────
  const trashCall = async (id: string) => {
    if (!user) return "";
    const trashId = `t${Date.now()}`;
    const call = calls.find(c => c.id === id);
    if (!call) return "";

    const userRef = doc(db, "users", effectiveUid);
    const trashItem: TrashItem = {
      id: trashId,
      type: 'call',
      patient_id: call.patient_id,
      deleted_at: new Date().toISOString(),
      data: {
        call,
        appointments: [],
        conversations: []
      }
    };

    const batch = writeBatch(db);
    batch.set(doc(userRef, "trash", trashId), trashItem);
    batch.delete(doc(userRef, "calls", id));
    await batch.commit();
    return trashId;
  }

  const restoreCall = async (trashId: string) => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const trashDoc = await getDoc(doc(userRef, "trash", trashId));
    if (!trashDoc.exists()) return;
    const item = trashDoc.data() as TrashItem;
    if (item.type !== 'call' || !item.data.call) return;

    const batch = writeBatch(db);
    batch.set(doc(userRef, "calls", item.data.call.id), item.data.call);
    batch.delete(doc(userRef, "trash", trashId));
    await batch.commit();
  }

  const clearTrash = async (type: 'patient' | 'appointment' | 'conversation' | 'all') => {
    if (!user) return;
    const userRef = doc(db, "users", effectiveUid);
    const itemsToDelete = type === 'all' 
      ? trash 
      : trash.filter(item => {
          if (type === 'conversation') return item.type === 'conversation' || item.type === 'call';
          return item.type === type;
        });

    if (itemsToDelete.length === 0) return;

    const batch = writeBatch(db);
    for (const item of itemsToDelete) {
      // Logic from deletePermanently for messages
      if (item.data.conversations && item.data.conversations.length > 0) {
        for (const conv of item.data.conversations) {
          const q = query(collection(userRef, "messages"), where("conversation_id", "==", conv.id));
          const snap = await getDocs(q);
          snap.docs.forEach(d => batch.delete(d.ref));
        }
      }
      
      if (item.type === 'patient' && item.data.patient) {
        const pId = item.data.patient.id;
        const orphanTrashItems = trash.filter(t => 
          (t.type === 'appointment' && t.data.appointment?.patient_id === pId) ||
          (t.type === 'conversation' && t.data.conversation?.patient_id === pId) ||
          (t.type === 'call' && t.data.call?.patient_id === pId)
        );
        orphanTrashItems.forEach(orphan => batch.delete(doc(userRef, "trash", orphan.id)));
      }

      batch.delete(doc(userRef, "trash", item.id));
    }
    await batch.commit();
  }

  const addTeamMember = async (member: Omit<TeamMember, "id">) => {
    const id = Date.now().toString();
    const newTeam = [...(settings.team || []), { ...member, id }];
    await updateSettings({ team: newTeam });
  }

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>) => {
    const newTeam = (settings.team || []).map(m => m.id === id ? { ...m, ...updates } : m);
    await updateSettings({ team: newTeam });
  }

  const deleteTeamMember = async (id: string) => {
    const newTeam = (settings.team || []).filter(m => m.id !== id);
    await updateSettings({ team: newTeam });
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    if (!user) return;
    await updateDoc(doc(db, "users", effectiveUid, "appointments", id), updates);
  }

  const deleteAppointment = async (id: string) => {
    return await trashAppointment(id);
  }

  const getClinics = async () => {
    if (!isAdmin) return [];
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const clinicList = [];
      for (const userDoc of usersSnap.docs) {
        const settingsSnap = await getDoc(doc(db, "users", userDoc.id, "settings", "global"));
        const settingsData = settingsSnap.data() as AppSettings | undefined;
        clinicList.push({
          uid: userDoc.id,
          name: settingsData?.clinicProfile?.name || "Clínica sin nombre",
          email: settingsData?.clinicProfile?.email || "Sin email"
        });
      }
      return clinicList;
    } catch (e) {
      console.error("Error fetching clinics:", e);
      return [];
    }
  }

  const triggerHistorySync = async () => {
    if (!effectiveUid || !settings.autoSaveProfile) return;
    
    await logActivity("Iniciando sincronización manual de historial", "info");
    
    // The useEffect will pick up the conversations/calls and process them.
    // However, to ensure it processes EVERYTHING (ignoring date filter if needed),
    // we could temporarily clear the date filter or just run the logic here.
    // For now, the user's choice of "Historial Pasado" sets autoSaveFromDate to null,
    // which triggers the useEffect to process everything.
  }

  return (
    <DataContext.Provider value={{ 
      patients, appointments, conversations, calls, trash, settings, 
      addAppointment, addPatient, updatePatient, updateSettings,
      deletePatient, deletePatients, 
      trashPatient, restorePatient,
      trashAppointment, restoreAppointment,
      trashConversation, restoreConversation,
      trashCall, restoreCall,
      deletePermanently, clearTrash, updateConversation, updateCall,
      addTeamMember, updateTeamMember, deleteTeamMember,
      updateAppointment, deleteAppointment,
      adminViewUid, effectiveUid, switchClinic, getClinics,
      triggerHistorySync
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
