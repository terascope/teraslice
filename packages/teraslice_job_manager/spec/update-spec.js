'use strict';

const Promise = require('bluebird');
const update = require('../cmds/update');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let newJobContents;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    status: () => Promise.resolve('running'),
                    stop: () => Promise.resolve({
                        status: {
                            status: 'stopped'
                        }
                    }),
                    start: () => Promise.resolve({ job_id: 12345 })
                };
                return functions;
            }
        },
        cluster: {
            put: () => newJobContents
        }
    }
};

describe('should update job file with option to restart job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return update.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should throw an error if job data not returned from teraslice client', (done) => {
        registeredCheck = Promise.resolve();
        newJobContents = {};
        return update.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should update job and return status if argv.r is present', (done) => {
        registeredCheck = Promise.resolve();
        newJobContents = {
            jobName: 'sameName',
            operations: [
                { _op: 'someop' }
            ],
            tjm: {
                cluster: 'example.dev:5678',
                job_id: 12345
            }
        };

        argv.r = true;
        return update.handler(argv, _tjmTestFunctions)
            .then(restart => expect(restart.job_id).toBe(12345))
            .finally(() => done());
    });

    it('should update job and return if argv.r is not present', (done) => {
        registeredCheck = Promise.resolve();
        newJobContents = {
            jobName: 'sameName',
            operations: [
                { _op: 'someop' }
            ],
            tjm: {
                cluster: 'example.dev:5678',
                job_id: 12345
            }
        };
        argv.r = false;
        return update.handler(argv, _tjmTestFunctions)
            .then(updateResult => expect(updateResult).toBeUndefined())
            .finally(() => done());
    });
});
