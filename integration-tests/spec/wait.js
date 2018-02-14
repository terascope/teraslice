'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var misc = require('./misc')();

module.exports = function wait() {
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

                        if (counter > iterations) {
                            reject(`forValue didn't find target value after ${iterations} iterations.`);
                        }
                        else {
                            setTimeout(checkValue, 500);
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

    /*
     * Wait for 'workerCount' workers to be joined on job 'jobId'.  `iterations`
     * is passed to forValue and indicates how many times the condition will be
     * tested for.
     * TODO: Implement a more generic function that waits for states other than
     * 'joined'
     */
    function forWorkersJoined(jobId, workerCount, iterations) {
        return forValue(() => {
            return misc.teraslice().cluster
                .slicers()
                .then((slicers) => {
                    const slicer = _.find(slicers, s => s.job_id === jobId);
                    if (slicer !== undefined) {
                        return slicer.workers_joined;
                    }
                    return 0;
                });
        }, workerCount, iterations)
            .catch((e) => {
                throw (new Error(`(forWorkersJoined) ${e}`));
            });
    }

    return {
        forValue,
        forLength,
        forNodes,
        forWorkersJoined
    };
};
