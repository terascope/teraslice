'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const shortid = require('shortid');
const decompress = require('decompress');

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

// to do refactor me, this function is barely readable
function normalizeZipFile(id, newPath, logger) {
    const metaData = { id };
    const packagePath = path.join(newPath, 'asset.json');

    return fse
        .open(packagePath, 'r')
        .then(() => fse
            .readJson(packagePath)
            .then((packageData) => {
                Object.assign(metaData, packageData);
                return metaData;
            })
            .catch(() => {
                const error = new Error(
                    "Failure parsing asset.json, please ensure that's it formatted correctly"
                );
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

            // check one subdir down for asset.json
            const assetJSON = fs
                .readdirSync(newPath)
                .filter((filename) => existsSync(path.join(newPath, filename, 'asset.json')));

            if (assetJSON.length === 0) {
                const error = new Error(
                    'asset.json was not found in root directory of asset bundle nor any immediate sub directory'
                );
                error.code = 422;
                return Promise.reject(error);
            }

            return fse
                .readJson(path.join(newPath, assetJSON[0], 'asset.json'))
                .then((packageData) => {
                    Object.assign(metaData, packageData);

                    return Promise.resolve(
                        moveContents(newPath, path.join(newPath, assetJSON[0]))
                    ).then(() => metaData);
                })
                .catch(() => {
                    const error = new Error(
                        "Failure parsing asset.json, please ensure that's it formatted correctly"
                    );
                    error.parseError = true;
                    error.code = 422;
                    return Promise.reject(error);
                });
        });
}

async function moveContents(rootPath, subDirPath) {
    const children = fs.readdirSync(subDirPath);
    const promises = children.map((child) => {
        const src = path.join(subDirPath, child);
        const dest = path.join(rootPath, child);
        return fse.move(src, dest);
    });
    await Promise.all(promises);
    await fse.remove(subDirPath);
}

async function saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    const newPath = path.join(assetsPath, id);
    const tempFileName = path.join(newPath, `${shortid.generate()}.zip`);

    try {
        if (fse.existsSync(newPath)) {
            await fse.emptyDir(newPath);
        } else {
            await fse.mkdir(newPath);
        }

        await fse.writeFile(tempFileName, binaryData);
        await decompress(tempFileName, newPath);
        await fse.unlink(tempFileName);

        const metaData = await normalizeZipFile(id, newPath, logger);
        // storage/assets save fn needs to check the return metadata for uniqueness
        if (metaCheck) {
            return metaCheck(metaData);
        }
        return metaData;
    } catch (err) {
        await deleteDir(newPath);
        throw err;
    }
}

module.exports = {
    existsSync,
    saveAsset,
    deleteDir,
    normalizeZipFile
};
