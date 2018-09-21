'use strict';

const Fetcher = require('./fetcher');
const Slicer = require('./slicer');
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
    async newReader(context, opConfig, executionConfig) {
        const fetcher = new Fetcher(context, opConfig, executionConfig);
        await fetcher.initialize();

        const events = context.apis.foundation.getSystemEvents();
        events.once('worker:shutdown', async () => {
            await fetcher.shutdown();
        });

        events.once('slice:retry', async () => {
            await fetcher.onSliceRetry();
        });

        events.once('slice:failure', async () => {
            await fetcher.onSliceFailed();
        });

        events.once('slice:success', async () => {
            await fetcher.onSliceSuccess();
        });

        events.once('slice:finished', async () => {
            await fetcher.onSliceFinished();
        });

        return sliceRequest => fetcher.fetch(sliceRequest);
    },
    async newSlicer(context, executionContext, recoveryData, logger) {
        const executionConfig = executionContext.config;
        const opConfig = executionConfig.operations[0];

        const slicer = new Slicer(context, executionConfig, opConfig, logger);
        await slicer.initialize(recoveryData);

        const events = context.apis.foundation.getSystemEvents();
        events.once('worker:shutdown', async () => {
            await slicer.shutdown();
        });

        events.once('slice:retry', async () => {
            await slicer.onSliceRetry();
        });

        events.once('slice:failure', async () => {
            await slicer.onSliceFailed();
        });

        events.once('slice:success', async () => {
            await slicer.onSliceSuccess();
        });

        events.once('slice:finalize', async () => {
            await slicer.onSliceFinished();
        });

        return [
            () => slicer.slice()
        ];
    }
};
