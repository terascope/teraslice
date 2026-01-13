import { BaseSchema } from '../../../../src/index.js';

export default class Schema extends BaseSchema<any, any> {
    build(): Record<string, any> {
        return {
            version: {
                doc: 'my version',
                format: 'required_string',
                default: undefined
            }
        };
    }
}
