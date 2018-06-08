'use strict';

const path = require('path');
const Promise = require('bluebird');
const stop = require('../cmds/stop');

const argv = {
    jobFile: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let stopResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    teraslice: {
        jobs: {
            wrap: (jobId) => {
                    return { 
                        status: () => stopResponse
                    }
                }
            }
        }
};

describe('stops job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return stop.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('confirms job has been stopped', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse = {
            status: {
                status: 'stopped'
            }
        };
        return stop.handler(argv, _tjmTestFunctions)
            .then((stopResponse) => {
                expect(stopResponse.status.status).toEqual('stopped');
            })
            .catch(() => done.fail)
            .finally(() => done());
    })

    it('throws an error if status is not stopped', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse = {
            status: {
                status: 'running'
            }
        };
        return stop.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('throws an error if no status in response', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse = {};
        return stop.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })
});