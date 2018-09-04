'use strict';

const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const path = require('path');
const makeDataChecks = require('../cmds/cmd_functions/data_checks');

describe('checks for job and asset file content', () => {
    const tmpDir = createTempDirSync();

    it('job files do not have to end in json', () => {
        const jobFile = path.join(tmpDir, 'tfile.prod.json');
        fs.writeJsonSync(jobFile, { test: 'test' });

        const tjmConfig = {
            baseDir: tmpDir,
            job_file: jobFile,
            tjm_check: false,
            c: 'clusterOne'
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        jobFileFunctions.jobFileHandler();
        expect(tjmConfig.job_file_content.test).toBe('test');
    });

    it('missing job file throws error', () => {
        const tjmConfig = {
            baseDir: tmpDir,
        };
        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Missing the job file!');
    });

    it('bad file path throws an error', () => {
        const tjmConfig = {
            baseDir: tmpDir,
            job_file: 'jobTest.json'
        };
        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler)
            .toThrow('Sorry, can\'t find the JSON file: jobTest.json');
    });

    it('empty json file throws an error', () => {
        const jobFile = path.join(tmpDir, 'testFile.json');
        fs.writeJsonSync(jobFile, {});

        const tjmConfig = {
            baseDir: tmpDir,
            job_file: jobFile
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler)
            .toThrow('JSON file contents cannot be empty');
    });

    it('should check if tjm data is in the job file', () => {
        const jsonFileData = {
            name: 'this is a name',
            version: '0.0.1',
            tjm: {}
        };

        // test metadata for asset
        jsonFileData.tjm = {
            clusters: ['http://localhost', 'http://cluster2']
        };

        const tjmConfig = {
            baseDir: tmpDir,
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions._tjmDataCheck(jsonFileData)).toBe(true);
        delete jsonFileData.tjm;

        // test metadata for job
        jsonFileData.tjm = {
            cluster: 'http://localhost'
        };
        expect(jobFileFunctions._tjmDataCheck(jsonFileData)).toBe(true);

        // test no metadata
        delete jsonFileData.tjm;
        expect(jobFileFunctions._tjmDataCheck(jsonFileData)).toBe(false);
    });

    it('cluster should be localhost', () => {
        const jobFile = path.join(tmpDir, 'tfile.local.json');
        // create test file
        fs.writeJsonSync(jobFile, { test: 'test' });

        const tjmConfig = {
            baseDir: tmpDir,
            job_file: jobFile,
            l: true
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);

        jobFileFunctions.returnJobData(true);
        expect(tjmConfig.cluster).toBe('http://localhost:5678');
    });

    it('cluster should be from jobFile', () => {
        const jobFile = path.join(tmpDir, 'fakeFile.json');
        // create test file
        fs.writeJsonSync(jobFile, {
            name: 'fakeJob',
            tjm: {
                cluster: 'aclustername',
                job_id: 'jobid'
            }
        });

        const tjmConfig = {
            baseDir: tmpDir,
            job_file: jobFile,
            tjm_check: true
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        jobFileFunctions.returnJobData();
        expect(tjmConfig.cluster).toBe('aclustername');
    });

    it('cluster should be from -c', () => {
        const jobFile = path.join(tmpDir, 'fakeFile2.json');
        // create test file
        fs.writeJsonSync(jobFile, { name: 'fakeJob' });

        const tjmConfig = {
            baseDir: tmpDir,
            job_file: 'fakeFile2.json',
            c: 'someClusterName'
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        jobFileFunctions.returnJobData(true);
        expect(tjmConfig.cluster).toBe('http://someClusterName');
    });

    it('url check should add http to urls when needed', () => {
        const jobFileFunctions = makeDataChecks();
        expect(jobFileFunctions._urlCheck('http://bobsyouruncle.com')).toEqual('http://bobsyouruncle.com');
        expect(jobFileFunctions._urlCheck('https://bobsyouruncle.com')).toEqual('https://bobsyouruncle.com');
        expect(jobFileFunctions._urlCheck('bobsyouruncle.com')).toEqual('http://bobsyouruncle.com');
    });

    it('should throw an error if -c and tjm cluster in jobs file', () => {
        const jobFile = path.join(tmpDir, 'test-regJobFile.json');
        fs.copyFileSync(path.join(__dirname, 'fixtures', 'regJobFile.json'), jobFile);

        const tjmConfig = {
            baseDir: tmpDir,
            c: true,
            job_file: jobFile
        };
        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Command specified a cluster via -c but the job is already associated with a cluster');
    });

    it('should throw an error if no cluster specified', () => {
        const jobFile = path.join(tmpDir, 'fakeFile3.json');
        fs.writeJsonSync(jobFile, {
            name: 'fakeJob',
        });
        const tjmConfig = {
            baseDir: tmpDir,
            job_file: jobFile
        };
        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Please specify a cluster with -c');
    });

    it('should throw an error if -m and no -c', () => {
        const jobFile = path.join(tmpDir, 'fakeFile4.json');

        fs.writeJsonSync(jobFile, {
            name: 'fakeJob',
            tjm: {
                cluster: 'abadcluster'
            }
        });
        const tjmConfig = {
            baseDir: tmpDir,
            m: true,
            job_file: jobFile,
        };

        const jobFileFunctions = makeDataChecks(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Specify a cluster to move the jobe to with -c');
    });
});
