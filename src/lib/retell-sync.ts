function formatHour(hour: number): string {
  if (hour === 0) return "12 de la noche";
  if (hour < 12) return `${hour} de la mañana`;
  if (hour === 12) return "12 del mediodía";
  return `${hour - 12} de la tarde`;
}

export async function syncRetellSettings(data: { 
  openingHour: number, 
  closingHour: number, 
  allowBookingAtClosingHour?: boolean,
  appointmentInterval?: number,
  categories: { name: string, color: string }[] 
}) {
  const apiKey = process.env.RETELL_API_KEY;
  const llmId = process.env.RETELL_LLM_ID;

  if (!apiKey || !llmId) {
    throw new Error("Faltan credenciales de Retell en .env");
  }

  // 1. Obtener el LLM actual
  const getResponse = await fetch(`https://api.retellai.com/get-retell-llm/${llmId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!getResponse.ok) {
    throw new Error(`Error al obtener LLM de Retell: ${getResponse.statusText}`);
  }

  const llm = await getResponse.json();
  let currentPrompt = llm.general_prompt || "";

  // 2. Generar nuevos bloques
  const lastAppointmentHour = data.allowBookingAtClosingHour ? data.closingHour : (data.closingHour - 1);
  const horarioText = `## HORARIO\n- Horario de apertura: de ${formatHour(data.openingHour)} a ${formatHour(data.closingHour)}.\n- La última hora en la que se puede agendar una cita es a las ${formatHour(lastAppointmentHour)}.\n- Fines de semana: Cerrado.\n- IMPORTANTE: No digas nunca "nueve cero cero" o "dieciocho cero cero". Di siempre "${formatHour(data.openingHour)}" y "${formatHour(data.closingHour)}".`;
  
  let intervalText = "";
  const interval = data.appointmentInterval || 60;
  if (interval === 60) {
    intervalText = `- CITAS: Solo en punto (ej. 10:00). Prohibido ofrecer minutos :15, :30 o :45.`;
  } else if (interval === 30) {
    intervalText = `- CITAS: Cada 30 minutos (ej. 10:00, 10:30). Prohibido ofrecer minutos :15 o :45.`;
  } else if (interval === 15) {
    intervalText = `- CITAS: Cada 15 minutos (ej. 10:00, 10:15, 10:30, 10:45).`;
  } else {
    intervalText = `- CITAS: El intervalo es de ${interval} minutos. Empieza a las ${data.openingHour}:00 y suma ${interval} min sucesivamente (ej. si es 45 min: 9:00, 9:45, 10:30, 11:15...).`;
  }

  const rulesText = `## REGLAS DE CITAS\n${intervalText}`;
  


  // 3. Reemplazar secciones usando Regex
  // Limpiamos cualquier rastro de ## SISTEMA o versiones antiguas de ## REGLAS / ## COMPORTAMIENTO
  let updatedPrompt = currentPrompt
    .replace(/## (FECHA Y )?HORARIO[\s\S]*?(?=\n##|$)/gi, "")
    .replace(/## REGLAS DE CITAS[\s\S]*?(?=\n##|$)/g, "")
    .replace(/- CITAS:.*$/gm, "") // Borramos cualquier regla de citas suelta
    .trim();

  // Añadimos las secciones actualizadas al final
  updatedPrompt += `\n\n${horarioText}`;
  updatedPrompt += `\n\n${rulesText}`;

  // 4. Actualizar el LLM en Retell
  const updateResponse = await fetch(`https://api.retellai.com/update-retell-llm/${llmId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      general_prompt: updatedPrompt,
    }),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json();
    throw new Error(`Error al actualizar Retell: ${JSON.stringify(errorData)}`);
  }

  return await updateResponse.json();
}
