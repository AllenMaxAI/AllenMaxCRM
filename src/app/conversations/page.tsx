"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, parseToDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, MoreVertical, MessageSquare, Phone, User, Trash2, Send, Bot, Download, RefreshCcw, Pencil, ExternalLink, Play, Pause, Volume2, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight, X, Headphones, Mail, MapPin } from "lucide-react"
import JSZip from "jszip"
import { Slider } from "@/components/ui/slider"
import { N8nChatWidget } from "@/components/chat/n8n-chat-widget"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useData } from "@/context/data-context"
import { useAuth } from "@/context/auth-context"
import { resolvePatientName, resolvePatientInitial, cleanSummary, findPatientByPhone, isGeneric } from "@/lib/patient-utils"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MOCK_VOICE_CALLS } from "@/lib/mock-data"
import { CallAudioPlayer } from "@/components/conversations/call-audio-player"

const CHANNEL_MAP: Record<string, string> = {
  "n8n Chatbot": "Chatbot web",
  "n8n chatbot": "Chatbot web",
  "chatbot web": "Chatbot web",
  "Chatbot Web": "Chatbot web",
  "Chatbot WhatsApp": "Chatbot WhatsApp",
  "Agente de voz": "Agente de voz",
  "Agente de voz": "Agente de voz",
  "Llamada VoIP": "Agente de voz",
  "voip": "Agente de voz",
  "Instagram": "Instagram",
}

const normalizeChannel = (channel: string): string =>
  CHANNEL_MAP[channel] ?? channel;

const formatPhone = (phone: string | undefined | null, showPlaceholder = false) => {
  if (!phone) return showPlaceholder ? "NÚMERO DESCONOCIDO" : "";
  
  // Si el "teléfono" es solo un número muy corto (como "7" u "8") o contiene letras (ID de sesión)
  // lo tratamos como desconocido para la visualización.
  const cleanedDigits = phone.trim().replace(/\D/g, "");
  if (cleanedDigits.length < 5 || /[a-zA-Z]/.test(phone)) {
    return showPlaceholder ? "NÚMERO DESCONOCIDO" : "";
  }

  let cleaned = phone.trim().replace(/\s+/g, "");
  // Specific fix for Spanish numbers starting with 62 misidentified as Indonesian (+62)
  if (cleaned.startsWith('+6262')) {
    // If we have +62 followed by 62..., Retell misidentified +34 6262... as +62 62...
    // The +62 prefix consumed the country code, so we change it to +34 and restore the 62.
    cleaned = '+3462' + cleaned.slice(3);
  } else if (cleaned.startsWith('+62') && cleaned.length === 10) {
    // Case like +62 6209988 -> +34 62 6209988
    cleaned = '+3462' + cleaned.slice(3);
  } else if (cleaned.startsWith('62') && cleaned.length === 11 && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('6262')) {
      cleaned = '+3462' + cleaned.slice(2);
    }
  }

  let prefix = "";
  
  // Specific handling for +34 (Spain) and others
  if (cleaned.startsWith('+34')) {
    prefix = "+34 ";
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('+')) {
    // For other countries, try to match 1-3 digits prefix
    const commonPrefixes = ['+1', '+52', '+44', '+33', '+49', '+351', '+54', '+57', '+56', '+62'];
    const foundPrefix = commonPrefixes.find(p => cleaned.startsWith(p));
    if (foundPrefix) {
      prefix = foundPrefix + " ";
      cleaned = cleaned.slice(foundPrefix.length);
    } else {
      // Fallback: match + and up to 2 digits if not 34
      const match = cleaned.match(/^(\+\d{1,2})/);
      if (match) {
        prefix = match[1] + " ";
        cleaned = cleaned.slice(match[1].length);
      }
    }
  } else if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    // If it's a 9-digit Spanish number without prefix, assume +34
    prefix = "+34 ";
  }
  
  const raw = cleaned.replace(/\D/g, "");
  let formatted = raw;
  
  if (raw.length === 9) {
    // Spanish standard: 600 00 00 00
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`;
  } else if (raw.length === 10) {
    formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  } else if (raw.length === 8) {
    formatted = `${raw.slice(0, 4)} ${raw.slice(4)}`;
  }
  
  return (prefix + formatted).trim();
};

const getIntentStyle = (intent: string) => {
  const normalized = (intent || "").toLowerCase();
  if (normalized.includes('cita') || normalized.includes('reserva')) {
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100/50 dark:border-emerald-500/20",
      container: "bg-emerald-50 dark:bg-emerald-500/10"
    };
  }
  if (normalized.includes('test') || normalized.includes('prueba')) {
    return {
      bg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100/50 dark:border-amber-500/20",
      container: "bg-amber-50 dark:bg-amber-500/10"
    };
  }
  if (normalized.includes('info') || normalized.includes('consult')) {
    return {
      bg: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100/50 dark:border-blue-500/20",
      container: "bg-blue-50 dark:bg-blue-500/10"
    };
  }
  if (normalized.includes('queja') || normalized.includes('reclama')) {
    return {
      bg: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-100/50 dark:border-red-500/20",
      container: "bg-red-50 dark:bg-red-500/10"
    };
  }
  return {
    bg: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-100/50 dark:border-slate-500/20",
    container: "bg-slate-50 dark:bg-slate-500/10"
  };
};


const fixPunctuation = (text: string) => {
  if (!text) return "";
  return text
    .replace(/,\./g, '.') // Corregir ,. -> .
    .replace(/\.,/g, '.') // Corregir ., -> .
    .replace(/\.{2,}/g, '.') // Corregir .. -> .
    .replace(/([\.?!,;])([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, '$1 $2') // Espacio tras puntuación
    .replace(/\s+/g, ' ') // Eliminar espacios múltiples
    .replace(/\s+([\.?!,;])/g, '$1') // Eliminar espacio antes de puntuación
    .trim();
};

const channelIcons: Record<string, React.ElementType> = {
  "Chatbot Web": Bot,
  "Chatbot WhatsApp": Phone,
  "Agente de voz": Phone,
}


let globalCachedConversations: any[] = [];
const globalMessageCache = new Map<string, any[]>();
let globalSelectedConv: any = null;

const formatDate = (date: any) => {
  const d = parseToDate(date);
  if (!d) return "---";

  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

export default function ConversationsPage() {
  const {
    patients,
    conversations: contextConversations,
    calls,
    addPatient,
    settings,
    updateConversation,
    trashConversation,
    restoreConversation,
    trashCall,
    restoreCall,
    updateCall,
    effectiveUid
  } = useData()
  const { user } = useAuth()

  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'chats' | 'llamadas'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('conversations_active_tab');
      return (saved === 'chats' || saved === 'llamadas') ? saved : 'chats';
    }
    return 'chats';
  })
  const [conversations, setConversations] = useState<any[]>(contextConversations)
  const [selectedConv, setSelectedConv] = useState<any>(globalSelectedConv)
  const [messages, setMessages] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterChannel, setFilterChannel] = useState<string>("Todos")
  const [isLoading, setIsLoading] = useState(globalCachedConversations.length === 0)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [isCallHistoryDialogOpen, setIsCallHistoryDialogOpen] = useState(false)
  const [formSource, setFormSource] = useState("Manual")
  const [playingCall, setPlayingCall] = useState<any>(null);

  // Call editing state
  const [isEditingCall, setIsEditingCall] = useState(false)
  const [editIntent, setEditIntent] = useState("")
  const [editSummary, setEditSummary] = useState("")


  // Smart Intent Override & Initialization
  useEffect(() => {
    if (calls.length > 0 && !selectedCall) {
      setSelectedCall(calls[0]);
    }
  }, [calls, selectedCall]);

  useEffect(() => {
    if (selectedCall) {
      setEditIntent(selectedCall.intent);
      setEditSummary(selectedCall.summary);

      // Smart Suggestion: If summary contains test/prueba and intent is CITA, suggest Testeo
      if (selectedCall.intent === "CITA" || selectedCall.intent === "Reserva") {
        const summary = selectedCall.summary.toLowerCase();
        if (summary.includes("test") || summary.includes("prueba")) {
          // We don't auto-save to avoid unexpected DB writes, 
          // but we could set a "suggestion" flag or just let the user edit it easily.
        }
      }
    }
  }, [selectedCall]);

  // Sincronizar selección global
  useEffect(() => {
    globalSelectedConv = selectedConv;
  }, [selectedConv]);


  const lastMessageCount = useRef(0)
  const isInitialLoad = useRef(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const scrollAnimRef = useRef<number | null>(null)
  const activeConvIdRef = useRef<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Controlar el foco y selección del nombre al abrir el modal
  useEffect(() => {
    if (isPatientModalOpen) {
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          const len = nameInputRef.current.value.length;
          nameInputRef.current.setSelectionRange(len, len);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPatientModalOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar conversaciones del contexto con el estado local para filtrado instantáneo
  useEffect(() => {
    if (contextConversations.length > 0) {
      setConversations(contextConversations);
      globalCachedConversations = contextConversations;

      if (selectedConv) {
        const updated = contextConversations.find((c: any) => c.id === selectedConv.id);
        if (updated) {
          if (updated.patient_name !== selectedConv.patient_name || updated.updated_at !== selectedConv.updated_at) {
            setSelectedConv(updated);
          }
        } else {
          setSelectedConv(null);
          setMessages([]);
        }
      }
    }
  }, [contextConversations, selectedConv]);

  // Prefetch mensajes (opcional para hover)
  const prefetchMessages = useCallback(async (id: string) => {
    if (globalMessageCache.has(id)) return; // ya en caché
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch(`/api/conversations/${id}/messages`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();
      globalMessageCache.set(id, data);
    } catch { }
  }, [user]);

  // Auto-guardado de perfiles (Solo si no son desconocidos)
  useEffect(() => {
    if (settings?.autoSaveProfile && conversations.length > 0) {
      conversations.forEach((conv: any) => {
        // --- FILTRO DE DESCONOCIDOS ---
        // No guardamos si el nombre es genérico o está vacío
        const isUnknown = !conv.patient_name ||
          ['Desconocido', 'Paciente Desconocido', 'Paciente', 'Nuevo Paciente'].includes(conv.patient_name);

        if (isUnknown) return; // Ignoramos esta conversación

        // --- FILTRO POR FECHA DE AUTOGUARDADO ---
        // Si el usuario eligió "A partir de ahora", ignoramos chats cuya última actualización sea anterior a la fecha elegida
        if (settings?.autoSaveFromDate && conv.updated_at) {
          const updateDate = parseToDate(conv.updated_at);
          const filterDate = parseToDate(settings.autoSaveFromDate);
          if (updateDate && filterDate && updateDate < filterDate) {
            return;
          }
        }

        // Asumimos que contact_identifier es el teléfono en WhatsApp/Voz
        const phone = conv.channel.includes('WhatsApp') || conv.channel.includes('Voz')
          ? conv.contact_identifier
          : '';

        // Verificamos si existe por nombre y/o teléfono
        const exists = patients.some(p =>
          p.name === conv.patient_name ||
          (phone && p.phone === phone)
        );

        if (!exists) {
          addPatient({
            name: conv.patient_name,
            phone: phone || conv.contact_identifier,
            email: '',
            first_contact_channel: conv.channel,
            notes: 'Paciente auto-guardado desde chat.',
            tags: ['AUTOGUARDADO']
          });
        } else if (settings?.autoUpdatePatientName) {
          // If patient exists by phone but has a generic name, or name is different and better
          const patientByPhone = patients.find(p => phone && p.phone === phone);
          if (patientByPhone && conv.patient_name && !isGeneric(conv.patient_name) && patientByPhone.name !== conv.patient_name) {
            // Only update if current DB name is generic or if we explicitly want to follow the latest name
            updatePatient(patientByPhone.id, { name: conv.patient_name });
          }
        }
      });
    }
  }, [conversations, settings?.autoSaveProfile, patients, addPatient]);

  useEffect(() => {
    if (!selectedConv || !effectiveUid) return;

    const prevConvId = activeConvIdRef.current;
    activeConvIdRef.current = selectedConv.id;

    if (prevConvId !== selectedConv.id) {
      lastMessageCount.current = 0;
      isInitialLoad.current = true;

      const cached = globalMessageCache.get(selectedConv.id);
      if (cached && cached.length > 0) {
        setMessages(cached);
        lastMessageCount.current = cached.length;
        isInitialLoad.current = false;
        setIsLoadingMessages(false);
      } else {
        setMessages([]);
        setIsLoadingMessages(true);
      }

      setTimeout(() => {
        const container = document.getElementById('message-container');
        if (container) container.scrollTop = 0;
      }, 100);
    }

    const q = query(
      collection(db, "users", effectiveUid!, "messages"),
      where("conversation_id", "==", selectedConv.id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          timestamp: (() => {
            const t = d.timestamp;
            if (!t) return new Date().toISOString();
            if (typeof t.toDate === 'function') return t.toDate().toISOString();
            if (t.seconds) return new Date(t.seconds * 1000).toISOString();
            if (typeof t === 'string') return t;
            return new Date(t).toISOString();
          })()
        };
      });

      globalMessageCache.set(selectedConv.id, data);

      if (data.length > lastMessageCount.current) {
        setMessages(data);
        const hadMessages = lastMessageCount.current > 0;
        lastMessageCount.current = data.length;

        if (!isInitialLoad.current && hadMessages) {
          setTimeout(() => {
            const container = document.getElementById('message-container');
            if (container) {
              container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
          }, 100);
        }
        isInitialLoad.current = false;
      } else {
        setMessages(data);
      }
      setIsLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages via snapshot:", error);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConv, effectiveUid]);

  // Smooth wheel scroll handler con acumulador de destino
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    let targetScroll = container.scrollTop;
    let animating = false;
    let isDraggingScrollbar = false;

    const animate = () => {
      if (isDraggingScrollbar) {
        animating = false;
        return;
      }
      const current = container.scrollTop;
      const distance = targetScroll - current;

      if (Math.abs(distance) < 1) {
        container.scrollTop = targetScroll;
        animating = false;
        return;
      }

      container.scrollTop = current + distance * 0.15;
      scrollAnimRef.current = requestAnimationFrame(animate);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (!animating) {
        targetScroll = container.scrollTop;
      }

      targetScroll = Math.max(
        0,
        Math.min(
          container.scrollHeight - container.clientHeight,
          targetScroll + e.deltaY * 1.3
        )
      );

      if (!animating) {
        animating = true;
        scrollAnimRef.current = requestAnimationFrame(animate);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      // Si el click es a la derecha del área de contenido → es la scrollbar
      if (e.clientX >= rect.left + container.clientWidth) {
        isDraggingScrollbar = true;
        if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
        animating = false;
        targetScroll = container.scrollTop;
      }
    };

    const handlePointerUp = () => {
      if (isDraggingScrollbar) {
        isDraggingScrollbar = false;
        targetScroll = container.scrollTop;
      }
    };

    const handlePointerMove = () => {
      if (isDraggingScrollbar) {
        targetScroll = container.scrollTop;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointermove', handlePointerMove);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointermove', handlePointerMove);
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [selectedConv]);

  const channels = useMemo(() => {
    const unique = Array.from(new Set(conversations.map(c => normalizeChannel(c.channel))))
    return ["Todos", ...unique]
  }, [conversations])

  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const cleanQuery = query.replace(/\D/g, "");

    return conversations.filter(conv => {
      const matchesName = conv.patient_name.toLowerCase().includes(query);

      // Búsqueda por teléfono: Limpiamos tanto el query como el campo de la DB para coincidencia exacta de dígitos
      const matchesPhone = conv.patient_phone && cleanQuery && conv.patient_phone.replace(/\D/g, "").includes(cleanQuery);
      const matchesId = conv.contact_identifier && cleanQuery && conv.contact_identifier.replace(/\D/g, "").includes(cleanQuery);

      const matchesSearch = matchesName || matchesPhone || matchesId;
      const matchesChannel = filterChannel === "Todos" || normalizeChannel(conv.channel) === filterChannel;
      return matchesSearch && matchesChannel;
    });
  }, [conversations, searchQuery, filterChannel]);

  const filteredCalls = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return (calls || []).filter(call =>
      call.phone_number?.toLowerCase().includes(query) ||
      call.summary?.toLowerCase().includes(query) ||
      call.intent?.toLowerCase().includes(query)
    );
  }, [calls, searchQuery]);

  const deleteConversationById = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the conversation when clicking delete
    try {
      const tId = await trashConversation(id);

      toast({
        title: "Conversación enviada a la papelera",
        description: "Estará disponible en la papelera durante 30 días.",
        variant: "destructive",
        action: (
          <ToastAction altText="Deshacer" onClick={() => restoreConversation(tId)}>
            Deshacer
          </ToastAction>
        ),
      });

      // Update local state immediately for instant feedback
      setConversations(prev => prev.filter(c => c.id !== id));

      if (selectedConv?.id === id) {
        setSelectedConv(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error al mover la conversación a la papelera:", error);
    }
  };

  const handleOpenAddPatientModal = () => {
    if (!selectedCall) return;
    setFormSource("Agente de voz");
    setIsPatientModalOpen(true);
  };

  const handleOpenAddPatientModalForChat = () => {
    if (!selectedConv) return;
    setFormSource("Chatbot");
    setIsPatientModalOpen(true);
  };

  const deleteSelectedConversation = async () => {
    if (!selectedConv) return;
    deleteConversationById({ stopPropagation: () => { } } as any, selectedConv.id);
  };

  const formatBotMessage = (text: string) => {
    if (!text) return "";

    // 1. Reemplazar tags de formularios por placeholders descriptivos
    let formatted = text;
    const formTags = [
      {
        tag: '[SHOW_BOOKING_FORM]',
        label: 'Se le muestra formulario de reserva al usuario...',
        prefix: ''  // el bot ya suele enviar texto antes de este
      },
      {
        tag: '[SHOW_PROFILE_FORM]',
        label: 'Se le muestra formulario de perfil al usuario...',
        prefix: ''
      },
      {
        tag: '[SHOW_MY_APPOINTMENTS]',
        label: 'Se le muestra el listado de citas al usuario...',
        prefix: 'Tus próximas citas:'
      },
      {
        tag: '[SHOW_APPOINTMENT_DETAILS]',
        label: 'Se le muestran detalles de la cita al usuario...',
        prefix: 'Detalles de tu cita:'
      }
    ];

    formTags.forEach(({ tag, label, prefix }) => {
      if (formatted.includes(tag)) {
        const trimmed = formatted.replace(tag, '').trim();
        // Si el mensaje no tiene texto adicional, añadimos el prefijo descriptivo
        const headerText = trimmed.length === 0 && prefix
          ? `<span class="font-bold block mb-2">${prefix}</span>`
          : '';
        formatted = formatted.replace(
          tag,
          `${headerText}<em class="opacity-50 text-[11px] block text-center border-y border-white dark:border-border/10 py-2 my-2">${label}</em>`
        );
      }
    });

    // 2. Eliminar enlaces de calendario de Google y texto relacionado
    formatted = formatted.replace(/\[.*?\]\(https:\/\/www\.google\.com\/calendar\/.*?\)/gi, '');
    formatted = formatted.replace(/Puedes añadirla a tu calendario\s*:?\s*\.?\s*/gi, '');

    // 3. Limpiar residuos: puntos colgados, comas o "Si deseas,"
    formatted = formatted.replace(/Si deseas,?\s*$/gi, '');
    formatted = formatted.replace(/Si deseas,\s*(?:puedes hacerlo|puedes modificarla)\s*\:?\s*$/gi, '');

    // 3.5 Corregir errores de puntuación específicos del bot
    formatted = formatted.replace(/que\.\s+huecos/gi, 'qué huecos');
    formatted = formatted.replace(/comprobar\s+que\./gi, 'comprobar qué');
    formatted = formatted.replace(/\s+([,\.!\?])/g, '$1'); // Quitar espacios antes de puntuación
    formatted = formatted.replace(/\.{2,}/g, '.'); // Evitar puntos dobles

    // 4. Limpiar puntos finales solitarios que quedan tras borrar tags o links
    formatted = formatted.trim().replace(/\s*\.\s*$/, '');

    // 5. Formatear mensajes de Modificación de Cita (Premium Design - Ultra Compact)
    if (formatted.includes('Modificar cita') || formatted.includes('ANTERIOR:') || formatted.includes('NUEVA:')) {
      // Eliminamos ABSOLUTAMENTE todos los saltos de línea
      formatted = formatted.replace(/\n/g, ' ');

      formatted = formatted
        .replace(/\{/g, '<span class="font-bold text-slate-700 dark:text-slate-100">')
        .replace(/\}/g, '</span>')
        .replace(/\|/g, '<br>')
        .replace(/Modificar cita -/g, '<div class="text-[12px] font-black uppercase tracking-tighter text-blue-600 mb-0.5 flex items-center gap-2"><div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div> Solicitud de Cambio</div>')
        .replace(/ANTERIOR:/g, '<div class="bg-slate-50/50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white dark:border-border/5 mb-1"><div class="text-[10px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Estado Previo</div><div class="text-[13px] space-y-1 text-slate-500 leading-normal">')
        .replace(/---/g, '</div></div>')
        .replace(/NUEVA:/g, '<div class="bg-blue-50/30 dark:bg-blue-500/5 rounded-xl p-3 border border-blue-100/50 dark:border-blue-500/10"><div class="text-[10px] font-black uppercase text-blue-500 mb-0.5 tracking-widest">Nueva Propuesta</div><div class="text-[13px] space-y-1 text-slate-700 dark:text-slate-200 leading-normal">');

      if (!formatted.endsWith('</div></div>')) {
        formatted += '</div></div>';
      }
    }

    // 6. Formatear mensajes de Agendar Cita (Varios formatos)
    const isBooking = formatted.includes('Agendar cita') || formatted.includes('Cita Agendada');
    
    if (isBooking) {
      // Intentar extraer datos con regex flexible (soporta con o sin emojis, negritas, etc)
      const patterns = [
        // Formato 1: Agendar cita para [Nombre] - Tel: [Tel]...
        /Agendar cita para (.*?) - Tel: (.*?) - Servicio: (.*?) - Fecha: (.*?) - Comentarios: (.*)/,
        // Formato 2: Emojis + Negritas
        /(?:📅|🗓️).*?Paciente:?\s*\*?\*?(.*?)\*?\*?.*?Doctor:?\s*\*?\*?(.*?)\*?\*?.*?Hora:?\s*\*?\*?(.*?)\*?\*?.*?Día:?\s*\*?\*?(.*?)\*?\*?$/s,
        // Formato 3: Solo datos básicos
        /Cita para (.*?) con el (.*?) el día (.*?) a las (.*?)(?:\.|$)/
      ];

      let extractedData = null;
      for (const p of patterns) {
        const m = formatted.match(p);
        if (m) {
          if (p.source.includes('Tel:')) {
            extractedData = { nombre: m[1], tel: m[2], servicio: m[3], fecha: m[4], comentarios: m[5] };
          } else if (p.source.includes('Paciente:')) {
            extractedData = { nombre: m[1], doctor: m[2], hora: m[3], dia: m[4] };
          } else {
            extractedData = { nombre: m[1], doctor: m[2], dia: m[3], hora: m[4] };
          }
          break;
        }
      }

      if (extractedData) {
        const { nombre, tel, servicio, fecha, comentarios, doctor, dia, hora } = extractedData;
        const displayFecha = fecha || (dia && hora ? `${dia} a las ${hora}` : dia || hora);
        const displaySub = servicio || (doctor ? `Dr/a. ${doctor}` : 'Consulta General');

        formatted = `
          <div class="text-[12px] font-black uppercase tracking-tighter text-emerald-600 mb-2 flex items-center gap-2"><div class="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></div> Nueva Cita Confirmada</div>
          <div class="bg-emerald-50/30 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-100/50 dark:border-emerald-500/10 space-y-3 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-0.5">Paciente</div>
                <div class="text-sm font-bold text-slate-900 dark:text-slate-50">${nombre}</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-0.5">Especialidad</div>
                <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg inline-flex items-center justify-center">${displaySub.trim()}</div>
              </div>
            </div>
            <div class="flex items-center gap-4 py-3 border-y border-emerald-100/30 dark:border-emerald-500/5">
              <div class="flex-1">
                <div class="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-0.5">Fecha y Horario</div>
                <div class="text-sm font-bold text-slate-900 dark:text-slate-50">${displayFecha}</div>
              </div>
              ${tel ? `<div><div class="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-0.5">Contacto</div><div class="text-sm font-bold text-slate-900 dark:text-slate-50">${tel}</div></div>` : ''}
            </div>
            ${comentarios && !['test', 'ninguno', 'n/a', ''].includes(comentarios.toLowerCase()) ? `
              <div class="bg-white/40 dark:bg-black/20 p-2.5 rounded-xl border border-emerald-100/20">
                <div class="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-1">Notas del paciente</div>
                <div class="text-sm text-slate-600 dark:text-slate-400 italic leading-snug font-medium">${comentarios}</div>
              </div>` : ''}
          </div>
        `.replace(/\n\s+/g, '');
      }
    }

    // 7. Convertir Markdown Negrita **texto** -> <strong>texto</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return formatted.trim();
  };

  const handleTrashCall = async (e: React.MouseEvent, callId: string) => {
    e.stopPropagation();
    try {
      const trashId = await trashCall(callId);
      if (selectedCall?.id === callId) setSelectedCall(null);

      toast({
        title: "Llamada enviada a la papelera",
        description: "El registro ha sido movido a la papelera.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await restoreCall(trashId);
              toast({ title: "Llamada restaurada" });
            }}
            className="h-7 rounded-lg bg-white/10 border-white/10 font-black text-[9px] uppercase tracking-widest"
          >
            Deshacer
          </Button>
        )
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo mover la llamada a la papelera.", variant: "destructive" });
    }
  };

  const formatMessagePreview = (text: string) => {
    if (!text) return '';
    let preview = text;

    // Reemplazar tags de formularios por texto legible
    preview = preview
      .replace(/\[SHOW_BOOKING_FORM\]/g, '📅 Formulario de reserva')
      .replace(/\[SHOW_PROFILE_FORM\]/g, '👤 Formulario de perfil')
      .replace(/\[SHOW_MY_APPOINTMENTS\]/g, '📋 Tus próximas citas')
      .replace(/\[SHOW_APPOINTMENT_DETAILS\]/g, '🔍 Detalles de la cita');

    // Si es mensaje de modificar cita, simplificar
    if (preview.includes('Modificar cita') || preview.includes('ANTERIOR:')) {
      return '✏️ Solicitud de cambio de cita';
    }

    // Limpiar Markdown
    preview = preview.replace(/\*\*(.*?)\*\*/g, '$1');
    // Limpiar saltos de línea
    preview = preview.replace(/\n/g, ' ').trim();

    return preview;
  };

  if (!mounted) return null

  return (
    <main className="flex-1 flex flex-col overflow-hidden px-12 py-10">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-slate-100 dark:border-border pb-6 mb-8 shrink-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">Conversaciones</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">Historial de interacciones y llamadas con pacientes</p>
        </motion.div>
        <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-[9px] bg-emerald-500/10 px-3 py-1.5 rounded-full">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En tiempo real
        </div>
      </div>

      {/* Panels — floating islands with gap */}
      <div className="flex flex-1 overflow-hidden gap-6">

        {/* ── Main Content Pane ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'chats' ? (
            /* ── CHAT VIEW ── */
            <div className="flex-1 flex flex-col bg-white dark:bg-background rounded-[32px] shadow-sm shadow-none border border-slate-100 dark:border-border overflow-hidden">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="h-20 bg-white dark:bg-background/80 backdrop-blur-md border-b border-slate-100 dark:border-border flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const resolvedName = resolvePatientName(selectedConv.patient_phone || selectedConv.contact_identifier, selectedConv.patient_name, "", patients, settings?.preferredDisplayName);
                        return (
                          <>
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-none">
                              {resolvePatientInitial(resolvedName)}
                            </div>
                            <div>
                              <h2 className="font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight leading-tight">
                                {resolvedName}
                              </h2>
                              <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">
                                {normalizeChannel(selectedConv.channel)}
                                {(selectedConv.patient_phone || selectedConv.contact_identifier) && (
                                  <span className="ml-1">• {formatPhone(selectedConv.patient_phone || selectedConv.contact_identifier, true)}</span>
                                )}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={deleteSelectedConversation}
                        className="h-10 rounded-xl border-red-100 hover:bg-red-50 text-red-500 font-bold text-xs gap-2 px-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {(() => {
                        const existingPatient = findPatientByPhone(selectedConv.patient_phone || selectedConv.contact_identifier, patients);

                        if (existingPatient) {
                          return (
                            <Button
                              onClick={() => {
                                // @ts-ignore
                                setSelectedPatient(existingPatient);
                                setIsInfoOpen(true);
                              }}
                              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs px-6 shadow-md shadow-none transition-all text-white border-none"
                            >
                              Perfil
                            </Button>
                          );
                        } else {
                          return (
                            <Button
                              onClick={handleOpenAddPatientModalForChat}
                              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs px-6 shadow-md shadow-none transition-all text-white border-none"
                            >
                              Guardar Paciente
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div id="message-container" className="flex-1 overflow-y-auto p-8 space-y-6 custom-blue-scrollbar min-h-0 bg-slate-50/30 dark:bg-accent/5">
                    {isLoadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <RefreshCcw className="h-8 w-8 text-blue-500 animate-spin opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Sincronizando historial...</p>
                      </div>
                    ) : !Array.isArray(messages) || messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40">
                        <MessageSquare className="h-12 w-12 text-slate-200 dark:text-slate-800" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                          No hay mensajes en esta conversacion<br />
                          <span className="opacity-60 font-bold lowercase tracking-normal">Los nuevos mensajes aparecerán aquí en tiempo real</span>
                        </p>
                      </div>
                    ) : (
                      messages.map((msg: any, index: number) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, delay: Math.max(0, (index - (messages.length - 5))) * 0.04 }}
                          className={cn(
                            "flex flex-col max-w-[65%]",
                            msg.sender === 'paciente' ? "mr-auto items-start" : "ml-auto items-end"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-3xl px-6 py-3.5 text-sm font-medium shadow-sm shadow-none leading-relaxed whitespace-pre-wrap",
                              msg.sender === 'paciente'
                                ? "bg-slate-50 dark:bg-accent/10 text-slate-700 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-border"
                                : "bg-blue-600 text-white rounded-tr-none shadow-none font-bold"
                            )}
                            dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.message) }}
                          />
                          <span className={cn(
                            "text-[9px] mt-2 font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5 px-1",
                            msg.sender === 'IA' && "text-blue-500"
                          )}>
                            {msg.sender === 'IA' && <Bot className="h-3 w-3" />}
                            {parseToDate(msg.timestamp)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                          </span>
                        </motion.div>
                      ))
                    )}
                    <div id="scroll-anchor" />
                  </div>

                  {/* Chat Input */}
                  <div className="p-6 bg-white dark:bg-background border-t border-slate-100 dark:border-border shrink-0">
                    <div className="relative max-w-4xl mx-auto">
                      <input
                        type="text"
                        placeholder="Escribe tu mensaje o deja que la IA responda..."
                        disabled
                        className="w-full bg-slate-50 dark:bg-accent/10 border border-slate-100 dark:border-border rounded-[24px] py-4 pl-6 pr-14 text-sm font-medium italic text-slate-400 focus:bg-white dark:bg-background transition-all shadow-inner"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-slate-200 rounded-full text-white cursor-not-allowed">
                        <Send className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Selecciona una conversación para visualizarla
                </div>
              )}
            </div>
          ) : (
            /* ── VOICE CALL VIEW ── */
            <div className="flex-1 flex flex-col bg-white dark:bg-background rounded-[32px] shadow-sm shadow-none border border-slate-100 dark:border-border overflow-hidden">
              {selectedCall ? (
                <>
                  {/* Header Equilibrado */}
                  <div className="h-20 bg-slate-900 border-b border-white/5 flex items-center justify-between px-8 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                    <div className="relative flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <Phone className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-black text-white uppercase tracking-tight leading-tight">
                            {resolvePatientName(selectedCall.phone_number, selectedCall.patient_name, selectedCall.patient_name_collected, patients, settings?.preferredDisplayName)}
                          </h2>
                        </div>
                        <p className="text-[9px] uppercase font-black text-white/40 tracking-widest mt-0.5">
                          Agente de voz • {formatPhone(selectedCall.phone_number, true)}
                        </p>
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mr-4">
                        {formatDate(selectedCall.timestamp)}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleTrashCall(e, selectedCall.id)}
                          className="h-10 w-10 rounded-xl border border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {(() => {
                          const p = findPatientByPhone(selectedCall.phone_number, patients);
                          if (p) {
                            return (
                              <Button
                                onClick={() => { setSelectedPatient(p); setIsInfoOpen(true); }}
                                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none font-bold text-xs px-6 shadow-lg shadow-blue-600/20 transition-all"
                              >
                                Perfil
                              </Button>
                            );
                          } else {
                            return (
                              <Button
                                onClick={handleOpenAddPatientModal}
                                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none font-bold text-xs px-6 shadow-lg shadow-blue-600/20 transition-all"
                              >
                                Guardar Paciente
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30 dark:bg-accent/5">
                    <div className="p-8 space-y-8 max-w-4xl mx-auto">

                      {/* Audio Player Card */}
                      {selectedCall.recording_url && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-2">
                            <div className="h-1 w-1 rounded-full bg-blue-600" />
                            <h4 className="text-[9px] uppercase font-black text-blue-600 tracking-[0.2em]">Grabación de la llamada</h4>
                          </div>
                          <CallAudioPlayer url={selectedCall.recording_url} />
                        </div>
                      )}

                      {/* AI Summary */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className="h-1 w-1 rounded-full bg-blue-600" />
                          <h4 className="text-[9px] uppercase font-black text-blue-600 tracking-[0.2em]">Resumen IA</h4>
                        </div>
                        <div className="bg-white dark:bg-background rounded-3xl p-6 border border-slate-100 dark:border-border shadow-sm shadow-none group/summary relative">
                          <p className="text-base font-medium leading-relaxed italic text-slate-800 dark:text-slate-200 tracking-tight pr-10">
                            "{cleanSummary(selectedCall.summary)}"
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditSummary(selectedCall.summary);
                              setEditIntent(selectedCall.intent);
                              setIsEditingCall(true);
                            }}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full transition-all bg-slate-50 dark:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600 transition-colors" />
                          </Button>
                        </div>
                      </div>


                      {/* Transcript */}
                      <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-4 px-2">
                          <h4 className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">Transcripción completa</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Paciente</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">IA Clínica</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(() => {
                            const lines = selectedCall.transcript.split('\n').filter((l: string) => l.trim().length > 0);
                            const groups: { role: string; isIA: boolean; content: string }[] = [];

                            lines.forEach((line: string) => {
                              const isIA = line.toLowerCase().startsWith('ia:') || line.toLowerCase().startsWith('agent:');
                              const cleanContent = line.replace(/^(IA:|Paciente:|Agent:|User:)\s*/gi, '').trim();
                              
                              if (groups.length > 0 && groups[groups.length - 1].isIA === isIA) {
                                const lastGroup = groups[groups.length - 1];
                                
                                // Evitar duplicados exactos consecutivos
                                if (lastGroup.content.includes(cleanContent)) return;

                                // Lógica de unión inteligente
                                const lastChar = lastGroup.content.trim().slice(-1);
                                const firstCharOfNew = cleanContent.trim().charAt(0);
                                const isNextLower = firstCharOfNew === firstCharOfNew.toLowerCase() && firstCharOfNew !== firstCharOfNew.toUpperCase();
                                
                                let separator = " ";
                                
                                // Si no termina en signo de puntuación fuerte
                                if (!/[.!?]/.test(lastChar)) {
                                  // Solo ponemos punto si NO es una continuación (si empieza por mayúscula)
                                  if (/[0-9a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(lastChar) && !isNextLower) {
                                    separator = ". ";
                                  }
                                }
                                
                                lastGroup.content += separator + cleanContent;
                              } else {
                                groups.push({
                                  role: isIA ? 'IA Clínica' : 'Paciente',
                                  isIA,
                                  content: cleanContent
                                });
                              }
                            });

                            return groups.map((group, i) => (
                              <div key={i} className={`flex flex-col ${group.isIA ? 'items-end' : 'items-start'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-1.5 ${group.isIA ? 'mr-4' : 'ml-4'}`}>
                                  {group.role}
                                </span>
                                <div className={`
                                  max-w-[85%] rounded-2xl px-5 py-3.5 text-[13px] leading-relaxed font-medium shadow-sm
                                  ${group.isIA
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-slate-100 dark:bg-muted text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-border/50'
                                  }
                                `}>
                                  {fixPunctuation(group.content)}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="px-8 py-6 border-t border-slate-100 dark:border-border bg-white dark:bg-background/80 backdrop-blur-sm flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Origen</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-50">Agente de voz</span>
                      </div>
                    </div>


                    <div className={cn(
                      "flex items-center gap-2 border rounded-xl px-4 py-2 transition-all group/intent relative",
                      getIntentStyle(selectedCall.intent).container,
                      getIntentStyle(selectedCall.intent).border
                    )}>
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", getIntentStyle(selectedCall.intent).text)}>Intención:</span>
                      <Badge className={cn("text-white border-none rounded-md font-black text-[8px] h-4 flex items-center px-2 uppercase tracking-widest", getIntentStyle(selectedCall.intent).bg)}>
                        {selectedCall.intent}
                      </Badge>
                      <button 
                        onClick={() => {
                          setEditSummary(selectedCall.summary);
                          setEditIntent(selectedCall.intent);
                          setIsEditingCall(true);
                        }}
                        className="transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600 transition-colors" />
                      </button>
                    </div>
                  </div>

                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  Selecciona una llamada para ver el detalle
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Interacciones Sidebar ── */}
        <div className="w-[380px] flex-shrink-0 bg-white dark:bg-background shadow-sm shadow-none border border-slate-100 dark:border-border flex flex-col rounded-[32px] overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-50 dark:border-border shrink-0">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50 mb-6">Interacciones</h1>

            {/* Tab Switcher */}
            <div className="flex gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl mb-6 border border-slate-100 dark:border-white/5 relative">
              <button
                onClick={() => {
                  setTab('chats');
                  localStorage.setItem('conversations_active_tab', 'chats');
                }}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10",
                  tab === 'chats' ? "text-slate-900 dark:text-slate-50" : "text-slate-400 hover:text-slate-500"
                )}
              >
                {tab === 'chats' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-muted rounded-xl shadow-sm border border-slate-100 dark:border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20">Chats</span>
              </button>
              <button
                onClick={() => {
                  setTab('llamadas');
                  localStorage.setItem('conversations_active_tab', 'llamadas');
                }}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10",
                  tab === 'llamadas' ? "text-slate-900 dark:text-slate-50" : "text-slate-400 hover:text-slate-500"
                )}
              >
                {tab === 'llamadas' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-muted rounded-xl shadow-sm border border-slate-100 dark:border-white/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20">Llamadas</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar pacientes..."
                className="w-full bg-slate-50 dark:bg-accent/20 border border-slate-100 dark:border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Channel filters (chats only) */}
          {tab === 'chats' && (
            <div className="px-6 py-3 border-b border-slate-50 dark:border-border bg-slate-50/50 dark:bg-accent/5 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex gap-2 w-max">
                {channels.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setFilterChannel(ch)}
                    className={cn(
                      "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all whitespace-nowrap",
                      filterChannel === ch
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-background border-slate-100 dark:border-border/50 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                    )}
                  >
                    {ch.replace('Chatbot ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative">
            <AnimatePresence mode="wait" initial={false}>
              {tab === 'chats' ? (
                <motion.div
                  key="chats-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full"
                >
                  {filteredConversations.map((conv: any, idx) => {
                    const Icon = channelIcons[normalizeChannel(conv.channel)] || MessageSquare
                    return (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedConv(conv)}
                        onMouseEnter={() => prefetchMessages(conv.id)}
                        className={cn(
                          "p-6 border-b border-slate-50 dark:border-border hover:bg-slate-50 dark:hover:bg-accent cursor-pointer transition-all relative group",
                          selectedConv?.id === conv.id ? "bg-slate-50 dark:bg-muted border-r-4 border-r-blue-600" : "dark:bg-accent/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 dark:text-slate-50">
                            {resolvePatientName(conv.patient_phone || conv.contact_identifier, conv.patient_name, "", patients, 'conversation', settings)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {formatDate(conv.updated_at)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 line-clamp-1 mb-3">{formatMessagePreview(conv.last_message)}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <div className="p-1 bg-white dark:bg-background rounded-lg border border-slate-100 dark:border-border shadow-sm shadow-none">
                              {Icon && <Icon className="h-2.5 w-2.5 text-blue-600" />}
                            </div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">{normalizeChannel(conv.channel)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const p = findPatientByPhone(conv.patient_phone || conv.contact_identifier, patients);
                                if (p) {
                                  setSelectedPatient(p);
                                  setIsInfoOpen(true);
                                } else {
                                  toast({
                                    title: "Paciente no registrado",
                                    description: "Guarda este contacto para ver su perfil.",
                                  });
                                }
                              }}
                              className="h-8 w-8 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <User className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => deleteConversationById(e, conv.id)}
                              className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="calls-panel"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full"
                >
                  <div className="flex flex-col divide-y divide-slate-50 dark:divide-border/50">
                    {filteredCalls.map((call, idx) => (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedCall(call)}
                        className={cn(
                          "p-6 hover:bg-slate-50 dark:hover:bg-accent cursor-pointer transition-all relative group",
                          selectedCall?.id === call.id ? "bg-slate-50 dark:bg-muted border-r-4 border-r-blue-600" : "dark:bg-accent/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 dark:text-slate-50">
                            {resolvePatientName(call.phone_number, call.patient_name, call.patient_name_collected, patients, 'conversation', settings)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">
                            {formatDate(call.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className={cn("h-1.5 w-1.5 rounded-full", getIntentStyle(call.intent).bg)} />
                           <span className={cn("text-[8px] font-black uppercase tracking-widest", getIntentStyle(call.intent).text)}>{call.intent}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 line-clamp-1 mb-3 italic">"{cleanSummary(call.summary)}"</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <div className="p-1 bg-white dark:bg-background rounded-lg border border-slate-100 dark:border-border shadow-sm shadow-none">
                              <Phone className="h-2.5 w-2.5 text-blue-600" />
                            </div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Agente de voz</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingCall(call);
                              }}
                              className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <Headphones className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCall(call);
                                setEditSummary(call.summary);
                                setEditIntent(call.intent);
                                setIsEditingCall(true);
                              }}
                              className="h-8 w-8 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const p = findPatientByPhone(call.phone_number, patients);
                                if (p) {
                                  setSelectedPatient(p);
                                  setIsInfoOpen(true);
                                } else {
                                  toast({ title: "Paciente no registrado", description: "Guarda este contacto para ver su perfil." });
                                }
                              }}
                              className="h-8 w-8 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <User className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleTrashCall(e, call.id)}
                              className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredCalls.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-accent/10 flex items-center justify-center mb-4">
                          <Phone className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {searchQuery ? "No hay llamadas que coincidan" : "No hay llamadas registradas"}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Modal para Guardar Paciente Manualmente */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent
          key={selectedConv?.id || selectedCall?.id || 'new-patient'}
          className="sm:max-w-[425px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">Guardar Paciente</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400">
              Verifica y modifica los datos antes de agregar al contacto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const patientId = await addPatient({
              name: formData.get('name') as string,
              phone: `${formData.get('countryCode')}${formData.get('phone')}`,
              email: (formData.get('email') as string) || "",
              first_contact_channel: selectedConv?.channel || (selectedCall ? 'Agente de voz' : 'Manual'),
              status: "Lead",
              tags: [],
              origin: formSource || "Manual",
              notes: ""
            });

            if (selectedConv && patientId) {
              await updateConversation(selectedConv.id, {
                patient_id: patientId,
                patient_name: formData.get('name') as string
              });

              // Actualizar estado local
              setSelectedConv((prev: any) => ({
                ...prev,
                patient_id: patientId,
                patient_name: formData.get('name') as string
              }));
            }

            if (selectedCall && patientId) {
              await updateCall(selectedCall.id, {
                patient_id: patientId
              });

              // Actualizar estado local
              setSelectedCall((prev: any) => ({
                ...prev,
                patient_id: patientId
              }));
            }

            setIsPatientModalOpen(false);
            toast({
              title: "Paciente guardado",
              description: "El perfil ha sido creado y vinculado exitosamente.",
            });
          }}>
            <div className="grid gap-6 py-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                <Input
                  ref={nameInputRef}
                  id="name"
                  name="name"
                  defaultValue={
                    (selectedConv?.patient_name &&
                      !['Desconocido', 'Paciente Desconocido', 'Paciente', 'Nuevo Paciente'].includes(selectedConv.patient_name))
                      ? selectedConv.patient_name
                      : (selectedCall?.patient_name_collected || '')
                  }
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</Label>
                <div className="flex gap-2">
                  <Select name="countryCode" defaultValue="+34">
                    <SelectTrigger className="w-[110px] h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold text-slate-700 dark:text-slate-200">
                      <SelectValue placeholder="+34" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-background border-slate-100 dark:border-border rounded-2xl">
                      {[
                        { code: '+34', iso: 'es' },
                        { code: '+1', iso: 'us' },
                        { code: '+52', iso: 'mx' },
                        { code: '+44', iso: 'gb' },
                        { code: '+33', iso: 'fr' },
                        { code: '+49', iso: 'de' },
                        { code: '+351', iso: 'pt' },
                        { code: '+54', iso: 'ar' },
                        { code: '+57', iso: 'co' },
                        { code: '+56', iso: 'cl' }
                      ].map((p) => (
                        <SelectItem key={p.code} value={p.code}>
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://flagcdn.com/w20/${p.iso}.png`}
                              srcSet={`https://flagcdn.com/w40/${p.iso}.png 2x`}
                              width="20"
                              alt={p.iso}
                              className="rounded-sm"
                            />
                            <span>{p.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Número del paciente"
                    defaultValue={
                      formatPhone(
                        (selectedConv?.patient_phone && !["No proporcionado", "unknown"].includes(selectedConv.patient_phone))
                          ? selectedConv.patient_phone.replace(/^\+(34|1|52|44|33|49|351|54|57|56|62)\s?/, '')
                          : (selectedCall?.phone_number
                            ? selectedCall.phone_number.replace(/^\+(34|1|52|44|33|49|351|54|57|56|62)\s?/, '')
                            : (selectedConv?.contact_identifier &&
                              !/[a-zA-Z]/.test(selectedConv.contact_identifier) &&
                              selectedConv.contact_identifier.replace(/\D/g, '').length >= 7 &&
                              !["No proporcionado", "unknown", "Sin teléfono"].includes(selectedConv.contact_identifier)
                              ? selectedConv.contact_identifier.replace(/^\+(34|1|52|44|33|49|351|54|57|56|62)/, '').replace(/\D/g, '')
                              : ''))
                      )
                    }
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                    }}
                    className="flex-1 h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="Ej: correo@ejemplo.com"
                  className="h-12 rounded-2xl bg-slate-50 dark:bg-accent/10 border-slate-100 dark:border-border font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-white uppercase tracking-widest text-[10px] shadow-lg shadow-none transition-all">
                Guardar Paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient Info Modal */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-8 bg-white dark:bg-background">
          <DialogTitle className="sr-only">Añadir Paciente</DialogTitle>
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Información del paciente</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-accent/10 rounded-3xl border border-slate-100 dark:border-border">
                <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">
                  {resolvePatientInitial(selectedPatient.name)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 uppercase tracking-tight">{selectedPatient.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedPatient.id.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-4 px-1">
                {(() => {
                  const cleanPatientPhone = selectedPatient.phone?.replace(/\D/g, '') || "";
                  const patientCalls = calls
                    .filter(c => {
                      if (selectedPatient && c.patient_id === selectedPatient.id) return true;
                      const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                      return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                    })
                    .sort((a, b) => (parseToDate(b.timestamp)?.getTime() || 0) - (parseToDate(a.timestamp)?.getTime() || 0));

                  if (patientCalls.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      <CallAudioPlayer url={patientCalls[0].recording_url} />

                      {patientCalls.length > 1 && (
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCallHistoryDialogOpen(true)}
                            className="w-full h-10 rounded-xl bg-slate-50 dark:bg-accent/5 hover:bg-slate-100 dark:hover:bg-accent/10 text-slate-500 hover:text-blue-600 border border-slate-100 dark:border-white/5 transition-all flex items-center justify-center gap-2 group"
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Ver historial de llamadas ({patientCalls.length})
                            </span>
                            <RefreshCcw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Mail className="h-4 w-4 text-slate-400" /></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {selectedPatient.email && selectedPatient.email !== "test@test.com" ? selectedPatient.email : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><Phone className="h-4 w-4 text-slate-400" /></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {selectedPatient.phone && selectedPatient.phone.replace(/\D/g, '').length > 3 ? formatPhone(selectedPatient.phone, true) : "NÚMERO DESCONOCIDO"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-accent/10 rounded-xl"><MapPin className="h-4 w-4 text-slate-400" /></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Origen: {normalizeChannel(selectedPatient.first_contact_channel)}</span>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] uppercase font-black text-slate-400 mb-3 ml-1 tracking-widest">Etiquetas</p>
                  <div className="flex gap-2 flex-wrap">
                    {(selectedPatient.tags || []).length > 0 ? (
                      (selectedPatient.tags || []).map((tag: string) => {
                        return (
                          <Badge
                            key={tag}
                            className="font-black border-none px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider bg-blue-50 dark:bg-accent/50 text-blue-600"
                          >
                            {tag}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-none"
                  onClick={() => setIsInfoOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call History Dialog */}
      <Dialog open={isCallHistoryDialogOpen} onOpenChange={setIsCallHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-8 bg-slate-50 dark:bg-[#0B0F1A] max-h-[80vh] flex flex-col">
          <DialogTitle className="sr-only">Historial de Llamadas</DialogTitle>
          <DialogHeader className="mb-6 shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded-xl">
                <RefreshCcw className="h-5 w-5 text-blue-600" />
              </div>
              Historial de llamadas
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex justify-between items-center w-full">
              <span>Todas las grabaciones de {selectedPatient?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const cleanPatientPhone = selectedPatient?.phone?.replace(/\D/g, '') || "";
                  const patientCalls = calls.filter(c => {
                    if (selectedPatient && c.patient_id === selectedPatient.id) return true;
                    const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                    return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                  });
                  
                  if (patientCalls.length === 0) return;

                  const zip = new JSZip();
                  const folder = zip.folder(`llamadas_${selectedPatient?.name?.replace(/\s+/g, '_')}`);
                  
                  toast({
                    title: "Preparando descarga",
                    description: `Procesando ${patientCalls.length} grabaciones...`,
                  });

                  try {
                    const downloadPromises = patientCalls.map(async (c, i) => {
                      try {
                        const response = await fetch(c.recording_url);
                        if (!response.ok) throw new Error("Failed to fetch");
                        const blob = await response.blob();
                        const date = parseToDate(c.timestamp)?.toISOString().split('T')[0] || 'fecha_desconocida';
                        folder?.file(`${date}_llamada_${patientCalls.length - i}.mp3`, blob);
                      } catch (err) {
                        console.error(`Error downloading call ${c.id}:`, err);
                      }
                    });

                    await Promise.all(downloadPromises);
                    const content = await zip.generateAsync({ type: "blob" });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `historial_llamadas_${selectedPatient?.name?.replace(/\s+/g, '_')}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast({
                      title: "Descarga completada",
                      description: "El archivo ZIP se ha generado correctamente.",
                    });
                  } catch (error) {
                    console.error("Error generating ZIP:", error);
                    toast({
                      title: "Error en la descarga",
                      description: "No se pudieron procesar algunos archivos.",
                      variant: "destructive"
                    });
                  }
                }}
                className="h-7 px-3 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Descargar todo
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-4">
            {(() => {
              const cleanPatientPhone = selectedPatient?.phone?.replace(/\D/g, '') || "";
              const patientCallsRaw = calls
                .filter(c => {
                  if (selectedPatient && c.patient_id === selectedPatient.id) return true;
                  const cleanCallPhone = c.phone_number?.replace(/\D/g, '') || "";
                  return cleanCallPhone && cleanPatientPhone && (cleanCallPhone.endsWith(cleanPatientPhone) || cleanPatientPhone.endsWith(cleanCallPhone));
                })
                .sort((a, b) => (parseToDate(b.timestamp)?.getTime() || 0) - (parseToDate(a.timestamp)?.getTime() || 0));

              const patientCalls = patientCallsRaw;

              return patientCalls.map((call, idx) => (
                <div key={call.id} className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 space-y-4 group hover:border-blue-600/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                        {idx === 0 ? "Última llamada" : `Llamada #${patientCalls.length - idx}`}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {parseToDate(call.timestamp)?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || '---'}
                      </span>
                    </div>
                    {(() => {
                      const d = Number(call.duration);
                      if (!d || isNaN(d)) return null;
                      const mins = Math.floor(d / 60);
                      const secs = Math.floor(d % 60);
                      return (
                        <div className="text-[10px] font-black text-slate-400 tabular-nums bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                          {mins}:{secs.toString().padStart(2, '0')}
                        </div>
                      );
                    })()}
                  </div>

                  <CallAudioPlayer url={call.recording_url} />
                </div>
              ));
            })()}
          </div>

          <DialogFooter className="mt-6 shrink-0">
            <Button
              className="w-full bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-none border-none"
              onClick={() => setIsCallHistoryDialogOpen(false)}
            >
              Cerrar Historial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── PLAY CALL DIALOG ── */}
      <Dialog open={!!playingCall} onOpenChange={(open) => !open && setPlayingCall(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 rounded-[32px] overflow-hidden border-none bg-transparent">
          <DialogTitle className="sr-only">Grabación de Llamada</DialogTitle>
          <DialogHeader className="sr-only">
            <DialogTitle>Reproductor de Llamada</DialogTitle>
          </DialogHeader>
          <div className="bg-white dark:bg-background rounded-[32px] overflow-hidden border border-slate-100 dark:border-border/50">
            {/* Header decorativo */}
            <div className="h-32 bg-slate-900 relative overflow-hidden flex items-center px-8">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[60px] rounded-full -mr-24 -mt-24" />
              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <Headphones className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">Reproducir Llamada</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                    {playingCall && resolvePatientName(playingCall.phone_number, playingCall.patient_name, playingCall.patient_name_collected, patients, 'conversation', settings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {playingCall?.recording_url ? (
                <>
                  <div className="bg-slate-50 dark:bg-accent/5 rounded-2xl p-4 border border-slate-100 dark:border-border/50">
                    <CallAudioPlayer url={playingCall.recording_url} />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-blue-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Resumen de la IA</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{cleanSummary(playingCall.summary)}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Duración</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-50">{playingCall.duration}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Fecha</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-50">{formatDate(playingCall.timestamp)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="h-12 w-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay grabación disponible para esta llamada</p>
                </div>
              )}

              <Button
                onClick={() => setPlayingCall(null)}
                className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity"
              >
                Cerrar Reproductor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── EDIT CALL DIALOG ── */}
      <Dialog open={isEditingCall} onOpenChange={setIsEditingCall}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-slate-100 dark:border-border bg-white dark:bg-background">
          <DialogTitle className="sr-only">Editar Resumen e Intención</DialogTitle>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">Corregir Llamada</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400">
              Modifica la intención o el resumen si la IA cometió un error.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intención de la llamada</Label>
              <Select value={editIntent} onValueChange={setEditIntent}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-100 dark:border-border bg-slate-50/50 dark:bg-accent/10 font-bold text-xs">
                  <SelectValue placeholder="Selecciona la intención" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 dark:border-border">
                  <SelectItem value="Cita" className="rounded-xl font-bold text-xs">Cita / Reserva</SelectItem>
                  <SelectItem value="Consulta" className="rounded-xl font-bold text-xs">Consulta / Información</SelectItem>
                  <SelectItem value="Testeo" className="rounded-xl font-bold text-xs">Prueba / Testeo</SelectItem>
                  <SelectItem value="Queja" className="rounded-xl font-bold text-xs">Queja / Reclamación</SelectItem>
                  <SelectItem value="Otros" className="rounded-xl font-bold text-xs">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resumen de la IA</Label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border-slate-100 dark:border-border bg-slate-50/50 dark:bg-accent/10 font-medium text-sm p-4 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                placeholder="Escribe el resumen correcto..."
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditingCall(false)}
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (selectedCall) {
                  await updateCall(selectedCall.id, {
                    intent: editIntent,
                    summary: editSummary
                  });
                  // Actualizar estado local para feedback inmediato
                  setSelectedCall((prev: any) => ({
                    ...prev,
                    intent: editIntent,
                    summary: editSummary
                  }));
                  setIsEditingCall(false);
                  toast({
                    title: "Llamada actualizada",
                    description: "Los datos se han guardado correctamente.",
                  });
                }
              }}
              className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] border-none shadow-lg shadow-blue-600/20 transition-all"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
