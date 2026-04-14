# **App Name**: DentalFlow CRM

## Core Features:

- User Authentication & Roles: Secure user login and management using Firebase Authentication, supporting Admin, Dentist, and Receptionist roles with segregated access to clinic data.
- Multi-Clinic Data Isolation: Ensures that data for each dental clinic (patients, appointments, conversations) is entirely isolated and accessible only to its authorized users via Firestore.
- Patient Management: Create, view, edit, and search patient profiles including personal info, contact details, and notes, all stored in Firestore.
- Appointment Scheduling & Calendar: Intuitive calendar interface (day, week, month views) to schedule, confirm, reschedule, or cancel patient appointments, with full details and status updates stored in Firestore.
- AI Conversation Ingestion API: Firebase Cloud Functions serving as API endpoints and webhooks to receive real-time conversation data (messages, call transcripts) from various external AI chatbot and voice agent tools into Firestore.
- Unified Conversation History: Display a comprehensive log of all patient-AI interactions across multiple channels (WhatsApp, Instagram, Website chatbot, Voice agent), with threaded messages and call transcripts stored in Firestore.
- Clinic Dashboard: An at-a-glance dashboard showing key operational metrics such as today's and upcoming appointments, recent AI conversations, total patients, and daily message counts from Firestore data.

## Style Guidelines:

- Color scheme: Light. Primary color: A muted yet professional blue (#3986AC) symbolizing trust and professionalism in healthcare. Background color: A very light, almost white, cool-toned gray-blue (#F0F3F5) providing a clean canvas. Accent color: A vibrant but clear aqua (#17CFB0) to highlight important actions and interactive elements, bringing a sense of freshness and calm.
- Font: 'Inter' (sans-serif) for both headlines and body text. Chosen for its modern, clean, and objective aesthetic, ensuring high readability across all modules of the CRM, which is crucial for detailed clinical information.
- Use a set of consistent, line-art style icons. Icons should be clear and minimalist to ensure quick recognition and maintain a professional, uncluttered appearance within the administrative interface. Examples: Calendar icon for appointments, Speech bubble for conversations, Person icon for patients.
- A clean, two-column layout with a fixed left-hand sidebar for primary navigation (Dashboard, Calendar, Conversations, Patients, Integrations, Settings) and a spacious main content area. Data tables and calendar views will be optimized for readability and efficient information display. Ample white space will be utilized to prevent visual fatigue for clinic staff.
- Subtle and functional animations to provide feedback and guide the user's attention. Examples include smooth transitions when opening appointment detail panels, fading in/out for alerts, and gentle highlighting on interactive elements upon hover or focus. Animations will be understated to maintain a professional and efficient user experience.