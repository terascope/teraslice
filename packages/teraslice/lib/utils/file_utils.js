'use strict';

const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const { TSError } = require('@terascope/utils');
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

async function verifyAssetJSON(id, newPath) {
    const hasAssetJSONTopLevel = await fse.pathExists(path.join(newPath, 'asset.json'));
    if (!hasAssetJSONTopLevel) {
        const err = new TSError(
            'asset.json was not found in root directory of asset bundle',
            { statusCode: 422 }
        );
        throw err;
    }

    try {
        const packageData = await fse.readJson(path.join(newPath, 'asset.json'));
        return Object.assign({ id }, packageData);
    } catch (_err) {
        const err = new TSError(_err, {
            message: "Failure parsing asset.json, please ensure that's it formatted correctly",
            statusCode: 422
        });
        err.parseError = true;
        throw err;
    }
}

async function saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    const newPath = path.join(assetsPath, id);

    try {
        if (await fse.pathExists(newPath)) {
            await fse.emptyDir(newPath);
        } else {
            await fse.mkdir(newPath);
        }

        logger.trace(`decompressing and saving asset ${id} to ${newPath}`);
        await decompress(binaryData, newPath);
        logger.trace(`decompressed ${id} to ${newPath}`);

        const metaData = await verifyAssetJSON(id, newPath);
        logger.trace(`asset ${id} saved to file ${newPath}`);

        // storage/assets save fn needs to check the return metadata for uniqueness
        if (metaCheck) {
            return await metaCheck(metaData);
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
    verifyAssetJSON
};
