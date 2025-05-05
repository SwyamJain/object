'use server';
/**
 * @fileOverview An AI agent that enhances the quality of a foggy image.
 *
 * - enhanceFoggyImage - A function that enhances the quality of a foggy image.
 * - EnhanceFoggyImageInput - The input type for the enhanceFoggyImage function.
 * - EnhanceFoggyImageOutput - The return type for the enhanceFoggyImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const EnhanceFoggyImageInputSchema = z.object({
  foggyPhotoDataUri: z
    .string()
    .describe(
      "A photo of a foggy scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceFoggyImageInput = z.infer<typeof EnhanceFoggyImageInputSchema>;

const EnhanceFoggyImageOutputSchema = z.object({
  enhancedPhotoDataUri: z
    .string()
    .describe(
      'An enhanced version of the photo with reduced fog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // DO NOT MODIFY: This is intentionally escaped. This is how the model wants it.
    ),
});
export type EnhanceFoggyImageOutput = z.infer<typeof EnhanceFoggyImageOutputSchema>;

export async function enhanceFoggyImage(input: EnhanceFoggyImageInput): Promise<EnhanceFoggyImageOutput> {
  return enhanceFoggyImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceFoggyImagePrompt',
  input: {
    schema: z.object({
      foggyPhotoDataUri: z
        .string()
        .describe(
          "A photo of a foggy scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    }),
  },
  output: {
    schema: z.object({
      enhancedPhotoDataUri: z
        .string()
        .describe(
          'An enhanced version of the photo with reduced fog, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // DO NOT MODIFY: This is intentionally escaped. This is how the model wants it.
        ),
    }),
  },
  prompt: `You are an AI expert in image processing, specializing in removing fog from images.

  Please enhance the quality and clarity of the following foggy image by reducing the fog and improving visibility.

  Output the enhanced image as a data URI.

  Foggy Image: {{media url=foggyPhotoDataUri}}`,
});

const enhanceFoggyImageFlow = ai.defineFlow<
  typeof EnhanceFoggyImageInputSchema,
  typeof EnhanceFoggyImageOutputSchema
>(
  {
    name: 'enhanceFoggyImageFlow',
    inputSchema: EnhanceFoggyImageInputSchema,
    outputSchema: EnhanceFoggyImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.foggyPhotoDataUri}},
        {text: 'Enhance this image by reducing the fog and improving visibility.'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {enhancedPhotoDataUri: media.url!};
  }
);
