import fs from 'fs';
import path from 'path';
import {
    isString,
    uniq,
    parseError,
    castArray,
    get,
    has,
    withoutNil
} from '@terascope/utils';
import { LegacyOperation } from './interfaces';
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
} from './operations';
import { readerShim, processorShim } from './operations/shims';

const ASSET_KEYWORD = 'ASSETS';
export interface LoaderOptions {
    /** Path to teraslice lib directory */
    terasliceOpPath?: string;
    /** Path to where the assets are stored */
    assetPath?: string[] | string;
}

interface ValidLoaderOptions {
    /** Path to teraslice lib directory */
    terasliceOpPath?: string;
    /** Path to where the assets are stored */
    assetPath: string[]
}

export enum AssetVersionType {
    /** This represents legacy operations */
    V1 = 'V1',
    /** This represents operations that are in the format
     * of ASSET_NAME/OP_NAME/OPERATION_TYPE
     *
     * @example
     *   some-asset/myOP/processor.js
     *   some-asset/myOP/schema.js
     */
    V2 = 'V2',
    /** This represents operations that live in the index file
     * of the asset name, and returns an object with the 'ASSETS'
     * key which lists all operations and api available
     * @example
     *   some-asset/index.ts
     *
     *  export default {
        *   // A list of the operations provided by this asset bundle
            * ASSETS: {
                // The key here would be the current file name
                some-processor-name: {
                    Processor: ProcessorExampleBatcher,
                    Schema: ProcessorSchema,
                },
                 some-reader-name: {
                    Fetcher: ExampleFetcher,
                    Slicer: ExampleSlicer,
                    Schema: ReaderSchema,
                },
                 some-api-name: {
                    API: ExampleAPI,
                    Schema: SchemaAPI,
                },
            },
        };

     */
    V3 = 'V3'
}

export enum OPMetadataType {
    asset = 'asset',
    /** is located in node_modules */
    module = 'module',
    /** is located in builtin dir */
    builtin = 'builtin',
    /** is located natively in teraslice */
    'teraslice' = 'teraslice'
}

export const V3TypeDict = {
    processor: 'Processor',
    schema: 'Schema',
    fetcher: 'Fetcher',
    slicer: 'Slicer',
    api: 'API',
    observer: 'Observer'
};

interface BaseMetadata {
    version: AssetVersionType
}
export interface ModuleType extends BaseMetadata {
    type: OPMetadataType.module
}

export interface BuiltinType extends BaseMetadata {
    type: OPMetadataType.builtin
}

export interface TerasliceOpType extends BaseMetadata {
    type: OPMetadataType.teraslice
}

export interface AssetOpType extends BaseMetadata {
    type: OPMetadataType.asset,
}

export type OperationMetadata = ModuleType | BuiltinType | TerasliceOpType | AssetOpType

export function isVersion3(input: OperationMetadata): input is AssetOpType {
    return input && input.version === AssetVersionType.V3;
}
interface FindOperationResults {
    codePath: string | null;
    metadata: OperationMetadata | null
}

interface OperationResults {
    codePath: string;
    metadata: OperationMetadata
}

function _getV3Operation(dirPath: string): Record<string, any>|undefined {
    const asset = require(dirPath);
    return get(asset, ASSET_KEYWORD) ?? get(asset, `default.${ASSET_KEYWORD}`);
}

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

    getV3Operation<T>(dirPath: string, opName: string, type: string, shouldThrow = true): T {
        const repository = _getV3Operation(dirPath);
        const operation = get(repository ?? {}, opName);

        if (!operation && shouldThrow) {
            throw new Error(`Could not find operation ${opName}`);
        }
        const repoType = V3TypeDict[type];
        const opType = operation[repoType];

        if (!opType && shouldThrow) {
            throw new Error(`Operation ${opName}, does not have ${repoType} registered`);
        }

        return opType;
    }

    isV3Operation(dirPath: string, name: string):boolean {
        try {
            const repository = _getV3Operation(dirPath);
            return has(repository, name);
        } catch (_err) {
            return false;
        }
    }

    getOperationVersion({
        codePath,
        name
    }: { codePath: string|null, name: string}): AssetVersionType|null {
        if (!codePath) return null;

        if (this.isV3Operation(codePath, name)) {
            return AssetVersionType.V3;
        }

        if (this.isLegacyOperation(codePath)) {
            return AssetVersionType.V1;
        }

        return AssetVersionType.V2;
    }

    isLegacyOperation(codePath: string) {
        const results = this.require(codePath);
        return ['newReader', 'newSlicer', 'newProcessor'].some((key) => has(results, key));
    }

    find(name: string, assetIds?: string[]): FindOperationResults {
        let filePath: string | null = null;
        let type: OPMetadataType;

        const findCodeFn = this.findCode(name);

        const findCodeByConvention = (basePath?: string, subfolders?: string[]) => {
            if (!basePath) return;
            if (!fs.existsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;

            for (const folder of subfolders) {
                const folderPath = path.join(basePath, folder);
                // we check for v3 version of asset
                if (this.isV3Operation(folderPath, name)) {
                    filePath = folderPath;
                }

                if (!filePath && fs.existsSync(folderPath)) {
                    filePath = findCodeFn(folderPath);
                }
            }
        };

        for (const assetPath of this.options.assetPath) {
            type = OPMetadataType.asset;
            findCodeByConvention(assetPath, assetIds);
            if (filePath) break;
        }

        if (!filePath) {
            type = OPMetadataType.builtin;
            findCodeByConvention(this.getBuiltinDir(), ['.']);
        }

        if (!filePath) {
            type = OPMetadataType.teraslice;
            findCodeByConvention(this.options.terasliceOpPath, ['readers', 'processors']);
        }

        if (!filePath) {
            type = OPMetadataType.module;
            filePath = this.resolvePath(name);
        }

        const version = this.getOperationVersion({ codePath: filePath, name });
        console.log({ version, type: type!, filePath });
        const metadata: OperationMetadata = withoutNil({ type: type!, version: version! });

        return { codePath: filePath, metadata };
    }

    /**
     * Load any LegacyOperation
     * DEPRECATED to accommodate for new Job APIs,
     * use loadReader, or loadProcessor
     */
    load(name: string, assetIds?: string[]): LegacyOperation {
        const { codePath, metadata } = this.findOrThrow(name, assetIds);
        try {
            if (isVersion3(metadata)) {
                throw new Error('Cannot use legacy operations with v3 operations');
            }
            return this.require(codePath);
        } catch (err) {
            throw new Error(`Failure loading module: ${name}, error: ${parseError(err, true)}`);
        }
    }

    loadProcessor(name: string, assetIds?: string[]): ProcessorModule {
        const { codePath, metadata: { version } } = this.findOrThrow(name, assetIds);

        if (version === AssetVersionType.V1) {
            return this.shimLegacyProcessor(name, codePath);
        }

        let Processor: ProcessorConstructor | undefined;
        let Schema: SchemaConstructor | undefined;
        let API: OperationAPIConstructor | undefined;

        try {
            Processor = this.require(codePath, 'processor', { name, version });
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(codePath, 'schema', { name, version });
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            API = this.require(codePath, 'api', { name, version });
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
        const { codePath, metadata: { version } } = this.findOrThrow(name, assetIds);

        if (version === AssetVersionType.V1) {
            console.log('am i shiming?');
            return this.shimLegacyReader(name, codePath);
        }

        let Fetcher: FetcherConstructor | undefined;
        let Slicer: SlicerConstructor | undefined;
        let Schema: SchemaConstructor | undefined;
        let API: OperationAPIConstructor | undefined;

        try {
            Slicer = this.require(codePath, 'slicer', { name, version });
        } catch (err) {
            throw new Error(`Failure loading slicer from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Fetcher = this.require(codePath, 'fetcher', { name, version });
        } catch (err) {
            throw new Error(`Failure loading fetcher from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(codePath, 'schema', { name, version });
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        console.log('at reader', { codePath, name, version });
        try {
            API = this.require(codePath, 'api', { name, version });
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
        const [apiName] = name.split(':');
        const { codePath, metadata: { version } } = this.findOrThrow(name, assetIds);

        let API: OperationAPIConstructor | undefined;

        try {
            API = this.require(codePath, 'api', { name, version });
        } catch (err) {
            // do nothing
        }

        let Observer: ObserverConstructor | undefined;

        try {
            Observer = this.require(codePath, 'observer', { name, version });
        } catch (err) {
            // do nothing
        }

        let Schema: SchemaConstructor | undefined;

        try {
            Schema = this.require(codePath, 'schema', { name, version });
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

        if (!results.codePath) {
            throw new Error(`Unable to find module for operation: ${name}`);
        }

        if (!results.metadata) {
            throw new Error(`Unable to gather metadata for operation: ${name}`);
        }

        return results as OperationResults;
    }

    private isLegacyReader(codePath: string): boolean {
        return !this.fileExists(codePath, 'fetcher') && !this.fileExists(codePath, 'slicer');
    }

    private shimLegacyReader(name: string, codePath: string): ReaderModule {
        try {
            return readerShim(this.require(codePath));
        } catch (err) {
            throw new Error(`Failure loading reader: ${name}, error: ${parseError(err, true)}`);
        }
    }

    private isLegacyProcessor(codePath: string): boolean {
        return !this.fileExists(codePath, 'processor');
    }

    private shimLegacyProcessor(name: string, codePath: string): ProcessorModule {
        try {
            return processorShim(this.require(codePath));
        } catch (err) {
            throw new Error(`Failure loading processor: ${name}, error: ${parseError(err, true)}`);
        }
    }

    private fileExists(dir: string, name: string): boolean {
        const filePaths = this.availableExtensions.map((ext) => path.format({
            dir,
            name,
            ext,
        }));
        return filePaths.some((filePath) => fs.existsSync(filePath));
    }

    private require<T>(
        dir: string,
        type?: string,
        { version, name }: { version?: AssetVersionType, name?: string } = {}
    ): T {
        const filePaths = type
            ? this.availableExtensions.map((ext) => path.format({
                dir,
                name: type,
                ext,
            }))
            : [dir];

        let err: Error | undefined;

        if (version && version === AssetVersionType.V3) {
            console.log('should not be here');
            if (!type) throw new Error('Must provide a operation type if using a version parameter');
            if (!name) throw new Error('Must provide a operation name if using a version parameter');

            try {
                return this.getV3Operation(dir, name, type, true);
            } catch (_err) {
                err = _err;
            }
        } else {
            console.log({ filePaths, type, name });
            for (const filePath of filePaths) {
                try {
                    console.log({ filePath });
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
                    return path.dirname(
                        require.resolve(
                            path.format({
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

        const codeNames = this.availableExtensions.map((ext) => path.format({
            name,
            ext,
        }));

        const allowedNames = uniq([name, ...codeNames]);

        const findCode = (rootDir: string): string | null => {
            const fileNames = fs.readdirSync(rootDir)
                .filter(this.allowedFile);

            for (const fileName of fileNames) {
                if (filePath) break;

                const nextPath = path.join(rootDir, fileName);

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
            return path.join(__dirname, 'builtin');
        }
        return path.join(__dirname, '..', '..', 'dist', 'src', 'builtin');
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
