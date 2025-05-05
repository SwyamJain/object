
'use client';

import Image from 'next/image';
import { type DetectObjectsOutput } from '@/ai/flows/detect-objects-in-foggy-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetectionResultsProps {
  enhancedImageUrl: string | null;
  detections: DetectObjectsOutput['detections'] | null;
  imageDimensions: { width: number; height: number } | null;
}

export function DetectionResults({ enhancedImageUrl, detections, imageDimensions }: DetectionResultsProps) {
  if (!imageDimensions || imageDimensions.width === 0 || imageDimensions.height === 0) return null; // Don't render if dimensions aren't ready or invalid

  const renderBoundingBoxes = () => {
    if (!detections) return null;

    return detections.map((detection, index) => {
      const { boundingBox, label, confidence } = detection;

      // **Crucial:** Ensure boundingBox coordinates are valid numbers. Fallback to 0 if not.
      const x = typeof boundingBox.x === 'number' && isFinite(boundingBox.x) ? boundingBox.x : 0;
      const y = typeof boundingBox.y === 'number' && isFinite(boundingBox.y) ? boundingBox.y : 0;
      const w = typeof boundingBox.width === 'number' && isFinite(boundingBox.width) ? boundingBox.width : 0;
      const h = typeof boundingBox.height === 'number' && isFinite(boundingBox.height) ? boundingBox.height : 0;

      // **Calculate percentage-based coordinates relative to the image's natural dimensions**
      // These percentages are used for CSS `top`, `left`, `width`, `height`
      const leftPercent = (x / imageDimensions.width) * 100;
      const topPercent = (y / imageDimensions.height) * 100;
      const widthPercent = (w / imageDimensions.width) * 100;
      const heightPercent = (h / imageDimensions.height) * 100;

       // **Clamp values to prevent boxes going outside the 0-100% range**
       // Ensure width/height don't cause overflow when calculating max left/top
       const safeWidthPercent = Math.max(0, Math.min(widthPercent, 100));
       const safeHeightPercent = Math.max(0, Math.min(heightPercent, 100));

       const clampedLeft = Math.max(0, Math.min(leftPercent, 100 - safeWidthPercent));
       const clampedTop = Math.max(0, Math.min(topPercent, 100 - safeHeightPercent));
       const clampedWidth = Math.max(0, Math.min(safeWidthPercent, 100 - clampedLeft)); // Ensure width doesn't exceed remaining space
       const clampedHeight = Math.max(0, Math.min(safeHeightPercent, 100 - clampedTop)); // Ensure height doesn't exceed remaining space


      // Add a small minimum size for visibility, especially if width/height are very small
      const minSizePx = 5; // Minimum size in pixels
      const minWidthPercent = (minSizePx / imageDimensions.width) * 100;
      const minHeightPercent = (minSizePx / imageDimensions.height) * 100;

      const finalWidth = Math.max(clampedWidth, minWidthPercent);
      const finalHeight = Math.max(clampedHeight, minHeightPercent);

      // Recalculate clampedLeft/Top if minSize caused an adjustment, preventing overflow
      const finalLeft = Math.min(clampedLeft, 100 - finalWidth);
      const finalTop = Math.min(clampedTop, 100 - finalHeight);

      return (
        <div
          key={index}
          className="absolute border-2 border-accent rounded shadow pointer-events-none box-border" // Added box-border
          style={{
            left: `${finalLeft}%`,
            top: `${finalTop}%`,
            width: `${finalWidth}%`,
            height: `${finalHeight}%`,
          }}
          aria-label={`Detected ${label}`}
        >
          <Badge
            variant="default"
            className="absolute -top-6 left-0 bg-accent text-accent-foreground text-xs whitespace-nowrap py-0.5 px-1.5 rounded shadow" // Added rounded and shadow
            // Prevent badge going off-screen left
            style={{ transform: finalLeft < 2 ? 'translateX(2px)' : 'none' }}
          >
            {label} ({confidence.toFixed(2)})
          </Badge>
        </div>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{enhancedImageUrl ? 'Enhanced Image & Detections' : 'Object Detections'}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Image container: relative positioning, overflow hidden, aspect ratio */}
        <div
            className="relative w-full overflow-hidden rounded-md shadow-md bg-muted" // Ensure overflow is hidden
            // Use padding-top trick for aspect ratio based on natural dimensions
            // Add a fallback aspect ratio if dimensions are somehow zero
            style={{
                 paddingTop: imageDimensions.width > 0 ? `${(imageDimensions.height / imageDimensions.width) * 100}%` : '75%' /* Default 4:3 */
            }}
        >
            {enhancedImageUrl ? (
                <>
                    {/* Image positioned absolutely within the container */}
                    <Image
                        src={enhancedImageUrl}
                        alt="Enhanced scene with object detections"
                        fill // Use fill instead of layout="fill"
                        style={{ objectFit: 'contain' }} // Use style for objectFit
                        className="absolute top-0 left-0 w-full h-full" // Position image within container
                        data-ai-hint="clear enhanced landscape"
                        unoptimized // Keep unoptimized for data URIs
                        priority // Load image faster if it's important
                    />
                    {/* Render boxes inside the same relative container */}
                    {renderBoundingBoxes()}
                </>
            ) : detections ? (
                // Fallback if no enhanced image but detections exist
                 <div className="absolute inset-0 flex items-center justify-center p-4">
                    {detections.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground bg-background/80 p-4 rounded">
                        {detections.map((det, i) => (
                            <li key={i}>
                            {det.label} (Confidence: {det.confidence.toFixed(2)})
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No objects detected.</p>
                    )}
                </div>
             ) : (
                 // Fallback if neither image nor detections exist
                 <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">Awaiting image upload...</p>
                 </div>
             )}
        </div>
      </CardContent>
    </Card>
  );
}
