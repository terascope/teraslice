'use strict';

import { Format, addFormat } from 'convict';
import * as moment from 'moment';
import * as dateMath from 'datemath-parser';

const formats : Format[] = [
    {
        name: 'required_String',
        validate(val: any) {
            if (!(val && typeof val === 'string')) {
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
            if (!val) return;
            if (val && typeof val === 'string') return;
            throw new Error('This field is optional but if specified it must be of type string');
        },
        coerce(val: any) {
            return val;
        },
    } as Format,
    {
        name: 'optional_Date',
        validate(val: any) {
            if (!val) return;
            if (typeof val === 'string' || typeof val === 'number') {
                if (moment(new Date(val)).isValid()) return;
                try {
                    dateMath.parse(val);
                } catch (err) {
                    throw new Error(
                        `value: "${val}" cannot be coerced into a proper date \n` +
                        'the error: ' + err.stack,
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
];

formats.forEach(addFormat);

export default formats;
