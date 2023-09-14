import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces';

export interface BumpAssetOnlyOptions {
    preId?: string;
    release: ReleaseType;
    skipReset?: boolean;
}

export interface BumpPackageOptions {
    release: ReleaseType;
    packages: PackageInfo[];
    deps: boolean;
    preId?: string;
    skipReset?: boolean;
    skipAsset?: boolean;
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

export enum BumpType {
    Dev = 'dev',
    Prod = 'prod',
    Peer = 'peer',
    Resolution = 'resolution'
}
