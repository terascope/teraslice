import { ConvictSchema } from '../../../../src';

class Schema extends ConvictSchema<any, any> {
    build(): Record<string, any> {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        };
    }
}

module.exports = Schema;
