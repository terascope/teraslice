import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { downloadRelease } from '@terascope/fetch-github-release';
import signale from './signale.js';
import { AUTOLOAD_PATH } from './config.js';

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

const bundles = [
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

function assetFileInfo(assetName: string) {
    const [name, version] = assetName.split('-');
    return {
        name,
        version: semver.coerce(version),
        repo: `${name}-assets`,
        bundle: assetName.includes('-bundle'),
        fileName: assetName
    };
}

function getOlderAsset(assets: any[], assetName: string) {
    const { name, version } = assetFileInfo(assetName);

    return assets.find((a) => {
        if (a.name !== name) return false;
        // @ts-expect-error TODO: fix this
        return semver.gt(version, a.version) && a.bundle;
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

function count(arr: any[], fn:(arg: any) => boolean) {
    let c = 0;

    for (const v of arr) {
        if (fn(v)) c++;
    }

    return c;
}

function deleteOlderAssets() {
    const duplicateAssets = listAssets().filter(({ name }, i, all) => {
        const c = count(all, (a) => a.name === name);
        return c > 1;
    });

    const olderAssets = duplicateAssets
        .reduce((acc, current, index, src) => {
            const without = src.filter((a, i) => index !== i);
            const older = getOlderAsset(without, current.fileName);
            if (older) {
                older.newerVersion = current.version;
                return acc;
            }
            // @ts-expect-error
            return acc.concat([current]);
        }, [])
        .filter(({ name, newerVersion, bundle }, index, arr) => {
            if (newerVersion == null && bundle) {
                return arr.find((a: any, i) => i !== index && a.name === name && a.bundle);
            }
            return newerVersion == null;
        }) as any[];

    for (const asset of olderAssets) {
        const b = asset.bundle ? ' [bundle]' : ' [non-bundle]';
        signale.warn(`Deleting asset ${asset.name}@v${asset.version} in-favor of existing v${asset.newerVersion || asset.version}${b}`);
        fs.unlinkSync(path.join(AUTOLOAD_PATH, asset.fileName));
    }
}

function logAssets() {
    const assets = listAssets().map(({ name, bundle, version }) => {
        if (bundle) return `${name}@v${version} [bundle]`;
        return `${name}@v${version} [non-bundle]`;
    });
    if (!assets.length) return;

    signale.info(`Autoload asset bundles: ${assets.join(', ')}`);
}

/**
 * @todo change this to not download both the bundled and non-bundled versions
*/
export async function downloadAssets() {
    await Promise.all(bundles.map(({ repo }) => downloadRelease(
        'terascope',
        repo,
        AUTOLOAD_PATH,
        filterRelease,
        filterAsset,
        leaveZipped,
        disableLogging
    )));

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
