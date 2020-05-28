import { ConvictSchema } from '../../operations';

export default class Schema extends ConvictSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {};
    }
}
