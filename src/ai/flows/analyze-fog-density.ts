'use server';

/**
 * @fileOverview Analyzes the fog density in an image.
 *
 * - analyzeFogDensity - A function that analyzes the fog density in an uploaded image.
 * - AnalyzeFogDensityInput - The input type for the analyzeFogDensity function.
 * - AnalyzeFogDensityOutput - The return type for the analyzeFogDensity function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeFogDensityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFogDensityInput = z.infer<typeof AnalyzeFogDensityInputSchema>;

const AnalyzeFogDensityOutputSchema = z.object({
  fogDensityScore: z
    .number()
    .describe('A score from 0 to 1 indicating the fog density in the image. 0 means no fog, 1 means very dense fog.'),
  fogDensityDescription: z.string().describe('A textual description of the fog density.'),
});
export type AnalyzeFogDensityOutput = z.infer<typeof AnalyzeFogDensityOutputSchema>;

export async function analyzeFogDensity(input: AnalyzeFogDensityInput): Promise<AnalyzeFogDensityOutput> {
  return analyzeFogDensityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFogDensityPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      fogDensityScore: z
        .number()
        .describe('A score from 0 to 1 indicating the fog density in the image. 0 means no fog, 1 means very dense fog.'),
      fogDensityDescription: z.string().describe('A textual description of the fog density.'),
    }),
  },
  prompt: `You are an expert in image analysis, specializing in assessing fog density.

You will analyze the provided image and determine the fog density.

Provide a fogDensityScore, which is a number from 0 to 1, where 0 means no fog and 1 means extremely dense fog.
Also, provide a fogDensityDescription, which is a short textual description of the fog density.

Image: {{media url=photoDataUri}}`,
});

const analyzeFogDensityFlow = ai.defineFlow<
  typeof AnalyzeFogDensityInputSchema,
  typeof AnalyzeFogDensityOutputSchema
>({
  name: 'analyzeFogDensityFlow',
  inputSchema: AnalyzeFogDensityInputSchema,
  outputSchema: AnalyzeFogDensityOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
