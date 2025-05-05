'use server';

/**
 * @fileOverview Detects objects in an image, especially in foggy conditions, using GenAI.
 *
 * - detectObjects - A function to detect objects in an image.
 * - DetectObjectsInput - Input type for the detectObjects function.
 * - DetectObjectsOutput - Return type for the detectObjects function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DetectObjectsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected grammar here
    ),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectObjectsOutputSchema = z.object({
  detections: z.array(
    z.object({
      label: z.string().describe('The label of the detected object.'),
      confidence: z.number().describe('The confidence score of the detection.'),
      boundingBox: z
        .object({
          x: z.number().describe('The x coordinate of the bounding box.'),
          y: z.number().describe('The y coordinate of the bounding box.'),
          width: z.number().describe('The width of the bounding box.'),
          height: z.number().describe('The height of the bounding box.'),
        })
        .describe('The bounding box of the detected object.'),
    })
  ).describe('An array of detected objects with labels, confidence scores, and bounding boxes.'),
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

export async function detectObjects(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return detectObjectsFlow(input);
}

const detectObjectsPrompt = ai.definePrompt({
  name: 'detectObjectsPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          'A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected grammar here
        ),
    }),
  },
  output: {
    schema: z.object({
      detections: z.array(
        z.object({
          label: z.string().describe('The label of the detected object.'),
          confidence: z.number().describe('The confidence score of the detection.'),
          boundingBox: z
            .object({
              x: z.number().describe('The x coordinate of the bounding box.'),
              y: z.number().describe('The y coordinate of the bounding box.'),
              width: z.number().describe('The width of the bounding box.'),
              height: z.number().describe('The height of the bounding box.'),
            })
            .describe('The bounding box of the detected object.'),
        })
      ).describe('An array of detected objects with labels, confidence scores, and bounding boxes.'),
    }),
  },
  prompt: `You are an expert object detection AI, specialized in detecting objects in foggy images. Analyze the image and identify the objects present in it. For each object, provide a label, a confidence score, and the bounding box coordinates (x, y, width, height). Return the results as a JSON array of objects.

Image: {{media url=photoDataUri}}`,
});

const detectObjectsFlow = ai.defineFlow<
  typeof DetectObjectsInputSchema,
  typeof DetectObjectsOutputSchema
>({
  name: 'detectObjectsFlow',
  inputSchema: DetectObjectsInputSchema,
  outputSchema: DetectObjectsOutputSchema,
},
async input => {
  const {output} = await detectObjectsPrompt(input);
  return output!;
});

