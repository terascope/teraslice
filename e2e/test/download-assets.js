'use strict';

const fs = require('fs');
const path = require('path');
const signale = require('signale');
const { promisify } = require('util');
const downloadRelease = require('@terascope/fetch-github-release');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// When the docker image is switched to use node:10 this value needs to be changed to '10'
const nodeVersion = '8';
const autoloadDir = path.join(__dirname, '..', 'autoload');
const downloadAtFile = path.join(autoloadDir, '.downloadedAt');
const leaveZipped = true;
const disableLogging = true;

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

function logAssets() {
    const assets = fs.readdirSync(autoloadDir).filter((file) => {
        const ext = path.extname(file);
        return ext === '.zip';
    });

    signale.info(`Autoload assets ${assets.join(', ')}`);
}

async function downloadAssets() {
    const shouldDownload = await checkDownloadedAt();
    if (!shouldDownload) {
        logAssets();
        return;
    }

    const bundles = [
        'elasticsearch-assets',
        'kafka-assets'
    ];

    const promises = bundles.map(async (repo) => {
        await downloadRelease('terascope', repo, autoloadDir, filterRelease, filterAsset, leaveZipped, disableLogging);
    });

    await Promise.all(promises);
    await touchDownloadAt();

    logAssets();
}

if (require.main === module) {
    downloadAssets();
} else {
    module.exports = downloadAssets;
}
