'use server';
/**
 * @fileOverview A Genkit flow for summarizing AI chatbot conversations.
 *
 * - summarizeAiChatConversation - A function that handles the summarization process.
 * - SummarizeAiChatConversationInput - The input type for the summarizeAiChatConversation function.
 * - SummarizeAiChatConversationOutput - The return type for the summarizeAiChatConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAiChatConversationInputSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.string().describe('The sender of the message (e.g., "patient", "AI").'),
      message: z.string().describe('The content of the message.'),
    })
  ).describe('The full conversation thread between the patient and the AI system.'),
});
export type SummarizeAiChatConversationInput = z.infer<typeof SummarizeAiChatConversationInputSchema>;

const SummarizeAiChatConversationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation thread.'),
});
export type SummarizeAiChatConversationOutput = z.infer<typeof SummarizeAiChatConversationOutputSchema>;

export async function summarizeAiChatConversation(input: SummarizeAiChatConversationInput): Promise<SummarizeAiChatConversationOutput> {
  return summarizeAiChatConversationFlow(input);
}

const summarizeAiChatConversationPrompt = ai.definePrompt({
  name: 'summarizeAiChatConversationPrompt',
  input: {schema: SummarizeAiChatConversationInputSchema},
  output: {schema: SummarizeAiChatConversationOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing conversation threads between a patient and an AI chatbot.
Your goal is to provide a concise summary that captures the main purpose of the conversation and any key outcomes or important information.
Focus on extracting critical details such as patient inquiries, AI responses, appointments made or discussed, and any resolutions or next steps.

Conversation Thread:
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
