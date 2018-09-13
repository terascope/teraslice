'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const { createTempDirSync } = require('jest-fixtures');
const start = require('../../cmds/job/start');

const tmpDir = createTempDirSync();

let registeredCheck;
let startResponse;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    terasliceClient: {
        jobs: {
            wrap: () => {
                const functions = {
                    start: () => startResponse
                };
                return functions;
            },
            submit: () => Promise.resolve({
                id: () => 'jobId'
            })
        }
    },
    createJsonFile: (filePath, jsonObject) => fs.writeJson(filePath, jsonObject, { spaces: 4 })
};

describe('start should start a job', () => {
    it('should register and start a job if no tjm data', (done) => {
        const jobFile = path.join(tmpDir, 'start-job-1.json');

        fs.copyFileSync(path.join(__dirname, '../fixtures', 'start_job.json'), jobFile);

        const jobFileData = {
            name: 'fakeJobe',
            lifecycle: 'once',
            workers: 1,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 10000
                }
            ]
        };
        const argv = {
            baseDir: tmpDir,
            job_file: jobFile,
            c: 'thisIsACluster'
        };
        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return Promise.resolve()
            .then(() => fs.writeJson(jobFile, jobFileData))
            .then(() => start.handler(argv, _tjmTestFunctions))
            .then(response => expect(response.job_id).toEqual('success'))
            .then(() => fs.readJson(jobFile))
            .then(jsonData => expect(jsonData.tjm.cluster).toBeDefined())
            .catch(() => done.fail)
            .finally(() => {
                done();
            });
    });

    it('should move a job to a new cluster', (done) => {
        const jobFile = path.join(tmpDir, 'start-job-2.json');

        fs.copyFileSync(path.join(__dirname, '../fixtures', 'start_job.json'), jobFile);

        const jobFileData = {
            name: 'fakeJobe',
            lifecycle: 'once',
            workers: 1,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 10000
                }
            ],
            tjm: {
                cluster: 'clusterOne',
                version: '0.0.1',
                job_id: 'jobIdOne'
            }
        };
        const argv = {
            baseDir: tmpDir,
            job_file: jobFile,
            c: 'clusterTwo',
            m: true,
        };

        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return Promise.resolve()
            .then(() => fs.writeJson(jobFile, jobFileData))
            .then(() => start.handler(argv, _tjmTestFunctions))
            .then(response => expect(response.job_id).toEqual('success'))
            .then(() => fs.readJson(jobFile))
            .then((jsonData) => {
                expect(jsonData.tjm.cluster).toBe('http://clusterTwo');
                expect(jsonData.tjm.job_id).toBe('jobId');
            })
            .catch(() => done.fail)
            .finally(() => {
                done();
            });
    });

    it('should start job', (done) => {
        const jobFile = path.join(tmpDir, 'start-job-3.json');

        fs.copyFileSync(path.join(__dirname, '../fixtures', 'start_job.json'), jobFile);

        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return start.handler({
            job_file: jobFile,
        }, _tjmTestFunctions)
            .then(response => expect(response.job_id).toEqual('success'))
            .catch(() => done.fail)
            .finally(() => done());
    });

    it('should throw error if start response does not have the job_id', (done) => {
        const jobFile = path.join(tmpDir, 'start-job-3.json');

        fs.copyFileSync(path.join(__dirname, '../fixtures', 'start_job.json'), jobFile);

        registeredCheck = Promise.resolve();
        startResponse = { };
        return start.handler({
            job_file: jobFile,
        }, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });
});
