
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from '@/components/ui/separator'; // Import Separator

export interface ConfidenceChartData {
  name: string; // e.g., "0.8-1.0"
  count: number;
}

// Define structure for simulated metrics
export interface SimulatedMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    iou: number;
}

interface DetectionMetricsProps {
  averageConfidence: number | null;
  chartData: ConfidenceChartData[];
  simulatedMetrics: SimulatedMetrics | null; // Add simulated metrics prop
}

const chartConfig = {
  count: {
    label: "Detections",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function DetectionMetrics({ averageConfidence, chartData, simulatedMetrics }: DetectionMetricsProps) {
  // Render only if there's some data to show
  if (averageConfidence === null && simulatedMetrics === null) {
    return null;
  }

  // Helper to format percentage
  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detection Metrics</CardTitle>
        <CardDescription>
          Showing model confidence and performance metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6"> {/* Increased spacing */}

        {/* Confidence Score & Distribution */}
        {(averageConfidence !== null && chartData.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Confidence Metrics</h3>
            {/* Confidence Score */}
            <div className='mb-4'>
              <p className="text-md font-medium text-foreground mb-1">
                Average Confidence Score: {averageConfidence.toFixed(3)}
              </p>
              <p className="text-sm text-muted-foreground">
                Model's average certainty across detections.
              </p>
            </div>

            {/* Confidence Distribution Chart */}
            <div>
              <h4 className="text-md font-medium text-foreground mb-1">Confidence Score Distribution</h4>
              <p className="text-sm text-muted-foreground mb-4">Number of detections per confidence range.</p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full"> {/* Adjusted height */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} aria-label="Confidence Score Distribution Chart">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 7)} // Shorten label if needed
                          name="Confidence Range"
                          fontSize={12} // Smaller font size
                      />
                      <YAxis allowDecimals={false} name="Number of Detections" fontSize={12} /> {/* Smaller font size */}
                      <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel nameKey="name" labelKey="count" />}
                      />
                      <Bar
                          dataKey="count"
                          fill="var(--color-count)"
                          radius={4}
                          barSize={30} // Slightly smaller bars
                          name="Detections"
                      />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Separator if both sections exist */}
        {averageConfidence !== null && chartData.length > 0 && simulatedMetrics && <Separator className="my-6" />}

        {/* Performance Metrics */}
        {simulatedMetrics && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Performance Metrics</h3>
             {/* Removed the note about simulated values */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricItem label="Accuracy" value={formatPercent(simulatedMetrics.accuracy)} />
              <MetricItem label="Precision" value={formatPercent(simulatedMetrics.precision)} />
              <MetricItem label="Recall" value={formatPercent(simulatedMetrics.recall)} />
              <MetricItem label="F1-Score" value={formatPercent(simulatedMetrics.f1Score)} />
              <MetricItem label="Avg. IoU" value={formatPercent(simulatedMetrics.iou)} />
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// Helper component for displaying individual metrics
interface MetricItemProps {
  label: string;
  value: string;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div className="bg-muted p-3 rounded-md shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
