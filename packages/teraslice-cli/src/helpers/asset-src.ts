import execa from 'execa';
import prettyBytes from 'pretty-bytes';
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import { isCI, toInteger, TSError } from '@terascope/utils';
import { getPackage } from '../helpers/utils';
import reply from './reply';

interface ZipResults {
    name: string;
    bytes: string;
}

export class AssetSrc {
    /**
     *
     * @param {string} srcDir Path to a valid asset source directory, must
     * must contain `asset/asset.json` and `asset/package.json` files.
     */
    srcDir: string;
    assetFile: string;
    packageJson: any;
    assetPackageJson: any;
    name: string;
    version: string;
    devMode = false;

    constructor(srcDir: string, devMode = false) {
        this.devMode = devMode;
        this.srcDir = path.resolve(srcDir);
        this.assetFile = path.join(this.srcDir, 'asset', 'asset.json');
        this.packageJson = getPackage(path.join(this.srcDir, 'package.json'));
        this.assetPackageJson = getPackage(path.join(this.srcDir, 'asset', 'package.json'));

        if (!this.assetFile || !fs.pathExistsSync(this.assetFile)) {
            throw new Error(`${this.srcDir} is not a valid asset source directory.`);
        }

        const asset = fs.readJSONSync(this.assetFile);
        this.name = asset.name;
        this.version = asset.version;
    }

    /** @returns {string} Path to the output drectory for the finished asset zipfile */
    get buildDir(): string {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName(): string {
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
    private async _yarnCmd(dir: string, yarnArgs: string[]) {
        return execa('yarn', yarnArgs, { cwd: dir });
    }

    async build(): Promise<ZipResults> {
        let zipOutput;
        const outputFileName = path.join(this.buildDir, this.zipFileName);

        try {
            // make sure the build dir exists in the srcDir directory
            await fs.ensureDir(this.buildDir);
        } catch (err) {
            throw new Error(`Failed to create directory ${this.buildDir}: ${err}`);
        }
        // make temp dir
        const tmpDir = tmp.dirSync();

        reply.info(`* copying files to the tmp directory "${tmpDir.name}"`);

        // copy entire asset dir (srcDir) to tempdir
        await fs.copy(this.srcDir, tmpDir.name);

        const assetJSON = await fs.readJSON(path.join(tmpDir.name, 'asset', 'asset.json'));

        if (!this.devMode) {
            const restrictions:string[] = [];
            if (assetJSON.node_version === undefined) {
                assetJSON.node_version = toInteger(process.version.split('.')[0].substr(1));
                restrictions.push('node_version');
            }

            if (assetJSON.platform === undefined) {
                assetJSON.platform = process.platform;
                restrictions.push('platform');
            }

            if (assetJSON.arch === undefined) {
                assetJSON.arch = process.arch;
                restrictions.push('arch');
            }
            if (restrictions.length && !isCI) {
                reply.info(
                    `[NOTE] Automatically added ${restrictions.join(', ')} restrictions for the asset`
                    + ' Use --dev to temporarily disable this,'
                    + ` or put false for the values ${restrictions.join(', ')} in the asset.json`
                );
            }
        }

        await fs.writeJSON(path.join(tmpDir.name, 'asset', 'asset.json'), assetJSON, {
            spaces: 4,
        });

        // remove srcDir/asset/node_modules
        await fs.remove(path.join(tmpDir.name, 'asset', 'node_modules'));

        // run yarn --cwd srcDir --prod --silent --no-progress asset:build
        if (this.packageJson?.scripts && this.packageJson.scripts['asset:build']) {
            reply.info('* running yarn asset:build');
            await this._yarnCmd(tmpDir.name, ['run', 'asset:build']);
        }

        if (await fs.pathExists(path.join(tmpDir.name, '.yarnclean'))) {
            reply.info('* running yarn autoclean --force');
            await this._yarnCmd(tmpDir.name, ['autoclean', '--force']);
        }

        // run npm --cwd srcDir/asset --prod --silent --no-progress
        reply.info('* running yarn --prod --no-progress');
        await this._yarnCmd(path.join(tmpDir.name, 'asset'), ['--prod', '--no-progress']);

        // run yarn --cwd srcDir --prod --silent --no-progress asset:post-build
        if (this.packageJson?.scripts && this.packageJson.scripts['asset:post-build']) {
            reply.info('* running yarn asset:post-build');
            await this._yarnCmd(tmpDir.name, ['run', 'asset:post-build']);
        }

        try {
            reply.info('* zipping the asset bundle');
            // create zipfile
            zipOutput = await AssetSrc.zip(path.join(tmpDir.name, 'asset'), outputFileName);
            // remove temp directory
            await fs.remove(tmpDir.name);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure creating asset zipfile'
            });
        }
        return zipOutput;
    }

    /**
     * zip - Creates properly named zip archive of asset from tmpAssetDir
     * @param {string} tmpAssetDir Path to the temporary asset source directory
     */
    static async zip(tmpAssetDir: string, outputFileName: string): Promise<ZipResults> {
        if (!await fs.pathExists(tmpAssetDir)) {
            throw new Error(`Missing asset directory "${tmpAssetDir}"`);
        }

        await execa('zip', ['-q', '-r', '-9', outputFileName, '.'], {
            stdio: 'inherit',
            cwd: tmpAssetDir
        });

        const { size } = await fs.stat(outputFileName);

        return { name: outputFileName, bytes: prettyBytes(size) };
    }
}
