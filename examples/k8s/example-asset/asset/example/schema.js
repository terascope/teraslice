import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema {
    build() {
        return {
            type: {
                doc: 'An example of a property schema',
                default: 'string',
                format: 'String',
            }
        };
    }
}
