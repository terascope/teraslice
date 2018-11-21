
'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const archiver = require('archiver');
const Promise = require('bluebird');
const path = require('path');
const reply = require('./reply')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    function _postAsset() {
        return Promise.resolve()
            .then(() => fs.readFile(path.join(cliConfig.baseDir, 'builds', 'processors.zip')))
            .then(zipFile => terasliceClient.assets.post(zipFile))
            .then(assetPostResponse => assetPostResponse);
    }

    function load() {
        if (!cliConfig.a) {
            return Promise.resolve();
        }
        return fs.emptyDir(path.join(cliConfig.baseDir, 'builds'))
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
                reply.green(`Asset posted to ${cliConfig.cluster} with id ${postResponseJson._id}`);
                return Promise.resolve();
            })
            .then(() => {
                const assetJson = _updateAssetMetadata();
                return createJsonFile(path.join(cliConfig.baseDir, 'asset/asset.json'), assetJson);
            })
            .then(() => reply.green('cli data added to asset.json'))
            .then(() => reply.green(`Asset has successfully been deployed to ${cliConfig.cluster}`));
    }

    function createJsonFile(filePath, jsonObject) {
        return fs.writeJson(filePath, jsonObject, { spaces: 4 });
    }

    function zipAsset() {
        const zipMessage = {};

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(path.join(cliConfig.baseDir, 'builds', 'processors.zip'));
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
                .directory(path.join(cliConfig.baseDir, 'asset'), 'asset')
                .finalize();
        });
    }

    function _updateAssetMetadata() {
        // writes asset metadata to asset.json
        const { cluster } = cliConfig;
        const assetJson = cliConfig.asset_file_content;

        if (!cluster) {
            throw new Error('Cluster configuration is invalid');
        }

        if (!_.has(assetJson, 'cli.clusters')) {
            _.set(assetJson, 'cli.clusters', [cluster]);
        } else if (assetJson.cli.clusters.indexOf(cluster) === -1) {
            assetJson.cli.clusters.push(cluster);
        }
        return assetJson;
    }

    function __testFunctions() {
        return {
            _updateAssetMetadata,
            _postAsset
        };
    }

    return {
        load,
        createJsonFile,
        __testFunctions,
        zipAsset,
    };
};
