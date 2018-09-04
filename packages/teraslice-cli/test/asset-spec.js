'use strict';

const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const asset = require('../cmds/asset');

let deployMessage = 'default deployed message';
let deployError = null;

const assetJson = {
    name: 'testing_123',
    version: '0.0.01',
    description: 'dummy asset.json for testing'
};

const assetPath = path.join(__dirname, '..', 'asset/assetTest.json');

const _tjmFunctions = {
    loadAsset: () => {
        if (deployError) {
            return Promise.reject(deployError);
        }
        return Promise.resolve(deployMessage);
    },
    zipAsset: () => Promise.resolve({
        bytes: 1000,
        success: 'very successful'
    }),
    terasliceClient: {
        cluster: {
            get: () => Promise.resolve([
                {
                    id: 'someAssetId'
                }
            ])
        },
        assets: {
            delete: () => Promise.resolve(JSON.stringify({ assetId: 'anAssetId' }))
        }
    }
};

describe('asset command testing', () => {
    beforeEach(() => {
        deployError = null;
        deployMessage = 'default deployed message';
    });
    let argv = {};

    it('deploy triggers load asset', (done) => {
        argv.c = 'example.dev:5678';
        argv.deploy = true;
        deployMessage = 'deployed';

        return Promise.resolve()
            .then(() => fs.ensureFile(assetPath))
            .then(() => fs.writeJson(assetPath, assetJson, { spaces: 4 }))
            .then(() => asset.handler(argv, _tjmFunctions))
            .then(result => expect(result).toEqual('deployed'))
            .then(() => fs.remove(assetPath))
            .catch(done.fail)
            .finally(() => done());
    });

    it('deploy should respond to a request error', () => {
        argv.c = 'example.dev:5678';
        argv.deploy = true;
        const error = new Error('This is an error');
        error.name = 'RequestError';
        error.message = 'This is an error';

        deployError = error;
        return asset.handler(argv, _tjmFunctions)
            .catch(err => expect(err).toBe('Could not connect to http://example.dev:5678'));
    });

    it('deploy should throw an error if requested cluster already in cluster tjm data', (done) => {
        const testJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: [
                    'http://example.dev:5678',
                    'http://newCluster:5678',
                    'http://anotherCluster:5678'
                ]
            }
        };
        argv.deploy = true;
        argv.c = 'http://example.dev:5678';

        return Promise.resolve()
            .then(() => fs.ensureFile(assetPath))
            .then(() => fs.writeJson(assetPath, testJson, { spaces: 4 }))
            .then(() => asset.handler(argv, _tjmFunctions))
            .catch((err) => {
                expect(err).toBe('Assets have already been deployed to http://example.dev:5678, use update');
            })
            .finally(() => done());
    });


    it('update should throw an error if no cluster data', () => {
        argv = {};
        argv.update = true;

        expect(() => asset.handler(argv, _tjmFunctions))
            .toThrow('Cluster data is missing from asset.json or not specified using -c.');
    });

    it('replace should delete and replace asset by name', (done) => {
        argv = {
            replace: true,
            l: true,
        };

        _tjmFunctions.continue = true;

        return Promise.resolve()
            .then(() => fs.ensureFile(assetPath))
            .then(() => fs.writeJson(assetPath, assetJson, { spaces: 4 }))
            .then(() => asset.handler(argv, _tjmFunctions))
            .then(result => expect(result).toBe('default deployed message'))
            .catch(done.fail)
            .finally(() => done());
    });

    it('replace should exit if continue is false', (done) => {
        argv = {
            replace: true,
            l: true,
        };

        _tjmFunctions.continue = false;

        return Promise.resolve()
            .then(() => fs.ensureFile(assetPath))
            .then(() => fs.writeJson(assetPath, assetJson, { spaces: 4 }))
            .then(() => asset.handler(argv, _tjmFunctions))
            .catch((err) => {
                expect(err).toBe('Exiting tjm');
            })
            .finally(() => done());
    });
});
