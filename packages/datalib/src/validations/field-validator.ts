import * as ts from '@terascope/utils';
import { Repository, ValidationResults } from '../interfaces';

export const respoitory: Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    isString: { fn: isString, config: {}}
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

    const validString: ValidationResults = isString(input);

    if (!validString.isValid) _invalidValue(input, 'email address must be a string');
    
    if (input.toLowerCase().match(regex) != null) return { isValid: true, input };
    return _invalidValue(input, 'not a valid emailAddress');
}

export function isString(input: any): boolean {
    return ts.isString(input);
}

export function isInteger(input: any) {
    // should this try to coerse the input to a number? before an int check?
    // like '10' -> 10

    
}
