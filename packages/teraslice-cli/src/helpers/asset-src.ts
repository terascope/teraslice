import execa from 'execa';
import prettyBytes from 'pretty-bytes';
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import { isCI, toInteger, TSError } from '@terascope/utils';
import { build } from 'esbuild';
import { wasmPlugin, getPackage } from '../helpers/utils';
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
    bundle?: boolean;
    bundleTarget?: string;
    outputFileName: string;
    debug: boolean;
    overwrite: boolean;

    devMode = false;

    constructor(
        srcDir: string,
        devMode = false,
        debug = false,
        bundle = false,
        bundleTarget = undefined,
        overwrite = false
    ) {
        this.bundle = bundle;
        this.bundleTarget = bundleTarget;
        this.debug = debug;
        this.devMode = devMode;
        this.overwrite = overwrite;
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

        this.outputFileName = path.join(this.buildDir, this.zipFileName);

        if (!this.overwrite && fs.pathExistsSync(this.outputFileName)) {
            throw new Error(`Zipfile already exists "${this.outputFileName}"`);
        }
    }

    /** @returns {string} Path to the output directory for the finished asset zipfile */
    get buildDir(): string {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName(): string {
        let zipName;
        let nodeVersion;
        if (this.bundle) {
            nodeVersion = this.bundleTarget?.replace('node', '');
            zipName = `${this.name}-v${this.version}-node-${nodeVersion}-bundle.zip`;
        } else {
            nodeVersion = process.version.split('.')[0].substr(1);
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

        // NOTE: The asset.json for bundled assets sets platform and arch to
        // false because bundled assets use WASM to avoid node-gyp.  If an asset
        // included an actual platform specific binary, it use the original
        // unbundled asset type
        if (!this.devMode) {
            const restrictions:string[] = [];
            if (assetJSON.node_version === undefined) {
                if (this.bundle) {
                    assetJSON.node_version = toInteger(this.bundleTarget?.replace('node', ''));
                } else {
                    assetJSON.node_version = toInteger(process.version.split('.')[0].substr(1));
                }
                restrictions.push('node_version');
            }

            if (assetJSON.platform === undefined) {
                assetJSON.platform = (this.bundle ? false : process.platform);
                restrictions.push('platform');
            }

            if (assetJSON.arch === undefined) {
                assetJSON.arch = (this.bundle ? false : process.arch);
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

        // write asset.json into tmpDir
        await fs.writeJSON(path.join(tmpDir.name, 'asset', 'asset.json'), assetJSON, {
            spaces: 4,
        });

        if (this.bundle) {
            const bundleDir = tmp.dirSync();
            reply.info(`* making tmp bundle directory "${bundleDir.name}"`);

            // write asset.json into bundleDir
            await fs.writeJSON(path.join(bundleDir.name, 'asset.json'), assetJSON, {
                spaces: 4,
            });

            // run npm --cwd srcDir/asset --prod --silent --no-progress
            reply.info('* running yarn --prod --no-progress');
            await this._yarnCmd(path.join(tmpDir.name, 'asset'), ['--prod', '--no-progress']);

            // NOTE: This still assumes a typescript asset with a `dist`
            // subdirectory, anything other than tmp/asset/dist failed to build
            // maybe a fallthrough of many dirs would work here, I think we
            // can accept this limitation now.
            let entryPoint = '';
            try {
                if (this.assetPackageJson?.entryPoint) {
                    // FIXME: why should we treat JS and TS differently?  If I
                    // do it like this ... we do the same thing two different
                    // ways:
                    // * JS - explicitly specify entry point in package.json
                    // * TS - implicitly find entry point by looking for file
                    // we should chose one or the other and use the same for
                    // both cases.
                    entryPoint = require.resolve(
                        path.join(tmpDir.name, 'asset', this.assetPackageJson.entryPoint)
                    );
                } else {
                    entryPoint = require.resolve(path.join(tmpDir.name, 'asset', 'src', 'index.ts'));
                }
                reply.warning(`entryPoint: ${entryPoint}`);
            } catch (err) {
                reply.fatal(`Unable to resolve entry point due to error: ${err}`);
            }
            const result = await build({
                bundle: true,
                entryPoints: [entryPoint],
                outdir: bundleDir.name,
                platform: 'node',
                sourcemap: false,
                target: this.bundleTarget,
                plugins: [wasmPlugin]
            });

            // Test require the asset to make sure it loads, if the process node
            // version is the same as the buildTarget
            if (this.bundleTarget?.replace('node', '') === process.version.split('.')[0].substr(1)) {
                try {
                    const modulePath = require.resolve(bundleDir.name);
                    reply.info(`* doing a test require of ${modulePath}`);
                    const requireOut = require(modulePath).ASSETS;
                    if (this.debug) {
                        reply.warning(JSON.stringify(requireOut, null, 2));
                    }
                } catch (err) {
                    reply.fatal(`Bundled asset failed to require: ${err}`);
                }
            }

            if (result.warnings.length > 0) {
                reply.warning(result.warnings);
            }

            try {
                if (this.overwrite && fs.pathExistsSync(this.outputFileName)) {
                    reply.info(`* overwriting ${this.outputFileName}`);
                    await fs.remove(this.outputFileName);
                }
                reply.info('* zipping the asset bundle');
                // create zipfile
                zipOutput = await AssetSrc.zip(path.join(bundleDir.name), this.outputFileName);
                // remove temp directories
                await fs.remove(tmpDir.name);
                await fs.remove(bundleDir.name);
            } catch (err) {
                throw new TSError(err, {
                    reason: 'Failure creating asset zipfile'
                });
            }
        } else {
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
                if (this.overwrite && fs.pathExistsSync(this.outputFileName)) {
                    reply.info(`* overwriting ${this.outputFileName}`);
                    await fs.remove(this.outputFileName);
                }

                reply.info('* zipping the asset bundle');
                // create zipfile
                zipOutput = await AssetSrc.zip(path.join(tmpDir.name, 'asset'), this.outputFileName);
                // remove temp directory
                await fs.remove(tmpDir.name);
            } catch (err) {
                throw new TSError(err, {
                    reason: 'Failure creating asset zipfile'
                });
            }
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
