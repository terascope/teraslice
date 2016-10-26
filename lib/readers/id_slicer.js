'use strict';

var elasticError = require('../utils/error_utils').elasticError;
var getKeyArray = require('../utils/id_utils').getKeyArray;
var buildQuery = require('../utils/elastic_utils').buildQuery;

var _ = require('lodash');


module.exports = function(client, job, opConfig, logger, retryData, range) {

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

    function determineKeySlice(generator, closePath, rangeObj) {
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

        let query = {
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

        if (rangeObj) {
            var range = {
                start: rangeObj.start,
                end: rangeObj.end,
                key: key
            };
            query = buildQuery(opConfig, range)
        }

        return getCountForKey(query)
            .then(function(count) {
                if (count >= opConfig.size) {
                    return determineKeySlice(generator, false, rangeObj)
                }
                else {
                    if (count !== 0) {
                        // the closing of this path happens at keyGenerator
                        if (range) {
                            range.count = count;
                            return range;
                        }
                        return {count: count, key: key};
                    }
                    else {
                        //if count is zero then close path to prevent further iteration
                        return determineKeySlice(generator, true, rangeObj)
                    }
                }
            })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`Error in determining key slice ${errMsg}`);
                return Promise.reject(`Error in getCountForKey: ${errMsg}`)
            })
    }

    function *generateKeys(baseArray, keyArray, n) {
        var continueProcessing = [];

        for (let startKey of keyArray) {
            //yield top level key
            let processKey = yield startKey;

            //if that key doesn't need processing then skip it
            if (!processKey && startKey.length !== n) {
                let str = startKey;

                while (str) {
                    for (let val of baseArray) {
                        let key = str + val;
                        //yield key to check if it needs to be further processed (ie the count is to big)
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

    function keyGenerator(baseArray, keyArray, key_depth, retryKey, range) {
        let gen = generateKeys(baseArray, keyArray, key_depth);
        let closePath = false;

        if (retryKey) {
            let foundKey = false;
            let skipKey = false;
            closePath = true;

            while (!foundKey) {
                let key = gen.next(skipKey).value;
                if (key === null) {
                    foundKey = true;
                }
                else {
                    //reset skipKey if used
                    if (skipKey) {
                        skipKey = false;
                    }
                    if (compareKeys(key, retryKey)) {
                        skipKey = true;
                    }
                    else {
                        if (key === retryKey) {
                            foundKey = true;
                        }
                    }
                }
            }
        }
        return function() {
            return determineKeySlice(gen, closePath, range)
                .then(function(results) {
                    closePath = true;
                    return results
                })
        }
    }

    function compareKeys(key, retryKey) {
        for (let i = 0; i < key.length; i++) {
            if (key[i] !== retryKey[i]) {
                return true;
            }
        }
    }

    var keyRange = opConfig.key_range;
    var baseKeyArray = getKeyArray(opConfig);
    var keyArray = opConfig.key_range ? opConfig.key_range : baseKeyArray.slice();

    if (_.difference(keyRange, baseKeyArray).length > 0) {
        return Promise.reject(`key_range specified for id_reader contains keys not found in: ${opConfig.key_type}`)
    }

    var slicerKeySet = divideKeyArray(keyArray, job.jobConfig.slicers);

    if (retryData && retryData.length > 0) {
        //slicer is being used as a subslicer, needs to ignore multiple slicer configs and division of key array
        if (range) {
            return Promise.resolve(retryData.map(function(retryData) {
                return keyGenerator(baseKeyArray, baseKeyArray, opConfig.key_depth, retryData.key, range);
            }))
        }
        else {
            //real retry of job here, need to reformat retry data
            let formattedRetryData = retryData.map(obj => {
                //regex to get str between # and *
                if (obj.lastSlice) {
                    return obj.lastSlice.key.match(/\#(.*)\*/)[1];
                }
                else {
                    //some slicers might not have a previous slice, need to start from scratch
                    return '';
                }
            });

            return Promise.resolve(slicerKeySet.map(function(keySet, index) {
                return keyGenerator(baseKeyArray, keySet, opConfig.key_depth, formattedRetryData[index], range);
            }));
        }
    }
    else {
        return Promise.resolve(slicerKeySet.map(function(keySet) {
            return keyGenerator(baseKeyArray, keySet, opConfig.key_depth);
        }));
    }
};
