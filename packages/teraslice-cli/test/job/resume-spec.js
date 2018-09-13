'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const resume = require('../../cmds/job/resume');

const tmpDir = createTempDirSync();

const jobFile = path.join(tmpDir, 'resume-spec-job-file.json');

fs.copyFileSync(path.join(__dirname, '../fixtures', 'test_job_file.json'), jobFile);

const argv = {
    job_file: jobFile
};

let registeredCheck;
let jobStatus;
let resumeStatus;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    status: () => jobStatus,
                    resume: () => resumeStatus
                };
                return functions;
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
    });

    it('should throw an error if job is not paused', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'stopped';
        return resume.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should resume job', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'paused';
        resumeStatus = {
            status: {
                status: 'running'
            }

        };

        return resume.handler(argv, _tjmTestFunctions)
            .then(status => expect(status.status.status).toEqual('running'))
            .catch(() => done.fail)
            .finally(() => done());
    });

    it('should throw error if resume status is not running', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'paused';
        resumeStatus = {
            status: {
                status: 'broken'
            }
        };

        return resume.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });
});
