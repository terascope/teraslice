import execa from 'execa';
import prettyBytes from 'pretty-bytes';
import glob from 'glob-promise';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import tmp from 'tmp';
import { build } from 'esbuild';
import {
    isCI, toInteger, TSError,
    toPascalCase, set, toUpperCase,
    toLowerCase,
} from '@terascope/utils';

import reply from './reply.js';
import { wasmPlugin, getPackage } from './utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

interface ZipResults {
    name: string;
    bytes: string;
}

interface AssetRegistry {
    [dir_name: string]: {
        [property in OpType]: string
    };
}

// These should match AssetRepositoryKey values from
// @terascope/job-components/src/operation-loader/interfaces.ts
const OP_TYPES = ['API', 'Fetcher', 'Processor', 'Schema', 'Slicer', 'Observer'] as const;

type OpTypeTuple = typeof OP_TYPES;
type OpType = OpTypeTuple[number];

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
    isESM = false;
    devMode = false;

    constructor(
        srcDir: string,
        devMode = false,
        debug = false,
        bundle = true,
        bundleTarget = 'node18',
        overwrite = false
    ) {
        if (bundle === false) {
            throw new Error('bundle must be set to true');
        }

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

        if (this.packageJson.type === 'module') {
            this.isESM = true;
        }

        const asset = fs.readJSONSync(this.assetFile);
        this.name = asset.name;
        this.version = asset.version;

        this.outputFileName = path.join(this.buildDir, this.zipFileName);
    }

    /** @returns {string} Path to the output directory for the finished asset zipfile */
    get buildDir(): string {
        return path.join(this.srcDir, 'build');
    }

    get zipFileName(): string {
        const nodeVersion = this.bundleTarget?.replace('node', '');
        const zipName = `${this.name}-v${this.version}-node-${nodeVersion}-bundle.zip`;

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

    /**
     * operatorFiles finds all of the Teraslice operator files, including:
     *   api.js/ts
     *   fetcher.js/ts
     *   processor.js/ts
     *   schema.js/ts
     *   slicer.js/ts
     *   observer.js/ts
     * @returns {Array} array of paths to all of the operator files
     */
    async operatorFiles(ext: 'js' | 'ts'): Promise<string[]> {
        const OP_TYPE_FILE_NAMES = OP_TYPES.map(toLowerCase);
        const matchString = path.join(this.srcDir, 'asset', `**/{${OP_TYPE_FILE_NAMES}}.${ext}`);
        return glob(matchString, { ignore: ['**/node_modules/**', '**/_*/**', '**/.*/**'] });
    }

    /**
     * generates the registry object that is used to generate the index.js asset
     * registry
     */
    async generateRegistry(): Promise<[AssetRegistry, string]> {
        const assetRegistry: AssetRegistry = {};
        const typescript = fs.existsSync(path.join(this.srcDir, 'tsconfig.json'));
        const fileExt = typescript ? 'ts' : 'js';

        const files = await this.operatorFiles(fileExt);
        for (const file of files) {
            const parsedPath = path.parse(file);
            const opDirectory = parsedPath.dir.split(path.sep).pop();
            if (!opDirectory) {
                throw new Error(`Error: unable to get 'op_directory' from ${parsedPath}`);
            }

            const pathName = parsedPath.name === 'api' ? toUpperCase(parsedPath.name) : toPascalCase(parsedPath.name);
            let value: string | [string, string];

            if (typescript) {
                let importName: string;
                if (pathName === 'Processor') {
                    importName = toPascalCase(opDirectory);
                } else if (opDirectory.endsWith('api')) {
                    importName = pathName === 'API'
                        ? toPascalCase(opDirectory).slice(0, -3) + pathName
                        : `${toPascalCase(opDirectory).slice(0, -3)}API${pathName}`;
                } else {
                    importName = toPascalCase(opDirectory) + pathName;
                }
                value = [importName, parsedPath.name];
            } else {
                value = parsedPath.base;
            }

            set(
                assetRegistry,
                `${opDirectory}.${pathName}`,
                value
            );
        }

        return [assetRegistry, fileExt];
    }

    async build(): Promise<ZipResults> {
        let zipOutput;
        const { isESM } = this;
        if (!this.overwrite && fs.pathExistsSync(this.outputFileName)) {
            throw new Error(`Zipfile already exists "${this.outputFileName}"`);
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

        // NOTE: The asset.json for bundled assets sets platform and arch to
        // false because bundled assets use WASM to avoid node-gyp.  If an asset
        // included an actual platform specific binary, it use the original
        // unbundled asset type
        if (!this.devMode) {
            const restrictions: string[] = [];
            if (assetJSON.node_version === undefined) {
                assetJSON.node_version = toInteger(this.bundleTarget?.replace('node', ''));
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

        // write asset.json into tmpDir
        await fs.writeJSON(path.join(tmpDir.name, 'asset', 'asset.json'), assetJSON, {
            spaces: 4,
        });

        const bundleDir = tmp.dirSync();
        reply.info(`* making tmp bundle directory "${bundleDir.name}"`);

        // write asset.json into bundleDir
        await fs.writeJSON(path.join(bundleDir.name, 'asset.json'), assetJSON, {
            spaces: 4,
        });

        let packageType = { type: 'commonjs' };

        if (isESM) {
            packageType = { type: 'module' };
        }

        // write asset.json into bundleDir
        await fs.writeJSON(path.join(bundleDir.name, 'package.json'), packageType, {
            spaces: 4,
        });

        // run npm --cwd srcDir/asset --prod --silent --no-progress
        reply.info('* running yarn --prod --no-progress');
        await this._yarnCmd(path.join(tmpDir.name, 'asset'), ['--prod', '--no-progress']);

        // Since we now require bundled assets to implement a registry, we
        // require that Javascript assets place it at `asset/index.js` and
        // TypeScript assets place it at `asset/src/index.ts`
        let entryPoint = '';
        try {
            if (await fs.pathExists(path.join(tmpDir.name, 'asset', 'index.js'))) {
                entryPoint = path.join(tmpDir.name, 'asset', 'index.js');
            } else if (await fs.pathExists(path.join(tmpDir.name, 'asset', 'src', 'index.ts'))) {
                entryPoint = path.join(tmpDir.name, 'asset', 'src', 'index.ts');
            } else {
                reply.fatal('Bundled assets require an asset registry at either asset/index.js or asset/src/index.ts');
            }
            reply.warning(`* entryPoint: ${entryPoint}`);
        } catch (err) {
            reply.fatal(`Unable to resolve entry point due to error: ${err}`);
        }

        const injectPath = path.join(dirname, './esm-shims.js');

        const result = await build({
            bundle: true,
            entryPoints: [entryPoint],
            outdir: bundleDir.name,
            platform: 'node',
            sourcemap: false,
            target: this.bundleTarget,
            plugins: [wasmPlugin],
            keepNames: true,
            ...(isESM && { format: 'esm', inject: [injectPath] })
        });

        // Test require the asset to make sure it loads, if the process node
        // version is the same as the buildTarget
        if (this.bundleTarget?.replace('node', '') === process.version.split('.', 1)[0].substr(1)) {
            try {
                const require = createRequire(import.meta.url);
                const modulePath = require.resolve(bundleDir.name);

                reply.info(`* doing a test require of ${modulePath}`);

                const module = await import(modulePath);

                if (this.debug) {
                    reply.warning(JSON.stringify(module.ASSETS, null, 2));
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

            await this._copyStaticAssets(tmpDir.name, bundleDir.name);

            reply.info('* zipping the asset bundle');
            // create zipfile
            // cp include files that are not required, should require as much as possible
            zipOutput = await AssetSrc.zip(path.join(bundleDir.name), this.outputFileName);
            // remove temp directories
            await fs.remove(tmpDir.name);
            await fs.remove(bundleDir.name);
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

    private async _copyStaticAssets(tempDir: string, bundleDir: string): Promise<void> {
        const exists = await fs.pathExists(path.join(tempDir, 'asset', '__static_assets'));

        if (exists) {
            await fs.copy(path.join(tempDir, 'asset', '__static_assets'), path.join(bundleDir, '__static_assets'));
        }
    }
}
