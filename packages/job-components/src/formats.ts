import pkg from 'convict';
// @ts-expect-error no types
import convict_format_with_validator from 'convict-format-with-validator';
// @ts-expect-error no types
import convict_format_with_moment from 'convict-format-with-moment';
import dateMath from 'datemath-parser';
import {
    startsWith, isString, isInteger,
    toInteger, isValidDate
} from '@terascope/core-utils';

const { addFormat, addFormats: nativeAddFormats } = pkg;

nativeAddFormats(convict_format_with_validator);
nativeAddFormats(convict_format_with_moment);

export const formats: pkg.Format[] = [
    {
        name: 'required_String',
        validate(val: unknown) {
            if (!val || !isString(val)) {
                throw new Error('This field is required and must by of type string');
            }
        },
        coerce(val: any) {
            return val;
        },
    },
    {
        name: 'optional_String',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val)) {
                return;
            }
            throw new Error('This field is optional but if specified it must be of type string');
        },
        coerce(val: any) {
            return val;
        },
    },
    {
        name: 'optional_Date',
        validate(val: unknown) {
            if (!val) {
                return;
            }
            if (isString(val) || isInteger(val)) {
                if (isValidDate(val)) {
                    return;
                }
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
    },
    {
        name: 'elasticsearch_Name',
        validate(val: unknown) {
            if (typeof val !== 'string') {
                throw new Error(`value: ${val} must be a string`);
            }
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
            const badChar = /[#*?"<>|/\\\\]/;
            if (badChar.test(val)) {
                throw new Error(`value: ${val} should not contain any invalid characters: #*?"<>|/\\`);
            }

            const upperRE = /[A-Z]/;
            if (upperRE.test(val)) {
                throw new Error(`value: ${val} should be lower case`);
            }
        },
        coerce(val) {
            return val;
        },
    },
    {
        name: 'positive_int',
        validate(val: unknown) {
            const int = toInteger(val);
            if (int === false || int < 1) {
                throw new Error('must be valid integer greater than zero');
            }
        },
        coerce(val: any) {
            return toInteger(val) || 0;
        },
    },
];

export function addFormats(): void {
    formats.forEach(addFormat);
}

addFormats();
