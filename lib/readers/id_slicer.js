'use strict';

var _ = require('lodash');
var parseError = require('../utils/error_utils').parseError;

var base64url = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '\-', '_'];

var hexadecimal = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

var HEXADECIMAL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];


module.exports = function(client, job, opConfig, logger, retryData, range) {

    var keyRange = opConfig.key_range;
    var baseKeyArray = getKeyArray(opConfig);
    var keyArray = opConfig.key_range ? opConfig.key_range : baseKeyArray.slice();
    var elasticsearch = require('elasticsearch_api')(client, logger, opConfig);
    var numOfRetries = job.max_retries;
    var retry = {};

    function retryKey(key, err, fn, msg) {
        var errMessage = parseError(err);
        logger.error('error while getting next slice', errMessage);

        if (!retry[key]) {
            retry[key] = 1;
            fn(msg)
        }
        else {
            retry[key] += 1;
            if (retry[key] > numOfRetries) {
                return Promise.reject(`max_retries met for slice, key: ${key}`, errMessage);
            }
            else {
                fn(msg)
            }
        }
    }

    function getCountForKey(query) {
        return elasticsearch.search(query);
    }

    function getKeyArray(opConfig) {
        if (opConfig.key_type === 'base64url') {
            return base64url.slice();
        }
        if (opConfig.key_type === 'hexadecimal') {
            return hexadecimal.slice();
        }
        if (opConfig.key_type === 'HEXADECIMAL') {
            return HEXADECIMAL.slice();
        }
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
        let msg = {count: 0, key: key};

        //this is used by elasticsearch slicer if slice is to large and its set to break it up further by key
        if (rangeObj) {
            msg = {
                start: rangeObj.start,
                end: rangeObj.end,
                key: key
            };
        }

        let query = elasticsearch.buildQuery(opConfig, msg);

        function getKeySlice(query) {
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
                    return retryKey(key, err, getKeySlice, query)
                })
        }

        return getKeySlice(query)
    }

    function* recurse(baseArray, str) {
        for (let key of baseArray) {
            let newStr = str + key;
            let resp = yield newStr;

            if (!resp) {
                yield* recurse(baseArray, newStr)
            }
        }
        return
    }

    function* generateKeys(baseArray, keyArray) {
        for (let startKey of keyArray) {
            let processKey = yield startKey;

            if (!processKey) {
                yield *recurse(baseArray, startKey)
            }
        }

        return null
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

    function keyGenerator(baseArray, keyArray, retryKey, range) {
        let gen = generateKeys(baseArray, keyArray);
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
                .catch(function(err) {
                    var errMessage = parseError(err);
                    logger.error('id_slicer errored while making slice', errMessage);
                    return Promise.reject(errMessage)
                })
        }
    }

    //return true if the keys do not match
    function compareKeys(key, retryKey) {
        for (let i = 0; i < key.length; i++) {
            if (key[i] !== retryKey[i]) {
                return true;
            }
        }
        return false;
    }


    if (_.difference(keyRange, baseKeyArray).length > 0) {
        return Promise.reject(`key_range specified for id_reader contains keys not found in: ${opConfig.key_type}`)
    }

    var slicerKeySet = divideKeyArray(keyArray, job.jobConfig.slicers);

    if (retryData && retryData.length > 0) {
        //slicer is being used as a subslicer, needs to ignore multiple slicer configs and division of key array
        if (range) {
            return Promise.resolve(retryData.map(function(retryData) {
                return keyGenerator(baseKeyArray, baseKeyArray, retryData.key, range);
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
                return keyGenerator(baseKeyArray, keySet, formattedRetryData[index], range);
            }));
        }
    }
    else {
        return Promise.resolve(slicerKeySet.map(function(keySet) {
            return keyGenerator(baseKeyArray, keySet);
        }));
    }
};
