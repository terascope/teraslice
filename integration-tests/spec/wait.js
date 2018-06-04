'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const misc = require('./misc')();

module.exports = function wait() {
    /*
     * Waits for the promise returned by 'func' to resolve to an array
     * then waits for the length of that array to match 'value'.
     */
    function forLength(func, value, iterations) {
        return forValue(
            () => func()
                .then(result => result.length),
            value, iterations
        );
    }

    /*
     * Waits for the promise returned by 'func' to resolve to a value
     * that can be compared to 'value'. It will wait 'iterations' of
     * time for the value to match before the returned promise will
     * reject.
     */
    function forValue(func, value, _iterations) {
        const iterations = _iterations || 100;
        let counter = 0;

        return new Promise(((resolve, reject) => {
            function checkValue() {
                func()
                    .then((result) => {
                        counter += 1;
                        if (result === value) {
                            resolve(result);
                            return;
                        }
                        if (counter > iterations) {
                            reject(`forValue didn't find target value after ${iterations} iterations.`);
                        } else {
                            setTimeout(checkValue, 500);
                        }
                    });
            }

            checkValue();
        }));
    }

    /*
     * Wait for 'node_count' nodes to be available.
     */
    function forNodes(nodeCount) {
        return forLength(() => misc.teraslice().cluster
            .state()
            .then(state => _.keys(state)), nodeCount);
    }

    /*
     * Wait for 'workerCount' workers to be joined on job 'jobId'.  `iterations`
     * is passed to forValue and indicates how many times the condition will be
     * tested for.
     * TODO: Implement a more generic function that waits for states other than
     * 'joined'
     */
    function forWorkersJoined(jobId, workerCount, iterations) {
        return forValue(() => misc.teraslice().cluster
            .slicers()
            .then((slicers) => {
                const slicer = _.find(slicers, s => s.job_id === jobId);
                if (slicer !== undefined) {
                    return slicer.workers_joined;
                }
                return 0;
            }), workerCount, iterations)
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
