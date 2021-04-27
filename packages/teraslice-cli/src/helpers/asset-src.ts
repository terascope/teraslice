import execa from 'execa';
import prettyBytes from 'pretty-bytes';
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import { isCI, toInteger, TSError } from '@terascope/utils';
import { build } from 'esbuild';
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
    bundle?: boolean;

    constructor(srcDir: string, devMode = false, bundle = false) {
        this.bundle = bundle;
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

    /** @returns {string} Path to the output directory for the finished asset zipfile */
    get buildDir(): string {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName(): string {
        const nodeVersion = process.version.split('.')[0].substr(1);
        let zipName;
        if (this.bundle) {
            zipName = `${this.name}-v${this.version}-node-${nodeVersion}-bundle.zip`;
        } else {
            zipName = `${this.name}-v${this.version}-node-${nodeVersion}-${process.platform}-${process.arch}.zip`;
        }
        return zipName;
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

        if (await fs.pathExists(outputFileName)) {
            throw new Error(`Zipfile already exists "${outputFileName}"`);
        }

        try {
            // make sure the build dir exists in the srcDir directory
            await fs.ensureDir(this.buildDir);
        } catch (err) {
            throw new Error(`Failed to create directory ${this.buildDir}: ${err}`);
        }
        // make temp dir
        const tmpDir = tmp.dirSync();

        reply.info(`* copying files to the tmp directory "${tmpDir.name}"`);

        // copy entire asset dir (srcDir) to tmpdir
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

    async buildBundle(): Promise<ZipResults> {
        let zipOutput;
        const outputFileName = path.join(this.buildDir, this.zipFileName);

        if (await fs.pathExists(outputFileName)) {
            throw new Error(`Zipfile already exists "${outputFileName}"`);
        }

        try {
            // make sure the build dir exists in the srcDir directory
            await fs.ensureDir(this.buildDir);
        } catch (err) {
            throw new Error(`Failed to create directory ${this.buildDir}: ${err}`);
        }
        // make temp dir
        const tmpDir = tmp.dirSync();

        reply.info(`* copying files to the tmp directory "${tmpDir.name}"`);

        // copy entire asset dir (srcDir) to tmpdir
        await fs.copy(this.srcDir, tmpDir.name);

        const assetJSON = await fs.readJSON(path.join(tmpDir.name, 'asset', 'asset.json'));

        if (!this.devMode) {
            const restrictions:string[] = [];
            if (assetJSON.node_version === undefined) {
                assetJSON.node_version = toInteger(process.version.split('.')[0].substr(1));
                restrictions.push('node_version');
            }

            if (assetJSON.platform === undefined) {
                assetJSON.platform = false;
                restrictions.push('platform');
            }

            if (assetJSON.arch === undefined) {
                assetJSON.arch = false;
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

        const bundleDir = tmp.dirSync();
        reply.info(`* making tmp bundle directory "${bundleDir.name}"`);
        // NOTE: `dest` can't be a directory when `src` is a file
        // https://github.com/jprichardson/node-fs-extra/issues/323
        // await fs.copy(
        //     path.join(tmpDir.name, 'asset', 'asset.json'),
        //     path.join(bundleDir.name, 'asset.json'),
        // );

        await fs.writeJSON(path.join(bundleDir.name, 'asset.json'), assetJSON, {
            spaces: 4,
        });

        // FIXME: This currently assumes that asset/dist/index.js exists, it
        // will not exist in the following cases:
        //  * asset was not built from typescript (index.js is elsewhere)
        //  * many assets don't have a top level index.js (maybe we can require it)
        const result = await build({
            bundle: true,
            entryPoints: [path.join(tmpDir.name, 'asset', 'dist', 'index.js')],
            outdir: bundleDir.name,
            platform: 'node',
            sourcemap: false,
            target: 'node12.21',
        });

        if (result.warnings.length > 0) {
            reply.warning(result.warnings);
        }

        try {
            reply.info('* zipping the asset bundle');
            // create zipfile
            zipOutput = await AssetSrc.zip(path.join(bundleDir.name), outputFileName);
            // remove temp directories
            // await fs.remove(tmpDir.name);
            // await fs.remove(bundleDir.name);
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
     * @param {string} outputFileName
     * @returns ZipResults
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
