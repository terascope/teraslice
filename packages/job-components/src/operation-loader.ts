'use strict';

import fs from 'fs';
import path from 'path';
import cloneDeep from 'lodash.clonedeep';
import { LegacyOperation } from './interfaces';
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
import { isString, uniq, parseError } from './utils';

export interface LoaderOptions {
    /** Path to teraslice lib directory */
    terasliceOpPath?: string;
    /** Path to where the assets are stored */
    assetPath?: string;
}

export class OperationLoader {
    private readonly options: LoaderOptions;
    private readonly availableExtensions: string[];

    constructor(options: LoaderOptions = {}) {
        this.options = cloneDeep(options);
        this.availableExtensions = availableExtensions();
    }

    find(name: string, assetIds?: string[]): string | null {
        let filePath: string | null = null;
        const findCodeFn = this.findCode(name);

        const findCodeByConvention = (basePath?: string, subfolders?: string[]) => {
            if (!basePath) return;
            if (!fs.existsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;

            subfolders.forEach((folder: string) => {
                const folderPath = path.join(basePath, folder);
                if (!filePath && fs.existsSync(folderPath)) {
                    filePath = findCodeFn(folderPath);
                }
            });
        };

        findCodeByConvention(this.options.assetPath, assetIds);

        if (!filePath) {
            findCodeByConvention(this.getBuiltinDir(), ['.']);
        }

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
            return this.require(codePath);
        } catch (err) {
            throw new Error(`Failure loading module: ${name}, error: ${parseError(err, true)}`);
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
            Processor = this.require(codePath, 'processor');
        } catch (err) {
            throw new Error(`Failure loading processor from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(codePath, 'schema');
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            API = this.require(codePath, 'api');
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
            Slicer = this.require(codePath, 'slicer');
        } catch (err) {
            throw new Error(`Failure loading slicer from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Fetcher = this.require(codePath, 'fetcher');
        } catch (err) {
            throw new Error(`Failure loading fetcher from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            Schema = this.require(codePath, 'schema');
        } catch (err) {
            throw new Error(`Failure loading schema from module: ${name}, error: ${parseError(err, true)}`);
        }

        try {
            API = this.require(codePath, 'api');
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
            Observer = this.require(codePath, 'observer');
        } catch (err) {
            throw new Error(`Failure loading observer from module: ${name}, error: ${parseError(err, true)}`);
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
            API = this.require(codePath, 'api');
        } catch (err) {
            throw new Error(`Failure loading api from module: ${name}, error: ${parseError(err, true)}`);
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
        const filePaths = this.availableExtensions.map((ext) => {
            return path.format({
                dir,
                name,
                ext,
            });
        });
        return filePaths.some((filePath) => fs.existsSync(filePath));
    }

    private require<T>(dir: string, name?: string): T {
        const filePaths = name ? this.availableExtensions.map((ext) => {
            return path.format({
                dir,
                name,
                ext,
            });
        }) : [dir];

        let err: Error|undefined;

        for (const filePath of filePaths) {
            try {
                const mod = require(filePath);
                return mod.default || mod;
            } catch (_err) {
                err = _err;
            }
        }

        if (err) {
            throw err;
        } else {
            throw new Error(`Unable to find module at paths: ${filePaths.join(', ')}`);
        }
    }

    private resolvePath(filePath: string): string | null {
        if (fs.existsSync(filePath)) return filePath;

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

        const codeNames = this.availableExtensions.map((ext) => {
            return path.format({
                name,
                ext,
            });
        });

        const allowedNames = uniq([name, ...codeNames]);

        const invalid = [
            'node_modules',
            ...ignoreDirectories(),
        ];

        const findCode = (rootDir: string): string|null => {
            const fileNames = fs.readdirSync(rootDir)
                .filter((fileName: string) => !invalid.includes(fileName));

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
        return path.join(__dirname, '..', 'dist', 'builtin');
    }
}

function availableExtensions(): string[] {
    // populated by teraslice Jest configuration
    // @ts-ignore
    return global.availableExtensions ? global.availableExtensions : ['.js'];
}

function ignoreDirectories() {
    // populated by teraslice Jest configuration
    // @ts-ignore
    return global.ignoreDirectories || [];
}
