import { Context } from '@terascope/teraslice-types';
export default class LoadOperation {
    private opPath;
    private terasliceOpPath;
    constructor(context: Context, terasliceOpPath: string);
    find(name: string, assetsPath: string, executionAssets: string[]): string;
    load(): void;
}
