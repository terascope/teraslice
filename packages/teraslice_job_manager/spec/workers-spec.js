'use strict';

const path = require('path');
const Promise = require('bluebird');
const workers = require('../cmds/workers');

const argv = {
    jobFile: 'spec/fixtures/test_job_file.json'
};

let registeredCheck;
let changeWorkers;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    teraslice: {
        jobs: {
            wrap: (jobId) => {
                    return { 
                        changeWorkers: (param1, param2) => changeWorkers
                    }
                }
            }
        }
};

describe('adds or removes workers from a job', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        argv.param = 'add'
        argv.num = 5
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return workers.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('argv.num must be positive number', (done) => {
        registeredCheck = Promise.resolve();
        argv.param = 'add';
        argv.num = -5;

        return workers.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })
            
    it('returns add workers message', (done) => {
        registeredCheck = Promise.resolve();
        changeWorkers = Promise.resolve('added 10 workers');
        argv.param = 'add';
        argv.num = 10;
        return workers.handler(argv, _tjmTestFunctions)
            .then((result) => {
                expect(result).toBe('added 10 workers');
            })
            .finally(() => done());
    })
});