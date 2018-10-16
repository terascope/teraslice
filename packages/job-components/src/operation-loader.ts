'use strict';

import { LegacyOperation } from '@terascope/teraslice-types';
import { APIConstructor } from './operations/core/api-core';
import { FetcherConstructor } from './operations/core/fetcher-core';
import { SlicerConstructor } from './operations/core/slicer-core';
import { ProcessorConstructor } from './operations/core/processor-core';
import { SchemaConstructor } from './operations/core/schema-core';
import fs from 'fs';
import { pathExistsSync } from 'fs-extra';
import path from 'path';
import { isString } from 'lodash';

export interface LoaderOptions {
    terasliceOpPath: string;
    assetPath?: string;
}

export class OperationLoader {
    private readonly options: LoaderOptions;

    constructor(options: LoaderOptions) {
        this.options = options;
    }

    public find(name: string, assetIds?: string[]): string | null {
        this.verifyOpName(name);

        let filePath: string | null = null;
        const findCodeFn = this.findCode(name);

        const findCodeByConvention = (basePath?: string, subfolders?: string[], resolvePath?: boolean) => {
            if (!basePath) return;
            if (!pathExistsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;
            const folderPath = resolvePath ? path.resolve(basePath) : basePath;

            subfolders.forEach((folder: string) => {
                const pathType = path.join(folderPath, folder);
                if (!filePath && pathExistsSync(pathType)) {
                    filePath = findCodeFn(pathType);
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

    public loadProcessor(name: string, assetIds?: string[]): ProcessorModule {
        this.verifyOpName(name);

        const codePath = this.find(name, assetIds);
        if (!codePath) {
            throw new Error(`Unable to find module for operation: ${name}`);
        } else if (!this.isDir(codePath)) {
            throw new Error(`Processor "${name}" cannot be loaded because it resolved to file not a directory`);
        }

        /* tslint:disable-next-line:variable-name */
        let Processor: ProcessorConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Schema: SchemaConstructor|undefined;
        let API: APIConstructor|undefined;

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

    public loadReader(name: string, assetIds?: string[]): ReaderModule {
        this.verifyOpName(name);

        const codePath = this.find(name, assetIds);
        if (!codePath) {
            throw new Error(`Unable to find module for operation: ${name}`);
        } else if (!this.isDir(codePath)) {
            throw new Error(`Reader "${name}" cannot be loaded because it resolved to file not a directory`);
        }

        /* tslint:disable-next-line:variable-name */
        let Fetcher: FetcherConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Slicer: SlicerConstructor|undefined;
        /* tslint:disable-next-line:variable-name */
        let Schema: SchemaConstructor|undefined;
        let API: APIConstructor|undefined;

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

    public load(name: string, assetIds?: string[]): LegacyOperation {
        this.verifyOpName(name);

        const codePath = this.find(name, assetIds);
        if (!codePath) {
            throw new Error(`Unable to find module for operation: ${name}`);
        }

        try {
            return require(codePath);
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

export interface OperationModule {
    Schema: SchemaConstructor;
    API?: APIConstructor;
}

export interface ReaderModule extends OperationModule {
    Slicer: SlicerConstructor;
    Fetcher: FetcherConstructor;
}

export interface ProcessorModule extends OperationModule {
    Processor: ProcessorConstructor;
}
