#!/usr/bin/env node

'use strict';

const { spawnSync } = require('child_process');

const fs = require('fs-extra');
const archiver = require('archiver');
const Promise = require('bluebird');
const path = require('path');
const tmp = require('tmp');


class AssetSrc {
    constructor(srcDir) {
        this.srcDir = path.resolve(srcDir);
        this.assetFile = path.join(this.srcDir, 'asset', 'asset.json');

        if (!fs.pathExistsSync(this.assetFile)) {
            throw new Error(`${this.srcDir} is not a valid asset source directory.`);
        }
    }

    /** @returns {string} Path to the output drectory for the finished asset zipfile */
    get buildDir() {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName() {
        const asset = require(path.join(this.srcDir, 'asset', 'asset.json'));

        const nodeVersion = process.version.split('.')[0].substr(1);
        return `${asset.name}-v${asset.version}-node-${nodeVersion}-${process.platform}-${process.arch}.zip`;
    }

    async build() {
        let zipOutput;
        const outputFileName = path.join(this.buildDir, this.zipFileName);

        try {
            // make sure the build dir exists in the srcDir directory
            fs.ensureDirSync(this.buildDir);
        } catch (err) {
            throw new Error(`Failed to create directory ${this.buildDir}: ${err}`);
        }
        // make temp dir
        const tmpDir = tmp.dirSync();

        // copy entire asset dir (srcDir) to tempdir
        fs.copySync(this.srcDir, tmpDir.name);

        // remove srcDir/asset/node_modules
        fs.removeSync(path.join(tmpDir.name, 'asset', 'node_modules'));

        // TODO: This has a dependency on the external executable `yarn`,
        //       we should test that this exists earlier than this and also
        //       support `npm`.
        // run yarn --cwd srcDir/asset --prod --silent --no-progress
        const yarn = spawnSync(
            'yarn',
            ['--cwd', path.join(tmpDir.name, 'asset'), '--prod', '--no-progress']
        );

        if (yarn.status !== 0) {
            throw new Error(
                `yarn command exited with non-zero status: ${yarn.status}\n`
                + `yarn stdout:\n${yarn.stdout}\n`
                + `yarn stderr:\n${yarn.stderr}`
            );
        }
        // Run asset:build commnd
        // TODO: run yarn --cwd srcDir/asset --prod --silent --no-progress asset:build

        try {
            // create zipfile
            zipOutput = await this.zip(path.join(tmpDir.name, 'asset'), outputFileName);
            // remove temp directory
            fs.removeSync(tmpDir.name);
        } catch (err) {
            throw new Error(`Error creating asset zipfile: ${err}`);
        }
        return zipOutput.success;
    }

    /**
     * zip - Creates properly named zip archive of asset from tmpAssetDir
     * @param {string} tmpAssetDir Path to the temporary asset source directory
     */
    zip(tmpAssetDir, outputFileName) {
        const zipMessage = {};

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputFileName);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('finish', () => {
                zipMessage.bytes = `${archive.pointer()} total bytes`;
                zipMessage.success = outputFileName;
                resolve(zipMessage);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive
                .directory(tmpAssetDir, false)
                .finalize();
        });
    }
}


module.exports = AssetSrc;
