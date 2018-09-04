'use strict';

const Promise = require('bluebird');
const stop = require('../cmds/job/stop');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let stopResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    status: () => stopResponse
                };
                return functions;
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
    });

    it('confirms job has been stopped', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse = {
            status: {
                status: 'stopped'
            }
        };
        return stop.handler(argv, _tjmTestFunctions)
            .then(response => expect(response.status.status).toEqual('stopped'))
            .catch(() => done.fail)
            .finally(() => done());
    });

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
    });

    it('throws an error if no status in response', (done) => {
        registeredCheck = Promise.resolve();
        stopResponse = {};
        return stop.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });
});
