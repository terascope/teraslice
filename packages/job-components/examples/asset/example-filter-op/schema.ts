import { ConvictSchema } from '@terascope/job-components';

export interface ExampleSchema {
    example: string;
}

export default class Schema extends ConvictSchema<ExampleSchema> {
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
