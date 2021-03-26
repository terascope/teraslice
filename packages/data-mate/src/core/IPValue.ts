import isIP from 'is-ip';
import { parse } from 'ip-bigint';
import {
    getTypeOf,
    isString,
    primitiveToString,
} from '@terascope/utils';
import { HASH_CODE_SYMBOL } from './interfaces';

function isValidIP(input: unknown): input is string {
    if (!isString(input)) return false;
    return isIP(input);
}

/**
 * The internal IP storage format
*/
export class IPValue {
    static fromValue(
        value: unknown,
    ): IPValue {
        const ipValue = primitiveToString(value);
        if (!isValidIP(ipValue)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP`);
        }
        return new IPValue(ipValue);
    }

    /**
     * A numeric representation of a IP value
    */
    readonly number: bigint;

    readonly version: 4|6;

    constructor(
        /**
         * The original IP value
        */
        readonly ip: string
    ) {
        const { number, version } = parse(ip);
        this.number = number;
        this.version = version;
    }

    [Symbol.toPrimitive](hint: 'string'|'number'|'default'): any {
        if (hint === 'number') return this.number;
        return this.ip;
    }

    get [HASH_CODE_SYMBOL](): string {
        return this.ip;
    }
}
