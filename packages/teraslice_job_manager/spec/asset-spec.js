'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Promise = require('bluebird');

let deploy;
const _tjmFunctions = {
    loadAsset: () => {
        return deploy;
    },
    zipAsset: () => {
        return Promise.resolve(
            {
                bytes: 1000,
                success: 'very successful'
            }
        );
    },
    reply: {
        error: (message) => {
            return message;
        },
        success: (message) => {
            return message;
        }
    }
}

const assetJson = {
    name: 'testing_123',
    version: '0.0.01',
    description: 'dummy asset.json for testing'
}

const assetPath = path.join(process.cwd(), 'asset/asset.json');

describe('asset command testing', () => {
    let argv = {};
    let error = new Error();

    it('deploy triggers load asset', (done) => {
        argv.c = 'localhost:5678';
        argv.cmd = 'deploy'; 
        deploy = Promise.resolve('deployed');
 
        Promise.resolve()
            .then(() => fs.ensureFile(assetPath))
            .then(() => fs.writeJson(assetPath, assetJson, {spaces: 4}))
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .then((result) => {
                expect(result).toEqual('deployed');
            })
            .catch(fail)
            .finally(done);
    });

    it('deploy should respond to a request error', (done) => {
        argv.c = 'localhost:5678';
        argv.cmd = 'deploy';
        error.name = 'RequestError';
        error.message = 'This is an error'
        
        deploy = Promise.reject(
            error
        );   

        return Promise.resolve()
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .then(err => expect(err).toBe('Could not connect to localhost:5678'))
            .catch(fail)
            .finally(done);
    });

     it('asset update should throw an error if no cluster data', (done) => {
        argv = {};
        argv.cmd = 'update';

        return Promise.resolve()
            .then(() => require('../cmds/asset').handler(argv, _tjmFunctions))
            .then(err => expect(err).toBe('Cluster data is missing from asset.json or not specified using -c.'))
            .catch(fail)
            .finally(done);
    });
});