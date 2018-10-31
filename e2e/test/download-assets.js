'use strict';

const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const downloadRelease = require('download-github-release');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Enable the next line once node 10 builds are made
// const nodeVersion = process.version.split('.')[0].substr(1);
const nodeVersion = '8';
const autoloadDir = path.join(__dirname, '..', 'autoload');
const downloadAtFile = path.join(autoloadDir, '.downloadedAt');
const leaveZipped = true;

function touchDownloadAt() {
    return writeFile(downloadAtFile, new Date().toISOString());
}

async function getDownloadedAt() {
    const _lastDate = await readFile(downloadAtFile, { encoding: 'utf-8' });
    const lastDate = _lastDate.trim();
    return new Date(lastDate);
}

async function checkDownloadedAt() {
    if (process.env.CI_MODE === 'true') return true;
    if (!fs.existsSync(downloadAtFile)) return true;

    const currentTime = Date.now();

    const downloadAt = await getDownloadedAt();
    const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = downloadAt.getTime() + expiresInMs;

    return currentTime > expiresAt;
}

function filterRelease(release) {
    return !release.draft && !release.prerelease;
}

function filterAsset(asset) {
    const mustContain = `node-${nodeVersion}-linux-x64.zip`;
    return asset.name.indexOf(mustContain) >= 0;
}

async function downloadAssets() {
    const shouldDownload = await checkDownloadedAt();
    if (!shouldDownload) return;

    const bundles = [
        'elasticsearch-assets'
    ];

    const promises = bundles.map(async (repo) => {
        await downloadRelease('terascope', repo, autoloadDir, filterRelease, filterAsset, leaveZipped);
    });

    await Promise.all(promises);
    await touchDownloadAt();
}

if (require.main === module) {
    downloadAssets();
} else {
    module.exports = downloadAssets;
}
