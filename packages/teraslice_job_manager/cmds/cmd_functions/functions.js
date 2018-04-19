'use strict';

const _ = require('lodash');
const fs = require('fs');
const archiver = require('archiver');
const Promise = require('bluebird');
const reply = require('./reply')();

module.exports = (argv, clusterName) => {
    const cluster = clusterName || argv.c;

    const teraslice = require('teraslice-client-js')({
        host: `${httpClusterNameCheck(cluster)}:5678`
    });

    function alreadyRegisteredCheck(jobContents) {
        if (_.has(jobContents, 'tjm.cluster')) {
            return teraslice.jobs.wrap(jobContents.tjm.job_id).spec()
                .then((jobSpec) => {
                    if (jobSpec.job_id === jobContents.tjm.job_id) {
                        return Promise.resolve(true);
                    }
                    return Promise.resolve(false);
                });
        }
        return Promise.resolve(false);
    }

    function addAssets() {
        const zname = fs.readFileSync(`${process.cwd()}/builds/processors.zip`);
        return teraslice.assets.post(zname)
            .then((asset) => {
                const msg = JSON.parse(asset);
                if (msg.error) {
                    reply.error(msg.error);
                } else {
                    reply.success(`Asset ${msg._id} successfully loaded`);
                }
            });
    }

    function loadAssets() {
        if (argv.a === true) {
            return removeProcessZip()
                .then(() => updateAssetsMetadata())
                .then((assetJson) => createJsonFile(`${process.cwd()}/asset/asset.json`, assetJson))
                .then(() => zipAssets())
                .then(() => addAssets())
                .catch((err) => {
                    reply.error(err);
                });
        }
        return Promise.resolve(true);
    }

    function createJsonFile(filePath, jsonObject) {
        fs.writeFile(filePath, JSON.stringify(jsonObject, null, 4), (err) => {
            if (err) {
                reply.error(err.message);
            }
        });
    }

    function httpClusterNameCheck(clusterCheck) {
        if (clusterCheck.indexOf('http') !== 0) {
            return `http://${clusterCheck}`;
        }
        return clusterCheck;
    }

    function removeProcessZip() {
        const assetsPath = `${process.cwd()}/builds/processors.zip`;
        const buildsPath = `${process.cwd()}/builds`;

        return new Promise((resolve, reject) => {
            fs.unlink(assetsPath, (err) => {
                if (err && err.code === 'ENOENT') {
                    fs.mkdir(buildsPath, (buildsErr) => {
                        if (buildsErr && buildsErr.code !== 'EEXIST') {
                            reject(buildsErr);
                        }
                        resolve();
                    });
                }
                resolve();
            });
        });
    }

    function zipAssets() {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(`${process.cwd()}/builds/processors.zip`);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            output.on('finish', () => {
                reply.success(`${archive.pointer()} total bytes`);
                reply.success('Assets have been zipped to builds/processors.zip');
                return resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive
                .directory(`${process.cwd()}/asset/`, 'asset')
                .finalize();
        });
    }

    function updateAssetsMetadata() {
        // write asset metadata to asset.json
        return new Promise((resolve, reject) => {
            const assetJson = require(`${process.cwd()}/asset/asset.json`);
            if (_.has(assetJson, 'tjm.clusters')) {
                if (_.indexOf(assetJson.tjm.clusters, argv.c) < 0) {
                    reject(`Assets have already been deployed to ${argv.c}, use update`);
                }
                    assetJson.tjm.clusters.push(httpClusterNameCheck(argv.c));
                    resolve(assetJson);
            } else {
                (_.set(assetJson, 'tjm.clusters', [httpClusterNameCheck(argv.c)]));
                resolve(assetJson)
            }
        })
    }

    return {
        addAssets,
        alreadyRegisteredCheck,
        httpClusterNameCheck,
        loadAssets,
        createJsonFile,
        teraslice,
        removeProcessZip,
        zipAssets,
    };
};
