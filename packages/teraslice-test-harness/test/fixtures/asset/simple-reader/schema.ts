import { ConvictSchema, AnyObject } from '@terascope/job-components';
import { SimpleReaderConfig } from './interfaces.js';

export default class Schema extends ConvictSchema<SimpleReaderConfig> {
    build(): AnyObject {
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
