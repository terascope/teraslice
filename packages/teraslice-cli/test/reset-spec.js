'use strict';

const fs = require('fs-extra');
const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const reset = require('../cmds/job/reset');

const tmpDir = createTempDirSync();

const jobFile = path.join(tmpDir, 'resetJobFile.json');

describe('reset should remove tjm data from file', () => {
    it('tjm data should be pulled from file', () => {
        fs.copyFileSync(path.join(__dirname, 'fixtures/test_job_file.json'), jobFile);
        // copy fixture file
        const argv = {
            baseDir: tmpDir,
            job_file: jobFile
        };

        reset.handler(argv)
            .then(() => {
                const updatedJobData = fs.readJsonSync(jobFile);
                expect(updatedJobData.tjm).toBeUndefined();
            });
    });
});
