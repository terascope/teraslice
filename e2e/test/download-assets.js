'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const downloadRelease = require('@terascope/fetch-github-release');
const signale = require('./signale');

/**
 * This will get the correct teraslice node version so
 * we can download the correct asset
*/
function getNodeVersion() {
    const dockerFilePath = path.join(__dirname, '..', '..', 'Dockerfile');
    const dockerFileContents = fs.readFileSync(dockerFilePath, 'utf8');
    const fromLine = dockerFileContents.split('\n').find((line) => line.trim().startsWith('FROM '));
    if (!fromLine) {
        throw new Error('Unable to find the import FROM line in the Dockerfile');
    }

    const splitChars = 'FROM terascope/node-base:';
    if (!fromLine.includes(splitChars)) {
        throw new Error(`Dockerfile does not contain "${splitChars}". If this has changed, this file needs to be changed`);
    }

    const nodeVersion = fromLine.trim().split(splitChars)[1];
    const majorNodeVersion = parseInt(nodeVersion.split('.')[0], 10);
    if (Number.isNaN(majorNodeVersion)) {
        throw new Error(`Expected to find a valid node major version in the Dockerfile but found ${majorNodeVersion}`);
    }

    return String(majorNodeVersion);
}

const nodeVersion = getNodeVersion();

const autoloadDir = path.join(__dirname, '..', 'autoload');
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

function assetFileInfo(assetName) {
    const [name, version] = assetName.split('-');
    return {
        name,
        version: semver.coerce(version),
        repo: `${name}-assets`,
        bundle: assetName.includes('-bundle'),
        fileName: assetName
    };
}

function getOlderAsset(assets, assetName) {
    const { name, version } = assetFileInfo(assetName);

    return assets.find((a) => {
        if (a.name !== name) return false;
        return semver.gt(version, a.version) && a.bundle;
    });
}

function filterRelease(release) {
    return !release.draft;
}

function filterAsset(asset) {
    // if it includes the bundle choose that
    return asset.name.includes(`node-${nodeVersion}-bundle.zip`);
}

function listAssets() {
    return fs
        .readdirSync(autoloadDir)
        .filter((file) => {
            const ext = path.extname(file);
            return ext === '.zip';
        })
        .map(assetFileInfo);
}

function count(arr, fn) {
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
            return acc.concat([current]);
        }, [])
        .filter(({ name, newerVersion, bundle }, index, arr) => {
            if (newerVersion == null && bundle) {
                return arr.find((a, i) => i !== index && a.name === name && a.bundle);
            }
            return newerVersion == null;
        });

    for (const asset of olderAssets) {
        const b = asset.bundle ? ' [bundle]' : ' [non-bundle]';
        signale.warn(`Deleting asset ${asset.name}@v${asset.version} in-favor of existing v${asset.newerVersion || asset.version}${b}`);
        fs.unlinkSync(path.join(autoloadDir, asset.fileName));
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
async function downloadAssets() {
    await Promise.all(bundles.map(({ repo }) => downloadRelease(
        'terascope',
        repo,
        autoloadDir,
        filterRelease,
        filterAsset,
        leaveZipped,
        disableLogging
    )));

    deleteOlderAssets();
    logAssets();
}

if (require.main === module) {
    downloadAssets();
} else {
    module.exports = downloadAssets;
}
