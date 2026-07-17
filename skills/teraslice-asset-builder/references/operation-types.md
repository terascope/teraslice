# Operation Types & Templates

All base classes come from `@terascope/job-components`. Data records are `DataEntity` instances (from `@terascope/core-utils` in newer bundles, `@terascope/utils` in older ones — check a sibling op). Always confirm imports against a real neighbor operation in the target bundle.

Each operation directory typically holds:
- an implementation file (`processor.ts` / `fetcher.ts` + `slicer.ts` / `api.ts`)
- `schema.ts`
- `interfaces.ts` (the config interface, when there are custom fields)

---

## Choosing a type

| Goal | Type | Base class | Key method |
|------|------|-----------|------------|
| Produce/source data | Reader | `Slicer` + `Fetcher` | `slice()`, `fetch(slice)` |
| Mutate each record | Processor | `MapProcessor` | `map(entity)` → entity |
| Side-effects per record (no mutation) | Processor | `EachProcessor` | `forEach(entity)` → void |
| Keep/drop records | Processor | `FilterProcessor` | `filter(entity)` → boolean |
| Operate on the whole batch / write to a sink | Processor | `BatchProcessor` | `onBatch(entities)` → entities |
| Expose a utility to other ops | API | `OperationAPI` | `createAPI()` |
| Factory for a client (reader/sender APIs) | API | `APIFactory` | `create()` → `{ client, config }` |
| Monitor without changing data | API | `Observer` | lifecycle hooks |

A job needs **at least one processor**. Senders/writers (e.g. bulk-to-Elasticsearch) are implemented as `BatchProcessor`s.

---

## Processors

### MapProcessor — mutate one record, return it (not async)
```ts
import { MapProcessor } from '@terascope/job-components';
import { DataEntity, set, has } from '@terascope/core-utils';
import { MyOpConfig } from './interfaces.js';

export default class MyOp extends MapProcessor<MyOpConfig> {
    map(doc: DataEntity): DataEntity {
        set(doc, this.opConfig.field, this.opConfig.value);
        return doc;
    }
}
```

### EachProcessor — side-effects only (not async, returns nothing)
```ts
import { EachProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';

export default class MyOp extends EachProcessor {
    count = 0;
    forEach(doc: DataEntity): void {
        this.count++;
        doc.setMetadata('count', this.count);
    }
}
```

### FilterProcessor — return true to keep, false to drop (not async)
```ts
import { FilterProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/core-utils';
import { MyOpConfig } from './interfaces.js';

export default class MyOp extends FilterProcessor<MyOpConfig> {
    filter(doc: DataEntity): boolean {
        return doc.getMetadata('_eventTime') > Date.now() - 5 * 60 * 1000;
    }
}
```
To send dropped records to the [dead letter queue](../../../docs) call `this.rejectRecord(doc, err)`.

### BatchProcessor — whole array at once (async). Use for senders/writers.
```ts
import { BatchProcessor, DataEntity } from '@terascope/job-components';
import { MyOpConfig } from './interfaces.js';

export default class MyOp extends BatchProcessor<MyOpConfig> {
    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        // transform or write `data` to a sink here
        return data;
    }
}
```

---

## Readers (Slicer + Fetcher)

A reader is registered with **both** a `Slicer` and a `Fetcher` (plus `Schema`).

### Slicer — runs on the execution controller, emits slice requests
```ts
import { Slicer, SlicerRecoveryData } from '@terascope/job-components';
import { MyOpConfig } from './interfaces.js';

export default class MyReaderSlicer extends Slicer<MyOpConfig> {
    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        await super.initialize(recoveryData);
    }

    maxQueueLength(): number {
        return this.workersConnected * 3;
    }

    isRecoverable(): boolean {
        return true;
    }

    // Return null/undefined to signal the slicer is finished.
    async slice(): Promise<Record<string, any> | null> {
        return { start: 0, end: this.opConfig.size };
    }
}
```
Use `ParallelSlicer` (with `newSlicer(id)` returning a slice fn) when you need multiple concurrent slicer streams controlled by the job's `slicers` setting.

### Fetcher — runs on a worker, turns a slice into records
```ts
import { Fetcher } from '@terascope/job-components';
import { MyOpConfig } from './interfaces.js';

export default class MyReaderFetcher extends Fetcher<MyOpConfig> {
    // The framework wraps results in DataEntity for you.
    async fetch(slice: Record<string, any>): Promise<Record<string, any>[]> {
        // read `slice` from the data source and return records
        return [];
    }
}
```

---

## APIs

### OperationAPI — expose a utility to other operations
```ts
import { OperationAPI } from '@terascope/job-components';

export default class MyAPI extends OperationAPI {
    async createAPI() {
        // return a function, object, or class instance
        return {
            doThing: (x: string) => x.toUpperCase(),
        };
    }
}
```

### APIFactory — reader/sender API factory pattern
Returns `{ client, config }` from `create()`. Study `elasticsearch_reader_api` / `elasticsearch_sender_api` in `elasticsearch-assets` before writing one — they follow a specific `APIFactory` contract.

### Observer — monitor only
```ts
import { Observer } from '@terascope/job-components';

export default class MyObserver extends Observer {
    onOperationStart(sliceId: string, index: number): void { /* ... */ }
    onOperationEnd(sliceId: string, index: number, processed: number): void { /* ... */ }
}
```

---

## Schema (`schema.ts`)

Every operation needs a schema. Extend `ConvictSchema` (or `BaseSchema`) and implement `build()`, which returns a [convict](https://github.com/mozilla/node-convict) schema object. Each field has `doc`, `default`, and `format`.

```ts
import { ConvictSchema } from '@terascope/job-components';
import { MyOpConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<MyOpConfig> {
    build(): Record<string, any> {
        return {
            field: {
                doc: 'Name of the field to set',
                default: null,
                format: 'required_string',   // built-in: fails if empty/missing
            },
            overwrite: {
                doc: 'Overwrite the field if it already exists',
                default: false,
                format: 'Boolean',
            },
            value: {
                doc: 'Value to assign',
                default: null,
                // custom format = a validator that throws on invalid input
                format: (val: unknown) => {
                    if (val == null) throw new Error('value cannot be null');
                },
            },
        };
    }
}
```

Common formats: `required_string`, `optional_string`, `String`, `Number`, `Boolean`, `Array`, `Object`, or an array of allowed values (e.g. `['trace', 'debug', 'info']`), or a custom validator function.

---

## Interfaces (`interfaces.ts`)

Extend `OpConfig` with the operation's config fields. This is the type parameter passed to the base class and used as `this.opConfig`.

```ts
import { OpConfig } from '@terascope/types';

export interface MyOpConfig extends OpConfig {
    field: string;
    value: unknown;
    overwrite: boolean;
}
```
