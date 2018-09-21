'use strict';

const MapProcessor = require('./processor');
const Schema = require('./schema');

module.exports = {
    schema: (context) => {
        if (Schema.type() !== 'convict') {
            throw new Error('Backwards compatibility only works for "convict schemas"');
        }

        const schema = new Schema();
        return schema.build(context);
    },
    async newProcessor(context, opConfig, executionConfig) {
        const processor = new MapProcessor(context, opConfig, executionConfig);
        await processor.initialize();

        return (input, logger, sliceRequest) => {
            process.logger = logger;
            const data = processor.toDataEntityList(input);
            return processor.handle(data, sliceRequest);
        };
    }
};
