'use server';
/**
 * @fileOverview Un flujo de Genkit para resumir conversaciones de chatbots de IA.
 *
 * - summarizeAiChatConversation - Una función que maneja el proceso de resumen.
 * - SummarizeAiChatConversationInput - El tipo de entrada para la función summarizeAiChatConversation.
 * - SummarizeAiChatConversationOutput - El tipo de retorno para la función summarizeAiChatConversation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAiChatConversationInputSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.string().describe('El remitente del mensaje (ej. "paciente", "IA").'),
      message: z.string().describe('El contenido del mensaje.'),
    })
  ).describe('El hilo completo de la conversación entre el paciente y el sistema de IA.'),
});
export type SummarizeAiChatConversationInput = z.infer<typeof SummarizeAiChatConversationInputSchema>;

const SummarizeAiChatConversationOutputSchema = z.object({
  summary: z.string().describe('Un resumen conciso del hilo de la conversación.'),
});
export type SummarizeAiChatConversationOutput = z.infer<typeof SummarizeAiChatConversationOutputSchema>;

export async function summarizeAiChatConversation(input: SummarizeAiChatConversationInput): Promise<SummarizeAiChatConversationOutput> {
  return summarizeAiChatConversationFlow(input);
}

const summarizeAiChatConversationPrompt = ai.definePrompt({
  name: 'summarizeAiChatConversationPrompt',
  input: {schema: SummarizeAiChatConversationInputSchema},
  output: {schema: SummarizeAiChatConversationOutputSchema},
  prompt: `Eres un asistente de IA encargado de resumir hilos de conversación entre un paciente y un chatbot de IA.
Tu objetivo es proporcionar un resumen conciso que capture el propósito principal de la conversación y cualquier resultado clave o información importante.
Concéntrate en extraer detalles críticos como consultas de pacientes, respuestas de la IA, citas programadas o discutidas, y cualquier resolución o paso siguiente.

Hilo de la Conversación:
{{#each messages}}
{{{sender}}}: {{{message}}}
{{/each}}`,
});

const summarizeAiChatConversationFlow = ai.defineFlow(
  {
    name: 'summarizeAiChatConversationFlow',
    inputSchema: SummarizeAiChatConversationInputSchema,
    outputSchema: SummarizeAiChatConversationOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeAiChatConversationPrompt(input);
    return output!;
  }
);
