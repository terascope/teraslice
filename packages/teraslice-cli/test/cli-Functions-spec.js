'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const { createTempDirSync } = require('jest-fixtures');
const Promise = require('bluebird');
const CliFunctions = require('../cmds/cmd_functions/functions');

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

    it('alreadyRegisteredCheck should resolve if the job exists', (done) => {
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

        const cliFunctions = CliFunctions(cliConfig, _terasliceClient);
        cliFunctions.alreadyRegisteredCheck()
            .then(result => expect(result).toBe(true))
            .catch(done.fail)
            .finally(() => done());
    });

    it('alreadyRegisteredCheck should reject if the job exists', (done) => {
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

        const cliFunctions = CliFunctions(cliConfig, _terasliceClient);
        cliFunctions.alreadyRegisteredCheck(jobContents)
            .catch(err => expect(err.message).toEqual('Job is not on the cluster'))
            .finally(() => done());
    });

    it('alreadyRegisteredCheck should reject if the job contents are empty', (done) => {
        const cliConfig = _.clone(baseCliConfig);
        cliConfig.job_file_content = {};
        cliConfig.job_file_path = 'someFilePath';

        someJobId = 'jobYouAreLookingFor';
        const cliFunctions = CliFunctions(cliConfig, _terasliceClient);
        cliFunctions.alreadyRegisteredCheck()
            .catch(err => expect(err.message).toEqual('No cluster configuration for this job'))
            .finally(() => done());
    });

    it('meta data is being written to assets.json ', (done) => {
        const cliConfig = _.clone(baseCliConfig);

        cliConfig.cluster = 'http://example.dev:5678';
        cliConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing'
        };

        const cliFunctions = CliFunctions(cliConfig, _terasliceClient);
        return Promise.resolve()
            .then(() => cliFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('cluster is added to array in asset.json if a new cluster', (done) => {
        const tjmConfig = _.clone(baseCliConfig);

        tjmConfig.cluster = 'http://anotherCluster:5678';
        tjmConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678']
            }
        };

        const cliFunctions = CliFunctions(tjmConfig, _terasliceClient);
        return Promise.resolve()
            .then(() => cliFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
                expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
                expect(jsonResult.tjm.clusters[2]).toBe('http://anotherCluster:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('cluster is not added to array in asset.json it is already there', (done) => {
        const tjmConfig = _.clone(baseCliConfig);

        tjmConfig.cluster = 'http://newCluster:5678';
        tjmConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678']
            }
        };

        const cliFunctions = CliFunctions(tjmConfig, _terasliceClient);
        return Promise.resolve()
            .then(() => cliFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters.length).toBe(2);
                expect(jsonResult.tjm.clusters[0]).toBe('http://example.dev:5678');
                expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('check that assets are zipped', (done) => {
        const tjmConfig = _.clone(baseCliConfig);

        const assetJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://example.dev:5678', 'http://newCluster:5678', 'http://anotherCluster:5678']
            }
        };
        const cliFunctions = CliFunctions(tjmConfig, _terasliceClient);

        return Promise.all([
            fs.writeFile(path.join(tmpDir, 'asset/asset.json'), JSON.stringify(assetJson, null, 4)),
            fs.emptyDir(path.join(tmpDir, 'builds'))
        ])
            .then(() => cliFunctions.zipAsset())
            .then(zipMessage => expect(zipMessage.success).toBe('Assets have been zipped to builds/processors.zip'))
            .then(() => fs.pathExists(path.join(tmpDir, 'builds/processors.zip')))
            .then(exists => expect(exists).toBe(true))
            .catch(done.fail)
            .finally(() => done());
    });

    it('add assets returns post asset message', (done) => {
        const tjmConfig = _.clone(baseCliConfig);

        assetObject = JSON.stringify({
            success: 'Asset was deployed',
            _id: '12345AssetId'
        });

        const cliFunctions = CliFunctions(tjmConfig, _terasliceClient);
        Promise.resolve()
            .then(() => fs.emptyDir(path.join(tmpDir, 'builds')))
            .then(() => fs.writeFile(path.join(tmpDir, 'builds/processors.zip'), 'this is some sweet text'))
            .then(() => cliFunctions.__testFunctions()._postAsset())
            .then((response) => {
                const parsedResponse = JSON.parse(response);
                expect(parsedResponse.success).toBe('Asset was deployed');
                expect(parsedResponse._id).toBe('12345AssetId');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('load asset removes build, adds metadata to asset, zips asset, posts to cluster', (done) => {
        const tjmConfig = _.clone(baseCliConfig);

        assetObject = JSON.stringify({ success: 'this worked', _id: '1235fakejob' });
        tjmConfig.cluster = 'http://example.dev:5678';
        tjmConfig.a = true;
        const cliFunctions = CliFunctions(tjmConfig, _terasliceClient);

        const assetJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing'
        };

        tjmConfig.asset_file_content = assetJson;

        return Promise.all([
            fs.writeJson(path.join(tmpDir, 'asset/asset.json'), assetJson),
            fs.emptyDir(path.join(tmpDir, 'builds'))
        ])
            .then(() => cliFunctions.loadAsset())
            .then(() => {
                const updatedAssetJson = fs.readJsonSync(path.join(tmpDir, 'asset/asset.json'));
                expect(updatedAssetJson.tjm.clusters[0]).toBe('http://example.dev:5678');
                expect(fs.pathExistsSync(path.join(tmpDir, 'builds/processors.zip'))).toBe(true);
                expect(fs.pathExistsSync(path.join(tmpDir, 'asset/package.json'))).toBe(true);
            })
            .catch(done.fail)
            .finally(() => done());
    });
});
