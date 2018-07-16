'use strict';

const fs = require('fs-extra');

const tjmConfig = {};
let tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig, 'localhost:5678');
const Promise = require('bluebird');
const path = require('path');

let jobContents;
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
    const assetPath = path.join(__dirname, '..', 'asset/asset.json');
    const packagePath = path.join(__dirname, '..', 'asset/package.json');
    return Promise.resolve()
        .then(() => fs.emptyDir(path.join(__dirname, '..', 'asset')))
        .then(() => Promise.all([
            fs.writeJson(assetPath, {
                name: 'testing_123',
                version: '0.0.01',
                description: 'dummy asset.json for testing'
            }, { spaces: 4 }),
            fs.writeJson(packagePath, packageJson, { spaces: 4 })
        ]));
}

describe('tjmFunctions testing', () => {
    afterAll(() => Promise.all([
        fs.remove(path.join(__dirname, '..', 'builds')),
        fs.remove(path.join(__dirname, '..', 'asset'))
    ]));

    beforeEach(() => createNewAsset());

    it('alreadyRegisteredCheck should resolve if the job exists', (done) => {
        jobContents = {
            tjm: {
                cluster: 'http://localhost:5678',
                job_id: 'jobYouAreLookingFor'
            }
        };

        tjmConfig.job_file_content = jobContents;
        tjmConfig.job_file_path = 'someFilePath';
        tjmConfig.cluster = 'clustername';

        someJobId = 'jobYouAreLookingFor';

        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        tjmFunctions.__testContext(_terasliceClient);
        tjmFunctions.alreadyRegisteredCheck()
            .then(result => expect(result).toBe(true))
            .catch(done.fail)
            .finally(() => done());
    });

    it('alreadyRegisteredCheck should reject if the job exists', (done) => {
        someJobId = 'notTheJobYouAreLookingFor';
        jobContents = {
            tjm: {
                cluster: 'http://localhost:5678',
                job_id: 'jobYouAreLookingFor'
            }
        };

        tjmConfig.job_file_content = jobContents;
        tjmConfig.job_file_path = 'someFilePath';
        tjmConfig.cluster = 'clustername';

        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        tjmFunctions.__testContext(_terasliceClient);
        tjmFunctions.alreadyRegisteredCheck(jobContents)
            .catch((err) => {
                expect(err.message).toEqual('Job is not on the cluster');
            })
            .finally(() => done());
    });

    it('alreadyRegisteredCheck should reject if the job contents are empty', (done) => {
        jobContents = {};
        const jobData = {
            contents: jobContents,
            file_path: 'someFilePath',
            cluster: 'clustername'
        }

        tjmConfig.job_file_content = jobContents;
        tjmConfig.job_file_path = 'someFilePath';

        someJobId = 'jobYouAreLookingFor';
        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        tjmFunctions.alreadyRegisteredCheck()
            .catch((err) => {
                expect(err.message).toEqual('No cluster configuration for this job');
            })
            .finally(() => done());
    });

    it('meta data is being written to assets.json ', (done) => {
        tjmConfig.cluster = 'http://localhost:5678';
        tjmConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing'
        }

        const tjmFuncs = require('../cmds/cmd_functions/functions')(tjmConfig);
        return Promise.resolve()
            .then(() => tjmFuncs.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://localhost:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('cluster is added to array in asset.json if a new cluster', (done) => {   
        
        tjmConfig.cluster = 'http://anotherCluster:5678';
        tjmConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://localhost:5678', 'http://newCluster:5678']
            }
        }

        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        return Promise.resolve()
            .then(() => tjmFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://localhost:5678');
                expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
                expect(jsonResult.tjm.clusters[2]).toBe('http://anotherCluster:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('cluster is not added to array in asset.json it is already there', (done) => {   
        
        tjmConfig.cluster = 'http://newCluster:5678';
        tjmConfig.asset_file_content = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://localhost:5678', 'http://newCluster:5678']
            }
        }

        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        return Promise.resolve()
            .then(() => tjmFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters.length).toBe(2);
                expect(jsonResult.tjm.clusters[0]).toBe('http://localhost:5678');
                expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
            })
            .catch(done.fail)
            .finally(() => done());
    });

    it('check that assets are zipped', (done) => {
        const assetJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing',
            tjm: {
                clusters: ['http://localhost:5678', 'http://newCluster:5678', 'http://anotherCluster:5678']
            }
        };
        return Promise.all([
            fs.writeFile(path.join(__dirname, '..', 'asset/asset.json'), JSON.stringify(assetJson, null, 4)),
            fs.emptyDir(path.join(__dirname, '..', 'builds'))
        ])
            .then(() => tjmFunctions.zipAsset())
            .then(zipMessage => expect(zipMessage.success).toBe('Assets have been zipped to builds/processors.zip'))
            .then(() => fs.pathExists(path.join(__dirname, '..', 'builds/processors.zip')))
            .then((exists) => expect(exists).toBe(true))
            .catch(done.fail)
            .finally(() => done());
    });

    it('add assets returns post asset message', (done) => {
        assetObject = JSON.stringify({
            success: 'Asset was deployed',
            _id: '12345AssetId'
        });

        Promise.resolve()
        .then(() => fs.emptyDir(path.join(__dirname, '..', 'builds')))
        .then(() => fs.writeFile(path.join(__dirname, '..', 'builds/processors.zip'), 'this is some sweet text'))
        .then(() => {
            tjmFunctions.__testContext(_terasliceClient);
            return tjmFunctions.__testFunctions()._postAsset();
        })
        .then((response) => {
            const parsedResponse = JSON.parse(response);
            expect(parsedResponse.success).toBe('Asset was deployed');
            expect(parsedResponse._id).toBe('12345AssetId');
        })
        .catch(done.fail)
        .finally(() => done());
    });

    it('load asset removes build, adds metadata to asset, zips asset, posts to cluster', (done) => {
        assetObject = JSON.stringify({ success: 'this worked', _id: '1235fakejob' });
        tjmConfig.cluster = 'http://localhost:5678';
        tjmConfig.a = true;
        tjmFunctions = require('../cmds/cmd_functions/functions')(tjmConfig);
        tjmFunctions.__testContext(_terasliceClient);

        const assetJson = {
            name: 'testing_123',
            version: '0.0.01',
            description: 'dummy asset.json for testing'
        };
        return Promise.all([
            fs.writeFile(path.join(__dirname, '..', 'asset/asset.json'), JSON.stringify(assetJson, null, 4)),
            fs.emptyDir(path.join(__dirname, '..', 'builds'))
        ])
        .then(() => tjmFunctions.loadAsset())
        .then(() => {
                const updatedAssetJson = require(path.join(__dirname, '..', 'asset/asset.json'));
                expect(updatedAssetJson.tjm.clusters[0]).toBe('http://localhost:5678');
                expect(fs.pathExistsSync(path.join(__dirname, '..', 'builds/processors.zip'))).toBe(true);
                expect(fs.pathExistsSync(path.join(__dirname, '..', 'asset/package.json'))).toBe(true);
        })
        .catch(done.fail)
        .finally(() => done());
    });
});
