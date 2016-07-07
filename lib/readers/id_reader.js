'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var swapLastTwo = require('../utils/id_utils').swapLastTwo;
var getKeyArray = require('../utils/id_utils').getKeyArray;
var transformIds = require('../utils/id_utils').transformIds;
var getClient = require('../utils/config').getClient;
var emitter = require('../utils/events');
var Queue = require('../utils/queue');

var idQueue = new Queue();

var parallelSlicers = false;

function newSlicer(context, job, retryData) {
    var opConfig = job.readerConfig;
    var logger = context.logger;
    var client = getClient(context, opConfig, 'elasticsearch');
    var slicers = [];

    function recurseID(keyArray, baseArray) {
        var transformed = transformIds(opConfig, keyArray);

        function recurse(arr) {
            return Promise.all(_.map(arr, function(key) {
                    var query = {
                        index: opConfig.index,
                        size: 0,
                        body: {
                            query: {
                                wildcard: {
                                    _uid: key
                                }
                            }
                        }
                    };

                    return getCountForKey(query)
                        .then(function(count) {
                            if (count >= opConfig.size) {
                                return recurse(_.map(baseArray, function(str) {
                                    return swapLastTwo(key + str)
                                }));
                            }
                            else {
                                if (count !== 0) {
                                    var data = {count: count, key: key};
                                    emitter.emit('data', data);
                                }
                            }
                        })
                        .catch(function(err) {
                            return Promise.reject('Error in getCountForKey: ' + JSON.stringify(err))
                        })
                })
            )
        }

        return recurse(transformed)
    }

    function getID(keyArray, baseArray) {
        var isDone = false;
        //TODO need to make this unique
        emitter.on('data', function(data) {
            idQueue.enqueue(data)
        });

        recurseID(keyArray, baseArray)
            .then(function() {
                isDone = true;
            });

        return function() {
            return new Promise(function(resolve, reject) {
                var interval = setInterval(function() {
                    if (idQueue.size()) {
                        clearInterval(interval);
                        resolve(idQueue.dequeue())
                    }
                    else {
                        if (isDone) {
                            clearInterval(interval);
                            resolve(null);
                        }
                    }
                }, 50)

            });
        }

    }

    //duplicate
    function getCountForKey(query) {
        return new Promise(function(resolve, reject) {
            client.search(query)
                .then(function(results) {
                    if (results._shards.failed > 0) {
                        var reasons = _.uniq(_.flatMap(results._shards.failures, function(shard) {
                            return shard.reason.type
                        }));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                        else {
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                    }
                    else {
                        resolve(results.hits.total)
                    }
                }).catch(function(err) {
                var errMsg = JSON.stringify(err);
                logger.error(errMsg);
                reject(errMsg)
            });
        })
    }

    function buildKeys(keyArray, baseArray) {

        function recurse(array, str, n) {
            if (str.length === n) {
                idQueue.enqueue({key: opConfig.type + '#' + str + '*'});
                return
            }
            else {
                for (var i = 0; i < array.length; i++) {
                    recurse(array, str + array[i], n)
                }
            }
        }

        keyArray.forEach(function(key) {
            recurse(baseArray, key, opConfig.key_depth);
        });
        if (opConfig.key_range) {
            logger.info(`slicer has generated ${idQueue.size()} slices for key_range ${opConfig.key_range}`)
        }
        else {
            logger.info(`slicer has generated ${idQueue.size()} slices for key_type ${opConfig.key_type}`)
        }
        return function() {
            return idQueue.dequeue();
        }
    }

    var keyRange = opConfig.key_range;
    var baseKeyArray = getKeyArray(opConfig);
    var keyArray = opConfig.key_range ? opConfig.key_range : baseKeyArray;

    if (_.difference(keyRange, baseKeyArray).length > 0) {
        return Promise.reject('key_range specified for id_reader contains keys not found in: ' + opConfig.key_type)
    }

    var slicerFn;

    if (opConfig.verify_count) {
        slicerFn = getID(keyRange, baseKeyArray)
    }
    else {
        slicerFn = buildKeys(keyArray, baseKeyArray, opConfig.key_depth)
    }

    for (var i = 0; i < job.jobConfig.slicers; i++) {
        slicers.push(slicerFn);
    }

    return Promise.resolve(slicers);
}


function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    var logger = context.logger;

    return function(msg) {
        var query = {
            index: opConfig.index,
            size: msg.count || 200000,
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
                }).catch(function(err) {
                var errMsg = JSON.stringify(err);
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
            default: '',
            format: 'required_String'

        },
        type: {
            doc: 'type of the document in the index, used for key searches',
            default: '',
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
            format: ['base64url', 'hexadecimal']
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
        verify_count: {
            doc: 'check against elasticsearch to make sure keys have the right slice size',
            default: true,
            format: Boolean
        },
        key_depth: {
            doc: 'used if verify_count is false, generates keys lengths equal to this number',
            default: 5,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('key_depth parameter for id_reader must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('key_depth parameter for id_reader must be greater than zero')
                    }
                }
            }
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};