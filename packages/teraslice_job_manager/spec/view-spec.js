'use strict';

const jasmine = require('jasmine');
const fs = require('fs-extra');
const path = require('path');
const view = require('../cmds/view');
const Promise = require('bluebird');

const argv = {
    job_file: 'spec/fixtures/test_job_file.json'
};
let registeredCheck;
let specData;
const _tjmTestFunctions = {
    alreadyRegisteredCheck: () => registeredCheck,
    teraslice: {
        jobs: {
            wrap: (jobContents) => {
                    return { spec: () => Promise.resolve(specData) }
            }
        }
    }
}

describe('view should display the job saved in the cluster', () => {
    it('should throw an error if alreadyRegisteredCheck fails', (done) => {
        registeredCheck = Promise.reject(new Error('Job is not on the cluster'));
        return view.handler(argv, _tjmTestFunctions)
            .then(done.fail)
            .catch(() => done());
    })

    it('should display save job data from cluster', (done) => {
        registeredCheck = Promise.resolve();
        specData = 'job spec goes here';
        return view.handler(argv, _tjmTestFunctions)
            .then((jobSpec) => {
                expect(jobSpec).toEqual('job spec goes here')
            })
            .catch(done.fail)
            .finally(() => done());
    })
})