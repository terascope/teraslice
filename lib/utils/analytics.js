'use strict';
var moment = require('moment');
var Promise = require('bluebird');

function analyze(fn) {

    return function(data) {
        var start = moment();
        var end;

        return Promise.resolve(fn(data))
            .then(function(result) {
                end = moment();
                console.log('this is time', end - start);
                if (result) {
                    if (result.hits && result.hits.hits) {
                        console.log('number of docs retrieved from elasticsearch', result.hits.hits.length);
                    }
                    if (result.length) {
                        console.log('length of transformed data', result.length);
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