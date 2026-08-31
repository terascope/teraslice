---
title: Prometheus Metrics API
sidebar_label: Prometheus Metrics
---

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

## Modifying a metric

There are two ways to update a metric after it has been added:

1. **Directly** — call `inc`, `dec`, `set`, or `observe` from your processing code every time the value changes.
2. **With a `collect()` callback** — pass a `collect` function to `addCounter`/`addGauge`/etc. The callback runs lazily, **only when the `/metrics` endpoint is scraped**, and updates the metric from a value you accumulate in local memory.

The `collect()` approach is preferred in a hot path (for example, once per record). Instead of touching the Prometheus metric on every record, you increment a cheap in-memory tally and let `collect()` flush that tally into the metric once per scrape.

Whichever approach you use, the label names as well as the metric name must match when calling `inc`, `dec`, `set`, or `observe`.

### Example Counter (direct increment)

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

### Example Counter using a collect() callback

A counter is monotonic: `inc()` **adds** its argument to the counter's current value, and the Prometheus counter keeps its running total across scrapes. When you defer updates to a `collect()` callback, you should therefore keep a local tally of "events since the last scrape", `inc()` the metric by that tally, and then **reset the tally to `0`**.

If you do not reset the tally, the next `collect()` will add the entire accumulated total *again* on top of a counter that already includes it — over-counting more and more with every scrape.

```typescript
export default class CountByField extends MapProcessor<CountByFieldConfig> {
    // local tally of events seen since the last scrape
    static countSinceLastInc = 0;

    async initialize(): Promise<void> {
        const { opConfig, context } = this;

        if (isPromAvailable(context)) {
            const defaultLabels = context.apis.foundation.promMetrics.getDefaultLabels();

            await context.apis.foundation.promMetrics.addCounter(
                `${opConfig._op}_count_total`, // name
                `${opConfig._op} record count`, // help or description
                [...Object.keys(defaultLabels), 'op_name'], // label names
                function collect() { // runs only when the '/metrics' endpoint is scraped
                    const labels = { // labels must match those used when the metric was added
                        op_name: opConfig._op,
                        ...defaultLabels
                    };
                    // add everything counted since the last scrape to the metric...
                    this.inc(labels, CountByField.countSinceLastInc); // 'this' refers to the Counter
                    // ...then reset the local tally so it isn't counted again next scrape
                    CountByField.countSinceLastInc = 0;
                }
            );
        }
    }

    map(doc: DataEntity): DataEntity {
        // hot path: bump the cheap in-memory tally, not the metric itself
        CountByField.countSinceLastInc += 1;
        return doc;
    }
}
```

### Example Gauge using a collect() callback

A gauge is different: `set()` **replaces** the value rather than adding to it, so the backing variable is a running total you do **not** reset. Each scrape simply publishes the current value.

```typescript
const self = this;
if (isPromAvailable(this.context)) {
    await this.context.apis.foundation.promMetrics.addGauge(
        'slices_dispatched_current', // name
        'number of slices a slicer has dispatched', // help or description
        ['class'], // label names specific to this metric
        function collect() { // callback fn updates value only when '/metrics' endpoint is hit
            const slicesDispatched = self.getSlicesDispatched(); // get current value from local memory
            const labels = { // 'set()' needs both default labels and labels specific to metric to match the correct gauge
                ...self.context.apis.foundation.promMetrics.getDefaultLabels(),
                class: 'SlicerExecutionContext'
            };
            this.set(labels, slicesDispatched); // 'this' refers to the Gauge; no reset — set() overwrites
        }
    );
}
```
