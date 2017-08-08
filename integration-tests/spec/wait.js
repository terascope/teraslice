'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var misc = require('./misc')();

module.exports = function() {
    /*
     * Waits for the promise returned by 'func' to resolve to an array
     * then waits for the length of that array to match 'value'.
     */
    function forLength(func, value, iterations) {
        return forValue(
            function() {
                return func()
                    .then(function(result) {
                        return result.length
                    })
            },
            value, iterations);
    }

    /*
     * Waits for the promise returned by 'func' to resolve to a value
     * that can be compared to 'value'. It will wait 'iterations' of
     * time for the value to match before the returned promise will
     * reject.
     */
    function forValue(func, value, iterations) {
        if (! iterations) iterations = 100;
        var counter = 0;

        return new Promise(function(resolve, reject) {
            function checkValue() {
                func()
                    .then(function(result) {
                        counter++;

                        if (result === value) {
                            return resolve(result);
                        }
                        else {
                            setTimeout(checkValue, 500);
                        }

                        if (counter > iterations) {
                            reject(`forValue didn't find target value after ${iterations} iterations.`);
                        }
                    })
            }

            checkValue();
        });
    }

    /*
     * Wait for 'node_count' nodes to be available.
     */
    function forNodes(node_count) {
        return forLength(function() {
            return misc.teraslice().cluster
                .state()
                .then(function(state) {
                    return _.keys(state)
                });
        }, node_count);
    }

    return {
        forValue: forValue,
        forLength: forLength,
        forNodes: forNodes
    }
};
