'use strict';

const Promise = require('bluebird');
const errors = require('../cmds/job/errors');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let returnedErrors;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    errors: () => returnedErrors
                };
                return functions;
            }
        }
    }
};

describe('errors should show errors for a job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return errors.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should show errors if errors returned', (done) => {
        registeredCheck = Promise.resolve();
        returnedErrors = ['e1', 'e2', 'e3'];
        return errors.handler(argv, _tjmTestFunctions)
            .then(errorResponse => expect(errorResponse).toEqual(returnedErrors))
            .catch(() => done.fail)
            .finally(() => done());
    });

    it('should show no errors if no errors returned', (done) => {
        registeredCheck = Promise.resolve();
        returnedErrors = [];
        return errors.handler(argv, _tjmTestFunctions)
            .then(errorResponse => expect(errorResponse.length).toBe(0))
            .catch(() => done.fail)
            .finally(() => done());
    });
});
