import { ConvictSchema } from '../../operations/index.js';

export default class Schema extends ConvictSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {};
    }
}
