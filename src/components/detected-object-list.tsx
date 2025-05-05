
'use client';

import { type DetectObjectsOutput } from '@/ai/flows/detect-objects-in-foggy-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetectedObjectListProps {
  detections: DetectObjectsOutput['detections'] | null;
}

export function DetectedObjectList({ detections }: DetectedObjectListProps) {
  if (!detections || detections.length === 0) {
    return null; // Don't render if there are no detections
  }

  // Extract unique labels
  const uniqueLabels = Array.from(new Set(detections.map(d => d.label)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Objects</CardTitle>
      </CardHeader>
      <CardContent>
        {uniqueLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uniqueLabels.map((label, index) => (
                <Badge key={index} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
        ) : (
            <p className="text-muted-foreground">No distinct objects detected.</p> // Should not happen if component renders, but good fallback
        )}
      </CardContent>
    </Card>
  );
}
