import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces.js';

export interface BumpAssetOnlyOptions {
    preId?: string;
    release: ReleaseType;
}

export interface BumpPackageOptions {
    release: ReleaseType;
    packages: PackageInfo[];
    deps: boolean;
    preId?: string;
    skipReset?: boolean;
}

export interface BumpPkgInfo {
    from: string;
    to: string;
    main: boolean;
    deps: {
        name: string;
        type: BumpType;
    }[];
}

export interface AssetJsonInfo {
    name: string;
    version: string;
    description: string;
}

export enum BumpType {
    Dev = 'dev',
    Prod = 'prod',
    Peer = 'peer',
    Resolution = 'resolution'
}
