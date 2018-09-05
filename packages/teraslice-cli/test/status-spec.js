'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const status = require('../cmds/job/status');

const tmpDir = createTempDirSync();

const jobFile = path.join(tmpDir, 'status-spec-job-file.json');

fs.copyFileSync(path.join(__dirname, 'fixtures', 'test_job_file.json'), jobFile);

const argv = {
    baseDir: tmpDir,
    job_file: jobFile
};

let registeredCheck;
let statusResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    status: () => statusResponse
                };
                return functions;
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
    });

    it('returns the status for a job', (done) => {
        registeredCheck = Promise.resolve();
        statusResponse = 'running';
        return status.handler(argv, _tjmTestFunctions)
            .then(response => expect(response).toEqual('running'))
            .catch(() => done.fail)
            .finally(() => done());
    });
});
