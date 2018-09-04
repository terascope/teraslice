'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const pause = require('../cmds/job/pause');

const tmpDir = createTempDirSync();

const jobFile = path.join(tmpDir, 'pause-spec-job-file.json');

fs.copyFileSync(path.join(__dirname, 'fixtures', 'test_job_file.json'), jobFile);

const argv = {
    baseDir: tmpDir,
    job_file: jobFile
};

let registeredCheck;
let jobStatus;
let pauseStatus;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    status: () => jobStatus,
                    pause: () => pauseStatus
                };
                return functions;
            }
        }
    }
};

describe('pause should pause jobs that are running', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return pause.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should throw an error if the job status is not running', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'stopped';
        return pause.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should throw an error if the pause status is not paused', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'running';
        pauseStatus = {
            status: {
                status: 'broken'
            }
        };
        return pause.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should pause the job', (done) => {
        registeredCheck = Promise.resolve();
        jobStatus = 'running';
        pauseStatus = {
            status: {
                status: 'paused'
            }
        };
        return pause.handler(argv, _tjmTestFunctions)
            .then((result) => {
                expect(result.status.status).toBe('paused');
            })
            .finally(() => done());
    });
});
