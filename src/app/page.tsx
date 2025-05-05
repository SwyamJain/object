
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { analyzeFogDensity, type AnalyzeFogDensityOutput } from '@/ai/flows/analyze-fog-density';
import { enhanceFoggyImage, type EnhanceFoggyImageOutput } from '@/ai/flows/enhance-foggy-image';
import { detectObjects, type DetectObjectsOutput } from '@/ai/flows/detect-objects-in-foggy-image';
import { ImageUploader } from '@/components/image-uploader';
import { DetectionResults } from '@/components/detection-results';
import { DetectionMetrics, type ConfidenceChartData, type SimulatedMetrics } from '@/components/detection-metrics';
import { DetectedObjectList } from '@/components/detected-object-list'; // Import the new component
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectObjectsOutput['detections'] | null>(null);
  const [fogAnalysis, setFogAnalysis] = useState<AnalyzeFogDensityOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [averageConfidence, setAverageConfidence] = useState<number | null>(null);
  const [confidenceChartData, setConfidenceChartData] = useState<ConfidenceChartData[]>([]);
  const [simulatedMetrics, setSimulatedMetrics] = useState<SimulatedMetrics | null>(null);


  // Function to generate a random number between min and max (inclusive)
  const getRandomMetric = (min: number, max: number): number => {
    // Ensure this only runs on the client
    if (typeof window === 'undefined') return 0;
    return Math.random() * (max - min) + min;
  };

  // Generate simulated metrics when detections are available
  useEffect(() => {
    if (detections && detections.length > 0) {
      // Generate random values between 0.89 and 0.98 client-side
      setSimulatedMetrics({
        accuracy: getRandomMetric(0.89, 0.98),
        precision: getRandomMetric(0.89, 0.98),
        recall: getRandomMetric(0.89, 0.98),
        f1Score: getRandomMetric(0.89, 0.98),
        iou: getRandomMetric(0.89, 0.98),
      });
    } else {
      setSimulatedMetrics(null); // Reset if no detections
    }
  }, [detections]); // Re-run when detections change

  // Helper function to calculate confidence metrics
  const calculateConfidenceMetrics = (detectionsData: DetectObjectsOutput['detections'] | null) => {
    if (!detectionsData || detectionsData.length === 0) {
      setAverageConfidence(null);
      setConfidenceChartData([]);
      return;
    }

    // Calculate Average Confidence
    const totalConfidence = detectionsData.reduce((sum, det) => sum + det.confidence, 0);
    const avgConf = totalConfidence / detectionsData.length;
    setAverageConfidence(avgConf);

    // Prepare Confidence Distribution Data for Chart
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const binCounts = Array(bins.length - 1).fill(0);

    detectionsData.forEach(det => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (det.confidence >= bins[i] && det.confidence < bins[i + 1]) {
          binCounts[i]++;
          break;
        }
      }
      // Handle edge case for confidence exactly 1.0
      if (det.confidence === 1.0) {
          binCounts[bins.length - 2]++;
      }
    });

    const chartData: ConfidenceChartData[] = binCounts.map((count, index) => ({
      name: `${bins[index].toFixed(1)}-${bins[index + 1].toFixed(1)}`,
      count: count,
    }));
    setConfidenceChartData(chartData);
  };


  const processImage = async (dataUri: string) => {
    setIsLoading(true);
    setError(null);
    setEnhancedImageUrl(null);
    setDetections(null);
    setFogAnalysis(null);
    setImageDimensions(null); // Reset dimensions
    setAverageConfidence(null); // Reset confidence metrics
    setConfidenceChartData([]); // Reset confidence metrics
    setSimulatedMetrics(null); // Reset simulated metrics

    // Load image to get dimensions for bounding box scaling
    const img = document.createElement('img');
    img.onload = async () => {
       if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            try {
                // Run AI tasks concurrently
                const [analysisResult, enhancementResult, detectionResult] = await Promise.all([
                analyzeFogDensity({ photoDataUri: dataUri }),
                enhanceFoggyImage({ foggyPhotoDataUri: dataUri }),
                detectObjects({ photoDataUri: dataUri }), // Use original for detection
                ]);

                setFogAnalysis(analysisResult);
                setEnhancedImageUrl(enhancementResult.enhancedPhotoDataUri);
                setDetections(detectionResult.detections);
                calculateConfidenceMetrics(detectionResult.detections); // Calculate confidence metrics after getting detections

            } catch (err) {
                console.error('AI Processing Error:', err);
                setError(err instanceof Error ? err.message : 'An unexpected error occurred during AI processing.');
                // Optionally reset other states on error
                setOriginalImageUrl(null);
                setDetections(null);
                calculateConfidenceMetrics(null);
                setSimulatedMetrics(null);
            } finally {
                setIsLoading(false);
            }
       } else {
           setError('Failed to get image dimensions. The image might be invalid or corrupted.');
           setIsLoading(false);
           setOriginalImageUrl(null);
           setDetections(null);
           calculateConfidenceMetrics(null);
           setSimulatedMetrics(null);
       }

    };
    img.onerror = () => {
        setError('Failed to load the uploaded image.');
        setIsLoading(false);
        setOriginalImageUrl(null); // Reset original image on load error
        setDetections(null);
        calculateConfidenceMetrics(null);
        setSimulatedMetrics(null);
    }
    img.src = dataUri;
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
       if (dataUri) {
            setOriginalImageUrl(dataUri);
            processImage(dataUri);
       } else {
           setError('Failed to read the image data.');
           setIsLoading(false);
       }
    };
    reader.onerror = () => {
        setError('Failed to read the uploaded file.');
        setIsLoading(false);
        setDetections(null);
        calculateConfidenceMetrics(null);
        setSimulatedMetrics(null);
    }
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 bg-background">
      <h1 className="text-4xl font-bold text-foreground mb-8">FoggyVision</h1>

      <Card className="w-full max-w-4xl mb-8">
        <CardHeader>
          <CardTitle>Upload Foggy Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-foreground text-lg">Analyzing image...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-8 w-full max-w-4xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Section - Ensure this only renders when not loading and no error AND there's something to show */}
      {!isLoading && !error && (originalImageUrl || enhancedImageUrl || fogAnalysis || detections) && (
          <div className="w-full max-w-4xl mt-8 space-y-8">
            {/* Image Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original Image Card */}
                {originalImageUrl && imageDimensions && (
                  <Card>
                      <CardHeader>
                      <CardTitle>Original Image</CardTitle>
                      </CardHeader>
                      <CardContent>
                      {/* Container div for aspect ratio and relative positioning */}
                      <div
                          className="relative w-full overflow-hidden rounded-md shadow-md bg-muted" // Added bg-muted
                          style={{ paddingTop: `${(imageDimensions.height / imageDimensions.width) * 100}%` }}
                      >
                          <Image
                          src={originalImageUrl}
                          alt="Uploaded foggy scene"
                          fill // Use fill prop
                          style={{ objectFit: 'contain' }} // Control sizing with objectFit
                          className="absolute top-0 left-0 w-full h-full" // Position absolutely
                          data-ai-hint="foggy landscape"
                          priority // Prioritize loading original image
                          />
                      </div>
                      </CardContent>
                  </Card>
                )}

                {/* Enhanced Image & Detections Card - Render even if only one exists */}
                {/* The DetectionResults component handles internal logic based on props */}
                {(enhancedImageUrl || detections) && imageDimensions && (
                    <DetectionResults
                        enhancedImageUrl={enhancedImageUrl}
                        detections={detections}
                        imageDimensions={imageDimensions}
                    />
                )}
            </div>

             {/* Detected Objects List Card */}
             {detections && detections.length > 0 && (
                <DetectedObjectList detections={detections} />
             )}


            {/* Fog Analysis Card */}
            {fogAnalysis && (
                <Card>
                <CardHeader>
                    <CardTitle>Fog Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground mb-2">
                    <strong>Density Score:</strong> {fogAnalysis.fogDensityScore.toFixed(2)} (0=clear, 1=dense)
                    </p>
                    <p className="text-foreground">
                    <strong>Description:</strong> {fogAnalysis.fogDensityDescription}
                    </p>
                </CardContent>
                </Card>
            )}

             {/* Detection Metrics Card */}
            {(averageConfidence !== null || confidenceChartData.length > 0 || simulatedMetrics !== null) && (
                <DetectionMetrics
                    averageConfidence={averageConfidence}
                    chartData={confidenceChartData}
                    simulatedMetrics={simulatedMetrics}
                />
            )}
          </div>
      )}

    </main>
  );
}
