import { accessSync, readFileSync } from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import semver from 'semver';
import { Mutex } from 'async-mutex';
import { TSError, Logger } from '@terascope/utils';
import decompress from 'decompress';
import { getMajorVersion } from './asset_utils.js';

const mutex = new Mutex();

const packagePath = path.join(process.cwd(), './package.json');

export interface PackageJSON {
    name: string;
    version: string;
    scripts: Record<string, string>
    resolutions: Record<string, string>
    devDependencies: Record<string, string>
    terascope: {
        root?: boolean;
        type?: string;
        target?: string;
        tests?: {
            [key: string]: string[]
        };
        version?: number;
    }
}

let _packageJSON: PackageJSON | undefined;

export function getPackageJSON(): PackageJSON {
    if (_packageJSON) return _packageJSON;

    const file = readFileSync(
        packagePath,
        { encoding: 'utf8' }
    );

    const results = JSON.parse(file) as PackageJSON;
    _packageJSON = results;
    return results;
}

export function existsSync(filename: string) {
    try {
        accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

export function deleteDir(dirPath: string) {
    return fse.remove(dirPath);
}

export interface AssetJSON {
    name: string;
    version: string;
    arch?: string;
    platform?: string;
    node_version?: number;
}

export type metaCheckFN = (data: AssetMetadata) => Promise<AssetMetadata>

export interface AssetMetadata extends AssetJSON {
    id: string
}

export async function verifyAssetJSON(id: string, newPath: string): Promise<AssetMetadata> {
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
        const metadata: AssetMetadata = Object.assign({ id }, packageData);

        if (!metadata.name) {
            throw new Error('Missing name');
        }

        metadata.version = semver.clean(metadata.version) as string;

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
        throw err;
    }
}

async function _saveAsset(
    logger: Logger,
    assetsPath: string,
    id: string,
    binaryData: Buffer,
    metaCheck?: metaCheckFN
): Promise<AssetMetadata> {
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
        console.log('\n\nam i deleting here', err, '\n\n')
        await deleteDir(newPath);
        throw err;
    }
}

export async function saveAsset(
    logger: Logger,
    assetsPath: string,
    id: string,
    binaryData: Buffer,
    metaCheck?: metaCheckFN
) {
    return mutex.runExclusive(() => _saveAsset(
        logger, assetsPath, id, binaryData, metaCheck
    ));
}
