'use strict';

const path = require('path');
const Promise = require('bluebird');
const resume = require('../cmds/resume');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let jobStatus;
let resumeStatus;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                    return { 
                        status: () => jobStatus,
                        resume: () => resumeStatus
                    }
                }
            }
        }
};

describe('resume should restart a paused job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return resume.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('should throw an error if job is not paused', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'stopped'
        return resume.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('should resume job', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'paused'
        resumeStatus = {
            status: {
                status: 'running'
            }

        };

        return resume.handler(argv, _tjmTestFunctions)
            .then((status) => {
                expect(status.status.status).toEqual('running');
            })
            .catch(() => done.fail)
            .finally(() => done());
    })

    it('should throw error if resume status is not running', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'paused'
        resumeStatus = {
            status: {
                status: 'broken'
            }

        };

        return resume.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })
});