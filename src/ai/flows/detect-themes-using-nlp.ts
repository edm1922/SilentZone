'use server';

/**
 * @fileOverview An AI agent that detects related themes beyond just keywords using NLP.
 *
 * - detectThemes - A function that handles the theme detection process.
 * - DetectThemesInput - The input type for the detectThemes function.
 * - DetectThemesOutput - The return type for the detectThemes function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DetectThemesInputSchema = z.object({
  content: z.string().describe('The content to analyze for theme detection.'),
});
export type DetectThemesInput = z.infer<typeof DetectThemesInputSchema>;

const DetectThemesOutputSchema = z.object({
  themes: z.array(z.string()).describe('The detected themes in the content.'),
});
export type DetectThemesOutput = z.infer<typeof DetectThemesOutputSchema>;

export async function detectThemes(input: DetectThemesInput): Promise<DetectThemesOutput> {
  return detectThemesFlow(input);
}

const detectThemesPrompt = ai.definePrompt({
  name: 'detectThemesPrompt',
  input: {
    schema: z.object({
      content: z.string().describe('The content to analyze for theme detection.'),
    }),
  },
  output: {
    schema: z.object({
      themes: z.array(z.string()).describe('The detected themes in the content.'),
    }),
  },
  prompt: `You are an AI expert in natural language processing. Your task is to analyze the given content and identify related themes beyond just keywords.

Content: {{{content}}}

Based on the content, identify the main themes. Return a list of themes.
`,
});

const detectThemesFlow = ai.defineFlow<
  typeof DetectThemesInputSchema,
  typeof DetectThemesOutputSchema
>(
  {
    name: 'detectThemesFlow',
    inputSchema: DetectThemesInputSchema,
    outputSchema: DetectThemesOutputSchema,
  },
  async input => {
    const {output} = await detectThemesPrompt(input);
    return output!;
  }
);
