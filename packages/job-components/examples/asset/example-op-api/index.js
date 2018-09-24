'use strict';

const ExampleAPI = require('./api');
const Schema = require('./schema');

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

// IMPORTANT: The backward compatibility for this type is very limited,
// since it is required to be in the operation list even though it is a no-op
module.exports = {
    schema: (context) => {
        if (Schema.type() !== 'convict') {
            throw new Error('Backwards compatibility only works for "convict schemas"');
        }

        const schema = new Schema();
        return schema.build(context);
    },
    async newProcessor(context, opConfig, executionConfig) {
        const opApi = new ExampleAPI(context, opConfig, executionConfig);
        await opApi.initialize();

        opApi.register();

        const events = context.apis.foundation.getSystemEvents();
        events.once('worker:shutdown', async () => {
            await opApi.shutdown();
        });

        events.once('slice:retry', async () => {
            await opApi.onSliceRetry();
        });

        events.once('slice:failure', async () => {
            await opApi.onSliceFailed();
        });

        events.once('slice:success', async () => {
            await opApi.onSliceSuccess();
        });

        events.once('slice:finalize', async () => {
            await opApi.onSliceFinished();
        });

        return data => data;
    }
};
