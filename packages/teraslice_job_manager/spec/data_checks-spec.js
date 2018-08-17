'use strict';

const fs = require('fs-extra');
const path = require('path');

describe('checks for job and asset file content', () => {
    it('job files do not have to end in json', () => {
        fs.writeFileSync(
            path.join(__dirname, '..', 'tfile.prod.json'),
            JSON.stringify({ test: 'test' })
        );

        const tjmConfig = {
            job_file: 'tfile.prod',
            tjm_check: false,
            c: 'clusterOne'
        };

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        jobFileFunctions.jobFileHandler();
        expect(tjmConfig.job_file_content.test).toBe('test');
        fs.unlinkSync(path.join(__dirname, '..', 'tfile.prod.json'));
    });

    it('missing job file throws error', () => {
        const tjmConfig = {};
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Missing the job file!');
    });

    it('bad file path throws an error', () => {
        const tjmConfig = {
            job_file: 'jobTest.json'
        };
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler)
            .toThrow('Sorry, can\'t find the JSON file: jobTest.json');
    });

    it('empty json file throws an error', () => {
        fs.writeFileSync(
            path.join(
                __dirname,
                '..',
                'testFile.json'
            ),
            JSON.stringify({ })
        );

        const tjmConfig = {
            job_file: 'testFile.json'
        };

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler)
            .toThrow('JSON file contents cannot be empty');
        fs.unlinkSync(path.join(__dirname, '..', 'testFile.json'));
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

        const tjmConfig = {};

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
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
        // create test file
        fs.writeFileSync(path.join(__dirname, '..', 'tfile.prod.json'), JSON.stringify({ test: 'test' }));

        const tjmConfig = {
            job_file: 'tfile.prod.json',
            l: true
        };

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);

        jobFileFunctions.returnJobData(true);
        expect(tjmConfig.cluster).toBe('http://localhost:5678');
        fs.unlinkSync(path.join(__dirname, '..', 'tfile.prod.json'));
    });

    it('cluster should be from jobFile', () => {
        // create test file
        fs.writeFileSync(path.join(__dirname, '..', 'fakeFile.json'), JSON.stringify({
            name: 'fakeJob',
            tjm: {
                cluster: 'aclustername',
                job_id: 'jobid'
            }
        }));

        const tjmConfig = {
            job_file: 'fakeFile.json',
            tjm_check: true
        };

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        jobFileFunctions.returnJobData();
        expect(tjmConfig.cluster).toBe('aclustername');
        fs.unlinkSync(path.join(__dirname, '..', 'fakeFile.json'));
    });

    it('cluster should be from -c', () => {
        // create test file
        fs.writeFileSync(path.join(__dirname, '..', 'fakeFile2.json'), JSON.stringify({
            name: 'fakeJob',
        }));

        const tjmConfig = {
            job_file: 'fakeFile2.json',
            c: 'someClusterName'
        };

        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        jobFileFunctions.returnJobData(true);
        expect(tjmConfig.cluster).toBe('http://someClusterName');
        fs.unlinkSync(path.join(__dirname, '..', 'fakeFile2.json'));
    });

    it('url check should add http to urls when needed', () => {
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')();
        expect(jobFileFunctions._urlCheck('http://bobsyouruncle.com')).toEqual('http://bobsyouruncle.com');
        expect(jobFileFunctions._urlCheck('https://bobsyouruncle.com')).toEqual('https://bobsyouruncle.com');
        expect(jobFileFunctions._urlCheck('bobsyouruncle.com')).toEqual('http://bobsyouruncle.com');
    });

    it('should throw an error if -c and tjm cluster in jobs file', () => {
        const tjmConfig = {
            c: true,
            job_file: 'spec/fixtures/regJobFile.json'
        };
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Command specified a cluster via -c but the job is already associated with a cluster');
    });

    it('should throw an error if no cluster specified', () => {
        fs.writeFileSync(path.join(__dirname, '..', 'fakeFile2.json'), JSON.stringify({
            name: 'fakeJob',
        }));
        const tjmConfig = {
            job_file: 'fakeFile2.json'
        };
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Please specify a cluster with -c');
        fs.removeSync('fakeFile2.json');
    });

    it('should throw an error if -m and no -c', () => {
        fs.writeFileSync(path.join(__dirname, '..', 'fakeFile3.json'), JSON.stringify({
            name: 'fakeJob',
            tjm: {
                cluster: 'abadcluster'
            }
        }));
        const tjmConfig = {
            m: true,
            job_file: 'fakeFile3.json'
        };
        const jobFileFunctions = require('../cmds/cmd_functions/data_checks')(tjmConfig);
        expect(jobFileFunctions.jobFileHandler).toThrow('Specify a cluster to move the jobe to with -c');
        fs.removeSync('fakeFile3.json');
    });
});
