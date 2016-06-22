'use strict';

var jsf = require('json-schema-faker');
var parsedSchema = require('../utils/elastic_utils').parsedSchema;
var Promise = require('bluebird');


function newReader(context, opConfig, jobConfig) {
    var schema = parsedSchema(opConfig);

    return function(msg) {
        var results = [];
        if (opConfig.stress_test) {
            var data = jsf(schema);
            for (var i = 0; i < msg; i++) {
                results.push(data)
            }
        }
        else {
            for (var i = 0; i < msg; i++) {
                results.push(jsf(schema))
            }
        }

        return results;
    }
}

function onceGenerator(context, opConfig, jobConfig) {
    var numOfRecords = opConfig.size;
    var lastOp = jobConfig.operations[jobConfig.operations.length - 1];
    var interval = lastOp.size ? lastOp.size : 5000;

    return function() {
        if (numOfRecords <= 0) {
            return null;
        }
        else {
            if (numOfRecords - interval >= 0) {
                numOfRecords = numOfRecords - interval;
                return interval;
            }
            else {
                var finalCount = numOfRecords;
                numOfRecords = 0;
                return finalCount;
            }
        }
    }
}

function persistentGenerator(context, opConfig, jobConfig) {
    return function() {
        return opConfig.size;
    }
}

function newSlicer(context, job, retryData) {
    var opConfig = job.readerConfig;
    var jobConfig = job.jobConfig;
    var slicers = [];

    if (jobConfig.lifecycle === 'once') {
        slicers.push(onceGenerator(context, opConfig, jobConfig))
    }
    else {
        slicers.push(persistentGenerator(context, opConfig, jobConfig))
    }

    return Promise.resolve(slicers)
}

function schema() {
    return {
        json_schema: {
            doc: 'file path to custom data schema',
            default: '',
            format: 'optional_String'
        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_data_generator must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('size parameter for elasticsearch_data_generator must be greater than zero')
                    }
                }
            }
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: '',
            format: 'optional_Date'
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: '',
            format: 'optional_Date'
        },
        format: {
            doc: 'This is only used with the teraslice provided schema, can elect different time structures' +
            'such as dateNow, utcDate, utcBetween and isoBetween',
            default: '',
            format: 'optional_String'
        },
        stress_test: {
            doc: 'used to speed up the creation process to test elasticsearch load',
            default: false,
            format: Boolean
        }
    };
}

var parallelSlicers = false;

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};


