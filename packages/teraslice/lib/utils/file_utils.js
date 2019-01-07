'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const fse = require('fs-extra');
const shortid = require('shortid');
const decompress = require('decompress');
const _ = require('lodash');

function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

function deleteDir(dirPath) {
    return fse.remove(dirPath);
}

function normalizeZipFile(id, newPath, logger) {
    const metaData = { id };
    const packagePath = path.join(newPath, 'asset.json');

    return fse.open(packagePath, 'r')
        .then(() => fse.readJson(packagePath)
            .then((packageData) => {
                _.assign(metaData, packageData);
                return metaData;
            })
            .catch(() => {
                const error = new Error("Failure parsing asset.json, please ensure that's it formatted correctly");
                error.code = 422;
                error.parseError = true;
                logger.error(error);
                return Promise.reject(error);
            }))
        .catch((err) => {
            // JSON is formatted incorrectly
            if (err.parseError) {
                return Promise.reject(err);
            }

            // check one subdir down for asset.sjon
            const assetJSON = fs.readdirSync(newPath)
                .filter(filename => existsSync(path.join(newPath, filename, 'asset.json')));

            if (assetJSON.length === 0) {
                const error = new Error('asset.json was not found in root directory of asset bundle nor any immediate sub directory');
                error.code = 422;
                return Promise.reject(error);
            }

            return fse.readJson(path.join(newPath, assetJSON[0], 'asset.json'))
                .then((packageData) => {
                    _.assign(metaData, packageData);

                    return Promise.resolve(moveContents(newPath, path.join(newPath, assetJSON[0])))
                        .then(() => metaData);
                })
                .catch(() => {
                    const error = new Error("Failure parsing asset.json, please ensure that's it formatted correctly");
                    error.parseError = true;
                    error.code = 422;
                    return Promise.reject(error);
                });
        });
}

function moveContents(rootPath, subDirPath) {
    const children = fs.readdirSync(subDirPath);
    return Promise.map(children, (child) => {
        const src = path.join(subDirPath, child);
        const dest = path.join(rootPath, child);
        return fse.move(src, dest);
    }).then(() => fse.remove(subDirPath));
}

function saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    const newPath = path.join(assetsPath, id);
    const tempFileName = path.join(newPath, `${shortid.generate()}.zip`);

    return fse.mkdir(newPath)
        .then(() => fse.writeFile(tempFileName, binaryData))
        .then(() => decompress(tempFileName, newPath))
        .then(() => fse.unlink(tempFileName))
        .then(() => normalizeZipFile(id, newPath, logger)
            .then((metaData) => {
                // storage/assets save fn needs to check the return metadata for uniqueness
                if (metaCheck) {
                    return metaCheck(metaData);
                }
                return metaData;
            }))
        .catch(err => deleteDir(newPath)
            .then(() => Promise.reject(err)));
}


module.exports = {
    existsSync,
    saveAsset,
    deleteDir,
    normalizeZipFile
};
