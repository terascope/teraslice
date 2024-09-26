import PhoneValidator from 'awesome-phonenumber';
import { toString, isString } from './strings.js';

import { isNumber, inNumberRange } from './numbers.js';

export function parsePhoneNumber(input: string | number): string {
    const preppedInput = _prepPhoneNumber(toString(input).trim());

    const fullNumber = new PhoneValidator(preppedInput).getNumber();

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
        const isdn = country ? new PhoneValidator(toString(input), country) : new PhoneValidator(`+${input}`);

        return isdn.isValid();
    }

    return false;
}

export function isPhoneNumberLike(input: unknown): boolean {
    const testValue = toString(input).trim()
        .replace(/\D/g, '');

    return inNumberRange(testValue.length, { min: 7, max: 20, inclusive: true });
}
