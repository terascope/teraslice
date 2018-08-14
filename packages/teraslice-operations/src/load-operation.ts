'use strict';

import { get } from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Context } from '@terascope/teraslice-types';

export default class LoadOperation {
    private opPath: string;
    private terasliceOpPath: string;

    constructor(context: Context, terasliceOpPath: string) {
        this.terasliceOpPath = terasliceOpPath;
        this.opPath = get(context, 'context.sysconfig.teraslice.ops_directory', '');
    }

    find(name: string, assetsPath: string, executionAssets: string[]) : string {
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

        function findCodeByConvention(basePath: string, subfolders: string[]) {
            if (!basePath) return;
            if (!fs.pathExistsSync(basePath)) return;

            subfolders.forEach((folder: string) => {
                const pathType = path.resolve(path.join(basePath, folder));
                if (!filePath && fs.pathExistsSync(pathType)) {
                    findCode(pathType);
                }
            });
        }

        findCodeByConvention(assetsPath, executionAssets);

        // if found, don't do extra searches
        if (filePath) return filePath;

        findCodeByConvention(this.terasliceOpPath, ['readers', 'processors']);

        // if found, don't do extra searches
        if (filePath) return filePath;

        findCodeByConvention(this.opPath, ['readers', 'processors']);

        return filePath;
    }

    load() : void {

    }
}
