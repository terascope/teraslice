---
title: Types of Operations
---

Operations within [Teraslice Job](./overview.md) are designed to read, transform, write, or monitor data within a Teraslice job.

## Readers

A `Reader` is the first operation specificed on the job and has two main components, a [Slicer](#slicers) and a [Fetcher](#fetchers). The purpose of a Reader to distribute and read partitions of data across one or more Workers.

To develop a reader, see the [docs](./development.md#reader).

## Slicers

A `Slicer` runs on the Execution Controller and its primary function to create [Slices](./slices.md).

### Slicer

The simplest varient of a "Slicer" that only handles one running "Slicer".

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { v4 as uuid } from 'uuid';
import { Slicer, SlicerRecoveryData } from '@terascope/job-components';

export default class ExampleSlicer extends Slicer {
    // If undefined or null is returned here teraslice will
    // consider this "slicer" to be done and the execution
    // will finish
    async slice() {
        return {
            id: uuid(),
            foo: 'bar',
        };
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/slicer/classes/default.md) for more details.

### Parallel Slicer

A varient of a "Slicer" for running a parallel stream of slicers. The number of slicers can be configured via the "slicers" configuration on the [Job Configuration](./configuration.md#job-configuration).

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
const { ParallelSlicer, pDelay, times } = require('@terascope/job-components');

export default class ExampleSlicer extends ParallelSlicer {
    // set is recoverable to true disable support covering an "Execution"
    isRecoverable() {
        return true;
    }

    // you can configure the number of "in-flight" slices by setting the maxQueueLength
    // in this case we are going to set it to 2 times the number of workers connnected.
    maxQueueLength() {
        return this.stats.workers.connected * 2;
    }

    // The `newSlicer` create a new context for a "slice function" similar to "Slicer->slice()".
    // If you return `undefined` it will drop support for that slicer, this usefull to limiting the number of supported slicers.
    async newSlicer(id) {
        const { countPerSlicer } = this.opConfig;
        const records = times(countPerSlicer, i => ({ id: `slicer-${id}-${i}` }));

        return async () => {
            await pDelay(0);
            return records.shift();
        };
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/parallel-slicer/overview.md) for more details.

## Fetchers

A `Fetcher` runs on a Worker and its primary process [Slices](./slices.md). When processing a `Slice` the worker will use [Slice Request](../packages/types/api/teraslice/interfaces/SliceRequest.md) to read a set of data from its data source. The fetcher will then return the data through the pipeline.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
const { Fetcher } = require('@terascope/job-components');

export default class ExampleSlicer extends Fetcher {
    // This where you fetch the Data from a particular Data Source
    // you don't need to call DataEntity.makeArray because
    // the framework will do this for you
    async fetch(slicerRequest: object) {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            }));
        }
        return result;
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Processors

A Job is required to contain a least one Processor. The duty of a processor is to transform or write data to an external service.

To develop a processor, see the [docs](./development.md#processor).

### Batch Processor

A variation of "Processor" that deals with a batch of data at a time.

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { BatchProcessor } from '@terascope/job-components';

export default class ExampleBatchProcessor extends BatchProcessor {
    batchedKeys: (string[])[] = [];

    async onBatch(dataEntities: DataEntity[]): Promise<DataEntity[]> {
        let keys: string = [];

        for (const dataEntity of dataEntities) {
            keys.push(dataEntity.getKey());
        }

        this.batchedKeys.push(keys);
        return dataEntities;
    }

}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/batch-processor/overview.md) for more details.

### Each Processor

A variation of Processor that can process a single DataEntity at a time. This processor should limit the side-effects on the data. If you are going to mutate the data use the [MapProcessor](#map-processor).

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { EachProcessor } from '@terascope/job-components';

export default class ExampleEachProcessor extends EachProcessor {
    count = 0;

    // NOTE: this is NOT an async function and should not return anything.
    forEach(dataEntity: DataEntity, index: number, array: DataEntity[]): void {
        this.count++;
        dataEntity.setMetadata('count', this.count);
    }

}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/each-processor/overview.md) for more details.

### Map Processor

A variation of Processor that can process a single DataEntity at a time. This processor should return a modified DataEntity.

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { MapProcessor } from '@terascope/job-components';

export default class ExampleMapProcessor extends MapProcessor {

    // NOTE: this is NOT an async function
    map(dataEntity: DataEntity, index: number, array: DataEntity[]): DataEntity {
        dataEntity.foo == 'bar';
        return dataEntity;
    }

}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/map-processor/overview.md) for more details.

### Filter Processor

A variation of Processor that can process a single DataEntity at a time. This processor is used to removed data from the batch of data.

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { FilterProcessor } from '@terascope/job-components';

export default class ExampleFilterProcessor extends FilterProcessor {

    // NOTE: this is NOT an async function
    filter(dataEntity: DataEntity, index: number, array: DataEntity[]): boolean {
        const eventTime = dataEntity.getMetadata('_eventTime');
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return eventTime && eventTime > fiveMinutesAgo;
    }

}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/filter-processor/overview.md) for more details.

## APIs

A Job can specify an Operation API which can expose an utility API, a [Dead Letter Queue](./dead-letter-queue.md) or can be used to monitor/track data going through the pipeline. APIs are [configured](./configuration.md#apis) separately and are attached to the [Operation Lifecycle](./slices.md#worker-lifecycle-events) on startup.

To develop a processor, see the [docs](./development.md#api).

### Operation API

This type of API that exposes to functionality to other processors within a job. A [Dead Letter Queue](./dead-letter-queue.md) is a type of `Operation API`.

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { OperationAPI } from '@terascope/job-components';

export default class ExampleOperationAPI extends OperationAPI {
    value: string = 'foo';

    // this function should resolve an OpAPI
    // an OpAPI can be a function, object, or an instance of class
    async createAPI() {
        return {
            get: () => {
                return this.value;
            },
            update: (value: string) => {
                this.value = value;
            }
        };
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/operation-api/overview.md) for more details.

### Observer

This type of API only monitors/tracks data and processors, checkout the [Worker Lifecycle](./slices.md#worker-lifecycle-events)) for all of the events that can be subscribed to.

**Example:**

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { Observer } from '@terascope/job-components';

export default class ExampleObserver extends Observer {

    onOperationStart(sliceId: string, index: number): boolean {
        const opName = this.executionConfig.operations[index]._op;
        this.logger.trace(`operation ${opName} is starting slice ${slice}`);
    }

    onOperationEnd(sliceId: string, index: number, processed: number): boolean {
        const opName = this.executionConfig.operations[index]._op;
        this.logger.trace(`operation ${opName} is processed ${processed} records for slice ${slice}`);
    }

}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/observer/overview.md) for more details.
