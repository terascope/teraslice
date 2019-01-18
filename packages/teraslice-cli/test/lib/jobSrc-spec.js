'use strict';

const path = require('path');
const process = require('process');
const fs = require('fs-extra');
const JobSrc = require('../../lib/job-src');

describe('JobSrc', () => {
    let jobFile;
    const jobPath = path.join(process.cwd(), 'test', 'fixtures');

    beforeEach(() => {
        jobFile = {};
    });

    function writeJob(jobName = 'jobFile.json') {
        fs.writeJsonSync(path.join(jobPath, jobName), jobFile, { spaces: 4 });
    }

    function deleteJob(jobName = 'jobFile.json') {
        fs.removeSync(path.join(jobPath, jobName));
    }


    it('should throw an error on a bad job path', () => {
        try {
            const job = new JobSrc('badDir', 'someJob.json'); // eslint-disable-line no-unused-vars
        } catch (e) {
            expect(e).toBe('Cannot find badDir/someJob.json, check your path and file name and try again');
        }
    });

    it('job should throw an error if bad content', () => {
        jobFile.name = 'jobName';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'someop'
            }
        ];

        writeJob();
        try {
            const job = new JobSrc(jobPath, 'jobFile.json'); // eslint-disable-line no-unused-vars
        } catch (e) {
            expect(e).toBe('Job must have a name, workers, and at least 2 operations');
        }
        deleteJob();
    });

    it('should return correct version', () => {
        const jobName = 'legitJob.json';
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            }
        ];
        writeJob(jobName);
        const { version } = require('../../package.json');
        try {
            const job = new JobSrc(jobPath, jobName);
            expect(job.version).toBe(version);
        } catch (e) {
            fail(e);
        }
        deleteJob(jobName);
    });

    it('should add metaData to job contents', () => {
        const jobName = 'addMetaData.json';
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            }
        ];
        writeJob(jobName);
        const { version } = require('../../package.json');
        try {
            const job = new JobSrc(jobPath, jobName);
            job.addMetaData('1234', 'localhost');
            const { content } = job;
            expect(content.__metadata.cli.version).toBe(version);
            expect(content.__metadata.cli.job_id).toBe('1234');
            expect(content.__metadata.cli.cluster).toBe('localhost');
            expect(content.__metadata.cli.updated).toBeDefined();
        } catch (e) {
            fail(e);
        }
        deleteJob(jobName);
    });

    it('should check presence of metadataCheck false', () => {
        const jobName = 'metaCheck.json';
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            }
        ];
        writeJob(jobName);
        try {
            const job = new JobSrc(jobPath, jobName);
            expect(job.metaDataCheck()).toBe(false);
        } catch (e) {
            fail(e);
        }
        deleteJob(jobName);
    });

    it('should check presence of metadataCheck true', () => {
        const jobName = 'metaCheck.json';
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            }
        ];
        writeJob(jobName);
        try {
            const job = new JobSrc(jobPath, 'metaCheck.json');
            job.addMetaData('1234', 'localhost');
            expect(job.metaDataCheck()).toBe(true);
        } catch (e) {
            fail(e);
        }
        deleteJob(jobName);
    });

    it('should overwrite old job file', () => {
        const jobName = 'overwrite.json';
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            }
        ];
        writeJob(jobName);
        const job = new JobSrc(jobPath, jobName);
        job.addMetaData('1234', 'localhost');
        job.overwrite();
        const overwrittenPath = path.join(jobPath, jobName);
        const overwritten = fs.readJsonSync(overwrittenPath);
        expect(overwritten.__metadata).toBeDefined();
        deleteJob(jobName);
    });
});
