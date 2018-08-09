'use strict';

const momentJS = require('moment');
const dateMath = require('datemath-parser');

module.exports = [
    {
        name: 'required_String',
        validate(val) {
            if (!(val && typeof val === 'string')) {
                throw new Error('This field is required and must by of type string');
            }
        },
        coerce(val) {
            return val;
        }
    },

    {
        name: 'optional_String',
        validate(val) {
            if (val && typeof val !== 'string') {
                throw new Error('This field is optional but if specified it must be of type string');
            }
        },
        coerce(val) {
            return val;
        }
    },
    {
        name: 'optional_Date',
        validate(val) {
            if (val) {
                if (typeof val === 'string' || typeof val === 'number') {
                    if (!momentJS(new Date(val)).isValid()) {
                        try {
                            dateMath.parse(val);
                        } catch (err) {
                            throw new Error(`value: "${val}" cannot be coerced into a proper date`, '\n', 'the error', err.stack);
                        }
                    }
                } else {
                    throw new Error('parameter must be a string or number IF specified');
                }
            }
        },
        coerce(val) {
            return val;
        }
    }
];
