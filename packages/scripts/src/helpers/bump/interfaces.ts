import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces.js';

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

export enum BumpType {
    Dev = 'dev',
    Prod = 'prod',
    Peer = 'peer',
    Resolution = 'resolution'
}
