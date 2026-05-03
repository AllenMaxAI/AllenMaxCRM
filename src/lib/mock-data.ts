export type Role = 'Administrador' | 'Gestor Clínico' | 'Recepcionista';

export interface User {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string;
  first_contact_channel: string;
  tags: string[];
  notes: string;
  created_at: string;
}

export type AppointmentStatus = 'programada' | 'confirmada' | 'cancelada' | 'completada';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  title: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  source: string;
  notes: string;
  appointment_notes?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name: string;
  channel: string;
  contact_identifier: string;
  last_message: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'paciente' | 'IA';
  message: string;
  timestamp: string;
}

export interface VoiceCall {
  id: string;
  clinic_id: string;
  patient_id: string;
  patient_name?: string; // Standardized for synchronization
  phone_number: string;
  transcript: string;
  summary: string;
  duration: string;
  intent: string;
  timestamp: string;
  recording_url?: string;
}

export const MOCK_CLINIC_ID = 'OkfqLr3tVyRgAEBGAqlgBbatOGU2';

export const MOCK_PATIENTS: Patient[] = [];


// Usamos fechas estáticas para evitar errores de hidratación
const today = new Date('2024-05-20');
const tomorrow = new Date('2024-05-21');

export const MOCK_APPOINTMENTS: Appointment[] = [];


export const MOCK_CONVERSATIONS: Conversation[] = [];


export const MOCK_MESSAGES: Message[] = [];

export const MOCK_VOICE_CALLS: VoiceCall[] = [
  {
    id: 'v1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p2',
    phone_number: '+34 600 000 456',
    transcript: 'Miguel: Hola. IA: Hola Miguel, ¿en qué puedo ayudarte? Miguel: Quiero saber los precios del blanqueamiento. IA: Nuestra consulta de blanqueamiento cuesta 50€, que se deducen del tratamiento si decides continuar. Miguel: Vale, reserva para el miércoles.',
    summary: 'El paciente preguntó por costes de blanqueamiento y reservó una consulta.',
    duration: '1m 45s',
    intent: 'Reserva',
    timestamp: '2023-12-07T14:30:00Z',
    recording_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
];