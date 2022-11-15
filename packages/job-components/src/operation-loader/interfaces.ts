import {
    APIConstructor, SlicerConstructor, ProcessorConstructor,
    FetcherConstructor, ObserverConstructor, SchemaConstructor
} from '../operations/interfaces.js';

export const ASSET_KEYWORD = 'ASSETS';
export interface LoaderOptions {
    /** Path to teraslice lib directory */
    terasliceOpPath?: string;
    /** Path to where the assets are stored */
    assetPath?: string[] | string;
}

export interface ValidLoaderOptions {
    /** Path to teraslice lib directory */
    terasliceOpPath?: string;
    /** Path to where the assets are stored */
    assetPath: string[]
}

export enum AssetBundleType {
    /** This represents legacy operations */
    LEGACY = 'LEGACY',
    /** This represents operations that are in the format
     * of ASSET_NAME/OP_NAME/OPERATION_TYPE
     *
     * @example
     *   some-asset/myOP/processor.js
     *   some-asset/myOP/schema.js
     */
    STANDARD = 'STANDARD',
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
    BUNDLED = 'BUNDLED'
}

export enum OperationLocationType {
    asset = 'asset',
    /** is located in node_modules */
    module = 'module',
    /** is located in builtin dir */
    builtin = 'builtin',
    /** is located natively in teraslice */
    'teraslice' = 'teraslice'
}

export enum OperationTypeName {
    processor = 'processor',
    schema = 'schema',
    fetcher = 'fetcher',
    slicer = 'slicer',
    api = 'api',
    observer = 'observer'
}

export const AssetRepositoryKey = {
    [OperationTypeName.processor]: 'Processor',
    [OperationTypeName.schema]: 'Schema',
    [OperationTypeName.fetcher]: 'Fetcher',
    [OperationTypeName.slicer]: 'Slicer',
    [OperationTypeName.api]: 'API',
    [OperationTypeName.observer]: 'Observer'
} as const;

export interface BundledProcessorOperation {
    [AssetRepositoryKey.processor]: ProcessorConstructor,
    [AssetRepositoryKey.schema]: SchemaConstructor,
    [AssetRepositoryKey.api]?: APIConstructor,
}

export interface BundledReaderOperation {
    [AssetRepositoryKey.fetcher]: FetcherConstructor,
    [AssetRepositoryKey.slicer]: SlicerConstructor,
    [AssetRepositoryKey.schema]: SchemaConstructor,
    [AssetRepositoryKey.api]?: APIConstructor
}

export interface BundledAPIOperation {
    [AssetRepositoryKey.api]: APIConstructor
    [AssetRepositoryKey.schema]:SchemaConstructor,
}

export interface BundledObserverOperation {
    [AssetRepositoryKey.observer]: ObserverConstructor
    [AssetRepositoryKey.schema]: SchemaConstructor,
}

export type RepositoryOperation = BundledProcessorOperation
| BundledReaderOperation
| BundledAPIOperation
| BundledObserverOperation

export interface AssetRepository {
    [ASSET_KEYWORD]: {
        [key: string]: RepositoryOperation
    }
}

/** This map what type of operation the loader is looking for with
 * the key listed in the asset bundle
 */
export const OpTypeToRepositoryKey = {
    processor: AssetRepositoryKey.processor,
    schema: AssetRepositoryKey.schema,
    fetcher: AssetRepositoryKey.fetcher,
    slicer: AssetRepositoryKey.slicer,
    api: AssetRepositoryKey.api,
    observer: AssetRepositoryKey.observer
};

export interface OperationResults {
    path: string;
    location: OperationLocationType;
    bundle_type: AssetBundleType
}

export interface FindOperationResults {
    path: string|null;
    location: OperationLocationType|null;
    bundle_type: AssetBundleType|null
}
