'use strict';

const Fetcher = require('./fetcher');
const Slicer = require('./slicer');
const Schema = require('./schema');

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

        return sliceRequest => fetcher.fetch(sliceRequest);
    },
    async newSlicer(context, executionContext, recoveryData, logger) {
        const executionConfig = executionContext.config;
        const opConfig = executionConfig.operations[0];

        const slicer = new Slicer(context, executionConfig, opConfig, logger);
        await slicer.initialize(recoveryData);

        return [
            () => slicer.slice()
        ];
    }
};
