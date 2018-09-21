'use strict';

const BatchProcessor = require('./processor');
const Schema = require('./schema');

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

module.exports = {
    schema: (context) => {
        if (Schema.type() !== 'convict') {
            throw new Error('Backwards compatibility only works for "convict schemas"');
        }

        const schema = new Schema();
        return schema.build(context);
    },
    async newProcessor(context, opConfig, executionConfig) {
        const processor = new BatchProcessor(context, opConfig, executionConfig);
        await processor.initialize();

        const events = context.apis.foundation.getSystemEvents();
        events.once('worker:shutdown', async () => {
            await processor.shutdown();
        });

        events.once('slice:retry', async () => {
            await processor.onSliceRetry();
        });

        events.once('slice:failure', async () => {
            await processor.onSliceFailed();
        });

        events.once('slice:success', async () => {
            await processor.onSliceSuccess();
        });

        events.once('slice:finalize', async () => {
            await processor.onSliceFinished();
        });

        return async (input, logger, sliceRequest) => {
            process.logger = logger;
            const data = processor.toDataEntityList(input);

            const output = await processor.handle(data, sliceRequest);
            return output.toArray();
        };
    }
};
