import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces';

export type BumpPackageOptions = {
    release: ReleaseType;
    packages: PackageInfo[];
    deps: boolean;
    preId?: string;
};

export type BumpPkgInfo = {
    from: string;
    to: string;
    deps: {
        name: string;
        type: BumpType;
    }[];
}

export enum BumpType {
    Release = 'release',
    Dev = 'dev',
    Prod = 'prod',
    Peer = 'peer',
}
