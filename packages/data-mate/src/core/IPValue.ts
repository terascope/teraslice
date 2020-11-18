import isIP from 'is-ip';
import { parse } from 'ip-bigint';
import {
    getTypeOf,
    isString,
} from '@terascope/utils';
import { HASH_CODE_SYMBOL } from './interfaces';

function isValidIP(input: unknown): input is string {
    if (!isString(input)) return false;
    if (!isIP(input)) return false;

    // needed to check for inputs like - '::192.168.1.18'
    if (input.includes(':') && input.includes('.')) return false;

    return true;
}

/**
 * The internal IP storage format
*/
export class IPValue {
    static fromValue(
        value: unknown,
    ): IPValue {
        if (!isValidIP(value)) {
            throw new TypeError(`Expected ${value} (${getTypeOf(value)}) to be a valid IP`);
        }
        return new IPValue(value);
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
