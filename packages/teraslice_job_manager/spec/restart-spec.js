'use strict';

const path = require('path');
const Promise = require('bluebird');
const restart = require('../cmds/restart');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let startResponse;
let stopResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    teraslice: {
        jobs: {
            wrap: (jobId) => {
                    return { 
                        stop: () => stopResponse,
                        start: () => startResponse
                    }
                }
            }
        }
};

describe('start should start a job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return restart.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('should throw an error if job is not stopped', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse =  stopResponse = {
            status: {
                status: 'running'
            }
        };
        return restart.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('should throw error if start response does not have the job_id', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse =  stopResponse = {
            status: {
                status: 'stopped'
            }
        };
        startResponse = { };
        return restart.handler(argv, _tjmTestFunctions)
            .then(done.fail)
        .   catch(() => done());
    })

    it('should restart job', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse =  stopResponse = {
            status: {
                status: 'stopped'
            }
        };
        startResponse = { job_id: 'success' };
        return restart.handler(argv, _tjmTestFunctions)
            .then((startResponse) => {
                expect(startResponse.job_id).toEqual('success');
            })
            .catch(() => done.fail)
            .finally(() => done());
    })
});