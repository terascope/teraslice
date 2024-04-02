import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { downloadRelease } from '@terascope/fetch-github-release';
import signale from './signale.js';
import { AUTOLOAD_PATH } from './config.js';

type AssetInfo = {
    name: string;
    version: semver.SemVer | null;
    newerVersion?: semver.SemVer | null;
    repo: string;
    bundle: boolean;
    fileName: string;
    assetNodeVersion: string;
}

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

function assetFileInfo(assetName: string): AssetInfo {
    const [name, version, , assetNodeVersion] = assetName.split('-');
    return {
        name,
        version: semver.coerce(version),
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

function filterRelease(release: any) {
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
 * Download all bundled assets described in the
 * defaultAssetBundles array to the autoload directory
*/
export async function downloadAssets() {
    await Promise.all(defaultAssetBundles.map(({ repo }) => downloadRelease(
        'terascope',
        repo,
        AUTOLOAD_PATH,
        filterRelease,
        filterAsset,
        leaveZipped,
        disableLogging
    )));

    deleteAssetsWithWrongNodeVersions();
    deleteOlderAssets();
    logAssets();
}

// TODO: review this, see if we can seperate it out
if (import.meta.url.startsWith('file:')) {
    const modulePath = fileURLToPath(import.meta.url);
    const executePath = process.argv[1];

    if (executePath === modulePath) {
        downloadAssets();
    }
}
