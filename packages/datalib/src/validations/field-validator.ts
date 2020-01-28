import * as ts from '@terascope/utils';
import { Repository, ValidationResults } from '../interfaces';

export const respoitory: Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
};

export function isBoolean(input: string): ValidationResults {
    const isValid = ts.isBoolean(input);
    if (isValid) return { isValid };
    return { isValid, error: `Input: ${input} is not a boolean` };
}

export function isBooleanLike(input: string): ValidationResults {
    const isValid = ts.isBooleanLike(input);
    if (isValid) return { isValid };
    return { isValid, error: `Input: ${input} is not a booleanLike` };
}

export function isEmail(input: string): ValidationResults {
    // eslint-disable-next-line
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (ts.isString(input)) {
        if (input.toLowerCase().match(regex)) return { isValid: true };
        return { isValid: false, error: `Input: ${input} is not a valid email` };
    }
    return { isValid: false, error: `Input ${input} must be a string` };
}
