'use strict';

const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const { createTempDirSync } = require('jest-fixtures');
const replace = require('../../cmds/assets/replace');

let getAssetName;
let deleteAsset;
let zipped = false;
let posted = false;
let zipError = null;
let postError = null;
let postResponse = [{ id: 'someAssetId' }];

const _tjmFunctions = {
    postAsset: () => {
        if (postError) {
            return Promise.reject(postError);
        }
        posted = true;
        return Promise.resolve();
    },
    zipAsset: () => {
        if (zipError) {
            return Promise.reject(zipError);
        }
        zipped = true;
        return Promise.resolve({
            bytes: 1000,
            success: 'very successful'
        });
    },
    terasliceClient: {
        cluster: {
            get: (assetName) => {
                getAssetName = assetName;
                return Promise.resolve(postResponse);
            }
        },
        assets: {
            delete: (assetName) => {
                deleteAsset = assetName;
                return Promise.resolve(JSON.stringify({ assetId: 'anAssetId' }));
            }
        }
    },
    continue: true
};

const assetJson = {
    name: 'testing_123',
    version: '0.0.01',
    description: 'dummy asset.json for testing'
};
const tmpDir = createTempDirSync();
const assetPath = path.join(tmpDir, 'asset/asset.json');

const argv = {
    _: ['asset', 'replace'],
    baseDir: tmpDir,
    replace: true,
    cluster: 'cluster.com:5678',
    c: 'cluster.com:5678'
};

describe('replace', () => {
    it('should delete asset from cluster', async () => {
        await fs.ensureFile(assetPath);
        await fs.writeJson(assetPath, assetJson, { spaces: 4 });
        try {
            await replace.handler(argv, _tjmFunctions);
            expect(getAssetName).toBe('/assets/testing_123');
            expect(deleteAsset).toBe('someAssetId');
            expect(zipped).toBe(true);
            expect(posted).toBe(true);
        } catch (e) {
            fail(e);
        }
    });

    it('should throw error if no asset.json file', async () => {
        argv.baseDir = '/nonexistantdir/';
        try {
            await replace.handler(argv, _tjmFunctions);
        } catch (e) {
            expect(e).toBe('Cannot find the asset.json file');
        }
        argv.baseDir = tmpDir;
    });

    it('should throw error if a bad zip response', async () => {
        zipError = 'a terrible zip error';
        try {
            await replace.handler(argv, _tjmFunctions);
        } catch (e) {
            expect(e).toBe('a terrible zip error');
        }
        zipError = null;
    });

    it('should throw error if a bad post response', async () => {
        postError = 'a terrible post error';
        try {
            await replace.handler(argv, _tjmFunctions);
        } catch (e) {
            expect(e).toBe('a terrible post error');
        }
        postError = null;
    });

    it('should throw error if no asset id returned from the cluster', async () => {
        postResponse = [];
        try {
            await replace.handler(argv, _tjmFunctions);
        } catch (e) {
            expect(e).toBe('Could not find the asset on the cluster, check the status and deploy');
        }
    });
});
