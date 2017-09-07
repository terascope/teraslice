'use strict';

var Promise = require('bluebird');
var getOpConfig = require('../utils/config').getOpConfig;
var mocker = require('mocker-data-generator');
var dataSchema = require('../utils/data_utils');

function parsedSchema(opConfig) {
    var schema = false;

    if (opConfig.json_schema) {
        var firstPath = opConfig.json_schema;
        var nextPath = process.cwd() + '/' + opConfig.json_schema;

        try {
            if (fs.existsSync(firstPath)) {
                schema = require(firstPath);
            }
            else {
                schema = require(nextPath);
            }
        }
        catch (e) {
            throw new Error('Could not retrieve code for: ' + opConfig + '\n' + e);
        }
    }
    else {
        return dataSchema(opConfig, schema);
    }
}

function newReader(context, opConfig, jobConfig) {
    var schema = parsedSchema(opConfig);

    return function(msg) {
        if (opConfig.stress_test) {
            var results = [];
            var data = mocker()
                .schema('schema', schema, 1)
                .build(function(data) {
                    return data.schema[0]
                });
            for (var i = 0; i < msg; i++) {
                results.push(data)
            }
            return results;
        }
        else {
            return mocker()
                .schema('schema', schema, msg)
                .build(function(data) {
                    return data.schema
                });
        }
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

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    var jobConfig = job.jobConfig;
    var opConfig = getOpConfig(jobConfig, 'elasticsearch_data_generator');
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
            default: "",
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
            default: "",
            format: 'optional_Date'
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: "",
            format: 'optional_Date'
        },
        format: {
            doc: 'This is only used with the teraslice provided schema, can elect different time structures' +
            'such as dateNow, utcDate, utcBetween and isoBetween',
            default: "",
            format: 'optional_String'
        },
        stress_test: {
            doc: 'used to speed up the creation process to test elasticsearch load',
            default: false,
            format: Boolean
        },
        date_key: {
            doc: 'key value on schema where date should reside',
            default: 'created',
            format: String
        },
        set_id: {
            doc: 'used to make an id on the data that will be used for the doc _id for elasticsearch, values: base64url, hexadecimal, HEXADECIMAL',
            default: "",
            format: 'optional_String'
        },
        id_start_key: {
            doc: 'set if you would like to force the first part of the ID to a certain character',
            default: "",
            format: 'optional_String'
        }
    };
}

function op_validation(op) {
    if (op.id_start_key && !op.set_id) {
        throw new Error('elasticsearch_data_generator is mis-configured, id_start_key must be used with set_id parameter, please set the missing parameters')
    }
}

function post_validation(job, sysconfig) {
    var opConfig = getOpConfig(job, 'elasticsearch_data_generator');

    if (opConfig.set_id) {
        var indexSelectorConfig = job.operations.find(function(op) {
            return op._op === 'elasticsearch_index_selector';
        });

        if (!indexSelectorConfig.id_field) {
            throw new Error('elasticsearch_data_generator is mis-configured, set_id must be used in tandem with id_field which is set in elasticsearch_index_selector')
        }

        if (indexSelectorConfig.id_field !== 'id') {
            throw new Error('id_field set in elasticsearch_index_selector must be set to "id" when elasticsearch_data_generator is creating ids')
        }
    }
}


module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    op_validation: op_validation,
    post_validation: post_validation,
    schema: schema
};


