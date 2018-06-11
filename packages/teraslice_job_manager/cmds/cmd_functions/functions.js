'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const archiver = require('archiver');
const Promise = require('bluebird');
const reply = require('./reply')();
const path = require('path');

module.exports = (argv, clusterName) => {
    let cluster;
    if (clusterName) {
        cluster = clusterName;
    } else if (argv.c) {
        cluster = argv.c;
    } else if (argv.l) {
        cluster = 'http://localhost:5678';
    }
    httpClusterNameCheck(cluster);
    let teraslice = require('teraslice-client-js')({
        host: `${httpClusterNameCheck(cluster)}`
    });

    function alreadyRegisteredCheck(jobContents) {
        if (_.has(jobContents, 'tjm.cluster')) {
            return teraslice.jobs.wrap(jobContents.tjm.job_id).spec()
                .then((jobSpec) => {
                    if (jobSpec.job_id === jobContents.tjm.job_id) {
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error('Job is not on the cluster'));
                });
        }
        return Promise.reject(new Error('No cluster configuration for this job'));
    }

    function _postAsset() {
        return Promise.resolve()
            .then(() => fs.readFile(path.join(process.cwd(), 'builds', 'processors.zip')))
            .then(zipFile => teraslice.assets.post(zipFile))
            .then(assetPostResponse => assetPostResponse);
    }

    function loadAsset() {
        if (!argv.a) {
            return Promise.resolve();
        }
        return fs.emptyDir(path.join(process.cwd(), 'builds'))
            .then(() => zipAsset())
            .then((zipData) => {
                reply.green(zipData.bytes);
                reply.green(zipData.success);
            })
            .then(() => _postAsset())
            .then((postResponse) => {
                const postResponseJson = JSON.parse(postResponse);
                if (postResponseJson.error) {
                    return Promise.reject(new Error(postResponseJson.error));
                }
                reply.green(`Asset posted to ${argv.c} with id ${postResponseJson._id}`);
                return Promise.resolve();
            })
            .then(() => {
                const assetJson = _updateAssetMetadata();
                return createJsonFile(path.join(process.cwd(), 'asset/asset.json'), assetJson);
            })
            .then(() => reply.green('TJM data added to asset.json'))
            .then(() => reply.green(`Asset has successfully been deployed to ${argv.c}`));
    }

    function createJsonFile(filePath, jsonObject) {
        return fs.writeJson(filePath, jsonObject, { spaces: 4 });
    }

    function httpClusterNameCheck(url) {
        if (!url) {
            return '';
        }
        // needs to have a port number
        if (url.lastIndexOf(':') !== url.length - 5) {
            reply.fatal('Cluster names need to include a port number');
        }

        if (url.indexOf('http') !== 0) {
            return `http://${url}`;
        }
        return url;
    }

    function zipAsset() {
        const zipMessage = {};

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(path.join(process.cwd(), 'builds', 'processors.zip'));
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            output.on('finish', () => {
                zipMessage.bytes = `${archive.pointer()} total bytes`;
                zipMessage.success = 'Assets have been zipped to builds/processors.zip';
                resolve(zipMessage);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive
                .directory(path.join(process.cwd(), 'asset'), 'asset')
                .finalize();
        });
    }

    function _updateAssetMetadata() {
        // writes asset metadata to asset.json
        let assetJson;

        try {
            assetJson = fs.readJsonSync(path.join(process.cwd(), 'asset', 'asset.json'));
        } catch (err) {
            throw new Error(`Could not load asset.json: ${err.message}`);
        }

        const c = argv.l ? 'http://localhost:5678' : argv.c;
        if (_.has(assetJson, 'tjm.clusters')) {
            if (_.indexOf(assetJson.tjm.clusters, httpClusterNameCheck(c)) >= 0) {
                throw new Error(`Assets have already been deployed to ${c}, use update`);
            }
            assetJson.tjm.clusters.push(httpClusterNameCheck(c));
            return assetJson;
        }
        _.set(assetJson, 'tjm.clusters', [httpClusterNameCheck(c)]);
        return assetJson;
    }

    function __testContext(_teraslice) {
        teraslice = _teraslice;
    }

    function __testFunctions() {
        return {
            _updateAssetMetadata,
            _postAsset
        };
    }

    return {
        alreadyRegisteredCheck,
        httpClusterNameCheck,
        loadAsset,
        createJsonFile,
        teraslice,
        __testContext,
        __testFunctions,
        zipAsset,
    };
};
