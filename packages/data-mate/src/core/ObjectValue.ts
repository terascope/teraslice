import { getHashCodeFrom } from '..';
import { HASH_CODE_SYMBOL } from './interfaces';

export class ObjectValue<T extends Record<string, any>> {
    constructor(input: T) {
        Object.assign(this, input);
    }

    [HASH_CODE_SYMBOL](): string {
        return getHashCodeFrom(Object.entries(this), false);
    }
}
