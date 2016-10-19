'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var swapLastTwo = require('../utils/id_utils').swapLastTwo;
var getKeyArray = require('../utils/id_utils').getKeyArray;
var transformIds = require('../utils/id_utils').transformIds;
var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;
var emitter = require('../utils/events');
var Queue = require('../utils/queue');
var elasticError = require('../utils/error_utils').elasticError;


var idQueue = new Queue();

var parallelSlicers = false;

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    var opConfig = getOpConfig(job.jobConfig, 'id_reader');
    var client = getClient(context, opConfig, 'elasticsearch');


    /*function recurseID(keyArray, baseArray) {
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
     idQueue.enqueue({key: `${opConfig.type}#${str}*`});
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
     */
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
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    reject(errMsg)
                });
        })
    }

    function determineKeySlice(generator, closePath) {
        let data;
        if (closePath) {
            data = generator.next(closePath);
        }
        else {
            data = generator.next();
        }
        if (data.done) {
            return Promise.resolve(null);
        }
        let key = `${opConfig.type}#${data.value}*`;
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
                console.log('i got a count', count, key);
                if (count >= opConfig.size) {
                    console.log('recursing');
                    return determineKeySlice(generator)
                }
                else {
                    if (count !== 0) {
                        return {count: count, key: key};
                    }
                    else {
                        return determineKeySlice(generator, true)
                    }
                }
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                return Promise.reject(`Error in getCountForKey: ${errMsg}`)
            })
    }

    function *generateKeys(baseArray, keyArray, n) {
        var continueProcessing = [];
        console.log('the crazy generator is calling');
        for (let startKey of keyArray) {
            let processKey = yield startKey;

            if (!processKey && startKey.length !== n) {
                let str = startKey;

                while (str) {
                    for (let val of baseArray) {
                        let key = str + val;
                        //we wait for answer
                        var stopKey = yield key;
                        if (!stopKey && key.length !== n) {
                            continueProcessing.push(key)
                        }
                    }
                    str = continueProcessing.shift();
                }
            }
        }

        return null;
    }

    function divideKeyArray(keyArray, num) {
        let results = [];
        let len = num;

        for (let i = 0; i < len; i++) {
            var divideNum = Math.ceil(keyArray.length / len);

            if (i === num - 1) {
                divideNum = keyArray.length;
            }

            results.push(keyArray.splice(0, divideNum))
        }

        return results;
    }

    function keyGenerator(baseArray, keyArray, key_depth, retry) {
        let gen = generateKeys(baseArray, keyArray, key_depth);
        let closePath = false;
        if (retry) {
            //TODO while loop to get the generator to the right spot
        }
        return function() {
            return determineKeySlice(gen, closePath)
                .then(function(results) {
                    console.log('whats this results in slicer', results);
                    closePath = true;
                    return results
                })
        }
    }

    var keyRange = opConfig.key_range;
    var baseKeyArray = getKeyArray(opConfig);
    var keyArray = opConfig.key_range ? opConfig.key_range : baseKeyArray.slice();

    if (_.difference(keyRange, baseKeyArray).length > 0) {
        return Promise.reject(`key_range specified for id_reader contains keys not found in: ${opConfig.key_type}`)
    }

    var slicerKeySet = divideKeyArray(keyArray, job.jobConfig.slicers);
//TODO there could be a mismatch of slicers vs config slicers, need to deal with that in the retry ability

    //  console.log('slicerKeySet', slicerKeySet);

    return Promise.resolve(slicerKeySet.map(function(keySet) {
        return keyGenerator(baseKeyArray, keySet, opConfig.key_depth);
    }));
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


function post_validation(job, sysconfig) {
    var opConfig = getOpConfig(job, 'id_reader');

    if (opConfig.key_range && job.slicers > opConfig.key_range.length) {
        throw new Error('The number of slicers specified on the job cannot be more the length of key_range')
    }

    if (job.key_type === 'base64url') {
        if (job.slicers > 64) {
            throw new Error('The number of slicers specified on the job cannot be more than 64')
        }
    }

    if (job.key_type === 'hexadecimal') {
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