'use strict';

const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const _ = require('lodash');
const { createTempDirSync } = require('jest-fixtures');
const deploy = require('../../cmds/assets/deploy');

let argvCluster;
let postedUrls = [];
let zipError = null;
let postError = null;
let assetMetaData;

const _cliFunctions = {
    postAsset: (client) => {
        if (postError) {
            return Promise.reject(postError);
        }
        if (client) {
            postedUrls.push(client);
        } else {
            postedUrls.push(argvCluster);
        }
        return Promise.resolve();
    },
    zipAsset: () => {
        if (zipError) {
            return Promise.reject(zipError);
        }
        return Promise.resolve({
            bytes: 1000,
            success: 'very successful'
        });
    },
    updateAssetMetadata: () => assetMetaData,
    createJsonFile: (filePath, jsonObject) => fs.writeJson(filePath, jsonObject, { spaces: 4 })
};

const assetJson = {
    name: 'testing_123',
    version: '0.0.01',
    description: 'dummy asset.json for testing'
};
const tmpDir = createTempDirSync();
const assetPath = path.join(tmpDir, 'asset/asset.json');

const argv = {
    _: ['asset', 'deploy'],
    baseDir: tmpDir,
    deploy: true,
};

describe('deploy', () => {
    it('should deploy asset to a single cluster', async () => {
        argv.cluster = 'example.dev:5678';
        argv.c = 'example.dev:5678';
        argvCluster = argv.cluster;
        // returned json file should match assetMetaData
        assetMetaData = _.cloneDeep(assetJson);
        assetMetaData.tjm = {
            clusters: ['example.dev:5678']
        };
        // should add meta data to the file
        await fs.ensureFile(assetPath);
        await fs.writeJson(assetPath, assetJson, { spaces: 4 });
        try {
            await deploy.handler(argv, _cliFunctions);
            const result = await fs.readJson(assetPath);
            expect(postedUrls.length).toBe(1);
            expect(postedUrls[0]).toBe('example.dev:5678');
            expect(result.tjm).toBeDefined();
            expect(result.tjm.clusters.length).toBe(1);
        } catch (e) {
            fail(e);
        }
    });

    it('should let user know if cli cannot find asset.json', async () => {
        const tmpDirX = createTempDirSync();
        const argvX = {
            _: ['assets', 'deploy'],
            baseDir: tmpDirX,
            deploy: true,
        };

        argvX.cluster = 'example.dev:5678';
        argvX.c = 'example.dev:5678';
        argvCluster = argvX.cluster;
        // no asset.json file

        try {
            await deploy.handler(argvX, _cliFunctions);
        } catch (e) {
            expect(e).toBe('Cannot find the asset.json file');
        }
    });

    it('should handle post errors', async () => {
        argv.cluster = 'example.dev:5678';
        argv.c = 'example.dev:5678';
        argvCluster = argv.cluster;
        postError = 'This is a post error';
        try {
            await deploy.handler(argv, _cliFunctions);
        } catch (e) {
            expect(e).toBe('This is a post error');
        }
        // reset postError
        postError = null;
    });

    it('should handle zip errors', async () => {
        argv.cluster = 'example.dev:5678';
        argv.c = 'example.dev:5678';
        argvCluster = argv.cluster;
        zipError = 'This is a zip error';
        try {
            await deploy.handler(argv, _cliFunctions);
        } catch (e) {
            expect(e).toBe('This is a zip error');
        }
        // reset zip error
        zipError = null;
    });

    it('should deploy an asset to a group of clusters', async () => {
        postedUrls = [];
        const tmpDir2 = createTempDirSync();
        const assetPath2 = path.join(tmpDir2, 'asset/asset.json');

        const argv2 = {
            _: ['assets', 'deploy'],
            baseDir: tmpDir2,
            deploy: true,
        };

        argv2.cluster = 'example.dev:5678';
        argv2.c = 'example.dev:5678';
        argv2.a = true;
        argv2.all = true;
        assetJson.tjm = {
            clusters: ['cluster1.io:80', 'cluster2.io:5678']
        };
        // expect postAsset to be hit 2x
        try {
            await fs.ensureFile(assetPath2);
            await fs.writeJson(assetPath2, assetJson, { spaces: 4 });
            await deploy.handler(argv2, _cliFunctions);
            expect(postedUrls.length).toBe(2);
            expect(postedUrls[0].config.host).toBe('cluster1.io:80');
            expect(postedUrls[1].config.host).toBe('cluster2.io:5678');
        } catch (e) {
            fail(e);
        }
    });

    it('should check that asset.json has tjm data if -a is specified', async () => {
        argv.a = true;
        argv.All = true;
        // argv does not have tjm data
        try {
            await deploy.handler(argv, _cliFunctions);
        } catch (e) {
            expect(e).toBe('You must specify a cluster with -c, or a cluster alias');
        }
    });

    it('should handle a post error if multiple clusters specified', async () => {
        postedUrls = [];
        const tmpDir2 = createTempDirSync();
        const assetPath2 = path.join(tmpDir2, 'asset/asset.json');

        const argv2 = {
            _: ['asset', 'deploy'],
            baseDir: tmpDir2,
            deploy: true,
        };

        argv2.cluster = 'example.dev:5678';
        argv2.c = 'example.dev:5678';
        argv2.a = true;
        argv2.all = true;
        assetJson.tjm = {
            clusters: ['cluster1.io:80', 'cluster2.io:5678']
        };
        postError = 'This is a post error';
        // expect postAsset to be hit 2x
        try {
            await fs.ensureFile(assetPath2);
            await fs.writeJson(assetPath2, assetJson, { spaces: 4 });
            await deploy.handler(argv2, _cliFunctions);
            await deploy.handler(argv2, _cliFunctions);
        } catch (e) {
            expect(e).toBe('This is a post error');
        }
    });
});
