'use strict';

const _ = require('lodash');

const defaultResults = _.times(10, () => ({ hello: true }));
const defaultSlicerResults = [{ howdy: true }, null];
const defaultSlicerQueueLength = '10';

function schema() {
    return {
        errorAt: {
            doc: 'An array of indexes to error at',
            default: [],
            format: 'Array'
        },
        results: {
            doc: 'Reader results to return',
            default: defaultResults,
            format: 'Array'
        },
        slicerQueueLength: {
            doc: 'A string for the slicer queue length, anything but QUEUE_MINIMUM_SIZE will be converted to a number',
            default: defaultSlicerQueueLength,
            format: 'String'
        },
        slicerErrorAt: {
            doc: 'An array of indexes to error at when newSlicer is invoked',
            default: [],
            format: 'Array'
        },
        slicerResults: {
            doc: 'Slicer results to return',
            default: defaultSlicerResults,
            format: 'Array'
        },
        updateMetadata: {
            doc: 'Update the metadata on the slicer execution',
            default: false,
            format: Boolean
        }
    };
}

module.exports = {
    schema,
    newReader: jest.fn((context, opConfig) => {
        const results = _.get(opConfig, 'results', defaultResults);
        const errorAt = _.get(opConfig, 'errorAt', []);

        if (!context._readerCalls) context._readerCalls = -1;

        return Promise.resolve(() => {
            context._readerCalls += 1;

            if (_.includes(errorAt, context._readerCalls)) {
                return Promise.reject(new Error('Bad news bears'));
            }

            return Promise.resolve(results);
        });
    }),
    slicerQueueLength: jest.fn((executionContext) => {
        const queueLength = _.get(executionContext, 'config.operations[0].slicerQueueLength', defaultSlicerQueueLength);
        if (queueLength === 'QUEUE_MINIMUM_SIZE') {
            return queueLength;
        }
        return _.toSafeInteger(queueLength);
    }),
    newSlicer: jest.fn((context, executionContext) => {
        const slicerResults = _.get(executionContext, 'config.operations[0].slicerResults', defaultSlicerResults);
        const errorAt = _.get(executionContext, 'config.operations[0].slicerErrorAt', []);
        const updateMetadata = _.get(executionContext, 'config.operations[0].updateMetadata', false);

        if (!context._slicerCalls) context._slicerCalls = -1;
        context._slicerCalls += 1;

        if (_.includes(errorAt, context._slicerCalls)) {
            return Promise.reject(new Error('Bad news bears'));
        }

        let sliceCalls = 0;
        return [
            async () => {
                const result = slicerResults.shift();
                sliceCalls++;
                if (updateMetadata) {
                    await context.apis.executionContext.setMetadata(
                        'slice_calls',
                        sliceCalls
                    );
                }
                if (result && result.error) {
                    throw new Error(result.error);
                }
                return result;
            },
        ];
    })
};
