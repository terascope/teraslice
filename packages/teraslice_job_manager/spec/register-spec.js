'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const register = require('../cmds/register');

describe('register should register job with cluster and follow options', () => {
    const argv = {};

    const _testTJMFunctions = {
        terasliceClient: {
            jobs: {
                submit: () => Promise.resolve({
                    id: () => 'jobId'
                })
            },
            assets: {
                post: () => Promise.resolve()
            }
        },
        loadAsset: () => {
            if (argv.a) {
                return Promise.resolve('loaded');
            }
            return Promise.resolve();
        },
        createJsonFile: (filePath, jsonObject) => fs.writeJson(filePath, jsonObject, { spaces: 4 })
    };

    it('register should add tjm data to job file', (done) => {
        const regJobData = {
            name: 'Data Generator',
            lifecycle: 'once',
            workers: 1,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 10000
                },
                {
                    _op: 'elasticsearch_index_selector',
                    index: 'auto-data-logs',
                    type: 'events'
                },
                {
                    _op: 'elasticsearch_bulk',
                    size: 100
                }
            ]
        };

        argv.c = 'http://localhost:5678';
        const jobPath = path.join(__dirname, 'fixtures/regJobFile2.json');
        fs.writeJsonSync(jobPath, regJobData, { spaces: 4 });
        argv.job_file = 'spec/fixtures/regJobFile2.json';
        return register.handler(argv, _testTJMFunctions)
            .then(() => {
                const registeredJob = require(jobPath);
                expect(_.has(registeredJob, 'tjm')).toBe(true);
                expect(_.get(registeredJob, 'tjm.job_id')).toBe('jobId');
            })
            .finally(() => {
                fs.removeSync(jobPath);
                done();
            });
    });
});
