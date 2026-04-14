export type Role = 'Admin' | 'Dentist' | 'Receptionist';

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

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';

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
  sender: 'patient' | 'AI';
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

export const MOCK_CLINIC_ID = 'clinic_001';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Sarah Johnson',
    phone: '+1 555-0123',
    email: 'sarah.j@example.com',
    first_contact_channel: 'Website Chatbot',
    tags: ['Regular', 'Orthodontics'],
    notes: 'Sensitive teeth, prefers morning appointments.',
    created_at: '2023-10-01T10:00:00Z',
  },
  {
    id: 'p2',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Michael Chen',
    phone: '+1 555-0456',
    email: 'm.chen@example.com',
    first_contact_channel: 'Voice Agent',
    tags: ['New Patient'],
    notes: 'Interested in teeth whitening.',
    created_at: '2023-11-15T14:30:00Z',
  },
  {
    id: 'p3',
    clinic_id: MOCK_CLINIC_ID,
    name: 'Emma Wilson',
    phone: '+1 555-0789',
    email: 'emma.w@example.com',
    first_contact_channel: 'WhatsApp Chatbot',
    tags: ['Emergency'],
    notes: 'Chipped tooth, needs urgent repair.',
    created_at: '2023-12-01T09:00:00Z',
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p1',
    patient_name: 'Sarah Johnson',
    title: 'Routine Cleaning',
    start_time: new Date(new Date().setHours(9, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(10, 0, 0)).toISOString(),
    dentist: 'Dr. Emily Smith',
    status: 'scheduled',
    source: 'Website Chatbot',
    notes: 'Standard checkup.',
    created_at: '2023-12-05T08:00:00Z',
  },
  {
    id: 'a2',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p2',
    patient_name: 'Michael Chen',
    title: 'Whitening Consult',
    start_time: new Date(new Date().setHours(11, 30, 0)).toISOString(),
    end_time: new Date(new Date().setHours(12, 0, 0)).toISOString(),
    dentist: 'Dr. Emily Smith',
    status: 'confirmed',
    source: 'Voice Agent',
    notes: 'Check for eligibility.',
    created_at: '2023-12-06T10:00:00Z',
  },
  {
    id: 'a3',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p3',
    patient_name: 'Emma Wilson',
    title: 'Emergency Filling',
    start_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    end_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    dentist: 'Dr. Alan Brown',
    status: 'scheduled',
    source: 'WhatsApp Chatbot',
    notes: 'Upper left molar.',
    created_at: '2023-12-07T15:00:00Z',
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p1',
    patient_name: 'Sarah Johnson',
    channel: 'Website Chatbot',
    contact_identifier: 'web_user_998',
    last_message: 'Thank you for scheduling my appointment!',
    updated_at: '2023-12-08T10:30:00Z',
  },
  {
    id: 'c2',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p3',
    patient_name: 'Emma Wilson',
    channel: 'WhatsApp Chatbot',
    contact_identifier: '+15550789',
    last_message: 'Is Dr. Alan available tomorrow?',
    updated_at: '2023-12-08T11:15:00Z',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    conversation_id: 'c1',
    sender: 'patient',
    message: 'Hello, I would like to book a cleaning.',
    timestamp: '2023-12-08T10:25:00Z',
  },
  {
    id: 'm2',
    conversation_id: 'c1',
    sender: 'AI',
    message: 'Sure! I have availability tomorrow at 9:00 AM. Would you like to book it?',
    timestamp: '2023-12-08T10:26:00Z',
  },
  {
    id: 'm3',
    conversation_id: 'c1',
    sender: 'patient',
    message: 'Yes, please.',
    timestamp: '2023-12-08T10:27:00Z',
  },
  {
    id: 'm4',
    conversation_id: 'c1',
    sender: 'AI',
    message: 'Done! Your appointment is scheduled for tomorrow at 9:00 AM with Dr. Emily Smith. Thank you for scheduling my appointment!',
    timestamp: '2023-12-08T10:28:00Z',
  },
];

export const MOCK_VOICE_CALLS: VoiceCall[] = [
  {
    id: 'v1',
    clinic_id: MOCK_CLINIC_ID,
    patient_id: 'p2',
    phone_number: '+1 555-0456',
    transcript: 'Michael: Hello. AI: Hi Michael, how can I help you? Michael: I want to know about teeth whitening prices. AI: Our whitening consultation is $50, which is deducted from the treatment if you proceed. Michael: Okay, book me for Wednesday.',
    summary: 'Patient inquired about whitening costs and booked a consultation.',
    duration: '1m 45s',
    intent: 'Booking',
    timestamp: '2023-12-07T14:30:00Z',
  },
];
