'use server';

/**
 * @fileOverview Suggests related topics or keywords based on an initial keyword using AI.
 *
 * - suggestRelatedTopics - A function that suggests related topics.
 * - SuggestRelatedTopicsInput - The input type for the suggestRelatedTopics function.
 * - SuggestRelatedTopicsOutput - The return type for the suggestRelatedTopics function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestRelatedTopicsInputSchema = z.object({
  keyword: z.string().describe('The initial keyword to find related topics for.'),
});
export type SuggestRelatedTopicsInput = z.infer<typeof SuggestRelatedTopicsInputSchema>;

const SuggestRelatedTopicsOutputSchema = z.object({
  relatedTopics: z
    .array(z.string())
    .describe('An array of related topics or keywords suggested by the AI.'),
});
export type SuggestRelatedTopicsOutput = z.infer<typeof SuggestRelatedTopicsOutputSchema>;

export async function suggestRelatedTopics(input: SuggestRelatedTopicsInput): Promise<SuggestRelatedTopicsOutput> {
  return suggestRelatedTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedTopicsPrompt',
  input: {
    schema: z.object({
      keyword: z.string().describe('The initial keyword to find related topics for.'),
    }),
  },
  output: {
    schema: z.object({
      relatedTopics: z
        .array(z.string())
        .describe('An array of related topics or keywords suggested by the AI.'),
    }),
  },
  prompt: `You are a topic suggestion expert. Given a keyword, you will suggest related topics or keywords that users might also be interested in muting.\n\nKeyword: {{{keyword}}}\n\nRelated Topics:`,
});

const suggestRelatedTopicsFlow = ai.defineFlow<
  typeof SuggestRelatedTopicsInputSchema,
  typeof SuggestRelatedTopicsOutputSchema
>({
  name: 'suggestRelatedTopicsFlow',
  inputSchema: SuggestRelatedTopicsInputSchema,
  outputSchema: SuggestRelatedTopicsOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
