import { parsePhoneNumber as _parsePhoneNumber } from 'awesome-phonenumber';
import { toString, isString } from './strings.js';

import { isNumber, inNumberRange } from './numbers.js';

export function parsePhoneNumber(input: string | number): string {
    const preppedInput = _prepPhoneNumber(toString(input).trim());

    const fullNumber = _parsePhoneNumber(preppedInput).number?.e164;
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

function _prepPhoneNumber(input: string): string {
    let testNumber = input;

    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    return testNumber;
}

export function isISDN(input: unknown, country?: string): boolean {
    if (isString(input) || isNumber(input)) {
        const isdn = country ? _parsePhoneNumber(toString(input), { regionCode: country }) : _parsePhoneNumber(`+${input}`);

        return isdn.valid;
    }

    return false;
}

export function isPhoneNumberLike(input: unknown): boolean {
    const testValue = toString(input).trim()
        .replace(/\D/g, '');

    return inNumberRange(testValue.length, { min: 7, max: 20, inclusive: true });
}
