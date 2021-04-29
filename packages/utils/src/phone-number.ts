import PhoneValidator from 'awesome-phonenumber';
import { toString, isString } from './strings';

import { isNumber, inNumberRange } from './numbers';

export function parsePhoneNumber(input: string|number): string {
    let testNumber = toString(input).trim();
    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    // needs to start with a +
    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    const fullNumber = new PhoneValidator(testNumber).getNumber();
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

export function isISDN(input: unknown): boolean {
    if (input == null) return false;

    if (isString(input) || isNumber(input)) {
        const isdn = new PhoneValidator(`+${input}`);

        return isdn.isValid();
    }

    return false;
}

export function isPhoneNumberLike(input: unknown): boolean {
    const testValue = toString(input).trim().replace(/\D/g, '');

    return inNumberRange(testValue.length, { min: 7, max: 20, inclusive: true });
}
