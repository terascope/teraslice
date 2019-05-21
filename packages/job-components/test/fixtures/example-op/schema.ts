import { ConvictSchema } from '../../../src';

export default class Schema extends ConvictSchema<any, any> {
    build() {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            test_flush: {
                default: false,
                doc: 'Test flushing',
                format: 'Boolean',
            },
        };
    }
}
