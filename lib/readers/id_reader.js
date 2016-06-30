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

    function recurseID(keyArray) {
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
                            console.log('should be running', count, key);

                            if (count >= opConfig.size) {
                                return recurse(_.map(keyArray, function(str) {
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
                            console.log('what to do here in error catch of recurseID', err);
                        })
                })
            )
        }

        return recurse(transformed)
    }

    function getID(keyArray) {
        var isDone = false;
        //TODO need to make this unique
        emitter.on('data', function(data) {
            idQueue.push(data)
        });

        recurseID(keyArray)
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

    
    

    slicers.push(getID(getKeyArray(opConfig)));

    return Promise.resolve(slicers);
}


function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    var logger = context.logger;

    return function(msg) {
        var query = {
            index: opConfig.index,
            size: msg.count,
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
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 10000,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_reader must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('size parameter for elasticsearch_reader must be greater than zero')
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
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};