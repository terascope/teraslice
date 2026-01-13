import { BaseSchema } from '@terascope/job-components';

export default class Schema extends BaseSchema<Record<string, any>> {
    build() {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            countPerSlicer: {
                default: 10,
                doc: 'The number of slices for the slicer to create',
                format: 'Number',
            },
            countPerFetch: {
                default: 10,
                doc: 'The number of records to return from the fetcher',
                format: 'Number',
            }
        };
    }
}
