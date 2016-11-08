'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;
var elasticError = require('../utils/error_utils').elasticError;


var parallelSlicers = true;

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    var opConfig = getOpConfig(job.jobConfig, 'id_reader');
    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./id_slicer')(client, job, opConfig, logger, retryData)
}


function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');

    return function(msg, logger) {
        var query = {
            index: opConfig.index,
            size: msg.count ? msg.count : 200000,
            body: {
                query: {
                    wildcard: {
                        _uid: msg.key
                    }
                }
            }
        };
        //Duplicate
        return new Promise(function(resolve, reject) {
            client.search(query)
                .then(function(data) {
                    if (data._shards.failed > 0) {
                        var reasons = _.uniq(_.flatMap(data._shards.failures, function(shard) {
                            return shard.reason.type
                        }));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            var errorReason = reasons.join(' | ');
                            logger.error('Not all shards returned successful, shard errors: ', errorReason);
                            reject(errorReason)
                        }
                        else {
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error('Not all shards returned successful, shard errors: ', errorReason);
                            reject(errorReason)
                        }
                    }
                    else {
                        if (opConfig.full_response) {
                            resolve(data)
                        }
                        else {
                            resolve(_.map(data.hits.hits, function(hit) {
                                return hit._source
                            }));
                        }
                    }
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                });
        })
    }

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