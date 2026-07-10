import { BaseSchema } from '../../../../src/index.js';

export default class Schema extends BaseSchema<any, any> {
    build(): Record<string, any> {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            old_example: {
                default: 'old_default',
                doc: 'Deprecated example field',
                format: 'String',
                deprecated: 'use example instead',
            },
        };
    }
}
