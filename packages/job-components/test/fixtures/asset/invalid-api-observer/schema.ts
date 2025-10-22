import { AnyObject } from '@terascope/core-utils';
import { ConvictSchema } from '../../../../src/index.js';

export default class Schema extends ConvictSchema<any, any> {
    build(): AnyObject {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        };
    }
}
