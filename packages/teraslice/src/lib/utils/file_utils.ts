import { accessSync, readFileSync } from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import semver from 'semver';
import { Mutex } from 'async-mutex';
import { TSError, Logger } from '@terascope/core-utils';
import extract from 'extract-zip';
import { getMajorVersion } from './asset_utils.js';

const mutex = new Mutex();

const packagePath = path.join(process.cwd(), './package.json');

export interface PackageJSON {
    name: string;
    version: string;
    scripts: Record<string, string>;
    resolutions: Record<string, string>;
    devDependencies: Record<string, string>;
    terascope: {
        root?: boolean;
        type?: string;
        target?: string;
        tests?: {
            [key: string]: string[];
        };
        version?: number;
    };
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
    minimum_teraslice_version?: string;
}

export type MetaCheckFN = (data: AssetMetadata) => Promise<AssetMetadata>;

export interface AssetMetadata extends AssetJSON {
    id: string;
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

    let packageData;
    try {
        packageData = await fse.readJson(path.join(newPath, 'asset.json'));
    } catch (_err) {
        const err = new TSError(_err, {
            message: 'Failure parsing asset.json, please ensure that\'s it formatted correctly',
            statusCode: 422
        });
        throw err;
    }

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
    if (metadata.minimum_teraslice_version) {
        const terasliceVersion = getPackageJSON().version;
        if (semver.gt(metadata.minimum_teraslice_version, terasliceVersion)) {
            throw new Error(`Asset requires teraslice version ${metadata.minimum_teraslice_version} or greater.`);
        }
    }
    return metadata;
}

/**
 * Extract a zip file already on disk into the asset directory and verify it.
 * Streaming the archive entry-by-entry to disk keeps memory bounded, unlike
 * buffering the whole archive plus its decompressed contents in memory.
 */
async function _extractAssetFromFile(
    logger: Logger,
    assetsPath: string,
    id: string,
    zipFilePath: string,
    metaCheck?: MetaCheckFN
): Promise<AssetMetadata> {
    const newPath = path.join(assetsPath, id);

    try {
        if (await fse.pathExists(newPath)) {
            await fse.emptyDir(newPath);
        } else {
            await fse.mkdir(newPath);
        }

        logger.info(`decompressing and saving asset ${id} to ${newPath}`);
        // extract-zip streams each entry straight to disk, so peak memory is
        // one entry rather than the entire archive plus its expanded contents.
        await extract(zipFilePath, { dir: newPath });
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

/**
 * Save an asset from a zip file already written to disk. Preferred for large
 * assets (e.g. streamed down from S3) since nothing is held in memory.
 */
export async function saveAssetFromFile(
    logger: Logger,
    assetsPath: string,
    id: string,
    zipFilePath: string,
    metaCheck?: MetaCheckFN
) {
    return mutex.runExclusive(() => _extractAssetFromFile(
        logger, assetsPath, id, zipFilePath, metaCheck
    ));
}

/**
 * Save an asset from an in-memory zip buffer. The buffer is written to a temp
 * file next to the asset dir (same volume) and then extracted via streaming.
 */
export async function saveAsset(
    logger: Logger,
    assetsPath: string,
    id: string,
    binaryData: Buffer,
    metaCheck?: MetaCheckFN
) {
    return mutex.runExclusive(async () => {
        const tmpZipPath = path.join(assetsPath, `${id}.tmp.zip`);
        try {
            await fse.writeFile(tmpZipPath, binaryData);
            return await _extractAssetFromFile(
                logger, assetsPath, id, tmpZipPath, metaCheck
            );
        } finally {
            await fse.remove(tmpZipPath).catch(() => { /* best-effort cleanup */ });
        }
    });
}

/**
 * Check if a buffer contains a zip file.
 * Note that file extension and mime type are not checked.
 * Any file type that is actually a zip (.xlsx, .jar, .apk,
 * .epub) will return true.
 * @param {Buffer} buffer A buffer containing a file file
 * @returns {boolean}
 */
export function isZipFile(buffer: Buffer) {
    const zipSignature = [0x50, 0x4B, 0x03, 0x04];
    return zipSignature.every((byte, index) => buffer[index] === byte);
}
