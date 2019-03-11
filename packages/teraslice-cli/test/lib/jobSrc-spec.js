'use strict';

const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const JobSrc = require('../../lib/job-src');

describe('JobSrc', () => {
    let jobFile;
    let args;
    const jobPath = createTempDirSync();
    const { version } = require('../../package.json');

    beforeEach(() => {
        jobFile = {};
        args = {
            srcDir: jobPath,
            jobFile: 'jobFile.json'
        };
    });

    afterAll(() => {
        fs.removeSync(jobPath);
    });

    function writeJob(jobName = 'jobFile.json') {
        fs.writeJsonSync(path.join(jobPath, jobName), jobFile, { spaces: 4 });
    }

    it('should throw an error on a bad job path', () => {
        delete args.srcDir;

        try {
            const job = new JobSrc(args); // eslint-disable-line no-unused-vars
        } catch (e) {
            expect(e).toBe('The job file or source directory are missing');
        }
    });

    it('should throw an error on a bad job name', () => {
        args.jobFile = 'badjobname';
        try {
            const job = new JobSrc(args);
            job.readFile();
        } catch (e) {
            expect(e).toBe(`Cannot find ${path.join(jobPath, 'badjobname')}, check your path and file name and try again`);
        }
    });

    it('job should throw an error if invalid job content', () => {
        jobFile.name = 'jobName';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'someop'
            }
        ];

        writeJob();
        try {
            const job = new JobSrc(args); // eslint-disable-line no-unused-vars
            job.validateJob();
        } catch (e) {
            expect(e).toBe('Job must have a name, workers, and at least 2 operations');
        }
    });

    it('should return correct version', () => {
        try {
            const job = new JobSrc(args);
            expect(job.version).toBe(version);
        } catch (e) {
            fail(e);
        }
    });

    it('should add metaData to job contents', () => {
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
        writeJob();
        try {
            const job = new JobSrc(args);
            job.readFile();
            job.addMetaData('1234', 'localhost');
            const { content } = job;
            expect(content.__metadata.cli.version).toBe(version);
            expect(content.__metadata.cli.job_id).toBe('1234');
            expect(content.__metadata.cli.cluster).toBe('localhost');
            expect(content.__metadata.cli.updated).toBeDefined();
        } catch (e) {
            fail(e);
        }
    });

    it('should check presence of metadataCheck false', () => {
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
        writeJob();
        try {
            const job = new JobSrc(args);
            job.readFile();
            expect(job.hasMetaData).toBe(false);
        } catch (e) {
            fail(e);
        }
    });

    it('should check presence of metadataCheck true', () => {
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
        writeJob();
        try {
            const job = new JobSrc(args);
            job.readFile();
            job.addMetaData('1234', 'localhost');
            expect(job.hasMetaData).toBe(true);
        } catch (e) {
            fail(e);
        }
    });

    it('should overwrite old job file', () => {
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
        writeJob();
        const job = new JobSrc(args);
        job.readFile();
        job.addMetaData('1234', 'localhost');
        job.overwrite();
        const overwrittenPath = path.join(jobPath, 'jobFile.json');
        const overwritten = fs.readJsonSync(overwrittenPath);

        expect(overwritten.__metadata).toBeDefined();
        expect(overwritten.__metadata.cli.cluster).toBe('localhost');
        expect(overwritten.__metadata.cli.job_id).toBe('1234');
        expect(overwritten.__metadata.cli.version).toEqual(version);
    });

    it('init should validate job', () => {
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
        writeJob();
        const job = new JobSrc(args);
        try {
            job.init();
        } catch (e) {
            expect(e).toBe('Job file does not contain cli data, register the job first');
        }
    });

    it('init add data to job object', () => {
        jobFile.name = 'goodJob';
        jobFile.workers = 5;
        jobFile.operations = [
            {
                _op: 'one'
            },
            {
                _op: 'two'
            },
        ];
        jobFile.__metadata = {
            cli: {
                version: '1.1.1',
                cluster: 'localhost:5678',
                job_id: 'some-job-id',
                updated: '2019-01-23T21:07:07.812Z'
            }
        };

        writeJob();
        const job = new JobSrc(args);
        try {
            job.init();
            expect(job.clusterUrl).toBe('localhost:5678');
            expect(job.jobId).toBe('some-job-id');
            expect(job.name).toBe('goodJob');
        } catch (e) {
            fail(e);
        }
    });
});
