import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import semver from 'semver';
import { Mutex } from 'async-mutex';
import { TSError } from '@terascope/utils';
import decompress from 'decompress';
import { getMajorVersion } from './asset_utils';

const mutex = new Mutex();

export function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

export function deleteDir(dirPath) {
    return fse.remove(dirPath);
}

export async function verifyAssetJSON(id, newPath) {
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
        const metadata = Object.assign({ id }, packageData);
        if (!metadata.name) {
            throw new Error('Missing name');
        }

        metadata.version = semver.clean(metadata.version);
        if (!semver.valid(metadata.version)) {
            throw new Error(`Invalid version "${metadata.version}"`);
        }

        /**
         * If node_version, platform, or arch is set to a falsey
         * value we should delete it so it is considered a wildcard.
         *
         * This is useful for making an asset bundle that isn't
         * locked down.
        */
        if (metadata.node_version) {
            metadata.node_version = getMajorVersion(metadata.node_version);
        } else {
            delete metadata.node_version;
        }
        if (!metadata.platform) {
            delete metadata.platform;
        }
        if (!metadata.arch) {
            delete metadata.arch;
        }
        return metadata;
    } catch (_err) {
        const err = new TSError(_err, {
            message: "Failure parsing asset.json, please ensure that's it formatted correctly",
            statusCode: 422
        });
        err.parseError = true;
        throw err;
    }
}

async function _saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    const newPath = path.join(assetsPath, id);

    try {
        if (await fse.pathExists(newPath)) {
            await fse.emptyDir(newPath);
        } else {
            await fse.mkdir(newPath);
        }

        logger.info(`decompressing and saving asset ${id} to ${newPath}`);
        await decompress(binaryData, newPath);
        logger.info(`decompressed asset ${id} to ${newPath}`);

        const metadata = await verifyAssetJSON(id, newPath);

        logger.info(`asset ${id} saved to file ${newPath}`, metadata);

        // storage/assets save fn needs to check the return metadata for uniqueness
        if (metaCheck) {
            return await metaCheck(metadata);
        }
        return metadata;
    } catch (err) {
        await deleteDir(newPath);
        throw err;
    }
}

export async function saveAsset(logger, assetsPath, id, binaryData, metaCheck) {
    return mutex.runExclusive(() => _saveAsset(
        logger, assetsPath, id, binaryData, metaCheck
    ));
}
