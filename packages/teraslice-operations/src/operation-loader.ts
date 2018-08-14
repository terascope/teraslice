'use strict';

import * as path from 'path';
import * as fs from 'fs-extra';

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

    find(name: string, executionAssets?: string[]) : string {
        let filePath: string = '';
        let codeName: string = '';

        if (!name.match(/.js/)) {
            codeName = `${name}.js`;
        }

        function findCode(rootDir: string): void {
            fs.readdirSync(rootDir).forEach((filename: string) => {
                const nextPath = path.join(rootDir, filename);

                // if name is same as filename/dir then we found it
                if (filename === name || filename === codeName) {
                    filePath = nextPath;
                }
                if (filePath || filename === 'node_modules') return;

                if (fs.statSync(nextPath).isDirectory()) {
                    findCode(nextPath);
                }
            });
        }

        function findCodeByConvention(basePath?: string, subfolders?: string[]) {
            if (!basePath) return;
            if (!fs.pathExistsSync(basePath)) return;
            if (!subfolders || !subfolders.length) return;

            subfolders.forEach((folder: string) => {
                const pathType = path.resolve(path.join(basePath, folder));
                if (!filePath && fs.pathExistsSync(pathType)) {
                    findCode(pathType);
                }
            });
        }

        findCodeByConvention(this.options.assetPath, executionAssets);

        // if found, don't do extra searches
        if (filePath) return filePath;

        findCodeByConvention(this.options.terasliceOpPath, ['readers', 'processors']);

        // if found, don't do extra searches
        if (filePath) return filePath;

        findCodeByConvention(this.options.opPath, ['readers', 'processors']);

        return filePath;
    }

    load(name: string, executionAssets?: string[]) : any {
        const codePath = this.find(name, executionAssets);
        try {
            return require(codePath);
        } catch (error) {
            try {
                return require(name);
            } catch (err) {
                // if it cant be required check first error to see if it exists
                // or had an error loading
                if (error.message !== 'missing path') {
                    throw new Error(`Error loading module: ${name}, the following error occurred while attempting to load the code: ${error.message}`);
                }

                if (err.code && err.code === 'MODULE_NOT_FOUND') {
                    throw new Error(`Could not retrieve code for: ${name} , error message: ${err}`);
                }

                throw new Error(`Error loading module: ${name} , error: ${err.stack}`);
            }
        }
    }
}
