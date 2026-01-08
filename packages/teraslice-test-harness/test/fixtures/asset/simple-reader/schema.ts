import { BaseSchema } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces';

export default class Schema extends BaseSchema<SimpleReaderConfig> {
    build(): Record<string, any> {
        return {
            slicesToCreate: {
                default: 10,
                doc: 'Number of slice records to create',
                format: 'Number'
            },
            recordsToFetch: {
                default: 10,
                doc: 'Number of records to fetch',
                format: 'Number'
            }
        };
    }
}
