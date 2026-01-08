import { BaseSchema } from '@terascope/job-components';

const defaultResults = Array.from(Array(10)).map(() => ({ hi: true }));

export default class Schema extends BaseSchema<Record<string, any>> {
    build() {
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
}
