import { ConvictSchema, AnyObject } from '../../../src';

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
