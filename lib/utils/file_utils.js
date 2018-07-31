'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const fse = require('fs-extra');
const parseError = require('@terascope/error-parser');
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

function deleteDir(path) {
    return fse.remove(path);
}

function normalizeZipFile(id, newPath, logger) {
    const metaData = { id };
    const packagePath = `${newPath}/asset.json`;

    return fse.open(packagePath, 'r')
        .then(() => fse.readJson(packagePath)
            .then((packageData) => {
                _.assign(metaData, packageData);
                return metaData;
            })
            .catch(() => {
                const error = new Error("error occurred while parsing asset.json, please ensure that's it formatted correctly");
                error.parseError = true;
                logger.error(error.message);
                return Promise.reject(error);
            }))
        .catch((err) => {
            // JSON is formatted incorrectly
            if (err.parseError) {
                return Promise.reject(err);
            }

            // check one subdir down for asset.sjon
            const assetJSON = fs.readdirSync(newPath)
                .filter(filename => existsSync(`${newPath}/${filename}/asset.json`));

            if (assetJSON.length === 0) {
                return Promise.reject(new Error('asset.json was not found in root directory of asset bundle nor any immediate sub directory'));
            }

            return fse.readJson(`${newPath}/${assetJSON[0]}/asset.json`)
                .then((packageData) => {
                    _.assign(metaData, packageData);

                    return Promise.resolve(moveContents(newPath, `${newPath}/${assetJSON[0]}`))
                        .then(() => metaData);
                })
                .catch(() => {
                    const errMsg = "error occurred while parsing asset.json, please ensure that's it formatted correctly";
                    return Promise.reject(new Error(errMsg));
                });
        });
}

function moveContents(rootPath, subDirPath) {
    const children = fs.readdirSync(subDirPath);
    return Promise.map(children, child => fse.move(`${subDirPath}/${child}`, `${rootPath}/${child}`))
        .then(() => fse.remove(subDirPath));
}

function saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    const newPath = `${assetsPath}/${id}`;
    const tempFileName = `${newPath}/${shortid.generate()}.zip`;

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

        .catch((err) => {
            const errMsg = parseError(err);
            const error = new Error(`Error downloading assets: ${errMsg}`);
            logger.error(error.stack);
            // cleanup remnant directory
            return deleteDir(newPath)
                .then(() => Promise.reject(error));
        });
}


module.exports = {
    existsSync,
    saveAsset,
    deleteDir,
    normalizeZipFile
};
