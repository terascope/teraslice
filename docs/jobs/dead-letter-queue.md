---
title: Dead Letter Queue
---

## Dead Letter Queue

The Dead Letter Queue is an API available to any operation running in the [`WorkerContext`](../packages/job-components/api/classes/workerexecutioncontext.md) for putting invalid records or data. This API is useful for placing records that were not formatted correctly or were unserializable. There are a few built-in actions available:

- **"throw"** - Throw a specifically formatted error.
- **"log"** - Log the invalid record. *WARNING: this can expose sensitive data production data*
- **"none"** - Do nothing.

The `kafka-assets` bundle includes a [kafka dead letter queue](https://github.com/terascope/kafka-assets/blob/master/README.md#kafka-dead-letter) which can be configured to store all records in a Kafka topic.

Custom dead letter queues can also be created:

<!--DOCUSAURUS_CODE_TABS-->
<!--JavaScript-->
```js
const { OperationAPI, Collector } = require('@terascope/job-components');
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
import { OperationAPI, Collector } from '@terascope/job-components';
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
