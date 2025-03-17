/**
 * Used for caching Terascope assets in e2e tests
 * Options:
 * - `download`: will download the assets into the `/tmp/teraslice_assets` directory
 * - `generate-list`: will generate a txt file list of all assets to be downloaded
 */

import {
    defaultAssetBundles,
    downloadWithDelayedRetry,
    filterRelease
} from "../dist/test/download-assets.js";
import { downloadRelease } from '@terascope/fetch-github-release';
import { parse } from 'yaml';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'node:path';
import semver from 'semver'

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

function grabCINodeVersions() {
    const githubTestCIPath = path.join(__dirname, '../../.github/workflows/test.yml');
    if (fs.existsSync(githubTestCIPath)) {
        try {
            const ciFile = fs.readFileSync(githubTestCIPath, 'utf-8');
            const ciYaml = parse(ciFile);
            let nodeVersions = parse(ciYaml.env.NODE_VERSIONS);

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

function mapMajorVersions(nodeVersionArray) {
    const result = nodeVersionArray.map((value) => {
        try {
            const validatedVersion = semver.valid(semver.coerce(value));
            const majorVersion = semver.major(validatedVersion);

            return majorVersion;

        } catch(err) {
            throw new Error(`Unable to map major versions`, err);
        }
    });
    return result
}

function filterAsset(asset) {
    const nodeVersions = grabCINodeVersions();

     // Check if asset name contains any of the node versions
     return nodeVersions.some(version => asset.name.includes(`node-${version}-bundle.zip`));
}

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

const dryRun = userCommand === 'download' ? false : true;
const promises = defaultAssetBundles.map(({ repo }) => downloadWithDelayedRetry(
    () => downloadRelease(
        'terascope',
        repo,
        '/tmp/teraslice_assets',
        filterRelease,
        filterAsset,
        true, // Keep assets zipped
        false, // Don't disable logging
        dryRun // dry run is true
    ))
);
const jsonAssetList = await Promise.all(promises);

if (dryRun) {
    const assetBundleList = generateList(jsonAssetList);
    const generatedFilePath = path.join(__dirname, 'ci_asset_bundle_list.txt');
    if (fs.existsSync(generatedFilePath)) {
        fs.rmSync(generatedFilePath);
    }
    fs.writeFileSync(generatedFilePath, assetBundleList, 'utf-8');
}

