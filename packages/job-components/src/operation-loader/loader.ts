import fs from 'fs';
import * as pathModule from 'path';
import {
    isString,
    uniq,
    parseError,
    castArray,
    get,
    has,
    joinList,
} from '@terascope/utils';
import {
    OperationAPIConstructor,
    FetcherConstructor,
    SlicerConstructor,
    ProcessorConstructor,
    ObserverConstructor,
    SchemaConstructor,
    ProcessorModule,
    APIModule,
    ReaderModule,
} from '../operations';
import { readerShim, processorShim } from '../operations/shims';
import {
    ASSET_KEYWORD,
    LoaderOptions,
    ValidLoaderOptions,
    AssetBundleType,
    OperationLocationType,
    OpTypeToRepositoryKey,
    OperationResults,
    FindOperationResults,
    OperationTypeName
} from './interfaces';

export class OperationLoader {
    private readonly options: ValidLoaderOptions;
    private readonly availableExtensions: string[];
    private readonly invalidPaths: string[];
    allowedFile: (name: string) => boolean;

    constructor(options: LoaderOptions = {}) {
        this.options = this.validateOptions(options);
        this.availableExtensions = availableExtensions();
        this.invalidPaths = ['node_modules', ...ignoreDirectories()];

        this.allowedFile = (fileName: string) => {
            const char = fileName.charAt(0);
            const isPrivate = char === '.' || char === '_';
            return !isPrivate && !this.invalidPaths.includes(fileName);
        };
    }

    private _getBundledRepository(dirPath: string): Record<string, any>|undefined {
        const asset = this.require(dirPath);
        return get(asset, ASSET_KEYWORD) ?? get(asset, `default.${ASSET_KEYWORD}`);
    }

    private _getBundledOperation<T>(
        dirPath: string, opName: string, type: OperationTypeName
    ): T {
        const repository = this._getBundledRepository(dirPath);
        if (repository == null) {
            throw new Error(`Empty asset repository found at path: ${dirPath}`);
        }
        const operation = get(repository, opName);

        if (!operation) {
            throw new Error(`Could not find operation ${opName}, must be one of ${joinList(Object.keys(repository))}`);
        }
        const repoType = OpTypeToRepositoryKey[type];
        const opType = operation[repoType];

        if (!opType) {
            throw new Error(`Operation ${opName}, does not have ${repoType} registered`);
        }

        return opType;
    }

    private isBundledOperation(dirPath: string, name: string):boolean {
        try {
            const repository = this._getBundledRepository(dirPath);
            return has(repository, name);
        } catch (_err) {
            return false;
        }
    }

    private getBundleType({
        codePath,
        name
    }: { codePath: string|null, name: string}): AssetBundleType|null {
        if (!codePath) return null;

        if (this.isBundledOperation(codePath, name)) {
            return AssetBundleType.BUNDLED;
        }

        if (this.isLegacyOperation(codePath)) {
            return AssetBundleType.LEGACY;
        }

        return AssetBundleType.STANDARD;
    }

    private isLegacyOperation(codePath: string): boolean {
        try {
            const results = this.require(codePath);
            return ['newReader', 'newSlicer', 'newProcessor'].some((key) => has(results, key));
        } catch (_err) {
            return false;
        }
    }

    find(name: string, assetIds?: string[]): FindOperationResults {
        let filePath: string | null = null;
        let location: OperationLocationType | null = null;

        const findCodeFn = this.findCode(name);

        const findCodeByConvention = (basePath?: string, subfolders?: string[]) => {
            if (!basePath) return;
            if (!fs.existsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;

            for (const folder of subfolders) {
                const folderPath = pathModule.join(basePath, folder);
                // we check for v3 version of asset
                if (this.isBundledOperation(folderPath, name)) {
                    filePath = folderPath;
                }

                if (!filePath && fs.existsSync(folderPath)) {
                    filePath = findCodeFn(folderPath);
                }
            }
        };

        for (const assetPath of this.options.assetPath) {
            location = OperationLocationType.asset;
            findCodeByConvention(assetPath, assetIds);
            if (filePath) break;
        }

        if (!filePath) {
            location = OperationLocationType.builtin;
            findCodeByConvention(this.getBuiltinDir(), ['.']);
        }

        if (!filePath) {
            location = OperationLocationType.teraslice;
            findCodeByConvention(this.options.terasliceOpPath, ['readers', 'processors']);
        }

        if (!filePath) {
            location = OperationLocationType.module;
            filePath = this.resolvePath(name);
        }

        const bundle_type = this.getBundleType({ codePath: filePath, name });

        return { path: filePath, location, bundle_type };
    }

    loadProcessor(name: string, assetIds?: string[]): ProcessorModule {
        const { path, bundle_type } = this.findOrThrow(name, assetIds);

        if (bundle_type === AssetBundleType.LEGACY) {
            return this.shimLegacyProcessor(name, path);
        }

        let Processor: ProcessorConstructor | undefined;
        let Schema: SchemaConstructor | undefined;
        let API: OperationAPIConstructor | undefined;

        try {
            Processor = this.require(path, OperationTypeName.processor, { name, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(path, OperationTypeName.schema, { name, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            API = this.require(path, OperationTypeName.api, { name, bundle_type });
        } catch (err) {
            // do nothing
        }

        return {
            // @ts-expect-error
            Processor,
            // @ts-expect-error
            Schema,
            API,
        };
    }

    loadReader(name: string, assetIds?: string[]): ReaderModule {
        const { path, bundle_type } = this.findOrThrow(name, assetIds);

        if (bundle_type === AssetBundleType.LEGACY) {
            return this.shimLegacyReader(name, path);
        }

        let Fetcher: FetcherConstructor | undefined;
        let Slicer: SlicerConstructor | undefined;
        let Schema: SchemaConstructor | undefined;
        let API: OperationAPIConstructor | undefined;

        try {
            Slicer = this.require(path, OperationTypeName.slicer, { name, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading slicer from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Fetcher = this.require(path, OperationTypeName.fetcher, { name, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading fetcher from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(path, OperationTypeName.schema, { name, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            API = this.require(path, OperationTypeName.api, { name, bundle_type });
        } catch (err) {
            // do nothing
        }

        return {
            // @ts-expect-error
            Slicer,
            // @ts-expect-error
            Fetcher,
            // @ts-expect-error
            Schema,
            API,
        };
    }

    loadAPI(name: string, assetIds?: string[]): APIModule {
        const [apiName] = name.split(':', 1);
        const { path, bundle_type } = this.findOrThrow(apiName, assetIds);

        let API: OperationAPIConstructor | undefined;

        try {
            API = this.require(path, OperationTypeName.api, { name: apiName, bundle_type });
        } catch (err) {
            // do nothing
        }

        let Observer: ObserverConstructor | undefined;

        try {
            Observer = this.require(
                path, OperationTypeName.observer, { name: apiName, bundle_type }
            );
        } catch (err) {
            // do nothing
        }

        let Schema: SchemaConstructor | undefined;

        try {
            Schema = this.require(path, OperationTypeName.schema, { name: apiName, bundle_type });
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${apiName}, error: ${parseError(err, true)}`);
        }

        if (Observer == null && API == null) {
            throw new Error(`Failure to load api module: ${apiName}, requires at least an api.js or observer.js`);
        } else if (Observer != null && API != null) {
            throw new Error(`Failure to load api module: ${apiName}, required only one api.js or observer.js`);
        }

        const type = API != null ? 'api' : 'observer';

        return {
            // @ts-expect-error
            API: API || Observer,
            // @ts-expect-error
            Schema,
            type,
        };
    }

    private findOrThrow(name: string, assetIds?: string[]): OperationResults {
        this.verifyOpName(name);

        const results = this.find(name, assetIds);

        if (!results.path) {
            throw new Error(`Unable to find module for operation: ${name}`);
        }

        if (!results.location) {
            throw new Error(`Unable to gather location for operation: ${name}`);
        }

        if (!results.bundle_type) {
            throw new Error(`Unable to determine the bundle_type for operation: ${name}`);
        }

        return results as OperationResults;
    }

    private shimLegacyReader(name: string, codePath: string): ReaderModule {
        try {
            return readerShim(this.require(codePath));
        } catch (err) {
            throw new Error(`Failure loading reader: ${name}, error: ${parseError(err, true)}`);
        }
    }

    private shimLegacyProcessor(name: string, codePath: string): ProcessorModule {
        try {
            return processorShim(this.require(codePath));
        } catch (err) {
            throw new Error(`Failure loading processor: ${name}, error: ${parseError(err, true)}`);
        }
    }

    private require<T>(
        dir: string,
        type?: OperationTypeName,
        { bundle_type, name }: { bundle_type?: AssetBundleType, name?: string } = {}
    ): T {
        const filePaths = type
            ? this.availableExtensions.map((ext) => pathModule.format({
                dir,
                name: type,
                ext,
            }))
            : [dir];

        let err: Error | undefined;

        if (bundle_type && bundle_type === AssetBundleType.BUNDLED) {
            if (!type) throw new Error('Must provide a operation type if using a version parameter');
            if (!name) throw new Error('Must provide a operation name if using a version parameter');

            try {
                return this._getBundledOperation(dir, name, type);
            } catch (_err) {
                err = _err;
            }
        } else {
            for (const filePath of filePaths) {
                try {
                    const mod = require(filePath);
                    return mod.default || mod;
                } catch (_err) {
                    err = _err;
                }
            }
        }

        if (err) {
            throw err;
        } else {
            throw new Error(`Unable to find module at paths: ${filePaths.join(', ')}`);
        }
    }

    private resolvePath(filePath: string): string | null {
        if (!filePath) return null;
        if (fs.existsSync(filePath)) return filePath;

        try {
            return require.resolve(filePath);
        } catch (err) {
            for (const ext of this.availableExtensions) {
                try {
                    return pathModule.dirname(
                        require.resolve(
                            pathModule.format({
                                dir: filePath,
                                name: 'schema',
                                ext,
                            })
                        )
                    );
                } catch (_err) {
                    // do nothing
                }
            }
            return null;
        }
    }

    private verifyOpName(name: string): void {
        if (!isString(name)) {
            throw new TypeError('Please verify that the "_op" name exists for each operation');
        }

        if (!this.allowedFile(name)) throw new Error(`Invalid name: ${name}, it is private or otherwise restricted`);
    }

    private findCode(name: string) {
        let filePath: string | null = null;

        const codeNames = this.availableExtensions.map((ext) => pathModule.format({
            name,
            ext,
        }));

        const allowedNames = uniq([name, ...codeNames]);

        const findCode = (rootDir: string): string | null => {
            const fileNames = fs.readdirSync(rootDir)
                .filter(this.allowedFile);

            for (const fileName of fileNames) {
                if (filePath) break;

                const nextPath = pathModule.join(rootDir, fileName);

                // if name is same as fileName/dir then we found it
                if (allowedNames.includes(fileName)) {
                    filePath = this.resolvePath(nextPath);
                }

                if (!filePath && this.isDir(nextPath)) {
                    filePath = findCode(nextPath);
                }
            }

            return filePath;
        };

        return findCode;
    }

    private isDir(filePath: string) {
        return fs.statSync(filePath).isDirectory();
    }

    private getBuiltinDir() {
        if (this.availableExtensions.includes('.ts')) {
            return pathModule.join(__dirname, '../builtin');
        }
        return pathModule.join(__dirname, '..', '..', '..', 'dist', 'src', 'builtin');
    }

    private validateOptions(options: LoaderOptions): ValidLoaderOptions {
        const assetPath = castArray<string|undefined>(options.assetPath);
        const validOptions = Object.assign({}, options, { assetPath });
        return validOptions as ValidLoaderOptions;
    }
}

function availableExtensions(): string[] {
    // populated by teraslice Jest configuration
    // @ts-expect-error
    return global.availableExtensions ? global.availableExtensions : ['.js', '.mjs', '.cjs'];
}

function ignoreDirectories() {
    // populated by teraslice Jest configuration
    // @ts-expect-error
    return global.ignoreDirectories || [];
}
