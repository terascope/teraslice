'use strict';

const path = require('path');
const Promise = require('bluebird');
const status = require('../cmds/status');

const argv = {
    jobFile: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let statusResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    teraslice: {
        jobs: {
            wrap: (jobId) => {
                    return { 
                        status: () => statusResponse
                    }
                }
            }
        }
};

describe('status displays the current status for a job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return status.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('returns the status for a job', (done) => {
        registeredCheck = Promise.resolve();
        statusResponse = 'running';
        return status.handler(argv, _tjmTestFunctions)
            .then((status) => {
                expect(status).toEqual('running');
            })
            .catch(() => done.fail)
            .finally(() => done());
    })
});