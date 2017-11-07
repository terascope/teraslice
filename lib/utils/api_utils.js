'use strict';

const _ = require('lodash');
const Table = require('easy-table');


function makeTable(req, defaults, data, mappingFn) {
    const query = fieldsQuery(req.query, defaults);
    // used to create an empty table if there are no jobs
    if (data.length === 0) {
        data.push({});
    }

    return Table.print(data, (item, cell) => {
        const fn = mappingFn ? mappingFn(item) : field => item[field];
        _.each(query, (field) => {
            cell(field, fn(field));
        });
    }, (table) => {
        if (('headers' in req.query) && req.query.headers === 'false') {
            return table.print();
        }
        return table.toString();
    });
}

function fieldsQuery(query, defaults) {
    if (!query.fields) {
        return defaults || [];
    }

    const results = query.fields.split(',').map(word => word.trim());

    if (results.length === 0) {
        return defaults;
    }

    return results;
}

function sendError(res, code, error) {
    res.status(code).json({
        error: code,
        message: error
    });
}

module.exports = {
    makeTable,
    sendError
};
