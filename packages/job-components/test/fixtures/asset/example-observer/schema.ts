// eslint-disable-next-line import/no-import-module-exports
import { ConvictSchema } from '../../../../src/index.js';

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
