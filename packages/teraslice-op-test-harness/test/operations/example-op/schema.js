
import { ConvictSchema } from '@terascope/job-components';

export default class Schema extends ConvictSchema {
    build() {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        };
    }
}
