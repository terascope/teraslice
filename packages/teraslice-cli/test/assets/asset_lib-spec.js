'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const Promise = require('bluebird');
const assetFunctions = require('../../cmds/assets/lib');

const tmpDir = createTempDirSync();

const baseCliConfig = {
    baseDir: tmpDir,
    cluster: 'http://example.dev:5678'
};

let someJobId;
let assetObject;

const _terasliceClient = {
    jobs: {
        wrap: () => ({
            spec: () => Promise.resolve({
                job_id: someJobId
            })
        })
    },
    assets: {
        post: () => Promise.resolve(assetObject)
    }
};


const packageJson = {
    name: 'common_processors',
    version: '0.0.29',
    description: 'Processing modules that are common across data types',
    main: 'index.js'
};

function createNewAsset() {
    const assetPath = path.join(tmpDir, 'asset/asset.json');
    const packagePath = path.join(tmpDir, 'asset/package.json');
    return Promise.resolve()
        .then(() => fs.ensureDir(path.join(tmpDir, 'asset')))
        .then(() => fs.emptyDir(path.join(tmpDir, 'asset')))
        .then(() => Promise.all([
            fs.writeJson(assetPath, {
                name: 'testing_123',
                version: '0.0.01',
                description: 'dummy asset.json for testing'
            }, { spaces: 4 }),
            fs.writeJson(packagePath, packageJson, { spaces: 4 })
        ]));
}

describe('cliFunctions testing', () => {
    beforeEach(() => createNewAsset());
    it('alreadyRegisteredCheck should resolve if the job exists', async () => {
        const cliConfig = _.clone(baseCliConfig);
        cliConfig.job_file_content = {
            tjm: {
                cluster: 'http://example.dev:5678',
                job_id: 'jobYouAreLookingFor'
            }
        };
        cliConfig.job_file_path = 'someFilePath';
        cliConfig.cluster = 'http://clustername.dev';

        someJobId = 'jobYouAreLookingFor';

        const functions = assetFunctions(cliConfig, _terasliceClient);
        const result = await functions.alreadyRegisteredCheck();
        expect(result).toBe(true);
    });

    it('alreadyRegisteredCheck should reject if the job exists', async () => {
        const cliConfig = _.clone(baseCliConfig);

        someJobId = 'notTheJobYouAreLookingFor';
        const jobContents = {
            tjm: {
                cluster: 'http://example.dev:5678',
                job_id: 'jobYouAreLookingFor'
            }
        };

        cliConfig.job_file_content = jobContents;
        cliConfig.job_file_path = 'someFilePath';
        cliConfig.cluster = 'http://clustername.dev';

        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            await functions.alreadyRegisteredCheck(jobContents);
        } catch (e) {
            expect(e.message).toBe('Job is not on the cluster');
        }
    });

    it('alreadyRegisteredCheck should reject if the job contents are empty', async () => {
        const cliConfig = _.clone(baseCliConfig);
        const jobContents = {};

        cliConfig.job_file_content = jobContents;
        cliConfig.job_file_path = 'someFilePath';

        someJobId = 'jobYouAreLookingFor';
        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            await functions.alreadyRegisteredCheck(jobContents);
        } catch (e) {
            expect(e.message).toBe('No cluster configuration for this job');
        }
    });

    it('meta data is being written to assets.json ', async () => {
        const cliConfig = _.clone(baseCliConfig);

        cliConfig.cluster_url = 'http://example.dev:5678';
        cliConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing'
        };

        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            const jsonResult = await functions.updateAssetMetadata();
            expect(jsonResult.tjm).toBeDefined();
            expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
        } catch (e) {
            fail(e);
        }
    });

    it('cluster is added to array in asset.json if a new cluster', async () => {
        const cliConfig = _.clone(baseCliConfig);

        cliConfig.cluster_url = 'http://anotherCluster:5678';
        cliConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678']
            }
        };

        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            const jsonResult = await functions.updateAssetMetadata();
            expect(jsonResult.tjm).toBeDefined();
            expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
            expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
            expect(jsonResult.tjm.clusters[2]).toBe('http://anotherCluster:5678');
        } catch (e) {
            fail(e);
        }
    });

    it('cluster is not added to array in asset.json it is already there', async () => {
        const cliConfig = _.clone(baseCliConfig);
        cliConfig.cluster_url = 'http://newCluster:5678';
        cliConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678']
            }
        };

        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            const jsonResult = await functions.updateAssetMetadata();
            expect(jsonResult.tjm).toBeDefined();
            expect(jsonResult.tjm.clusters.length).toBe(2);
            expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
            expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
        } catch (e) {
            fail(e);
        }
    });

    it('check that assets are zipped', async () => {
        const cliConfig = _.clone(baseCliConfig);

        const assetJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678', 'http://anotherCluster:5678']
            }
        };
        const functions = assetFunctions(cliConfig, _terasliceClient);
        try {
            await fs.writeFile(path.join(tmpDir, 'asset/asset.json'), JSON.stringify(assetJson, null, 4));
            await fs.emptyDir(path.join(tmpDir, '.assetbuild'));
            const zipData = await functions.zipAsset();
            expect(zipData.size).toBeDefined();
            const fileExists = await fs.pathExists(path.join(tmpDir, '.assetbuild/processors.zip'));
            expect(fileExists).toBe(true);
        } catch (e) {
            fail(e);
        }
    });

    it('add assets returns post asset message', async () => {
        const cliConfig = _.clone(baseCliConfig);

        assetObject = JSON.stringify({
            success: 'Asset was deployed',
            _id: '12345AssetId'
        });

        const functions = assetFunctions(cliConfig, _terasliceClient);
        await fs.emptyDir(path.join(tmpDir, 'builds'));
        await fs.writeFile(path.join(tmpDir, 'builds/processors.zip'), 'this is some sweet text');
        const postResponse = await functions.postAsset();
        expect(postResponse).toBe(true);
    });

    it('should return latest asset version', () => {
        const cliConfig = _.clone(baseCliConfig);
        const assetArray1 = [
            {
                name: 'asset1',
                version: '0.0.1'
            },
            {
                name: 'asset1',
                version: '0.1.1'
            },
            {
                name: 'asset1',
                version: '2.0.1'
            },
            {
                name: 'asset1',
                version: '3.2.1'
            }
        ];

        const assetArray2 = [
            {
                name: 'asset1',
                version: '0.0.1'
            },
            {
                name: 'asset1',
                version: '0.0.2'
            },
            {
                name: 'asset1',
                version: '0.0.3'
            }
        ];

        const assetArray3 = [
            {
                name: 'asset1',
                version: '0.0.12'
            },
            {
                name: 'asset1',
                version: '0.0.15'
            },
            {
                name: 'asset1',
                version: '0.0.14'
            },
            {
                name: 'asset1',
                version: '0.0.1'
            }
        ];

        const orderedArray = assetFunctions(cliConfig).latestAssetVersion(assetArray1);
        expect(orderedArray).toEqual({ name: 'asset1', version: '3.2.1' });
        const orderedArray2 = assetFunctions(cliConfig).latestAssetVersion(assetArray2);
        expect(orderedArray2).toEqual({ name: 'asset1', version: '0.0.3' });
        const orderedArray3 = assetFunctions(cliConfig).latestAssetVersion(assetArray3);
        expect(orderedArray3).toEqual({ name: 'asset1', version: '0.0.15' });
    });
});
