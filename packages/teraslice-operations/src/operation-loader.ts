'use strict';

import { Operation } from '@terascope/teraslice-types';
import * as fs from 'fs';
import { pathExistsSync } from 'fs-extra';
import * as path from 'path';

export interface LoaderOptions {
    terasliceOpPath: string;
    opPath: string;
    assetPath?: string;
}

export class OperationLoader {
    private readonly options: LoaderOptions;

    constructor(options: LoaderOptions) {
        this.options = options;
    }

    public find(name: string, executionAssets?: string[]) : string|null {
        this.verifyOpName(name);

        let filePath: string|null = null;
        let codeName: string = '';

        if (!name.match(/.js$/)) {
            codeName = `${name}.js`;
        }

        const findCode = (rootDir: string): void => {
            fs.readdirSync(rootDir).forEach((filename: string) => {
                const nextPath = path.join(rootDir, filename);

                // if name is same as filename/dir then we found it
                if (filename === name || filename === codeName) {
                    filePath = this.resolvePath(nextPath);
                }

                if (filePath || filename === 'node_modules') {
                    return;
                }

                if (fs.statSync(nextPath).isDirectory()) {
                    findCode(nextPath);
                }
            });
        }

        const findCodeByConvention = (basePath?: string, subfolders?: string[]) => {
            if (!basePath) { return; }
            if (!pathExistsSync(basePath)) { return; }
            if (!subfolders || !subfolders.length) { return; }

            subfolders.forEach((folder: string) => {
                const pathType = path.join(basePath, folder);
                if (!filePath && pathExistsSync(pathType)) {
                    findCode(pathType);
                }
            });
        }

        findCodeByConvention(this.options.assetPath, executionAssets);

        if (!filePath) {
            findCodeByConvention(path.resolve(this.options.terasliceOpPath), ['readers', 'processors']);
        }

        if (!filePath) {
            findCodeByConvention(path.resolve(this.options.opPath), ['readers', 'processors']);
        }

        if (!filePath) {
            filePath = this.resolvePath(name);
        }

        return filePath;
    }

    public load(name: string, executionAssets?: string[]): Operation {
        this.verifyOpName(name);

        const codePath = this.find(name, executionAssets);

        if (codePath) {
            try {
                return require(codePath);
            } catch (err) {
                throw new Error(`Failure loading module: ${name}, error: ${err.stack}`);
            }
        }

        throw new Error(`Unable to find module for operation: ${name}`);
    }

    private resolvePath(filePath: string): string|null {
       if (pathExistsSync(filePath)) return filePath;

       try {
           return require.resolve(filePath);
       } catch(err) {
           return null
       }
    }

    private verifyOpName(name: string): void {
        if (typeof name !== 'string') {
            throw new Error('please verify that ops_directory in config and _op for each job operations are strings');
        }
    }
}
