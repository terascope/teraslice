# Prometheus Metrics API

The `PromMetrics` class lives within `packages/terafoundation/src/api/prom-metrics` package. Use of its API can be enabled using `prom_metrics_enabled` in the terafoundation config and overwritten in the job config. The `init` function can be found at `context.apis.foundation.promMetrics.init`. It is called on startup of the Teraslice master, execution_controller, and worker, but only creates the API if `prom_metrics_enabled` is true.

## Functions

| Name | Description | Type |
| ---------------- | ------------------------ | ----------------------------- |
| init | initialize the API and create exporter server | `(config: PromMetricsInitConfig) => Promise<boolean>` |
| set | set the value of a gauge | `(name: string, labels: Record<string, string>, value: number) => void` |
| inc | increment the value of a counter or gauge | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| dec | decrement the value of a gauge | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| observe | observe a histogram or summary | `(name: string, labelValues: Record<string, string>, value: number) => void` |
| addGauge | add a gauge metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Gauge>) => Promise<void>` |
| addCounter | add a counter metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Counter>) => Promise<void>` |
| addHistogram | add a histogram metric | `(name: string, help: string, labelNames: Array<string>, collectFn?: CollectFunction<Histogram>, buckets?: Array<number>) => Promise<void>` |
| addSummary | add a summary metric | `(name: string, help: string, labelNames: Array<string>,       collectFn?: CollectFunction<Summary>, maxAgeSeconds?: number, ageBuckets?: number, percentiles?: Array<number>) => Promise<void>` |
| hasMetric | check if a metric exists | `(name: string) => boolean` |
| deleteMetric | delete a metric from the metric list | `(name: string) => Promise<boolean>` |
| verifyAPI | verify that the API is running | `() => boolean` |
| resetMetrics | reset the values of all metrics | `() => void` |
| shutdown | disable API and shutdown exporter server | `() => Promise<void>` |
| getDefaultLabels | retrieve the default labels set at init | `() => Record<string, string>` |

Example init:

```typescript
await config.context.apis.foundation.promMetrics.init({
    terasliceName: context.sysconfig.teraslice.name,
    assignment: 'execution_controller',
    logger: this.logger,
    tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
    tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
    tf_prom_metrics_port: terafoundation.prom_metrics_port,
    job_prom_metrics_add_default: config.executionConfig.prom_metrics_add_default, // optional job override
    job_prom_metrics_enabled: config.executionConfig.prom_metrics_enabled, // optional job override
    job_prom_metrics_port: config.executionConfig.prom_metrics_port, // optional job override
    labels: { // optional default labels on all metrics for this teraslice process
        ex_id: this.exId,
        job_id: this.jobId,
        job_name: this.config.name,
        assignment: 'execution_controller',
    }
});
```

Once initialized all of the other functions under `context.apis.foundation.promMetrics` will be enabled. Any calls to promMetricsAPI functions should be wrapped in a check using the `job-components` utility function `isPromAvailable()`.

Example Counter:

```typescript
if (isPromAvailable(this.context)) {
    await this.context.apis.foundation.promMetrics.addCounter(
        'slices_dispatched', // name
        'number of slices a slicer has dispatched', // help or description
        ['class'], // label names specific to this metric
    );
    // now we can increment the counter anywhere else in the code
    this.context.apis.foundation.promMetrics.inc(
        'slices_dispatched', // name
        { class: 'ExecutionController' }, // label names and values
        1 // amount to increment by
    );
}
```

Example Gauge using collect() callback:

```typescript
const self = this;
if (isPromAvailable(this.context)) {
    await this.context.apis.foundation.promMetrics.addGauge(
        'slices_dispatched', // name
        'number of slices a slicer has dispatched', // help or description
        ['class'], // label names specific to this metric
        function collect() { // callback fn updates value only when '/metrics' endpoint is hit
            const slicesFinished = self.getSlicesDispatched(); // get current value from local memory
            const labels = { // 'set()' needs both default labels and labels specific to metric to match the correct gauge
                ...self.context.apis.foundation.promMetrics.getDefaultLabels(),
                class: 'SlicerExecutionContext'
            };
            this.set(labels, slicesFinished); // 'this' refers to the Gauge
        }
    );
}
```

The label names as well as the metric name must match when using `inc`, `dec`, `set`, or `observe` to modify a metric.
