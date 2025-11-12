/**
 * Used for caching Terascope assets in e2e tests
 * Options:
 * - `download`: will download the assets into the 'ASSET_BUNDLES_PATH' directory
 * - `generate-list`: will generate a txt file list of all assets to be downloaded
 */

import {
    defaultAssetBundles,
    downloadWithDelayedRetry,
    assetFileInfo
} from '../dist/test/download-assets.js';
import { config } from '../dist/test/config.js';
import { downloadRelease } from '@terascope/fetch-github-release';
import { parse } from 'yaml';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'node:path';
import semver from 'semver';

const { ASSET_BUNDLES_PATH } = config;

const validCommands = ['download', 'generate-list'];
// First argument after script
const userCommand = process.argv[2];

// Validate if we are using the correct command
if (!validCommands.includes(userCommand)) {
    console.error(`
Invalid command: "${userCommand}"
Usage:
  node downloadAssets.js download       # Download assets into /tmp/teraslice_assets
  node downloadAssets.js generate-list  # Generate a txt file list of assets

Options:
  - download       Download assets into the /tmp/teraslice_assets directory
  - generate-list  Generate a txt file list of all assets to be downloaded
`);

    process.exit(1);
}

// Grab the path to the downloadAssets.js file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let filterOutDevAsset = false;

/**
 * Grabs the NODE_VERSIONS value from the test.yml ci file and formats it into an array
 * @returns An array of node versions
 */
function grabCINodeVersions() {
    const githubTestCIPath = path.join(__dirname, '../../.github/workflows/test.yml');
    if (fs.existsSync(githubTestCIPath)) {
        try {
            const ciFile = fs.readFileSync(githubTestCIPath, 'utf-8');
            const ciYaml = parse(ciFile);
            let nodeVersions = parse(ciYaml.env.NODE_VERSIONS);

            // If it's just a number or string and not an array we need to put it in an array
            if (typeof nodeVersions === 'number' || typeof nodeVersions === 'string') {
                nodeVersions = [nodeVersions];
            }

            if (!Array.isArray(nodeVersions)) {
                throw new Error(`Expected array from variable ${nodeVersions}`);
            }

            return mapMajorVersions(nodeVersions);
        } catch (err) {
            throw new Error('Unable to grab e2e node versions from ci file: ', err);
        }
    } else {
        throw new Error(`The test workflow at ${githubTestCIPath} does not exist.`);
    }
}

/**
 * Reformats an array of node versions to only include the major version in each index
 * @param nodeVersionArray An array of node versions
 * @returns A reformatted version of the param array but with only the major version
 */
function mapMajorVersions(nodeVersionArray) {
    const result = nodeVersionArray.map((value) => {
        try {
            const validatedVersion = semver.valid(semver.coerce(value));
            const majorVersion = semver.major(validatedVersion);

            return majorVersion;
        } catch (err) {
            throw new Error(`Unable to map major versions`, err);
        }
    });
    return result;
}

/**
 * Filter function for downloadRelease() that will filter releases to only grab either a dev release
 * or the latest non dev release
 * @param release Github release object
 * @returns Boolean
 */
function filterRelease(release) {
    if (filterOutDevAsset) {
        const version = semver.clean(release.tag_name);
        const semverVersion = semver.coerce(version, { includePrerelease: true });
        // If the prerelease array isn't empty we don't want it.
        if (semverVersion?.prerelease && semverVersion?.prerelease.length > 0) {
            return false;
        }
    }
    return !release.draft;
}

/**
 * Filter function for downloadRelease() that will filter assets to only grab specified
 * node versions
 * @param asset Github asset object
 *  https://docs.github.com/en/rest/releases/releases?ap#get-a-single-release-asset
 * @returns Boolean
 */
function filterAsset(asset) {
    const nodeVersions = grabCINodeVersions();

    // Check if asset name contains any of the node versions
    return nodeVersions.some((version) => asset.name.includes(`node-${version}-bundle.zip`));
}

/**
 * Given an array of asset release objects, will return a stringified list of all file names.
 * @param list An array of asset release objects
 * @returns A string of all zip file names separated by '/n'
 */
function generateList(list) {
    const formatedList = [];
    list.forEach((release) => {
        formatedList.push(...release.assetFileNames);
    });
    // Format list alphabetically to ensure we don't make an identical list with
    // a different order
    formatedList.sort();

    // Lastly write it as a string
    const listString = formatedList.join('\n');
    return listString;
}

const promises = defaultAssetBundles.map(({ repo }) => downloadWithDelayedRetry(
    () => downloadRelease(
        'terascope',
        repo,
        ASSET_BUNDLES_PATH,
        filterRelease,
        filterAsset,
        true, // Keep assets zipped
        false, // Don't disable logging
        userCommand === 'download' ? false : true
    ))
);
const jsonAssetList = await Promise.all(promises);

const moreAssetBundles = [];
// We need to loop through what we just pulled from github and see if we got any pre released assets
// If we did, we need to also download the latest non pre released version.
jsonAssetList.forEach((repo) => {
    let fileInfo;
    if (repo.assetFileNames) {
        fileInfo = assetFileInfo(repo.assetFileNames[0]);
    } else {
        fileInfo = assetFileInfo(path.basename(repo[0]));
    }
    if (fileInfo.version.prerelease && fileInfo.version.prerelease.length > 0) {
        defaultAssetBundles.forEach((val) => {
            if (val.name === fileInfo.name) {
                moreAssetBundles.push(val);
            }
        });
    }
});

filterOutDevAsset = true;
const morePromises = moreAssetBundles.map(({ repo }) => downloadWithDelayedRetry(
    () => downloadRelease(
        'terascope',
        repo,
        ASSET_BUNDLES_PATH,
        filterRelease,
        filterAsset,
        true, // Keep assets zipped
        false, // Don't disable logging
        userCommand === 'download' ? false : true
    ))
);

jsonAssetList.push(...await Promise.all(morePromises));

if (userCommand === 'generate-list') {
    const assetBundleList = generateList(jsonAssetList);
    const generatedFilePath = path.join(__dirname, 'ci_asset_bundle_list.txt');
    if (fs.existsSync(generatedFilePath)) {
        fs.rmSync(generatedFilePath);
    }
    fs.writeFileSync(generatedFilePath, assetBundleList, 'utf-8');
}
