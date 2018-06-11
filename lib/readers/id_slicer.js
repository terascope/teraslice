'use strict';

const _ = require('lodash');
const parseError = require('error_parser');
const retryModule = require('../utils/error_utils').retryModule;

const base64url = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '\-', '_'];

const hexadecimal = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

const HEXADECIMAL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];


module.exports = function (context, client, executionContext, opConfig, logger, retryData, range) {
    const keyRange = opConfig.key_range;
    const baseKeyArray = getKeyArray(opConfig);
    const keyArray = opConfig.key_range ? opConfig.key_range : baseKeyArray.slice();
    const startingKeyDepth = opConfig.starting_key_depth;
    const elasticsearch = require('@terascope/elasticsearch-api')(client, logger, opConfig);
    const executionConfig = executionContext.config;
    const retryError = retryModule(logger, executionConfig.max_retries);
    const events = context.apis.foundation.getSystemEvents();


    function getCountForKey(query) {
        return elasticsearch.count(query);
    }

    function getKeyArray(config) {
        if (config.key_type === 'base64url') {
            return base64url.slice();
        }
        if (config.key_type === 'hexadecimal') {
            return hexadecimal.slice();
        }
        if (config.key_type === 'HEXADECIMAL') {
            return HEXADECIMAL.slice();
        }
        return new Error('could not find correct key type');
    }

    function determineKeySlice(generator, closePath, rangeObj) {
        let data;
        if (closePath) {
            data = generator.next(closePath);
        } else {
            data = generator.next();
        }

        if (data.done) {
            return Promise.resolve(null);
        }

        const key = `${opConfig.type}#${data.value}*`;
        let msg = { key };

        // this is used by elasticsearch slicer if slice is to large and its
        // set to break it up further by key
        if (rangeObj) {
            msg = {
                start: rangeObj.start,
                end: rangeObj.end,
                key
            };
        }

        const esQuery = elasticsearch.buildQuery(opConfig, msg);

        function getKeySlice(query) {
            return getCountForKey(query)
                .then((count) => {
                    if (count >= opConfig.size) {
                        events.emit('slicer:slice:recursion');
                        return determineKeySlice(generator, false, rangeObj);
                    }

                    if (count !== 0) {
                        // the closing of this path happens at keyGenerator
                        if (range) {
                            range.count = count;
                            range.key = key;
                            return range;
                        }
                        return { count, key };
                    }

                    // if count is zero then close path to prevent further iteration
                    return determineKeySlice(generator, true, rangeObj);
                })
                .catch(err => retryError(key, err, getKeySlice, query));
        }

        return getKeySlice(esQuery);
    }

    function* recurse(baseArray, str) {
        for (const key of baseArray) {
            const newStr = str + key;
            const resp = yield newStr;

            if (!resp) {
                yield* recurse(baseArray, newStr);
            }
        }
    }

    function* recurseDepth(baseArray, str) {
        for (const key of baseArray) {
            const newStr = str + key;

            if (newStr.length >= startingKeyDepth) {
                const resp = yield newStr;

                if (!resp) {
                    yield* recurse(baseArray, newStr);
                }
            } else {
                yield* recurse(baseArray, newStr);
            }
        }
    }

    function* generateKeys(baseArray, keysArray) {
        for (const startKey of keysArray) {
            const processKey = yield startKey;

            if (!processKey) {
                yield* recurse(baseArray, startKey);
            }
        }

        return null;
    }

    function* generateKeyDepth(baseArray, keysArray) {
        for (const startKey of keysArray) {
            yield* recurseDepth(baseArray, startKey);
        }

        return null;
    }

    function divideKeyArray(keysArray, num) {
        const results = [];
        const len = num;

        for (let i = 0; i < len; i++) {
            let divideNum = Math.ceil(keysArray.length / len);

            if (i === num - 1) {
                divideNum = keysArray.length;
            }

            results.push(keysArray.splice(0, divideNum));
        }

        return results;
    }

    function keyGenerator(baseArray, keysArray, retryKey, dateRange) {
        // if there is a starting depth, use the key depth generator, if not use default generator
        const gen = startingKeyDepth ? generateKeyDepth(baseArray, keysArray) : generateKeys(baseArray, keysArray);
        let closePath = false;

        if (retryKey) {
            let foundKey = false;
            let skipKey = false;
            closePath = true;

            while (!foundKey) {
                const key = gen.next(skipKey).value;
                if (key === null) {
                    foundKey = true;
                } else {
                    // reset skipKey if used
                    if (skipKey) {
                        skipKey = false;
                    }
                    if (compareKeys(key, retryKey)) {
                        skipKey = true;
                    } else if (key === retryKey) {
                        foundKey = true;
                    }
                }
            }
        }
        return function () {
            return determineKeySlice(gen, closePath, dateRange)
                .then((results) => {
                    closePath = true;
                    return results;
                })
                .catch((err) => {
                    const errMessage = parseError(err);
                    logger.error('id_slicer errored while making slice', errMessage);
                    return Promise.reject(errMessage);
                });
        };
    }

    // return true if the keys do not match
    function compareKeys(key, retryKey) {
        for (let i = 0; i < key.length; i += 1) {
            if (key[i] !== retryKey[i]) {
                return true;
            }
        }
        return false;
    }


    if (_.difference(keyRange, baseKeyArray).length > 0) {
        return Promise.reject(`key_range specified for id_reader contains keys not found in: ${opConfig.key_type}`);
    }

    const slicerKeySet = divideKeyArray(keyArray, executionConfig.slicers);

    if (retryData && retryData.length > 0) {
        // slicer is being used as a subslicer, needs to ignore multiple slicer
        // configs and division of key array
        if (range) {
            return Promise.resolve(retryData.map(retryData => keyGenerator(baseKeyArray, baseKeyArray, retryData.key, range)));
        }

        // real retry of executionContext here, need to reformat retry data
        const formattedRetryData = retryData.map((obj) => {
            // regex to get str between # and *
            if (obj.lastSlice) {
                return obj.lastSlice.key.match(/\#(.*)\*/)[1];
            }
            // some slicers might not have a previous slice, need to start from scratch
            return '';
        });

        return Promise.resolve(slicerKeySet.map((keySet, index) => keyGenerator(baseKeyArray, keySet, formattedRetryData[index], range)));
    }

    return Promise.resolve(slicerKeySet.map(keySet => keyGenerator(baseKeyArray, keySet)));
};
