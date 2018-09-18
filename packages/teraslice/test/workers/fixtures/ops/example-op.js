'use strict';

const _ = require('lodash');

const defaultResults = _.times(10, () => 'hi');

function schema() {
    return {
        errorAt: {
            doc: 'An array of indexes to error at',
            default: [],
            format: 'Array'
        },
        results: {
            doc: 'Op results to return',
            default: defaultResults,
            format: 'Array'
        },
    };
}

module.exports = {
    schema,
    newProcessor: jest.fn((context, opConfig) => {
        const results = _.get(opConfig, 'results', defaultResults);
        const errorAt = _.get(opConfig, 'errorAt', []);

        if (!context._opCalls) context._opCalls = -1;

        return Promise.resolve(() => {
            context._opCalls += 1;

            if (_.includes(errorAt, context._opCalls)) {
                return Promise.reject(new Error('Bad news bears'));
            }

            return Promise.resolve(results);
        });
    }),
};
