'use strict';

const jasmine = require('jasmine');
const fs = require('fs-extra');
const argv = {};
let tjmFunctions = require('../cmds/cmd_functions/functions')(argv, 'localhost:5678');
const Promise = require('bluebird');
const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');

let jobContents;
let someJobId;
let assetObject;

const _teraslice = {
    jobs: {
        wrap: (jobContents) => {
                return { spec: () => {
                    return Promise.resolve({
                        job_id: someJobId
                    })
                }
            }
        }
    },
    assets: {
        post: () => {
            return Promise.resolve(
                assetObject
            )
        }
    }
};

const packageJson = {
    name: 'common_processors',
    version: '0.0.29',
    description: 'Processing modules that are common across data types',
    main: "index.js"
}

const assetJson = {
    name: 'testing_123',
    version: '0.0.01',
    description: 'dummy asset.json for testing'
}

function createNewAsset() {
    const assetPath = path.join(process.cwd(), 'asset/asset.json');
    const packagePath = path.join(process.cwd(), 'asset/package.json');
    delete assetJson.tjm
    return Promise.resolve()
        .then(() => fs.emptyDir(path.join(process.cwd(), 'asset')))
        .then(() => {
            return Promise.all([
                fs.writeJson(assetPath, assetJson, {spaces: 4}),
                fs.writeJson(packagePath, packageJson, {spaces: 4})
            ])
        });
}

describe('tjmFunctions testing', function() {
    /*
    afterAll(() => {
        return Promise.all([
            fs.remove(path.join(process.cwd(), 'builds')),
            fs.remove(path.join(process.cwd(), 'asset'))
        ]);
    });
    */

    beforeEach(function(done) {
            createNewAsset()
                .then(() => done());
    });

    it('check that cluster name includes a port', () => {
        expect(tjmFunctions.httpClusterNameCheck('localhost:5678')).toBe('http://localhost:5678');
        expect(() => { tjmFunctions.httpClusterNameCheck('localhost')}).toThrow(chalk.red('Cluster names need to include a port number'));
        expect(() => { tjmFunctions.httpClusterNameCheck('http://localhost')}).toThrow(chalk.red('Cluster names need to include a port number'));
    })


    it('check that cluster name starts with http', () => {
        expect(tjmFunctions.httpClusterNameCheck('localhost:5678')).toBe('http://localhost:5678');
        expect(tjmFunctions.httpClusterNameCheck('http://localhost:5678')).toBe('http://localhost:5678');
        expect(tjmFunctions.httpClusterNameCheck('https://localhost:5678')).toBe('https://localhost:5678');
    });

    it('registered jobs return true, unregistered jobs return false', () => {
        jobContents = {
            tjm: {
                cluster: 'http://localhost:5678',
                job_id: 'jobYouAreLookingFor'
            }
        };

        someJobId = 'jobYouAreLookingFor';

        tjmFunctions.__testContext(_teraslice);
        tjmFunctions.alreadyRegisteredCheck(jobContents)
            .then(alreadyRegistered => {
                expect(alreadyRegistered).toBe(true);
            });

        someJobId = 'notTheJobYouAreLookingFor';
        tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(alreadyRegistered => {
            expect(alreadyRegistered).toBe(false);
        });

        jobContents = {}
        someJobId = 'jobYouAreLookingFor';
        tjmFunctions.alreadyRegisteredCheck(jobContents)
        .then(alreadyRegistered => {
            expect(alreadyRegistered).toBe(false);
        });

    })

    it('meta data is being written to assets.json ', () => {
        argv.c = 'http://localhost:5678';
        const tjmFunctions = require('../cmds/cmd_functions/functions')(argv);
        return createNewAsset()
            .then((result) => tjmFunctions.__testFunctions()._updateAssetMetadata())
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://localhost:5678');
            })
            .catch(fail);
    })

    it('cluster is added to array in asset.json if a new cluster', () => {
        return createNewAsset()
            .then(() => {
                _.set(assetJson, 'tjm.clusters');
                assetJson.tjm.clusters =  [ 'http://localhost:5678' ];
                return fs.writeFile(path.join(process.cwd(), 'asset/asset.json'), JSON.stringify(assetJson, null, 4))
            })
            .then(() => {
                argv.c = 'http://newCluster:5678';
                tjmFunctions = require('../cmds/cmd_functions/functions')(argv);
                return tjmFunctions.__testFunctions()._updateAssetMetadata();
            })
            .then((jsonResult) => {
                expect(jsonResult.tjm).toBeDefined();
                expect(jsonResult.tjm.clusters[0]).toBe('http://localhost:5678');
                expect(jsonResult.tjm.clusters[1]).toBe('http://newCluster:5678');
            })
            .catch(fail);
    })

    it('no asset.json throw error', () => {
        argv.c = 'http://localhost:5678'
        tjmFunctions = require('../cmds/cmd_functions/functions')(argv);
        return Promise.resolve()
            .then(() => fs.emptyDir(path.join(process.cwd(), 'asset')))
            .then(() => {
                expect(tjmFunctions.__testFunctions()._updateAssetMetadata).toThrowError();
            })
            .catch(fail);
    })
    
    it('if cluster already in metadata throw error', () => {
        argv.c = 'http://localhost:5678';
        _.set(assetJson, 'tjm.clusters');
        assetJson.tjm.clusters = ['http://localhost:5678', 'http://newCluster:5678', 'http://anotherCluster:5678'];
        tjmFunctions = require('../cmds/cmd_functions/functions')(argv);

        return fs.writeFile(path.join(process.cwd(), 'asset/asset.json'), JSON.stringify(assetJson, null, 4))
            .then(() => expect(tjmFunctions.__testFunctions()._updateAssetMetadata).toThrowError('Assets have already been deployed to http://localhost:5678, use update'))
            .catch(fail)
    })

    it('check that assets are zipped', () => {
        _.set(assetJson, 'tjm.clusters');
        assetJson.tjm.clusters = ['http://localhost:5678', 'http://newCluster:5678', 'http://anotherCluster:5678'];

        return Promise.resolve()
            .then(() => {
                return Promise.all([
                    fs.writeFile(path.join(process.cwd(), 'asset/asset.json'), JSON.stringify(assetJson, null, 4)),
                    fs.emptyDir(path.join(process.cwd(), 'builds'))
                ])
            })
            .then(() => tjmFunctions.zipAsset())
            .then(zipMessage => expect(zipMessage.success).toBe('Assets have been zipped to builds/processors.zip'))
            .then(() => fs.pathExists(path.join(process.cwd(), 'builds/processors.zip')))
            .then(exists => {
                expect(exists).toBe(true);
            })
            .catch(fail);
    })

    it('add assets returns post asset message', () => {
        assetObject = JSON.stringify({ 
            success: 'Asset was deployed',
            _id: '12345AssetId'
        });
        
        return Promise.resolve()
            .then(() => fs.emptyDir(path.join(process.cwd(), 'builds')))
            .then(() => fs.writeFile(path.join(process.cwd(), 'builds/processors.zip'), 'this is some sweet text'))
            .then(() => {
                tjmFunctions.__testContext(_teraslice);
                return tjmFunctions.__testFunctions()._postAsset()
            })
            .then((response) => {
                const parsedResponse = JSON.parse(response);
                expect(parsedResponse.success).toBe('Asset was deployed');
                expect(parsedResponse._id).toBe('12345AssetId');
            })
            .catch(fail);
    })

    xit('load asset removes build, adds metadata to asset, zips asset, posts to cluster', () => {
        assetObject = JSON.stringify({success: 'this worked', _id: '1235fakejob'});
        argv.c = 'localhost:5678'
        argv.a = true;
        tjmFunctions = require('../cmds/cmd_functions/functions')(argv);
        tjmFunctions.__testContext(_teraslice);

        return Promise.resolve()
            .then(() => tjmFunctions.loadAsset())
            .then(postAssetResponse => {
                const updatedAssetJson = require(path.join(process.cwd(), 'asset/asset.json'));
                expect(updatedAssetJson.tjm.clusters[0]).toBe('http://localhost:5678');
                expect(fs.pathExistsSync(path.join(process.cwd(), 'builds/processors.zip'))).toBe(true);
                expect(fs.pathExistsSync(path.join(process.cwd(), 'asset/package.json'))).toBe(true);
            })
            .catch(fail);
    })
});