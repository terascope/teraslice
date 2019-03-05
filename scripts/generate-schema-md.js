#!/usr/bin/env node

'use strict';

const path = require('path');
const os = require('os');
const { chain } = require('lodash');
const {
    toString,
    isString,
    getTypeOf,
    firstToUpper,
    isEmpty,
    isFunction,
} = require('@terascope/utils');
const table = require('markdown-table');

const homedir = os.homedir();
const hostname = os.hostname();
const ip = chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .filter(val => (val.family === 'IPv4' && val.internal === false))
    .map('address')
    .head()
    .value();

const cwd = process.cwd();

const replaceThese = {
    $PWD: cwd,
    $HOME: homedir,
    $HOSTNAME: hostname,
    $HOST_IP: ip,
};

const schemaArg = process.argv[2];
if (!schemaArg || ['h', '-h', 'help', '--help'].includes(schemaArg)) {
    // eslint-disable-next-line no-console
    console.error(`
./scripts/generate-schema-md.js <path/to/schema/file.(js|json)>

Generate a markdown table from a convict schema
`.trim());

    process.exit(1);
}

const result = generateConfigDocs(path.resolve(schemaArg));
// eslint-disable-next-line no-console
console.log(result);

function generateConfigDocs(schemaPath) {
    let schema = require(schemaPath);
    if (schema.default) schema = schema.default;
    if (isEmpty(schema)) {
        throw new Error('Schema exported an empty schema');
    }

    if (schema.schema) ({ schema } = schema);

    if (isEmpty(schema)) {
        throw new Error('Schema exported an invalid schema');
    }

    const data = [
        [
            'Field',
            'Type',
            'Default',
            'Description'
        ],
    ];

    function handleSchemaObj(schemaObj, prefix = '') {
        Object.keys(schemaObj)
            .sort()
            .forEach((field) => {
                const s = schemaObj[field];
                if (!s) return;

                const fullField = [prefix, field]
                    .join('.')
                    .replace(/^\./, '');

                if (!s.doc) {
                    handleSchemaObj(s, fullField);
                    return;
                }

                data.push([
                    `**${fullField}**`,
                    formatType(s),
                    formatDefaultVal(s),
                    sanatizeStr(s.doc),
                ]);
            });
    }

    handleSchemaObj(schema);

    return table(data, { align: 'c' });
}

function formatArr(arr) {
    return arr.map(v => formatVal(v)).join(', ');
}

function formatVal(val, isType = false) {
    if (Array.isArray(val)) return formatArr(val);
    let str;

    if (isString(val)) {
        if (isType) {
            if (val.indexOf('required_') === 0) {
                str = `${val.replace('required_', '')}`;
            } else if (val.indexOf('optional_') === 0) {
                str = `${val.replace('optional_', '')}`;
            } else {
                str = `${val}`;
            }
        } else {
            str = `"${val}"`;
        }
    } else if (val && val.name) {
        str = val.name;
    } else {
        str = toString(val);
    }

    if (isString(str)) {
        for (const [replaceWith, searchFor] of Object.entries(replaceThese)) {
            str = str.replace(searchFor, replaceWith);
        }
    }

    return `\`${str}\``;
}

function formatDefaultVal(s) {
    const val = s.default;
    if (val == null || (isString(val) && !val)) return '-';
    return formatVal(val);
}

function formatType(s) {
    if (s.default != null && (!s.format || isFunction(s.format))) {
        const typeOf = getTypeOf(s.default);
        if (/^[`"']/.test(typeOf)) {
            return typeOf;
        }
        return `\`${typeOf}\``;
    }
    return firstToUpper(formatVal(s.format, true));
}

function sanatizeStr(str) {
    if (!str) return '';
    return str.replace(/\r?\n|\r/g, '<br>').trim();
}
