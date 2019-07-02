---
title: Job Components Formats
sidebar_label: Formats
---

> Formats for @terascope/job-components

[Globals](../overview.md) / ["formats"](_formats_.md) /

# External module: "formats"

### Index

#### Variables

* [formats](_formats_.md#const-formats)

#### Functions

* [addFormats](_formats_.md#addformats)

## Variables

### `Const` formats

• **formats**: *`Format`[]* =  [
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
]

*Defined in [formats.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/formats.ts#L13)*

## Functions

###  addFormats

▸ **addFormats**(): *void*

*Defined in [formats.ts:92](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/formats.ts#L92)*

**Returns:** *void*
