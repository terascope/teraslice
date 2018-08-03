'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const fse = require('fs-extra');
const { VError, WError } = require('verror');
const shortid = require('shortid');
const decompress = require('decompress');
const _ = require('lodash');
const { logError, isUserError } = require('./error_utils');

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
            .catch((err) => {
                const error = new WError(err, "failure parsing asset.json, please ensure that's it formatted correctly");
                error.userError = true;
                return Promise.reject(error);
            }))
        .catch((err) => {
            logError(logger, err);
            // JSON is formatted incorrectly
            if (isUserError(err)) {
                return Promise.reject(err);
            }

            // check one subdir down for asset.sjon
            const assetJSON = fs.readdirSync(newPath)
                .filter(filename => existsSync(`${newPath}/${filename}/asset.json`));

            if (assetJSON.length === 0) {
                const error = new WError('asset.json was not found in root directory of asset bundle nor any immediate sub directory');
                error.userError = true;
                return Promise.reject(error);
            }

            return fse.readJson(`${newPath}/${assetJSON[0]}/asset.json`)
                .then((packageData) => {
                    _.assign(metaData, packageData);

                    return Promise.resolve(moveContents(newPath, `${newPath}/${assetJSON[0]}`))
                        .then(() => metaData);
                })
                .catch((parseErr) => {
                    const error = new WError(parseErr, "failure while parsing asset.json, please ensure that's it formatted correctly");
                    return Promise.reject(error);
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
            const error = new VError(err, 'failure downloading assets');
            logError(logger, error);
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
