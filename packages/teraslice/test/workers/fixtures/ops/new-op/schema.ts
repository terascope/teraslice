import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema<Record<string, any>> {
    build() {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            failOnSliceRetry: {
                default: false,
                doc: 'fail on slice retry',
                format: Boolean,
            }
        };
    }
}
