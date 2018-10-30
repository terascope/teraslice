'use strict';
'use console';

/* eslint-disable no-console */

const ttyTable = require('tty-table');
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
        } else {
            await pretty(header, items);
        }
    }

    return {
        display
    };
};
