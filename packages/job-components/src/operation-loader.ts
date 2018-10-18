'use strict';

import fs from 'fs';
import { pathExistsSync } from 'fs-extra';
import path from 'path';
import { LegacyOperation, LegacyReader, LegacyProcessor } from './interfaces';
import {
    OperationAPIConstructor,
    FetcherConstructor,
    SlicerConstructor,
    ProcessorConstructor,
    ObserverConstructor,
    SchemaConstructor,
    ObserverModule,
    ProcessorModule,
    APIModule,
    ReaderModule,
} from './operations';
import { readerShim, processorShim } from './operations/shims';
import { isString } from './utils';

interface LoaderOptions {
    terasliceOpPath: string;
    assetPath?: string;
}

export class OperationLoader {
    private readonly options: LoaderOptions;

    constructor(options: LoaderOptions) {
        this.options = options;
    }

    find(name: string, assetIds?: string[]): string | null {
        let filePath: string | null = null;
        const findCodeFn = this.findCode(name);

        const findCodeByConvention = (basePath?: string, subfolders?: string[]) => {
            if (!basePath) return;
            if (!pathExistsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;

            subfolders.forEach((folder: string) => {
                const folderPath = path.join(basePath, folder);
                if (!filePath && pathExistsSync(folderPath)) {
                    filePath = findCodeFn(folderPath);
                }
            });
        };

        findCodeByConvention(this.options.assetPath, assetIds);

        if (!filePath) {
            findCodeByConvention(this.options.terasliceOpPath, ['readers', 'processors']);
        }

        if (!filePath) {
            filePath = this.resolvePath(name);
        }

        return filePath;
    }

    /**
     * Load any LegacyOperation
     * DEPRECATED to accommadate for new Job APIs,
     * use loadReader, or loadProcessor
    */
    load(name: string, assetIds?: string[]): LegacyOperation {
        const codePath = this.findOrThrow(name, assetIds);

        try {
            return require(codePath);
        } catch (err) {
            throw new Error(`Failure loading module: ${name}, error: ${err.stack}`);
        }
    }

    loadProcessor(name: string, assetIds?: string[]): ProcessorModule {
        const codePath = this.findOrThrow(name, assetIds);

        if (this.isLegacyProcessor(codePath)) {
            return this.shimLegacyProcessor(name, codePath);
        }

        /* tslint:disable-next-line:variable-name */
        let Processor: ProcessorConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Schema: SchemaConstructor|undefined;
        let API: OperationAPIConstructor|undefined;

        try {
            Processor = require(path.join(codePath, 'processor.js'));
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${err.stack}`);
        }

        try {
            Schema = require(path.join(codePath, 'schema.js'));
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${err.stack}`);
        }

        try {
            API = require(path.join(codePath, 'api.js'));
        } catch (err) {
        }

        return {
            // @ts-ignore
            Processor,
            // @ts-ignore
            Schema,
            API,
        };
    }

    loadReader(name: string, assetIds?: string[]): ReaderModule {
        const codePath = this.findOrThrow(name, assetIds);

        if (this.isLegacyReader(codePath)) {
            return this.shimLegacyReader(name, codePath);
        }

        /* tslint:disable-next-line:variable-name */
        let Fetcher: FetcherConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Slicer: SlicerConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Schema: SchemaConstructor|undefined;
        let API: OperationAPIConstructor|undefined;

        try {
            Slicer = require(path.join(codePath, 'slicer.js'));
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${err.stack}`);
        }

        try {
            Fetcher = require(path.join(codePath, 'fetcher.js'));
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${err.stack}`);
        }

        try {
            Schema = require(path.join(codePath, 'schema.js'));
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${err.stack}`);
        }

        try {
            API = require(path.join(codePath, 'api.js'));
        } catch (err) {
        }

        return {
            // @ts-ignore
            Slicer,
            // @ts-ignore
            Fetcher,
            // @ts-ignore
            Schema,
            API,
        };
    }

    loadObserver(name: string, assetIds?: string[]): ObserverModule {
        const codePath = this.findOrThrow(name, assetIds);

        /* tslint:disable-next-line:variable-name */
        let Observer: ObserverConstructor|undefined;

        try {
            Observer = require(path.join(codePath, 'observer.js'));
        } catch (err) {
            throw new Error(`Failure loading observer from module: ${name}, error: ${err.stack}`);
        }

        return {
            // @ts-ignore
            Observer,
        };
    }

    loadAPI(name: string, assetIds?: string[]): APIModule {
        const codePath = this.findOrThrow(name, assetIds);

        /* tslint:disable-next-line:variable-name */
        let API: OperationAPIConstructor|undefined;

        try {
            API = require(path.join(codePath, 'api.js'));
        } catch (err) {
            throw new Error(`Failure loading api from module: ${name}, error: ${err.stack}`);
        }

        return {
            // @ts-ignore
            API,
        };
    }

    private findOrThrow(name: string, assetIds?: string[]): string {
        this.verifyOpName(name);

        const codePath = this.find(name, assetIds);
        if (!codePath) {
            throw new Error(`Unable to find module for operation: ${name}`);
        }

        return codePath;
    }

    private isLegacyReader(codePath: string): boolean {
        const fetcherPath = pathExistsSync(path.join(codePath, 'fetcher.js'));
        const slicerPath = pathExistsSync(path.join(codePath, 'slicer.js'));
        return !fetcherPath && !slicerPath;
    }

    private shimLegacyReader(name: string, codePath: string): ReaderModule {
        try {
            const legacy: LegacyReader = require(codePath);
            return readerShim(legacy);
        } catch (err) {
            throw new Error(`Failure loading module: ${name}, error: ${err.stack}`);
        }
    }

    private isLegacyProcessor(codePath: string): boolean {
        return !pathExistsSync(path.join(codePath, 'processor.js'));
    }
    private shimLegacyProcessor(name: string, codePath: string): ProcessorModule {
        try {
            const legacy: LegacyProcessor = require(codePath);
            return processorShim(legacy);
        } catch (err) {
            throw new Error(`Failure loading module: ${name}, error: ${err.stack}`);
        }
    }

    private resolvePath(filePath: string): string | null {
        if (pathExistsSync(filePath)) return filePath;

        try {
            return require.resolve(filePath);
        } catch (err) {
            return null;
        }
    }

    private verifyOpName(name: string): void {
        if (!isString(name)) {
            throw new TypeError('Please verify that the "_op" name exists for each operation');
        }
    }

    private findCode(name: string) {
        let filePath: string | null = null;
        let codeName: string = '';

        if (!name.match(/.js$/)) {
            codeName = `${name}.js`;
        }

        const invalid = [
            'node_modules'
        ];

        const findCode = (rootDir: string): string|null => {
            const fileNames = fs.readdirSync(rootDir)
                .filter((fileName: string) => !invalid.includes(fileName));

            for (const fileName of fileNames) {
                if (filePath) break;

                const nextPath = path.join(rootDir, fileName);

                // if name is same as fileName/dir then we found it
                if (fileName === name || fileName === codeName) {
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
}
