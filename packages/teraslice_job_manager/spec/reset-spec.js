'use strict';

const fs = require('fs-extra');
const path = require('path');
const reset = require('../cmds/job/reset');

describe('reset should remove tjm data from file', () => {
    const jobPath = path.join(__dirname, '/fixtures/resetJobFile.json');
    beforeEach(() => {
        const fakeJobData = require('./fixtures/test_job_file.json');
        return fs.writeJson(jobPath, fakeJobData, { spaces: 4 });
    });
    afterEach(() => fs.remove(jobPath));

    it('tjm data should be pulled from file', () => {
        // copy fixture file
        const argv = {
            job_file: 'spec/fixtures/resetJobFile.json'
        };

        const fakeJobData = require('./fixtures/test_job_file.json');
        return fs.writeJson(jobPath, fakeJobData, { spaces: 4 })
            .then(() => reset.handler(argv))
            .then(() => {
                const updatedJobData = fs.readJson(jobPath);
                expect(updatedJobData.tjm).toBeUndefined();
            });
    });
});
