'use strict';

import { addFormat, Format } from 'convict';
// @ts-ignore
import dateMath from 'datemath-parser';
import {
    startsWith,
    isValidDate,
    isString,
    isInteger
} from '@terascope/utils';

export const formats : Format[] = [
    {
        name: 'required_String',
        validate(val: any) {
            if (!val || !isString(val)) {
                throw new Error('This field is required and must by of type string');
            }
        },
        coerce(val: any) {
            return val;
        },
    } as Format,
    {
        name: 'optional_String',
        validate(val: any) {
            if (!val) { return; }
            if (isString(val)) { return; }
            throw new Error('This field is optional but if specified it must be of type string');
        },
        coerce(val: any) {
            return val;
        },
    } as Format,
    {
        name: 'optional_Date',
        validate(val: any) {
            if (!val) { return; }
            if (isString(val) || isInteger(val)) {
                if (isValidDate(val)) { return; }
                try {
                    dateMath.parse(val);
                } catch (err) {
                    throw new Error(
                        `value: "${val}" cannot be coerced into a proper date
                        the error: ${err.stack}`
                    );
                }
            } else {
                throw new Error('parameter must be a string or number IF specified');
            }
        },
        coerce(val) {
            return val;
        },
    } as Format,
    {
        name: 'elasticsearch_Name',
        validate(val: any) {
            if (val.length > 255) {
                throw new Error(`value: ${val} should not exceed 255 characters`);
            }

            if (startsWith(val, '_')
                || startsWith(val, '-')
                || startsWith(val, '+')) {
                throw new Error(`value: ${val} should not start with _, -, or +`);
            }

            if (val === '.' || val === '..') {
                throw new Error(`value: ${val} should not equal . or ..`);
            }

            // NOTE: the \\\\ is necessary to match a single \ in this case
            const badChar = new RegExp('[#*?"<>|/\\\\]');
            if (badChar.test(val)) {
                throw new Error(`value: ${ val } should not contain any invalid characters: #*?"<>|/\\`);
            }

            const upperRE = new RegExp('[A-Z]');
            if (upperRE.test(val)) {
                throw new Error(`value: ${ val } should be lower case`);
            }
        },
        coerce(val) {
            return val;
        },
    } as Format,
];

export function addFormats() {
    formats.forEach(addFormat);
}

addFormats();
