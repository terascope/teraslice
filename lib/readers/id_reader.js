'use strict';

var _ = require('lodash');
var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;

var parallelSlicers = true;

function newSlicer(context, job, retryData, slicerAnalytics, logger, event) {
    var opConfig = getOpConfig(job.jobConfig, 'id_reader');
    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./id_slicer')(client, job, opConfig, logger, retryData, null, null, event)
}


function newReader(context, opConfig, jobConfig, event) {
    var client = getClient(context, opConfig, 'elasticsearch');

    return function(msg, logger) {
        var elasticsearch = require('elasticsearch_api')(client, logger, opConfig);
        var query = elasticsearch.buildQuery(opConfig, msg);
        return elasticsearch.search(query);
    };
}

function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: "",
            format: 'required_String'

        },
        type: {
            doc: 'type of the document in the index, used for key searches',
            default: "",
            format: 'required_String'
        },
        size: {
            doc: 'The keys will attempt to recurse until the chunk will be <= size',
            default: 10000,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for id_reader must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('size parameter for id_reader must be greater than zero')
                    }
                }
            }
        },
        full_response: {
            doc: 'Set to true to receive the full Elasticsearch query response including index metadata.',
            default: false,
            format: Boolean
        },
        key_type: {
            doc: 'The type of id used in index',
            default: 'base64url',
            format: ['base64url', 'hexadecimal', 'HEXADECIMAL']
        },
        key_range: {
            doc: 'if provided, slicer will only recurse on these given keys',
            default: null,
            format: function(val) {
                if (val) {
                    if (!_.isArray(val) && val.length === 0) {
                        throw new Error('key_range for id_reader must be an array with length > 0')
                    }
                }
            }
        },
        query: {
            doc: 'You may place a lucene query here, and the slicer will use it when making slices',
            default: "",
            format: 'optional_String'
        },
        fields: {
            doc: 'used to only return fields that you are interested in',
            default: null,
            format: function(val) {
                function isString(elem) {
                    return typeof elem === 'string'
                }

                if (val === null) {
                    return;
                }
                else {
                    if (!Array.isArray(val)) {
                        throw new Error("Fields parameter must be an array")
                    }
                    if (!val.every(isString)) {
                        throw new Error("the values listed in the fields array must be of type string")
                    }
                }
            }
        }
    };
}


function post_validation(job, sysconfig) {
    var opConfig = getOpConfig(job, 'id_reader');

    if (opConfig.key_range && job.slicers > opConfig.key_range.length) {
        throw new Error('The number of slicers specified on the job cannot be more the length of key_range')
    }

    if (opConfig.key_type === 'base64url') {
        if (job.slicers > 64) {
            throw new Error('The number of slicers specified on the job cannot be more than 64')
        }
    }

    if (opConfig.key_type === 'hexadecimal' || opConfig.key_type === 'HEXADECIMAL') {
        if (job.slicers > 16) {
            throw new Error('The number of slicers specified on the job cannot be more than 16')
        }
    }
}


module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    post_validation: post_validation,
    schema: schema,
    parallelSlicers: parallelSlicers
};