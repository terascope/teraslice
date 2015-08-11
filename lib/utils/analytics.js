
'use strict';
var moment = require('moment');
var Promise = require('bluebird');

function analyze(fn) {

    return function(obj, data) {
        var start = moment();
        var end;

        return Promise.resolve(fn(data))
            .then(function(result) {
                end = moment();
               obj.time.push(end - start);
                if (result) {
                    if (result.hits && result.hits.hits) {
                        obj.size.push(result.hits.hits.length);
                    }
                    else if (result.length) {
                        obj.size.push(result.length);
                    }
                }
                return result;
            });
    }
}

function insertAnalyzers(array) {
    return array.map(function(fn) {
        return analyze(fn);
    })
}

module.exports = {
    analyze: analyze,
    insertAnalyzers: insertAnalyzers
};