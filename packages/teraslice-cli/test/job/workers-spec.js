'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const workers = require('../../cmds/job/workers');

const tmpDir = createTempDirSync();

const jobFile = path.join(tmpDir, 'workers-spec-job-file.json');

fs.copyFileSync(path.join(__dirname, '../fixtures', 'test_job_file.json'), jobFile);

const argv = {
    baseDir: tmpDir,
    job_file: jobFile
};

let registeredCheck;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    changeWorkers: (param1, param2) => Promise.resolve(`${param1} ${param2} workers`)
                };

                return functions;
            }
        }
    }
};

describe('adds or removes workers from a job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        argv.param = 'add';
        argv.num = 5;
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return workers.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should ensure that argv.num is a positive number', (done) => {
        registeredCheck = Promise.resolve();
        argv.param = 'add';
        argv.num = -5;

        return workers.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });

    it('should add workers', (done) => {
        registeredCheck = Promise.resolve();
        argv.param = 'add';
        argv.num = 10;
        return workers.handler(argv, _tjmTestFunctions)
            .then(result => expect(result).toBe('add 10 workers'))
            .finally(() => done());
    });

    it('should remove workers', (done) => {
        registeredCheck = Promise.resolve();
        argv.param = 'remove';
        argv.num = 5;
        return workers.handler(argv, _tjmTestFunctions)
            .then(result => expect(result).toBe('remove 5 workers'))
            .finally(() => done());
    });
});
