#!/usr/bin/env node

'use strict';

const { spawnSync } = require('child_process');

const _ = require('lodash');
const fs = require('fs-extra');
const archiver = require('archiver');
const Promise = require('bluebird');
const path = require('path');
const tmp = require('tmp');


class AssetSrc {
    /**
     *
     * @param {string} srcDir Path to a valid asset source directory, must
     * must contain `asset/asset.json` and `asset/package.json` files.
     */
    constructor(srcDir) {
        this.srcDir = path.resolve(srcDir);
        this.assetFile = path.join(this.srcDir, 'asset', 'asset.json');
        this.packageJson = require(path.join(this.srcDir, 'package.json'));
        this.assetPackageJson = require(path.join(this.srcDir, 'asset', 'package.json'));

        if (!fs.pathExistsSync(this.assetFile)) {
            throw new Error(`${this.srcDir} is not a valid asset source directory.`);
        }

        const asset = require(this.assetFile);
        this.name = asset.name;
        this.version = asset.version;
    }

    /** @returns {string} Path to the output drectory for the finished asset zipfile */
    get buildDir() {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName() {
        const nodeVersion = process.version.split('.')[0].substr(1);
        return `${this.name}-v${this.version}-node-${nodeVersion}-${process.platform}-${process.arch}.zip`;
    }

    // TODO: This has a dependency on the external executable `yarn`,
    //       we should test that this exists earlier than this and also
    //       support `npm`.
    /**
     * runs yarn command
     * @param {string} dir - Path to directory containing package.json
     * @param {Array} yarnArgs - Array of arguments or options to be passed to yarn command
     */
    _yarnCmd(dir, yarnArgs) {
        const yarn = spawnSync(
            'yarn',
            ['--cwd', dir].concat(yarnArgs)
        );

        if (yarn.status !== 0) {
            throw new Error(
                `yarn command exited with non-zero status: ${yarn.status}\n`
                + `yarn stdout:\n${yarn.stdout}\n`
                + `yarn stderr:\n${yarn.stderr}`
            );
        }
        return yarn;
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

        // run yarn --cwd srcDir/asset --prod --silent --no-progress
        this._yarnCmd(path.join(tmpDir.name, 'asset'), ['--prod', '--no-progress']);

        // run yarn --cwd srcDir --prod --silent --no-progress asset:build
        if (_.has(this.packageJson, ['scripts', 'asset:build'])) {
            this._yarnCmd(tmpDir.name, ['run', 'asset:build']);
        }

        try {
            // create zipfile
            zipOutput = await AssetSrc.zip(path.join(tmpDir.name, 'asset'), outputFileName);
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
    static zip(tmpAssetDir, outputFileName) {
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
