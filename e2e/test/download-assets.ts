import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { downloadRelease, HTTPError } from '@terascope/fetch-github-release';
import { pRetry, isCI } from '@terascope/core-utils';
import signale from './signale.js';
import { AUTOLOAD_PATH, ASSET_BUNDLES_PATH, USE_DEV_ASSETS } from './constants.js';

type AssetInfo = {
    name: string;
    version: semver.SemVer | null;
    newerVersion?: semver.SemVer | null;
    repo: string;
    bundle: boolean;
    fileName: string;
    assetNodeVersion: string;
};

/**
 * This will get the correct teraslice node version so
 * we can download the correct asset
*/
function getNodeVersion() {
    const majorNodeVersion = process.version.substring(1).split('.')[0];
    if (Number.isNaN(majorNodeVersion)) {
        throw new Error(`Expected to find a valid node major version in the Dockerfile but found ${majorNodeVersion}`);
    }

    return String(majorNodeVersion);
}

const nodeVersion = getNodeVersion();

const leaveZipped = true;
const disableLogging = true;

export const defaultAssetBundles = [
    {
        repo: 'elasticsearch-assets',
        name: 'elasticsearch'
    },
    {
        repo: 'kafka-assets',
        name: 'kafka'
    },
    {
        repo: 'standard-assets',
        name: 'standard'
    }
];

export function assetFileInfo(assetName: string): AssetInfo {
    const splitAssetName = assetName.split('-');
    const name = splitAssetName[0];
    let semverVersion;
    let assetVersion: string | null;
    let assetNodeVersion: string;
    // Ensure the files are of the correct extension
    if (!assetName.endsWith('.zip')) {
        throw new Error(`Invalid file extension for asset file ${assetName}. Should be a .zip file.`);
    } else {
        const firstDashIndex = assetName.indexOf('-');
        if (firstDashIndex === -1) {
            throw new Error(`Error parsing asset file name. The name should have dashes in it (-)`);
        }
        // Removes the asset name prefix
        // EX: kafka-v4.4.0-node-22-bundle.zip -> v4.4.0-node-22-bundle.zip -> v4.4.0
        assetVersion = assetName.slice(firstDashIndex + 1);

        const nodeIndex = assetVersion.indexOf('-node-');
        if (nodeIndex === -1) {
            throw new Error(`Error parsing asset file name. The name should have "-node-**" in it to determine node version.`);
        }
        // Removes node*
        // EX: v4.4.0-node-22-bundle.zip -> v4.4.0
        assetVersion = assetVersion.slice(0, nodeIndex);

        assetVersion = semver.clean(assetVersion);
        if (assetVersion === null) {
            throw new Error(`semver was unable to clean asset version for ${assetName}`);
        }

        semverVersion = semver.coerce(assetVersion, { includePrerelease: true });
        if (semverVersion === null) {
            throw new Error(`semver was unable to return a version for ${assetName}`);
        }
        assetNodeVersion = splitAssetName[splitAssetName.indexOf('node') + 1];
    }

    return {
        name,
        version: semverVersion,
        repo: `${name}-assets`,
        bundle: assetName.includes('-bundle'),
        fileName: assetName,
        assetNodeVersion
    };
}

function getOlderAssets(assets: AssetInfo[], assetName: string): AssetInfo[] {
    const { name, version } = assetFileInfo(assetName);

    // If we have no version we can't compare to other versions
    if (version === null) {
        return [];
    }
    return assets.filter((other) => {
        if (other.name !== name) return false;

        // Asset file name should always contain node version. If it doesn't, lets delete it.
        if (other.version === null) {
            return true;
        }
        return semver.gt(version, other.version);
    });
}

export function filterRelease(release: any) {
    if (!USE_DEV_ASSETS) {
        const version = semver.clean(release.tag_name);
        const semverVersion = semver.coerce(version, { includePrerelease: true });
        // If the prerelease array isn't empty we don't want it.
        if (semverVersion?.prerelease && semverVersion?.prerelease.length > 0) {
            return false;
        }
    }
    return !release.draft;
}

function filterAsset(asset: any) {
    // if it includes the bundle choose that
    return asset.name.includes(`node-${nodeVersion}-bundle.zip`);
}

function listAssets() {
    return fs
        .readdirSync(AUTOLOAD_PATH)
        .filter((file) => {
            const ext = path.extname(file);
            return ext === '.zip';
        })
        .map(assetFileInfo);
}

function count(arr: any[], fn: (arg: any) => boolean) {
    let c = 0;

    for (const v of arr) {
        if (fn(v)) c++;
    }

    return c;
}

/**
 * Returns all assets in autoload directory with a
 * name that matches any other asset present
 * @returns {AssetInfo[]}
 */
function listDuplicateAssets(): AssetInfo[] {
    return listAssets().filter(({ name }, i, all) => {
        const c = count(all, (a) => a.name === name);
        return c > 1;
    });
}

/**
 * Checks node version of all assets in the autoload directory.
 * Deletes those that don't match the teraslice node version.
 */
function deleteAssetsWithWrongNodeVersions() {
    const duplicateAssets = listDuplicateAssets();

    const assetsWithWrongNodeVersion = duplicateAssets
        .filter((asset) => asset.assetNodeVersion !== nodeVersion);

    for (const asset of assetsWithWrongNodeVersion) {
        signale.warn(`Deleting asset ${asset.fileName} because node version does not match ${nodeVersion}`);
        fs.unlinkSync(path.join(AUTOLOAD_PATH, asset.fileName));
    }
}

/**
 * Compares version numbers of duplicate assets. Deletes older versions
 */
function deleteOlderAssets() {
    const duplicateAssets = listDuplicateAssets();

    const olderAssets = duplicateAssets
        .reduce((acc: AssetInfo[], current, index, src) => {
            const without = src.filter((a, i) => index !== i);
            const older = getOlderAssets(without, current.fileName);
            if (older.length > 0) {
                for (const asset of older) {
                    asset.newerVersion = current.version;
                    if (!acc.includes(asset)) acc.push(asset);
                }
                return acc;
            }
            return acc.concat([current]);
        }, []);

    for (const asset of olderAssets) {
        const b = asset.bundle ? ' [bundle]' : ' [non-bundle]';
        signale.warn(`Deleting asset ${asset.name}@v${asset.version} in-favor of existing v${asset.newerVersion || asset.version}${b}`);
        fs.unlinkSync(path.join(AUTOLOAD_PATH, asset.fileName));
    }
}

function deleteAssetsWithDevTag() {
    const assets = listAssets();
    const filteredAssets = assets.filter((val) => {
        if (val.version) {
            return val.version?.prerelease.length > 0;
        } else {
            throw false;
        }
    });
    for (const asset of filteredAssets) {
        signale.warn(`Deleting asset ${asset.fileName} because it has a pre-release tag`);
        fs.unlinkSync(path.join(AUTOLOAD_PATH, asset.fileName));
    }
}

function logAssets() {
    const assets = listAssets().map(({
        name, bundle, version, assetNodeVersion
    }) => {
        if (bundle) return `${name}@v${version}-node-${assetNodeVersion} [bundle]`;
        return `${name}@v${version} [non-bundle]`;
    });
    if (!assets.length) return;

    signale.info(`Autoload asset bundles: ${assets.join(', ')}`);
}

/**
 * Parse the got HTTPError response headers for custom Github fields
 * to determine how long to wait before retrying a request
 * @param {HTTPError} err The error returned from got
 * @returns {number} milliseconds to wait
 */
function getMSUntilRetry(err: HTTPError): number {
    const RATE_LIMIT_DELAY_MS = 60_000;
    const retryAfterSec = err.response.headers['retry-after'];
    const remaining = err.response.headers['x-ratelimit-remaining'];
    const resetTime = err.response.headers['x-ratelimit-reset'];
    let delay = RATE_LIMIT_DELAY_MS;
    if (retryAfterSec) {
        delay = Number(retryAfterSec) * 1000;
    }
    if (resetTime && remaining && Number(remaining) === 0) {
        delay = (Number(resetTime) * 1000) - Date.now();
    }
    signale.info(`retry-after: ${retryAfterSec}, x-ratelimit-remaining: ${remaining}, x-ratelimit-reset: ${resetTime}`);
    signale.info(`Will retry download in ${delay} MS.`);
    return delay;
}

/**
 * If a Got HTTPError, calculate the delay based on the headers of the
 * initial response or throw error if delay is longer than MAX_WAIT_MS.
 * If any other error return undefined.
 * @param {any} err The response error
 * @returns {number|undefined} Delay in milliseconds or undefined
 */
function calculateDelay(err: any): number | undefined {
    const MAX_WAIT_MS = 180_000;

    if (err instanceof HTTPError) {
        const { statusCode } = err.response;
        if (statusCode === 403 || statusCode === 429) {
            const delay = getMSUntilRetry(err);
            if (delay <= MAX_WAIT_MS) {
                return delay;
            }
            throw new Error('Github actions rate-limit exceeded. Will not retry because\n'
                + `retry-after(${delay / 1000} seconds) exceeds max wait time(${MAX_WAIT_MS / 1000} seconds).`, err);
        }
    }
    return undefined;
}

/**
 * Runs a download function, retrying on err. If the error is a
 * Got HTTPError the headers will be parsed to determine the wait
 * time before retrying.
 * @param {function} downloadFunc A function that returns a promise
 * @returns {Promise<T>}
 */
export const downloadWithDelayedRetry = async <T>(
    downloadFunc: () => Promise<T>,
): Promise<T> => {
    try {
        return await downloadFunc();
    } catch (err) {
        signale.warn('Asset download unsuccessful: ', err.message);
        const rateLimitDelay = calculateDelay(err);
        return pRetry(() => downloadFunc(), {
            retries: 2,
            delay: rateLimitDelay || 500,
            maxDelay: 360_000
        });
    }
};

/**
 * Download all bundled assets described in the
 * defaultAssetBundles array to the autoload directory
*/
export async function downloadAssets() {
    if (!USE_DEV_ASSETS) {
        signale.info('Removing any assets with a pre-released tag..');
        deleteAssetsWithDevTag();
    }
    const assetBundles = await getNeededAssetBundles();
    // We already have all required asset bundles if the length is zero
    if (assetBundles.length) {
        signale.debug('Downloading asset bundles from Github..');
        const promises = assetBundles.map(({ repo }) => downloadWithDelayedRetry(
            () => downloadRelease(
                'terascope',
                repo,
                AUTOLOAD_PATH,
                filterRelease,
                filterAsset,
                leaveZipped,
                disableLogging
            ))
        );
        await Promise.all(promises);
    } else {
        signale.debug('Skipping downloading assets in favor of cache..');
        if (!isCI) {
            signale.warn(`The ${AUTOLOAD_PATH} directory acts as a cache for assets in local development.
             Clear this directory frequently to ensure testing is done with the latest assets from Github.
             Also ensure ${ASSET_BUNDLES_PATH} is cleared as well as e2e will pull assets from there.`);
        }
    }

    deleteAssetsWithWrongNodeVersions();
    deleteOlderAssets();
    logAssets();
}

// TODO: review this, see if we can separate it out
if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url);
    const executePath = process.argv[1];

    if (executePath === modulePath) {
        downloadAssets();
    }
}

/**
 * Loads zipped assets from the cache into autoload directory
 */
export function loadAssetCache() {
    signale.info('Loading asset cache..');

    if (fs.existsSync(ASSET_BUNDLES_PATH) && fs.existsSync(AUTOLOAD_PATH)) {
        const assetZipFiles = fs.readdirSync(ASSET_BUNDLES_PATH);

        for (const file of assetZipFiles) {
            const sourceFilePath = path.join(ASSET_BUNDLES_PATH, file);
            const targetFilePath = path.join(AUTOLOAD_PATH, file);

            // Copy the file and overwrite if it exists
            fs.copyFileSync(sourceFilePath, targetFilePath);
            signale.debug(`Loaded asset file ${file} from cache..`);
        }
        signale.success('Finished loading asset cache!');
    } else {
        signale.info('No asset cache found.');
    }
}

/**
 * Checks the autoload directory for the default bundles to ensure they exist
 * @returns An array of needed asset bundles missing from the autoload directory
 */
async function getNeededAssetBundles() {
    const currentAutoloadFiles = fs.readdirSync(AUTOLOAD_PATH, 'utf-8');
    const neededAssetBundles = [];

    // Loop over each default asset bundle
    for (const bundle of defaultAssetBundles) {
        let missingBundle = true;
        // Compare all autoload file names with each bundle
        for (const fileName of currentAutoloadFiles) {
            // If a file in the autoload has a .zip, the right node version, and the bundle name
            // it's present and not missing
            if (
                fileName.includes(bundle.name)
                && fileName.includes('.zip')
                && fileName.includes(nodeVersion)
            ) {
                missingBundle = false;
                break;
            }
        }
        if (missingBundle) {
            signale.debug(`Required asset ${bundle.repo} missing from autoload and will be downloaded..`);
            neededAssetBundles.push(bundle);
        }
    }

    return neededAssetBundles;
}
