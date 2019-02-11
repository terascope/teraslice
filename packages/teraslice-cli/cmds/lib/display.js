'use strict';
'use console';

/* eslint-disable no-console */

const ttyTable = require('tty-table');
const Table = require('cli-table3');
const easyTable = require('easy-table');
const _ = require('lodash');

async function pretty(headerValues, rows) {
    const header = [];
    _.each(headerValues, (item) => {
        const col = [];
        col.value = item;
        header.push(col);
    });

    const table = ttyTable(header, rows, {
        borderStyle: 1,
        paddingTop: 0,
        paddingBottom: 0,
        headerAlign: 'left',
        align: 'left',
        defaultValue: ''
    });
    console.log(table.render());
}
async function horizontal(rows, opts) {
    const table = new Table(opts);

    _.each(rows, (item) => {
        table.push(item);
    });

    console.log(await table.toString());
}

async function vertical(header, rows, style) {
    _.each(rows, (keys) => {
        const table = new Table(style);
        console.log(`\n${header} -> ${keys[header]}`);
        _.each(keys, (value, key) => {
            const val = {};
            val[key] = value;
            table.push(val);
        });
        console.log(table.toString());
    });
}

async function text(headerValues, items) {
    const rows = [];
    _.each(items, (item) => {
        const row = {};
        _.each(headerValues, (headerValue) => {
            row[headerValue] = item[headerValue];
        });
        rows.push(row);
    });
    console.log(easyTable.print(rows));
}

module.exports = () => {
    async function display(header, items, type) {
        if (type === 'txt') {
            await text(header, items);
        } else if (type === 'txtHorizontal') {
            const opts = {
                head: header,
                chars: {
                    top: '',
                    'top-mid': '',
                    'top-left': '',
                    'top-right': '',
                    bottom: '',
                    'bottom-mid': '',
                    'bottom-left': '',
                    'bottom-right': '',
                    left: '',
                    'left-mid': '',
                    mid: '',
                    'mid-mid': '',
                    right: '',
                    'right-mid': '',
                    middle: ' '.repeat(2)
                },
                style: {
                    'padding-left': 0, 'padding-right': 0, head: ['white'], border: ['white']
                }
            };
            await horizontal(items, opts);
        } else if (type === 'prettyHorizontal') {
            const opts = {
                head: header,
                style: { 'padding-left': 0, 'padding-right': 0, head: ['blue'] }
            };
            await horizontal(items, opts);
        } else if (type === 'txtVertical') {
            const style = {
                chars: {
                    top: '',
                    'top-mid': '',
                    'top-left': '',
                    'top-right': '',
                    bottom: '',
                    'bottom-mid': '',
                    'bottom-left': '',
                    'bottom-right': '',
                    left: '',
                    'left-mid': '',
                    mid: '',
                    'mid-mid': '',
                    right: '',
                    'right-mid': '',
                    middle: ' '.repeat(3)
                },
                style: {
                    'padding-left': 0, 'padding-right': 0, head: ['white']
                }
            };
            await vertical(header, items, style);
        } else if (type === 'prettyVertical') {
            const style = {
                style: { 'padding-left': 0, 'padding-right': 0, head: ['blue'] }
            };
            await vertical(header, items, style);
        } else {
            await pretty(header, items);
        }
    }

    return {
        display
    };
};
