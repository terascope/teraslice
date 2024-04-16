import type {
    Gauge, Counter, Histogram, Summary
} from 'prom-client';

export interface PromMetricAPIConfig {
    assignment: string
    port: number
    default_metrics: boolean
}

export type MetricList = Record<string, {
    readonly name?: string | undefined,
    readonly metric?: Gauge<any> | Counter<any> | Histogram<any> | Summary<any> | undefined,
    readonly functions?: Set<string> | undefined
}>;

export interface PromMetricsAPI {
    set: (name: string, labels: Record<string, string>, value: number) => void;
    inc: (name: string, labelValues: Record<string, string>, value: number) => void;
    dec: (name: string, labelValues: Record<string, string>, value: number) => void;
    observe: (name: string, labelValues: Record<string, string>, value: number) => void;
    addMetric: (name: string, help: string, labelNames: Array<string>, type: 'gauge' | 'counter' | 'histogram',
        buckets?: Array<number>) => Promise<void>;
    addSummary: (name: string, help: string, labelNames: Array<string>,
        ageBuckets: number, maxAgeSeconds: number,
        percentiles: Array<number>) => void;
    hasMetric: (name: string) => boolean;
    deleteMetric: (name: string) => boolean;
}
