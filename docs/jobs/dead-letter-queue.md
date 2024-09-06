---
title: Dead Letter Queue
---

This API available to any operation running in the [`WorkerContext`](../packages/job-components/api/execution-context/worker/classes/WorkerExecutionContext.md) for putting invalid records or data. This API is useful for placing records that were not formatted correctly or were unserializable.

## Usage

In order to use the Dead Letter Queue you have to specify the `_dead_letter_action` on configuration on the operation.

There are a few built-in actions available:

- **"throw"** - Throw a specifically formatted error and retry the slice.
- **"log"** - Log the invalid record. *WARNING: this can expose sensitive data production data*
- **"none"** - Do nothing.

The `kafka-assets` bundle includes a [kafka dead letter queue](https://github.com/terascope/kafka-assets/blob/master/README.md#kafka-dead-letter) which can be configured to store all records in a Kafka topic.

Additionally the `Fetcher` or `Processor` will need to call the approperiate methods to ensure the record is sent to the dead letter queue. There are two methods avalable on the [OperationCore](../packages/job-components/api/operations/core/operation-core/classes/default.md):

- `rejectRecord(input: any, err: Error)` a simple method that will place an invalid record into with an error into the dead letter queue.
- `tryRecord(fn: (record) => record)` a utility method curry a transformating or serialization function and automatically reject the record if needed. This uses `rejectRecord` under the hood.

<!--DOCUSAURUS_CODE_TABS-->
<!--rejectRecord()-->
```ts
export default class ExampleFetcher extends Fetcher {
    // ...
    async fetch() {
        // get the data from a client
        const records: (Buffer|string)[] = await this.client.getData();

        let results: DataEntity[];

        for (const data of records) {
            try {
                results.push(DataEntity.fromBuffer(record, this.opConfig));
            } catch (err) {
                this.rejectRecord(data, err);
            }
        }

        return results;
    }
    // ...
}
```
<!--tryRecord()-->
```ts
export default class ExampleFetcher extends Fetcher {
    // ...
    async fetch() {
        // curry JSON.parse
        const try = this.tryRecord((data) => DataEntity.fromBuffer(data, this.opConfig));

        // get the data from a client
        const records: (Buffer|string)[] = await this.client.getData();

        let results: DataEntity[];

        for (const data of records) {
            const result = try(data);
            // try will return undefined or null in some cases
            // so make sure those values aren't included in the finally result
            if (result) results.push(result);
        }

        return results;
    }
    // ...
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Building Your Own

You can build a custom dead letter queue similar to how you develop an [Operation API](./development.md#operation-api), the main difference is that the API returned via (`createAPI`) is a synchronous `function` that takes the invalid record as the first argument and error as the second argument.

**IMPORTANT:** Since this is a generic dead letter queue API, the arguments for invalid record and the error may vary in data structure or type, so make sure to handle any edge cases.

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
'use strict';

const { OperationAPI, Collector, parseError } = require('@terascope/job-components');
const { ExampleClient } = require('example-client');

class ExampleDeadLetterQueue extends OperationAPI {
    constructor(...args) {
        super(...args);

        this._bufferSize = this.apiConfig.size * 5;

        const clientConfig = {
            type: 'example',
            endpoint: 'default',
        };

        const { client } = this.context.foundation.getConnection(clientConfig);
        this.client = client;

        this.collector = new Collector({
            size: this.apiConfig.size,
            wait: this.apiConfig.wait,
        });
    }

    async initialize() {
        await super.initialize();
        await this.client.connect();
    }

    async shutdown() {
        const batch = this.collector.flushAll();
        await this.client.send(batch);

        await this.client.disconnect();
        await super.shutdown();
    }

    async createAPI() {
        return (input, err) => {
            let record;

            if (input && Buffer.isBuffer(input)) {
                record = input.toString('utf8');
            } else {
                try {
                    record = JSON.stringify(input);
                } catch (err) {
                    record = input;
                }
            }

            const data = {
                record,
                error: parseError(err, true)
            };

            const msg = {
                timestamp: Date.now(),
                data: Buffer.from(JSON.stringify(data)),
            };

            this.collector.add(msg);
        };
    }

    async onSliceFinalizing() {
        const batch = this.collector.flushAll();
        await this.client.send(batch);
    }
}

module.exports = ExampleDeadLetterQueue;
```
<!--TypeScript-->
```ts
import { OperationAPI, Collector, parseError } from '@terascope/job-components';
import { ExampleClient } from 'example-client';

type DeadLetterMsg = {
    timestamp: number,
    data: Buffer,
}

export default class ExampleDeadLetterQueue extends OperationAPI {
    client: ExampleClient;
    collector: Collector<DeadLetterMsg>;
    private _bufferSize: number;

    constructor(context: WorkerContext, apiConfig: KafkaDeadLetterConfig, executionConfig: ExecutionConfig) {
        super(context, apiConfig, executionConfig);

        this._bufferSize = this.apiConfig.size * 5;

        const clientConfig = {
            type: 'example',
            endpoint: 'default',
        };

        const { client } = this.context.foundation.getConnection(clientConfig);
        this.client = client;

        this.collector = new Collector({
            size: this.apiConfig.size,
            wait: this.apiConfig.wait,
        });
    }

    async initialize() {
        await super.initialize();
        await this.client.connect();
    }

    async shutdown() {
        const batch = this.collector.flushAll();
        await this.client.send(batch);

        await this.client.disconnect();
        await super.shutdown();
    }

    async createAPI(): Promise<DeadLetterAPIFn> {
        return (input: any, err: Error) => {
            let record: string;

            if (input && Buffer.isBuffer(input)) {
                record = input.toString('utf8');
            } else {
                try {
                    record = JSON.stringify(input);
                } catch (err) {
                    record = input;
                }
            }

            const data = {
                record,
                error: parseError(err, true)
            };

            const msg = {
                timestamp: Date.now(),
                data: Buffer.from(JSON.stringify(data)),
            };

            this.collector.add(msg);
        };
    }

    async onSliceFinalizing() {
        const batch = this.collector.flushAll();
        await this.client.send(batch);
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

For example, see the code for [kafka_dead_letter](https://github.com/terascope/kafka-assets/tree/master/asset/src/kafka_dead_letter) api.
