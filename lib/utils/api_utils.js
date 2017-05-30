'use strict';

var _ = require('lodash');
var Table = require('easy-table');


function makeTable(req, defaults, data, mappingFn) {
    var query = fieldsQuery(req.query, defaults);
    //used to create an empty table if there are no jobs
    if (data.length === 0) {
        data.push({})
    }

    return Table.print(data, function(item, cell) {
        var fn = mappingFn ? mappingFn(item) : (field) => item[field];
        _.each(query, function(field) {
            cell(field, fn(field))
        });
    }, function(table) {
        if (req.query.hasOwnProperty('headers') && req.query.headers === 'false') {
            return table.print()
        }
        return table.toString()
    });
}

function fieldsQuery(query, defaults) {
    if (!query.fields) {
        return defaults ? defaults : [];
    }
    else {
        var results = query.fields.split(',').map(word => word.trim());

        if (results.length === 0) {
            return defaults
        }
        else {
            return results;
        }
    }
}

function sendError(res, code, error) {
    res.status(code).json({
        error: code,
        message: error
    });
}

module.exports = {
    makeTable: makeTable,
    sendError: sendError
};