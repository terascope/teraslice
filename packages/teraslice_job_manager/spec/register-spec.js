'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');    
const Promise = require('bluebird');
const register = require('../cmds/register');

describe('register should register job with cluster and follow options', () => {
    const fakeJobData = require('./fixtures/test_job_file.json');
    const argv = {};
    
    const _testTJMFunctions = {
        teraslice: {
            jobs: {
                submit: (jobContents, start) => {
                    return Promise.resolve({
                        id: () => 'jobId'
                    });
                }
            },
            assets: {
                post: () => Promise.resolve(assetObject)
            }
        },
        httpClusterNameCheck: (cluster) => 'good',
        loadAsset: () => {
            if (argv.a) {
                return Promise.resolve('loaded');
            }
            return Promise.resolve();
        },
        createJsonFile: (filePath, jsonObject) => fs.writeJson(filePath, jsonObject, { spaces: 4 })
    };

    it('job should throw an error if the job has tjm data', (done) => {
        argv.c = 'http://localhost:5678'
        const jobPath = path.join(__dirname, 'fixtures/regJobFile.json')
        fs.writeJsonSync(jobPath, fakeJobData, { spaces: 4 });
        argv.job_file = 'spec/fixtures/regJobFile.json';
        register.handler(argv, _testTJMFunctions)
            .then(done.fail)
            .catch(() => {
                done()
             })
            .finally(() => {
                fs.removeSync(jobPath);
                done();
            })
    });

    it('register should add tjm data to job file', (done) => {
        const regJobData = {
            "name": "Data Generator",
            "lifecycle": "once",
            "workers": 1,
            "operations": [
                {
                    "_op": "elasticsearch_data_generator",
                    "size": 10000
                },
                {
                    "_op": "elasticsearch_index_selector",
                    "index": "auto-data-logs",
                    "type": "events"
                },
                {
                    "_op": "elasticsearch_bulk",
                    "size": 100
                }
            ]
        };
        
        argv.c = 'http://localhost:5678'
        const jobPath = path.join(__dirname, 'fixtures/regJobFile2.json')
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
            })
    });
});
