export type Role = 'Administrador' | 'Dentista' | 'Recepcionista';

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
  title: string;
  start_time: string;
  end_time: string;
  dentist: string;
  status: AppointmentStatus;
  source: string;
  notes: string;
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
  phone_number: string;
  transcript: string;
  summary: string;
  duration: string;
  intent: string;
  timestamp: string;
}

export const MOCK_CLINIC_ID = 'clinica_001';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Sara García',
    phone: '+34 600 000 123',
    email: 'sara.g@ejemplo.com',
    first_contact_channel: 'Chatbot Web',
    tags: ['Regular', 'Ortodoncia'],
    notes: 'Dientes sensibles, prefiere citas por la mañana.',
    created_at: '2023-10-01T10:00:00Z',
  },
  {
    id: 'p2',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Miguel Chen',
    phone: '+34 600 000 456',
    email: 'm.chen@ejemplo.com',
    first_contact_channel: 'Agente de Voz',
    tags: ['Nuevo Paciente'],
    notes: 'Interesado en blanqueamiento dental.',
    created_at: '2023-11-15T14:30:00Z',
  },
  {
    id: 'p3',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Emma Wilson',
    phone: '+34 600 000 789',
    email: 'emma.w@ejemplo.com',
    first_contact_channel: 'Chatbot WhatsApp',
    tags: ['Urgencia'],
    notes: 'Diente astillado, necesita reparación urgente.',
    created_at: '2023-12-01T09:00:00Z',
  },
];

// Usamos fechas estáticas para evitar errores de hidratación
const today = new Date('2024-05-20');
const tomorrow = new Date('2024-05-21');

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p1',
    patient_name: 'Sara García',
    title: 'Limpieza Rutinaria',
    start_time: new Date(today.setHours(9, 0, 0)).toISOString(),
    end_time: new Date(today.setHours(10, 0, 0)).toISOString(),
    dentist: 'Dra. Emily Smith',
    status: 'programada',
    source: 'Chatbot Web',
    notes: 'Chequeo estándar.',
    created_at: '2023-12-05T08:00:00Z',
  },
  {
    id: 'a2',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p2',
    patient_name: 'Miguel Chen',
    title: 'Consulta Blanqueamiento',
    start_time: new Date(today.setHours(11, 30, 0)).toISOString(),
    end_time: new Date(today.setHours(12, 0, 0)).toISOString(),
    dentist: 'Dra. Emily Smith',
    status: 'confirmada',
    source: 'Agente de Voz',
    notes: 'Verificar elegibilidad.',
    created_at: '2023-12-06T10:00:00Z',
  },
  {
    id: 'a3',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p3',
    patient_name: 'Emma Wilson',
    title: 'Empaste de Urgencia',
    start_time: new Date(tomorrow.setHours(10, 0, 0)).toISOString(),
    end_time: new Date(tomorrow.setHours(11, 0, 0)).toISOString(),
    dentist: 'Dr. Alan Brown',
    status: 'programada',
    source: 'Chatbot WhatsApp',
    notes: 'Molar superior izquierdo.',
    created_at: '2023-12-07T15:00:00Z',
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p1',
    patient_name: 'Sara García',
    channel: 'Chatbot Web',
    contact_identifier: 'web_user_998',
    last_message: '¡Gracias por programar mi cita!',
    updated_at: '2023-12-08T10:30:00Z',
  },
  {
    id: 'c2',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p3',
    patient_name: 'Emma Wilson',
    channel: 'Chatbot WhatsApp',
    contact_identifier: '+34600000789',
    last_message: '¿Está disponible el Dr. Alan mañana?',
    updated_at: '2023-12-08T11:15:00Z',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    conversation_id: 'c1',
    sender: 'paciente',
    message: 'Hola, me gustaría reservar una limpieza.',
    timestamp: '2023-12-08T10:25:00Z',
  },
  {
    id: 'm2',
    conversation_id: 'c1',
    sender: 'IA',
    message: '¡Claro! Tengo disponibilidad mañana a las 9:00 AM. ¿Te gustaría reservarla?',
    timestamp: '2023-12-08T10:26:00Z',
  },
  {
    id: 'm3',
    conversation_id: 'c1',
    sender: 'paciente',
    message: 'Sí, por favor.',
    timestamp: '2023-12-08T10:27:00Z',
  },
  {
    id: 'm4',
    conversation_id: 'c1',
    sender: 'IA',
    message: '¡Hecho! Tu cita está programada para mañana a las 9:00 AM con la Dra. Emily Smith. ¡Gracias por usar nuestro servicio!',
    timestamp: '2023-12-08T10:28:00Z',
  },
];

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
  },
];