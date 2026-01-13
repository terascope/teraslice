import { BaseSchema } from '../../operations/index.js';

export default class Schema extends BaseSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {};
    }
}
