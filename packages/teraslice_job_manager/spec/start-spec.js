'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const start = require('../cmds/start');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};

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
        const filePath = path.join(process.cwd(), 'spec/fixtures/start_job.json');
        argv.job_file = 'spec/fixtures/start_job.json';
        argv.c = 'thisIsACluster';
        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return Promise.resolve()
            .then(() => fs.writeJson(filePath, jobFileData))
            .then(() => start.handler(argv, _tjmTestFunctions))
            .then(response => expect(response.job_id).toEqual('success'))
            .then(() => fs.readJson(filePath))
            .then(jsonData => expect(jsonData.tjm.cluster).toBeDefined())
            .catch(() => done.fail)
            .finally(() => {
                fs.removeSync(filePath);
                done();
            });
    });

    it('should move a job to a new cluster', (done) => {
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
        const filePath = path.join(process.cwd(), 'spec/fixtures/start_job.json');
        argv.job_file = 'spec/fixtures/start_job.json';
        argv.c = 'clusterTwo';
        argv.m = true;
        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return Promise.resolve()
            .then(() => fs.writeJson(filePath, jobFileData))
            .then(() => start.handler(argv, _tjmTestFunctions))
            .then(response => expect(response.job_id).toEqual('success'))
            .then(() => fs.readJson(filePath))
            .then((jsonData) => {
                expect(jsonData.tjm.cluster).toBe('http://clusterTwo');
                expect(jsonData.tjm.job_id).toBe('jobId');
            })
            .catch(() => done.fail)
            .finally(() => {
                fs.removeSync(filePath);
                done();
            });
    });

    it('should start job', (done) => {
        registeredCheck = Promise.resolve();
        startResponse = { job_id: 'success' };
        return start.handler(argv, _tjmTestFunctions)
            .then(response => expect(response.job_id).toEqual('success'))
            .catch(() => done.fail)
            .finally(() => done());
    });

    it('should throw error if start response does not have the job_id', (done) => {
        registeredCheck = Promise.resolve();
        startResponse = { };
        return start.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    });
});
